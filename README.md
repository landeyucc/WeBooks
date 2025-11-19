# 书签管理器 - Bookmark Manager

现代化的浏览器书签管理系统，功能完善，支持多空间管理、智能搜索和现代化界面。

## 功能特性

- 完整的Next.js全栈应用
- PostgreSQL数据库支持
- 管理员认证系统（密码使用bcryptjs加密）
- 公共前端界面（无需登录浏览）
- 管理员后台界面（完整CRUD操作）
- 多语言支持（中英文）
- 深暗模式切换
- 响应式设计
- 智能搜索功能（Google/Bing引擎）
- 自动抓取网站图标和描述

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes + Prisma ORM
- **数据库**: PostgreSQL
- **认证**: bcryptjs + JWT tokens
- **包管理**: npm

## 数据库设计

- `users`: 用户表（单用户系统）
- `spaces`: 空间表（支持多空间切换）
- `folders`: 文件夹表（支持嵌套文件夹）
- `bookmarks`: 书签表

## 安装部署

### 1. 环境要求

- Node.js 18+
- PostgreSQL 数据库
- npm

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```env
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_jwt_secret_key"
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 推送数据库schema
npx prisma db push

# 或使用迁移
npx prisma migrate dev --name init
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 6. 生产部署

```bash
# 构建
npm run build

# 启动生产服务器
npm start
```

## 使用说明

### 首次使用

1. 访问网站会提示系统初始化
2. 设置管理员账户（用户名和密码）
3. 默认测试密码：admin123
4. 系统会自动创建默认空间

### 公共前端

- 左侧边栏：空间切换器和文件夹树形结构
- 顶部搜索栏：支持Google/Bing搜索引擎切换
- 主区域：书签卡片网格展示
- 无需登录即可浏览所有书签

### 管理员后台

1. 点击侧边栏底部"管理后台"按钮
2. 使用管理员账户登录
3. 管理书签、空间、文件夹
4. 支持完整的CRUD操作

### 书签管理

- 创建书签时可选择自动抓取网站图标和描述
- 支持手动输入图标链接
- 可为书签分配空间和文件夹
- 支持批量操作

### 多语言和主题

- 左侧边栏底部可切换中英文
- 支持浅色/深色主题切换
- 设置会保存到浏览器本地存储

## 项目结构

```
bookmark-manager/
├── app/
│   ├── api/              # API 路由
│   │   ├── auth/         # 认证相关
│   │   ├── spaces/       # 空间管理
│   │   ├── folders/      # 文件夹管理
│   │   └── bookmarks/    # 书签管理
│   ├── admin/            # 管理员页面
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页
│   └── globals.css       # 全局样式
├── components/
│   ├── admin/            # 管理员组件
│   │   ├── AdminDashboard.tsx
│   │   ├── BookmarkManager.tsx
│   │   ├── SpaceManager.tsx
│   │   └── FolderManager.tsx
│   ├── HomePage.tsx      # 主页组件
│   ├── Sidebar.tsx       # 侧边栏
│   ├── Header.tsx        # 顶部导航
│   ├── BookmarkGrid.tsx  # 书签网格
│   └── InitModal.tsx     # 初始化弹窗
├── contexts/
│   └── AppContext.tsx    # 全局状态管理
├── lib/
│   ├── prisma.ts         # Prisma 客户端
│   ├── auth.ts           # 认证工具
│   ├── scraper.ts        # 网站抓取
│   └── i18n.ts           # 多语言配置
├── prisma/
│   └── schema.prisma     # 数据库模型
├── .env                  # 环境变量（不提交到git）
├── .env.example          # 环境变量示例
└── package.json          # 项目配置
```

## API 接口

### 认证

- `GET /api/auth/init` - 检查初始化状态
- `POST /api/auth/init` - 初始化系统
- `POST /api/auth/login` - 管理员登录

### 空间

- `GET /api/spaces` - 获取所有空间
- `POST /api/spaces` - 创建空间（需认证）
- `PUT /api/spaces/[id]` - 更新空间（需认证）
- `DELETE /api/spaces/[id]` - 删除空间（需认证）

### 文件夹

- `GET /api/folders` - 获取文件夹
- `POST /api/folders` - 创建文件夹（需认证）
- `PUT /api/folders/[id]` - 更新文件夹（需认证）
- `DELETE /api/folders/[id]` - 删除文件夹（需认证）

### 书签

- `GET /api/bookmarks` - 获取书签
- `POST /api/bookmarks` - 创建书签（需认证）
- `PUT /api/bookmarks/[id]` - 更新书签（需认证）
- `DELETE /api/bookmarks/[id]` - 删除书签（需认证）

## 开发说明

### 技术特点

- 使用 TypeScript 确保类型安全
- Tailwind CSS 实现响应式设计
- Context API 管理全局状态
- Prisma ORM 简化数据库操作
- bcryptjs 加密密码
- JWT 实现无状态认证
- Cheerio 解析HTML抓取元数据

### 最佳实践

- 所有密码使用bcrypt加密存储
- JWT token有效期7天
- 支持级联删除保持数据一致性
- 使用 Context 避免 prop drilling
- 响应式设计适配所有设备

## 许可证

ISC

## 作者

MiniMax Agent

---

**享受使用书签管理器！**
