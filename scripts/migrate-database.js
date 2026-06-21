#!/usr/bin/env node

/**
 * 智能数据库迁移脚本
 * 自动检测 system_configs 表中缺失的列，并添加它们
 * 支持 PostgreSQL 和 SQLite
 * 幂等运行（可安全重复执行）
 */

const fs = require("fs");
const path = require("path");

// 加载环境配置
function loadEnvConfig() {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      const [key, value] = line.split("=");
      if (key && value && !key.startsWith("#")) {
        process.env[key.trim()] = value.trim();
      }
    }
  }
}

loadEnvConfig();

// system_configs 表中所有可能的列（从 Prisma schema 推断）
const EXPECTED_COLUMNS = [
  { name: "id", type: "TEXT", postgresType: "UUID", required: true, primaryKey: true },
  { name: "user_id", type: "TEXT", postgresType: "UUID", required: true, unique: true },
  { name: "default_space_id", type: "TEXT", postgresType: "UUID", required: false },
  { name: "site_title", type: "TEXT", postgresType: "TEXT", required: false },
  { name: "favicon_url", type: "TEXT", postgresType: "TEXT", required: false },
  { name: "seo_description", type: "TEXT", postgresType: "TEXT", required: false },
  { name: "keywords", type: "TEXT", postgresType: "TEXT", required: false },
  { name: "default_theme", type: "TEXT", postgresType: "TEXT", required: false, default: "'light'" },
  { name: "default_theme_type", type: "TEXT", postgresType: "TEXT", required: false, default: "'neumorphism'" },
  { name: "api_key", type: "TEXT", postgresType: "TEXT", required: false, unique: true },
  { name: "extension_api_key", type: "TEXT", postgresType: "TEXT", required: false, unique: true },
  { name: "created_at", type: "DATETIME", postgresType: "TIMESTAMP(3)", required: true, default: "CURRENT_TIMESTAMP" },
  { name: "updated_at", type: "DATETIME", postgresType: "TIMESTAMP(3)", required: true, default: "CURRENT_TIMESTAMP" }
];

function log(message, level = "info") {
  const prefix = {
    info: "[INFO]",
    warn: "[WARN]",
    error: "[ERROR]",
    success: "[SUCCESS]",
    debug: "[DEBUG]"
  }[level] || "[INFO]";
  console.log(`${prefix} ${message}`);
}

async function detectDatabaseType(prisma) {
  try {
    // PostgreSQL 特有查询
    await prisma.$queryRawUnsafe("SELECT version()");
    return "postgresql";
  } catch {
    try {
      // SQLite 特有查询
      await prisma.$queryRawUnsafe("SELECT sqlite_version()");
      return "sqlite";
    } catch {
      log("无法自动检测数据库类型，默认使用 postgresql", "warn");
      return "postgresql";
    }
  }
}

async function getExistingColumns(prisma, dbType) {
  try {
    if (dbType === "postgresql") {
      const result = await prisma.$queryRawUnsafe(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'system_configs'"
      );
      return result.map((r) => r.column_name.toLowerCase());
    } else {
      const result = await prisma.$queryRawUnsafe(
        "PRAGMA table_info(system_configs)"
      );
      return result.map((r) => r.name.toLowerCase());
    }
  } catch (error) {
    log(`获取现有列失败: ${error.message}`, "error");
    return [];
  }
}

async function checkTableExists(prisma, dbType) {
  try {
    if (dbType === "postgresql") {
      const result = await prisma.$queryRawUnsafe(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_configs')"
      );
      return result && result[0] && result[0].exists === true;
    } else {
      const result = await prisma.$queryRawUnsafe(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='system_configs'"
      );
      return result && result.length > 0;
    }
  } catch (error) {
    log(`检查表存在失败: ${error.message}`, "error");
    return false;
  }
}

