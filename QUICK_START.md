# 快速启动指南

## 第一次部署

1. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置数据库连接
   ```

2. **运行部署脚本**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **启动服务器**
   - 开发模式: `npm run dev`
   - 生产模式: `npm start`

4. **访问应用**
   打开浏览器访问: http://localhost:3000

## 手动部署步骤

如果部署脚本失败，可以手动执行：

```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma Client
npx prisma generate

# 3. 推送数据库schema
npx prisma db push

# 4. 构建项目
npm run build

# 5. 启动生产服务器
npm start
```

## 首次使用

1. 访问应用会自动检测需要初始化
2. 设置管理员用户名和密码（测试密码: admin123）
3. 系统会自动创建默认空间
4. 开始添加书签！

## 管理员后台

- 访问路径: http://localhost:3000/admin
- 使用初始化时设置的管理员账户登录
- 可以管理书签、空间、文件夹

## 常见问题

### 数据库连接失败
- 检查 .env 文件中的 DATABASE_URL 是否正确
- 确保 PostgreSQL 数据库可访问
- 检查数据库用户权限

### Prisma 错误
- 删除 node_modules 和 .next 文件夹
- 重新运行 `npm install`
- 运行 `npx prisma generate`

### 端口冲突
- 默认端口 3000
- 可以通过设置 PORT 环境变量更改端口:
  ```bash
  PORT=3001 npm run dev
  ```

## 开发模式

```bash
npm run dev
```

开发模式支持热重载，修改代码后自动刷新。

## 生产模式

```bash
npm run build
npm start
```

生产模式经过优化，性能更好。

## 环境变量说明

- `DATABASE_URL`: PostgreSQL 数据库连接字符串
- `JWT_SECRET`: JWT 加密密钥（请使用随机字符串）
- `NEXTAUTH_SECRET`: NextAuth 密钥
- `NEXTAUTH_URL`: 应用访问地址（生产环境需修改）
