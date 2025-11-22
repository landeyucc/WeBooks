#!/bin/bash
set -e

# ================================
# Webooks 数据库初始化脚本
# ================================

# 创建必要的扩展
echo "Creating database extensions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- 启用UUID扩展
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- 启用PostgreSQL全文搜索扩展
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    
    -- 启用JSONB操作扩展
    CREATE EXTENSION IF NOT EXISTS "jsonb";
    
    -- 创建搜索向量扩展
    CREATE EXTENSION IF NOT EXISTS "unaccent";
EOSQL

echo "Database extensions created successfully!"