async function createTable(prisma, dbType) {
  log(`创建 system_configs 表...`, "info");

  if (dbType === "postgresql") {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS system_configs (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL UNIQUE,
        default_space_id UUID,
        site_title TEXT,
        favicon_url TEXT,
        seo_description TEXT,
        keywords TEXT,
        default_theme TEXT DEFAULT 'light',
        default_theme_type TEXT DEFAULT 'neumorphism',
        api_key TEXT UNIQUE,
        extension_api_key TEXT UNIQUE,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } else {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS system_configs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        default_space_id TEXT,
        site_title TEXT,
        favicon_url TEXT,
        seo_description TEXT,
        keywords TEXT,
        default_theme TEXT DEFAULT 'light',
        default_theme_type TEXT DEFAULT 'neumorphism',
        api_key TEXT UNIQUE,
        extension_api_key TEXT UNIQUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  log("system_configs 表创建成功", "success");
}

async function addMissingColumn(prisma, dbType, column) {
  const colType = dbType === "postgresql" ? column.postgresType : column.type;
  let sql = `ALTER TABLE system_configs ADD COLUMN IF NOT EXISTS ${column.name} ${colType}`;

  if (column.default) {
    sql += ` DEFAULT ${column.default}`;
  }

  if (!dbType.startsWith("sqlite") && !column.required) {
    // PostgreSQL 允许 NULL（默认行为）
  }

  log(`执行: ${sql}`, "debug");

  try {
    await prisma.$executeRawUnsafe(sql);
    log(`添加列 ${column.name} 成功`, "success");
    return true;
  } catch (error) {
    if (error.message && (error.message.includes("already exists") || error.message.includes("duplicate column"))) {
      log(`列 ${column.name} 已存在，跳过`, "info");
      return true;
    }
    log(`添加列 ${column.name} 失败: ${error.message}`, "warn");
    return false;
  }
}

async function main() {
  log("开始数据库迁移检查...", "info");
  log("=".repeat(60), "info");

  let prisma;
  try {
    const { PrismaClient } = require("@prisma/client");
    prisma = new PrismaClient();
  } catch (error) {
    log(`无法加载 Prisma Client: ${error.message}`, "error");
    log("请先运行: npm install && npx prisma generate", "warn");
    process.exit(1);
  }

  try {
    // 检测数据库类型
    const dbType = await detectDatabaseType(prisma);
    log(`数据库类型: ${dbType}`, "info");

    // 检查表是否存在
    const tableExists = await checkTableExists(prisma, dbType);

    if (!tableExists) {
      log("system_configs 表不存在，正在创建...", "warn");
      await createTable(prisma, dbType);
    } else {
      // 检测现有列
      const existingColumns = await getExistingColumns(prisma, dbType);
      log(`现有列 (${existingColumns.length}): ${existingColumns.join(", ")}`, "info");

      // 查找缺失列
      const missingColumns = EXPECTED_COLUMNS.filter(
        (col) => !existingColumns.includes(col.name.toLowerCase())
      );

      if (missingColumns.length === 0) {
        log("所有列都已存在，无需迁移", "success");
      } else {
        log(`发现缺失列 (${missingColumns.length}): ${missingColumns.map((c) => c.name).join(", ")}`, "warn");

        // 添加缺失列
        let successCount = 0;
        for (const column of missingColumns) {
          if (await addMissingColumn(prisma, dbType, column)) {
            successCount++;
          }
        }

        log(`迁移完成：成功添加 ${successCount}/${missingColumns.length} 列`,
          successCount === missingColumns.length ? "success" : "warn"
        );
      }
    }

    // 验证
    const finalColumns = await getExistingColumns(prisma, dbType);
    const stillMissing = EXPECTED_COLUMNS.filter(
      (col) => !finalColumns.includes(col.name.toLowerCase())
    );

    if (stillMissing.length > 0) {
      log(`⚠ 仍有 ${stillMissing.length} 列缺失: ${stillMissing.map((c) => c.name).join(", ")}`, "warn");
      log("代码中的容错机制将处理这些列，但建议手动检查数据库", "warn");
    } else {
      log("✅ 所有预期列都已存在，数据库结构完整", "success");
    }

    log("=".repeat(60), "info");
    log("迁移检查完成", "success");

    await prisma.$disconnect();
  } catch (error) {
    log(`迁移过程中发生错误: ${error.message}`, "error");
    if (error.stack) log(`堆栈: ${error.stack}`, "debug");
    try {
      await prisma.$disconnect();
    } catch {
      // 忽略
    }
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch((error) => {
    log(`未捕获的错误: ${error.message}`, "error");
    process.exit(1);
  });
}

module.exports = { main };
