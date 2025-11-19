# Webooks 官方网站和文档网站

本目录包含 Webooks 项目的官方网站和文档网站，全部采用静态页面构建。

## 目录结构

```
website/
├── assets/                     # 静态资源目录
│   ├── css/                    # 样式文件
│   │   ├── style.css          # 官方网站样式
│   │   └── docs-site.css      # 文档网站样式
│   ├── images/                 # 图片资源目录
│   └── js/                     # JavaScript功能文件
│       ├── main.js            # 官方网站功能
│       └── docs-site.js       # 文档网站功能
├── docs-site/                  # 文档网站
│   ├── index.html             # 文档网站主页
│   ├── quick-start.html       # 快速开始指南
│   ├── api.html               # API文档
│   ├── deployment.html        # 部署指南
│   └── faq.html               # 常见问题
└── official-site/              # 官方网站
    └── index.html             # 官方网站首页
```

## 网站页面

### 官方网站 (official-site/index.html)
- 导航栏和品牌标识
- 英雄区域 - Webooks 产品介绍
- 核心功能特性展示
- 快速开始指南
- 产品演示区
- 下载和部署信息

### 文档网站 (docs-site/)

#### 主页 (index.html)
- 项目概述
- 技术栈介绍
- 环境要求
- 安装步骤说明

#### 快速开始 (quick-start.html)
- 环境要求
- 详细安装步骤
- 首次使用指南
- 基础操作教程
- 书签管理功能
- 管理后台使用

#### API文档 (api.html)
- 认证方式说明
- API基础信息
- 书签管理接口
- 空间管理接口
- 文件夹管理接口
- 认证接口
- 错误处理指南

#### 部署指南 (deployment.html)
- 部署方式选择
- 云平台部署说明
- 配置管理指南
- 故障排除建议

#### 常见问题 (faq.html)
- 通用问题解答
- 安装相关问题
- 配置问题解决
- 使用技巧和最佳实践

## 功能特性

### 响应式设计
- 移动端适配
- 桌面端优化
- 跨浏览器兼容

### 交互功能
- 移动端菜单导航
- 代码复制功能
- 搜索功能
- FAQ折叠展开
- 侧边栏导航
- 返回顶部按钮
- 阅读进度指示器

### 样式设计
- 现代化UI设计
- 一致的品牌色彩
- 清晰的信息层级
- 优秀的可读性

## 技术栈

- **HTML5**: 语义化标记
- **CSS3**: 现代化样式和动画
- **JavaScript**: 交互功能和动态效果
- **响应式设计**: 移动端优先

## 浏览器支持

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## 使用说明

1. 直接在浏览器中打开对应的 HTML 文件即可访问
2. 所有页面都是静态文件，无需服务器环境
3. 可以直接部署到任何静态网站托管服务

## 开发说明

### 修改样式
- 官方网站的样式修改 `assets/css/style.css`
- 文档网站的样式修改 `assets/css/docs-site.css`

### 修改功能
- 官方网站的功能修改 `assets/js/main.js`
- 文档网站的功能修改 `assets/js/docs-site.js`

### 添加新页面
1. 在对应的目录中创建新的 HTML 文件
2. 引用相应的 CSS 和 JS 文件
3. 保持导航结构的一致性

## 部署建议

### GitHub Pages
1. 将整个 `website` 目录上传到仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择源分支和目录

### Netlify
1. 拖拽 `website` 目录到 Netlify 部署区域
2. 自动获得 HTTPS 和自定义域名

### Vercel
1. 连接到 GitHub 仓库
2. 设置构建命令为空（静态文件）
3. 指定输出目录为 `website`

## 联系信息

如有问题或建议，请通过以下方式联系：
- 项目主页: https://github.com/webooks
- 文档问题: 提交 Issue
- 功能建议: 提交 Feature Request