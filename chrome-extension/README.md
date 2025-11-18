# Webooks Chrome Bookmark Saver

这是一个Chrome浏览器扩展，允许用户通过快捷键快速将当前网页保存到Webooks书签系统中。

## 功能特性

- 🔗 **快捷键保存**: 使用 `Ctrl+Shift+S` (Windows) 或 `Command+Shift+S` (Mac) 快速保存
- 🤖 **自动元数据获取**: 自动提取网页标题、描述和图标
- ⚙️ **灵活配置**: 支持自定义服务器地址、默认空间和文件夹
- 🔑 **API Key认证**: 安全的API Key认证机制
- 📱 **简洁界面**: 现代化的弹出式配置界面

## 安装方法

### 方法1：开发者模式安装（推荐用于测试）

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择本文件夹 `chrome-extension`
5. 扩展安装完成

### 方法2：生成图标文件后安装

如果需要生成PNG图标文件，可以运行：

```bash
# 生成图标文件（需要安装ImageMagick）
chmod +x icons/create-icons.sh
./icons/create-icons.sh
```

然后按照方法1进行安装。

## 配置步骤

### 1. 获取API Key

1. 在Webooks管理后台登录
2. 进入系统配置页面
3. 点击"生成新的API Key"
4. 复制生成的API Key（格式：`webooks_...`）

### 2. 配置扩展

1. 点击浏览器工具栏中的扩展图标
2. 在弹出的配置页面中：
   - 输入服务器地址（默认：`http://localhost:3000`）
   - 粘贴API Key
   - 选择默认保存空间
   - 可选：选择默认保存文件夹
   - 启用/禁用自动抓取元数据
3. 点击"保存配置"
4. 点击"测试连接"验证配置

## 使用方法

### 快捷键保存

1. 访问任意网页
2. 按下 `Ctrl+Shift+S` (Windows) 或 `Command+Shift+S` (Mac)
3. 确认保存对话框中的信息
4. 书签将被保存到指定的空间/文件夹中

### 弹出窗口操作

1. 点击浏览器工具栏中的扩展图标
2. 查看当前页面信息
3. 点击"立即保存书签"按钮

## API接口

扩展使用以下Webooks API接口：

- `POST /api/extension/bookmarks` - 添加书签
- `GET /api/extension/bookmarks` - 验证API Key
- `POST /api/extension/api-key` - 生成API Key
- `GET /api/spaces` - 获取空间列表
- `GET /api/folders` - 获取文件夹列表

## 安全性

- API Key采用随机生成的安全密钥
- API Key仅存储在用户的浏览器本地
- 扩展请求包含 `x-api-key` 请求头进行认证
- 仅支持添加操作，不允许修改或删除数据

## 技术规格

- **Manifest版本**: 3
- **最小Chrome版本**: 88
- **权限要求**:
  - `activeTab`: 访问当前标签页信息
  - `storage`: 存储用户配置
  - `commands`: 注册快捷键

## 故障排除

### 无法连接服务器
1. 检查服务器地址是否正确
2. 确认Webooks服务正在运行
3. 验证网络连接

### API Key无效
1. 确认API Key格式正确（`webooks_`开头）
2. 在Webooks后台重新生成API Key
3. 检查扩展中的API Key是否最新

### 快捷键无响应
1. 确认已授予扩展必要权限
2. 检查快捷键是否与其他扩展冲突
3. 重启浏览器后重试

## 开发与调试

### 开发模式
1. 以开发者模式加载扩展
2. 使用Chrome开发者工具查看扩展控制台
3. 修改代码后刷新扩展（需重新加载）

### 调试命令
- 查看扩展页面：`chrome://extensions/`
- 查看后台脚本日志：`chrome://extensions/` -> "检查视图" -> "service worker"
- 查看内容脚本：在页面右键 -> "检查" -> "Console"

## 更新日志

### v1.0.0
- 初始版本发布
- 支持快捷键保存书签
- 自动元数据提取
- API Key认证机制
- 简洁的配置界面

## 许可证

本扩展与Webooks项目使用相同的许可证。

## 支持

如果遇到问题，请：

1. 检查浏览器控制台错误信息
2. 确认Webooks服务器正常运行
3. 验证API Key配置正确
4. 在Webooks项目仓库提交issue