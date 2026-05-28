#!/usr/bin/env node

/**
 * 根据环境变量动态生成 Prisma schema 文件
 * 解决 Prisma 不允许在 provider 中使用 env() 的问题
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadEnvConfig() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const [key, value] = line.split('=');
      if (key && value && !key.startsWith('#')) {
        const trimmedKey = key.trim();
        let trimmedValue = value.trim();
        // 移除引号
        trimmedValue = trimmedValue.replace(/^["']|["']$/g, '');
        process.env[trimmedKey] = trimmedValue;
      }
    }
  }
}

function generateSchema() {
  log('🔧 生成 Prisma Schema 文件', 'bright');
  log('='.repeat(60), 'cyan');

  loadEnvConfig();

  const databaseType = process.env.DATABASE_TYPE || 'postgresql';
  let provider;

  if (databaseType === 'sqlite') {
    provider = 'sqlite';
  } else if (databaseType === 'postgresql') {
    provider = 'postgresql';
  } else {
    log(`⚠️  不支持的数据库类型: ${databaseType}，默认使用 postgresql`, 'yellow');
    provider = 'postgresql';
  }

  log(`📊 数据库类型: ${databaseType.toUpperCase()}`, 'green');
  log(`🔌 Prisma Provider: ${provider}`, 'green');

  const templatePath = path.join(process.cwd(), 'prisma', 'schema.template.prisma');
  const outputPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

  if (!fs.existsSync(templatePath)) {
    log(`❌ 模板文件不存在: ${templatePath}`, 'red');
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf8');
  template = template.replace('{{DATABASE_PROVIDER}}', provider);

  fs.writeFileSync(outputPath, template);

  log(`✅ Schema 文件已生成: ${outputPath}`, 'green');
  log('='.repeat(60), 'cyan');
}

if (require.main === module) {
  try {
    generateSchema();
  } catch (error) {
    log('❌ 生成 Schema 失败:', 'red');
    console.error(error);
    process.exit(1);
  }
}

module.exports = { generateSchema };
