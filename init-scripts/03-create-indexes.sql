#!/bin/bash
set -e

# ================================
# 创建数据库索引以优化性能
# ================================

echo "Creating database indexes..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

-- ================================
-- 用户表索引
-- ================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ================================
-- 书签表索引
-- ================================
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder ON bookmarks(user_id, folder);
CREATE INDEX IF NOT EXISTS idx_bookmarks_favorite ON bookmarks(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_last_clicked ON bookmarks(user_id, last_clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(url);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON bookmarks USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_bookmarks_search ON bookmarks USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- ================================
-- 书签分组表索引
-- ================================
CREATE INDEX IF NOT EXISTS idx_bookmark_folders_user_id ON bookmark_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_folders_name ON bookmark_folders(user_id, name);

-- ================================
-- 标签表索引
-- ================================
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(user_id, name);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

-- ================================
-- 用户会话表索引
-- ================================
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- ================================
-- 书签导入日志表索引
-- ================================
CREATE INDEX IF NOT EXISTS idx_bookmark_imports_user_id ON bookmark_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_imports_created_at ON bookmark_imports(created_at DESC);

-- ================================
-- 系统配置表索引
-- ================================
CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(key);
CREATE INDEX IF NOT EXISTS idx_system_configs_public ON system_configs(is_public);

-- ================================
-- 操作日志表索引
-- ================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

EOSQL

echo "Database indexes created successfully!"