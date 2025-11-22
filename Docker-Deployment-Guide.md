# Docker 部署指南

本文档详细说明如何使用 Docker 部署 Webooks 应用。

## 📋 目录

- [快速部署](#快速部署)
- [详细说明](#详细说明)
- [配置管理](#配置管理)
- [服务说明](#服务说明)
- [维护操作](#维护操作)
- [故障排除](#故障排除)

## 🚀 快速部署

### 1. 使用自动化脚本（推荐）

```bash
# 给部署脚本添加执行权限
chmod +x deploy.sh

# 执行自动部署
./deploy.sh deploy
```

### 2. 手动部署

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件（重要！）
# 根据实际需要修改 .env 文件中的配置

# 构建并启动服务
docker-compose up --build -d

# 检查服务状态
docker-compose ps
```

## 📖 详细说明

### 系统要求

- Docker Engine 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 10GB 可用磁盘空间

### 目录结构

```
webooks/
├── Dockerfile                 # 应用构建配置
├── docker-compose.yml         # 服务编排配置
├── .dockerignore             # Docker忽略文件
├── .env.example              # 环境变量模板
├── deploy.sh                 # 自动化部署脚本
├── nginx.conf                # Nginx配置
├── init-scripts/             # 数据库初始化脚本
│   ├── 01-create-extensions.sql
│   ├── 02-create-schema.sql
│   ├── 03-create-indexes.sql
│   └── 04-insert-initial-data.sql
├── logs/                     # 日志目录
├── uploads/                  # 上传文件目录
└── backups/                  # 备份目录
```

## ⚙️ 配置管理

### 环境变量配置

复制 `.env.example` 为 `.env` 并根据实际情况修改：

```bash
# 必要配置
NODE_ENV=production
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
NEXTAUTH_SECRET=your_nextauth_secret

# 数据库配置
POSTGRES_DB=webooks
POSTGRES_USER=webooks_user
POSTGRES_PASSWORD=your_secure_password

# 应用配置
PORT=3000
NEXTAUTH_URL=http://your-domain.com
```

### 安全建议

1. **修改所有默认密码**：
   - 数据库密码
   - JWT密钥
   - NextAuth密钥

2. **使用强密码**：
   - 至少12位字符
   - 包含大小写字母、数字和特殊字符

3. **生产环境注意事项**：
   - 配置SSL/TLS证书
   - 设置防火墙规则
   - 使用环境变量管理敏感信息

## 🏗️ 服务说明

### 核心服务

#### 1. 应用服务 (webooks_app)
- **镜像**: 基于 Dockerfile 构建
- **端口**: 3000
- **功能**: Webooks 主应用
- **健康检查**: `/api/health`

#### 2. 数据库服务 (webooks_db)
- **镜像**: postgres:15-alpine
- **端口**: 5432
- **功能**: PostgreSQL 数据库
- **持久化**: postgres_data 卷

#### 3. 缓存服务 (webooks_redis)
- **镜像**: redis:7-alpine
- **端口**: 6379
- **功能**: Redis 缓存和会话存储
- **持久化**: redis_data 卷

#### 4. 反向代理 (webooks_nginx)
- **镜像**: nginx:alpine
- **端口**: 80, 443
- **功能**: 反向代理和负载均衡
- **配置**: nginx.conf

### 网络配置

所有服务连接到 `webooks_network` 网络，实现服务间通信。

### 数据卷

- `postgres_data`: 数据库数据持久化
- `redis_data`: Redis数据持久化
- `./uploads`: 用户上传文件
- `./logs`: 应用日志

## 🔧 维护操作

### 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f webooks_app
docker-compose logs -f webooks_db

# 重启服务
docker-compose restart webooks_app

# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v

# 更新并重新构建
docker-compose up --build -d
```

### 备份和恢复

```bash
# 数据库备份
docker-compose exec webooks_db pg_dump -U webooks_user webooks > backup.sql

# 数据库恢复
docker-compose exec -T webooks_db psql -U webooks_user webooks < backup.sql

# 完整数据备份
tar -czf webooks-backup-$(date +%Y%m%d).tar.gz data/ uploads/ .env
```

### 日志管理

```bash
# 查看应用日志
docker-compose logs webooks_app

# 查看Nginx访问日志
docker-compose exec webooks_nginx tail -f /var/log/nginx/access.log

# 查看Nginx错误日志
docker-compose exec webooks_nginx tail -f /var/log/nginx/error.log
```

## 🔍 故障排除

### 常见问题

#### 1. 服务启动失败

检查日志：
```bash
docker-compose logs webooks_app
docker-compose logs webooks_db
```

#### 2. 数据库连接失败

- 确认数据库服务状态
- 检查环境变量配置
- 验证网络连接

#### 3. 端口占用

```bash
# 查看端口占用
netstat -tulpn | grep :3000

# 修改docker-compose.yml中的端口映射
ports:
  - "3001:3000"  # 改为其他端口
```

#### 4. 磁盘空间不足

```bash
# 清理Docker资源
docker system prune -a

# 清理未使用的卷
docker volume prune
```

#### 5. 权限问题

```bash
# 设置正确的文件权限
sudo chown -R $USER:$USER uploads/ logs/
chmod +x deploy.sh
```

### 性能优化

1. **调整数据库连接池**
2. **配置Redis缓存**
3. **启用Nginx压缩**
4. **优化静态文件缓存**

### 监控建议

1. **设置健康检查**
2. **监控磁盘使用率**
3. **监控内存使用**
4. **设置日志轮转**

## 🆘 获取帮助

如果遇到问题：

1. 查看服务日志：`docker-compose logs`
2. 检查配置文件
3. 确认系统要求
4. 查看故障排除章节

## 📝 版本信息

- Docker Compose 版本：3.8
- PostgreSQL：15-alpine
- Redis：7-alpine
- Nginx：alpine
- Node.js：18-alpine

---

🎉 **恭喜！您已成功配置 Webooks 的 Docker 环境**

现在可以访问 `http://localhost` 使用 Webooks 应用了！