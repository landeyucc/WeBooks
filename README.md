# Webooks - 现代化书签管理工具

#### 文档语言：中文 | [English](./README_EN.md)

一个功能强大的现代化书签管理工具，支持书签导入导出、分类管理、搜索和标签系统。专为提高浏览效率而设计，支持多种浏览器书签格式。

## 1. 程序概述（Program Overview）

### 核心特性
- **智能书签导入**：支持 NETSCAPE-Bookmark-file-1 格式，自动识别 Chrome、Edge、Firefox 等浏览器导出的书签
- **分类管理**：灵活的空间（Space）和文件夹（Folder）组织结构
- **高级搜索**：全文搜索书签标题、描述和 URL
- **标签系统**：多标签分类，支持快速筛选
- **批量操作**：支持书签的批量编辑、移动和删除
- **响应式设计**：完美适配桌面和移动设备
- **多语言支持**：内置中英文双语界面

## 2. 快速上手（Quick Start）

### 环境要求
- Node.js 18.0+
- npm 8.0+ 或 pnpm 7.0+
- 现代浏览器（Chrome 90+、Firefox 88+、Safari 14+、Edge 90+）

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/webooks.git
cd webooks

# 2. 安装依赖
npm install
# 或使用 pnpm
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息

# 4. 初始化数据库
npx prisma migrate dev
npx prisma generate
```

### 一键启动

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

### 验证安装
启动成功后，访问 http://localhost:3000，若看到初始化页面则表示安装成功。

## 3. 核心功能（Core Features）

### 书签管理
- **导入功能**：支持拖拽或选择 HTML 书签文件导入
- **导出功能**：一键导出所有书签为标准格式
- **分类管理**：创建和管理书签空间、文件夹结构
- **搜索功能**：实时搜索书签内容

### 用户管理
- **用户认证**：安全的登录注册系统
- **管理员后台**：强大的管理界面
- **权限控制**：基于角色的访问控制

### 系统功能
- **多语言支持**：中英文界面切换
- **响应式设计**：适配各种设备尺寸
- **性能优化**：快速加载和流畅操作

## 4. 使用说明（Usage Guide）

### 基础操作流程

#### 首次使用
1. 访问应用主页
2. 完成系统初始化
3. 创建第一个书签空间

#### 导入书签
1. 进入管理后台
2. 选择"导入书签"功能
3. 拖拽或选择浏览器导出的书签文件
4. 系统自动解析并分类书签

#### 管理书签
- **创建文件夹**：右键或使用管理面板
- **移动书签**：拖拽到目标文件夹
- **添加标签**：为书签分配多个标签
- **搜索书签**：使用搜索框实时查找


## 5. 详细配置（Configuration Details）

### 配置文件路径
- **环境配置**：`.env` 文件
- **应用配置**：`lib/server-config.ts`
- **数据库配置**：`prisma/schema.prisma`

### 主要配置项

#### 数据库配置
```env
DATABASE_URL="postgresql://username:password@localhost:5432/webooks"
```

#### 应用配置
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

## 6. 接口文档（API Documentation）

### RESTful API

#### 认证相关
- `POST /api/auth/login` - 用户登录

#### 书签管理
- `GET /api/bookmarks` - 获取书签列表
- `POST /api/bookmarks` - 创建书签
- `PUT /api/bookmarks/:id` - 更新书签
- `DELETE /api/bookmarks/:id` - 删除书签
- `POST /api/bookmarks/import` - 导入书签
- `GET /api/bookmarks/export` - 导出书签

#### 文件夹管理
- `GET /api/folders` - 获取文件夹列表
- `POST /api/folders` - 创建文件夹

#### 空间管理
- `GET /api/spaces` - 获取空间列表
- `POST /api/spaces` - 创建空间
- `GET /api/spaces/:id` - 获取空间详情
- `PUT /api/spaces/:id` - 更新空间
- `DELETE /api/spaces/:id` - 删除空间
- `POST /api/spaces/:id/verify-password` - 验证空间密码
- `POST /api/spaces/verify-password` - 通过名称验证空间密码

#### 系统管理
- `GET /api/system-config` - 获取系统配置
- `PUT /api/system-config` - 更新系统配置
- `GET /api/system-export` - 导出完整系统数据
- `POST /api/system-import` - 导入系统数据
- `POST /api/system-config/reset-password` - 重置管理员密码

#### 扩展功能
- `GET /api/extension/bookmarks` - 获取扩展可访问的书签
- `GET /api/extension/api-key` - 生成/管理扩展API密钥
- `POST /api/scrape` - 抓取网页元数据

### 请求格式示例

#### 创建书签
```json
POST /api/bookmarks
{
  "title": "示例网站",
  "url": "https://example.com",
  "description": "这是一个示例网站",
  "tags": ["开发", "工具"],
  "folderId": "folder-123",
  "spaceId": "space-456"
}
```

#### 响应格式
```json
{
  "success": true,
  "data": {
    "id": "bookmark-789",
    "title": "示例网站",
    "url": "https://example.com",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## 7. 部署与运维（Deployment & Ops）

### 部署环境要求
- **操作系统**：Linux/macOS/Windows
- **Node.js**：18.0 或更高版本
- **数据库**：PostgreSQL 13+ 或 SQLite
- **内存**：最小 512MB，推荐 2GB+
- **磁盘空间**：最小 1GB

### 部署步骤

#### 使用 Vercel（推荐）
1. Fork 项目到 GitHub
2. 连接 Vercel 账户
3. 导入项目并配置环境变量
4. 自动部署

#### 自定义服务器部署
```bash
# 1. 构建应用
npm run build

# 2. 启动生产服务
npm start

# 3. 使用 PM2 管理进程（可选）
npm install -g pm2
pm2 start npm --name "webooks" -- start
```

## 8. 开发指南（Development Guide）

### 开发环境搭建
```bash
# 1. 克隆项目
git clone https://github.com/yourusername/webooks.git

# 2. 安装依赖
npm install

# 3. 启动开发服务
npm run dev
```

### 代码目录结构
```
webooks/
├── app/                    # Next.js 应用目录
│   ├── admin/             # 管理后台页面
│   ├── api/               # API 路由
│   └── page.tsx           # 主页
├── components/             # React 组件
│   ├── admin/             # 管理组件
│   ├── ui/                # UI 组件
│   └── HomePage.tsx       # 主页组件
├── lib/                   # 工具库
│   ├── auth.ts            # 认证逻辑
│   ├── i18n.ts            # 国际化
│   └── prisma.ts          # 数据库连接
├── prisma/                # 数据库相关
│   ├── schema.prisma      # 数据库模式
│   └── migrations/        # 数据库迁移
└── chrome-extension/      # Chrome 扩展
```

### 编码规范
- **TypeScript**：严格模式
- **ESLint**：使用 Next.js 推荐配置
- **Prettier**：代码格式化
- **命名规范**：使用驼峰命名法

### 构建命令
```bash
npm run build              # 构建生产版本
npm run dev                # 开发模式
npm run lint               # 代码检查
npm run type-check         # 类型检查
```

### 本地调试
1. 使用 VS Code 调试配置
2. 设置断点调试 TypeScript 代码
3. 使用浏览器开发者工具调试前端
4. 使用 Prisma Studio 查看数据库

## 9. 依赖说明（Dependencies）

### 主要依赖
- **Next.js 14**：React 框架
- **React 18**：前端库
- **TypeScript**：类型安全
- **Prisma**：数据库 ORM
- **NextAuth.js**：认证系统
- **Tailwind CSS**：样式框架

### 开发依赖
- **ESLint**：代码检查
- **Prettier**：代码格式化
- **@types/node**：Node.js 类型定义

### 依赖安装
```bash
# 安装生产依赖
npm install

# 安装开发依赖
npm install --save-dev

# 依赖更新
npm update
```
