#!/bin/bash
set -e

# ================================
# 创建初始化数据
# ================================

echo "Creating initial data..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

-- ================================
-- 插入系统默认配置
-- ================================
INSERT INTO system_configs (key, value, description, config_type, is_public) VALUES
('app_name', 'Webooks', 'Application name', 'string', true),
('app_version', '1.0.0', 'Application version', 'string', true),
('max_bookmarks_per_user', '10000', 'Maximum number of bookmarks per user', 'number', false),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)', 'number', false),
('allowed_file_types', '["jpg","jpeg","png","gif","pdf","doc","docx","txt","csv"]', 'Allowed file upload types', 'json', false),
('session_timeout', '86400', 'User session timeout in seconds (24 hours)', 'number', false),
('enable_registration', 'true', 'Enable user registration', 'boolean', true),
('enable_oauth', 'false', 'Enable OAuth authentication', 'boolean', true),
('maintenance_mode', 'false', 'Enable maintenance mode', 'boolean', true),
('default_theme', 'light', 'Default application theme', 'string', true),
('default_language', 'zh-CN', 'Default application language', 'string', true),
('backup_retention_days', '30', 'Database backup retention in days', 'number', false),
('log_level', 'info', 'Application log level', 'string', false),
('enable_analytics', 'false', 'Enable usage analytics', 'boolean', false)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    config_type = EXCLUDED.config_type,
    is_public = EXCLUDED.is_public,
    updated_at = CURRENT_TIMESTAMP;

-- ================================
-- 创建默认系统管理员账户
-- ================================
INSERT INTO users (
    email, 
    username, 
    password_hash, 
    full_name, 
    is_active, 
    is_verified, 
    role,
    preferences
) VALUES (
    'admin@webooks.com',
    'admin',
    '$2b$10$YourPasswordHashHere.XXXXXXX', -- 需要在实际部署时替换为真实的哈希密码
    '系统管理员',
    true,
    true,
    'admin',
    '{"theme": "light", "language": "zh-CN", "timezone": "Asia/Shanghai", "notifications": {"email": true, "push": true}}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- ================================
-- 创建默认书签分组
-- ================================
-- 这里可以根据需要添加一些示例分组

-- ================================
-- 创建示例标签
-- ================================
-- 这里可以根据需要添加一些示例标签

EOSQL

echo "Initial data created successfully!"

-- ================================
# 显示初始化完成信息
-- ================================
echo "========================================"
echo "数据库初始化完成!"
echo "========================================"
echo ""
echo "默认管理员账户:"
echo "邮箱: admin@webooks.com"
echo "用户名: admin"
echo "⚠️  重要: 请立即修改默认管理员账户密码!"
echo ""
echo "系统配置已加载，您可以根据需要修改配置。"
echo ""