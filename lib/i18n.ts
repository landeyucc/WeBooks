export const translations = {
  zh: {
    // 通用
    search: '搜索',
    searchBookmarks: '搜索书签',
    cancel: '取消',
    confirm: '确认',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    create: '创建',
    close: '关闭',
    loading: '加载中...',
    reload: '重新加载',
    clear: '清空',
    saving: '保存中...',
    
    // 认证
    login: '登录',
    logout: '退出登录',
    username: '用户名',
    password: '密码',
    email: '邮箱',
    init: '初始化系统',
    needInit: '系统需要初始化',
    initDesc: '请设置管理员账户',
    
    // 空间
    spaces: '空间',
    selectSpace: '选择空间',
    createSpace: '创建空间',
    spaceName: '空间名称',
    spaceDesc: '空间描述',
    noSpaceData: '暂无空间数据，请重新加载',
    
    // 文件夹
    folders: '文件夹',
    createFolder: '创建文件夹',
    folderName: '文件夹名称',
    folderDesc: '文件夹描述',
    // 文件夹列表列标题
    folderTableName: '名称',
    folderTableSpace: '所属空间',
    folderTableParent: '父文件夹',
    folderTableBookmarks: '书签数',
    folderTableActions: '操作',
    // 文件夹表单
    folderFormParent: '父文件夹',
    folderFormParentNone: '无',
    folderFormParentSelect: '选择父文件夹',
    subFolder: '(子文件夹)',
    
    // 书签
    bookmarks: '书签',
    allBookmarks: '所有书签',
    createBookmark: '创建书签',
    bookmarkTitle: '书签标题',
    bookmarkUrl: '网址',
    bookmarkDesc: '描述',
    iconUrl: '图标链接',
    visitWebsite: '访问网站',
    
    // 搜索引擎
    searchEngine: '搜索引擎',
    google: 'Google',
    bing: 'Bing',
    baidu: 'Baidu',
    yandex: 'Yandex',
    searchWith: '使用%s搜索',
    
    // 主题
    theme: '主题',
    light: '浅色',
    dark: '深色',
    
    // 语言
    language: '语言',
    
    // 管理
    admin: '管理后台',
    adminPanel: '管理面板',
    
    // 系统设置
    systemSettings: '系统设置',
    siteSettings: '网站设置',
    systemCardSettings: '系统卡图设置',
    saveSystemCard: '保存配置',
    systemCardPreview: '卡图预览',
    systemCardUrl: '系统卡图URL',
    systemCardUrlPlaceholder: '请输入图片URL (支持JPG、PNG、GIF等格式)',
    defaultWeebooksTitle: '留空将显示默认的"webooks"标题',
    siteTitle: '网站标题',
    siteTitlePlaceholder: '请输入网站标题',
    browserTitleDesc: '将显示在浏览器标签页的标题栏',
    siteIcon: '网站图标 (Favicon)',
    faviconPlaceholder: '请输入图标URL (推荐尺寸: 32x32px 或 16x16px)',
    browserIconDesc: '将显示在浏览器标签页和书签栏',
    seoDescription: 'SEO描述',
    seoDescPlaceholder: '请输入网站描述，用于SEO优化',
    seoDescLabel: '将作为网页的meta描述，描述网站的主要内容和用途',
    seoKeywords: 'SEO关键字',
    keywordsPlaceholder: '请输入关键字，多个关键字用逗号分隔',
    keywordsDesc: '用于SEO优化的关键字，帮助搜索引擎理解网站内容',
    saveSiteSettings: '保存网站设置',
    siteSettingsDesc: '配置网站标题、图标和SEO信息',
    webScraping: '网页抓取',
    importExport: '导入导出',
    configSaveSuccess: '配置保存成功！',
    saveFailed: '保存失败，请检查网络连接',
    defaultSpaceConfig: '默认空间设置',
    defaultSpaceDesc: '设置首页默认显示的空间',
    defaultHomeSpace: '首页默认空间',
    selectDefaultSpace: '请选择默认空间',
    saveDefaultSpace: '保存默认空间',
    defaultSpaceSaveSuccess: '默认空间设置保存成功！',
    selectDefaultSpaceRequired: '请选择一个默认空间',
    returnHome: '返回首页',
    
    // 消息
    success: '操作成功',
    error: '操作失败',
    operationFailed: '操作失败',
    operationFailedNetwork: '操作失败: 网络错误',
    deleteFailed: '删除失败',
    deleteConfirm: '确定要删除吗？',
    
    // 输入提示
    inputUsername: '请输入用户名',
    inputPassword: '请输入密码',
    inputEmailOptional: '请输入邮箱（可选）',
    required: '必填',
    selectSpacePlaceholder: '选择空间',
    selectFolderPlaceholder: '选择文件夹',
    testPasswordPreset: '测试密码已预设为：admin123',
    initFailed: '初始化失败',
    initFailedRetry: '初始化失败，请重试',
    
    // 状态消息
    loginExpired: '您的登录状态已失效，请重新登录',
    pleaseLogin: '请先登录系统',
    noDescription: '暂无描述',
    
    // 系统卡图
    systemCardUrlLabel: '系统卡图URL (9:16比例)',
    spaceCardImageUrl: 'https://example.com/card-image.jpg',
    spaceCardImageDesc: '输入9:16比例的图片URL，将显示在侧边栏空间上方',
    fetchFoldersFailed: '获取文件夹失败',
    checkInitFailed: '检查初始化状态失败',
    setDefaultSpaceFailed: '设置默认空间失败',
    fetchBookmarksFailed: '获取书签失败',
    noBookmarks: '暂无书签',
    fetchSpacesFailed: '获取空间失败',
    fetchFoldersFailedSide: '获取文件夹失败',
    systemCardImage: '系统卡图',
    webooks: 'webooks',
    
    // AdminDashboard 特定文本
    adminFetchingSpacesData: '正在获取空间数据...',
    adminSpacesDataFetchFailed: '获取空间数据失败，状态码:',
    adminFetchingSpacesDataFailed: '获取空间数据失败:',
    adminLoadingSystemConfig: '正在加载系统配置和空间数据...',
    adminSystemConfigLoaded: '系统配置和空间数据加载完成',
    adminConfigLoadFailed: '加载系统配置和空间数据失败:',
    adminUpdateSystemCardUrl: '更新选中空间的系统卡图URL:',
    adminSwitchSettingsReload: '切换到系统设置，重新加载数据',
    adminSaveConfigFailed: '保存配置失败:',
    adminSaveDefaultSpaceFailed: '保存默认空间失败:',
    adminFetchSystemConfigFailed: '获取系统配置失败:',
    adminSaveSiteSettingsFailed: '保存网站设置失败:',
    adminSystemCardPreview: '系统卡图预览',
    
    // Header组件特定文本
    toggleMenuAria: '切换菜单',
    toggleSearchAria: '切换搜索',
    searchBookmarksPlaceholder: '搜索书签...',
    searchEnginePlaceholder: '搜索网络...',
    searchEngineMode: '搜索引擎',
    
    // 语言切换
    switchToChinese: '中文',
    switchToEnglish: 'English',
    
    // BookmarkGrid悬浮提示
    tooltipInfoDisplay: '已显示完整信息',
    
    // FolderManager删除错误
    folderDeleteFailed: '删除失败',
    
    // SpaceManager错误消息
    needLoginToCreateSpace: '您需要先登录才能创建空间',
    
    // 抓取按钮
    fetchInfo: '获取网站信息',
    fetchingInfo: '获取中...',
    fetchSuccess: '获取成功',
    fetchFailed: '获取失败',
    fetchInfoDesc: '自动获取网站标题、描述和图标',
    tryAgain: '重新获取',
    
    // API Key管理
    apiKeyManager: 'API Key管理',
    apiKeyDescription: '用于浏览器扩展的身份验证，请妥善保管您的API Key',
    yourApiKey: '您的API Key',
    hideApiKey: '隐藏API Key',
    showApiKey: '显示API Key',
    hide: '隐藏',
    show: '显示',
    apiKeyWarning: '此密钥用于浏览器扩展验证，请勿与他人分享',
    copyApiKey: '复制API Key',
    generating: '生成中...',
    noApiKeySet: '您还没有设置API Key',
    regenerate: '重新生成',
    generateApiKey: '生成API Key',
    apiKeyGeneratedSuccess: 'API Key生成成功！',
    generateApiKeyFailed: '生成API Key失败',
    generateApiKeyFailedNetwork: '生成API Key失败：网络错误',
    copyApiKeyClipboard: 'API Key已复制到剪贴板！',
    copyFailedManual: '复制失败，请手动复制',
    
    // 导入导出功能
    importExportTitle: 'Chrome/Edge/Firefox书签导入导出',
    importExportDesc: '支持导入Chrome、Edge、Firefox等浏览器的HTML书签文件，导出格式也兼容对应浏览器',
    importBookmarks: '导入书签',
    importBookmarksDesc: '从HTML文件导入书签数据，自动获取网站图标并创建以导入时间命名的文件夹',
    dragDropHtmlFile: '拖拽HTML书签文件到此处，或',
    selectFile: '选择文件',
    startImport: '开始导入',
    importing: '导入中...',
    importFailed: '导入失败',
    importFailedNetwork: '导入失败：网络错误',
    folderLabel: '文件夹：',
    viewErrorDetails: '查看错误详情',
    exportFailed: '导出失败',
    exportFailedNetwork: '导出失败：网络错误',
    exportBookmarks: '导出书签',
    exportBookmarkDesc: '导出书签为HTML文件，兼容Chrome/Edge等主流浏览器',
    exportScopeTitle: '选择导出范围',
    selectFolder: '选择文件夹',
    selectFolderSpace: '选择空间',
    reloadFolder: '重新加载',
    netscapeBookmarkFormat: '支持NETSCAPE-Bookmark-file-1格式的HTML书签（Chrome、Edge、Firefox等浏览器导出）',
    noFolderInSpace: '该空间暂无文件夹',
    
    // 批量操作
    spaceSelectionStatus: '空间选择状态',
    allSpaces: '所有空间',
    exitBatchMode: '退出批量模式',
    batchOperations: '批量操作',
    selectAll: '全选',
    selectedXBookmarks: '已选择 X 个书签',
    selectedCount: '已选择 {count} 个书签',
    clearSelection: '清除选择',
    batchMove: '批量移动',
    batchDelete: '批量删除',
    batchMoveTitle: '批量移动书签 ({count} 个)',
    targetSpace: '目标空间',
    targetFolder: '目标文件夹',
    confirmMove: '确认移动',
    deletedXBookmarks: '已删除 X 个书签',
    batchDeleteFailed: '批量删除失败',
    batchMoveFailed: '批量移动失败',
    batchDeletedCount: '已删除 {count} 个书签',
    batchMovedCount: '已移动 {count} 个书签',
    
    // 文件夹和书签状态
    noFolder: '无文件夹',
    uncategorizedBookmarks: '未分类书签',
    
    // 无障碍标签
    selectOptions: 'Select options',
    
    // 系统卡图说明
    systemCardDesc: '设置空间的系统卡图，将显示在侧边栏顶部。推荐尺寸：520px × 120px',
  },
  en: {
    // Common
    search: 'Search',
    searchBookmarks: 'Search Bookmarks',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    close: 'Close',
    loading: 'Loading...',
    reload: 'Reload',
    clear: 'Clear',
    saving: 'Saving...',
    
    // Auth
    login: 'Login',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    email: 'Email',
    init: 'Initialize System',
    needInit: 'System needs initialization',
    initDesc: 'Please set up admin account',
    
    // Spaces
    spaces: 'Spaces',
    selectSpace: 'Select Space',
    createSpace: 'Create Space',
    spaceName: 'Space Name',
    spaceDesc: 'Space Description',
    noSpaceData: 'No space data available, please reload',
    
    // Folders
    folders: 'Folders',
    createFolder: 'Create Folder',
    folderName: 'Folder Name',
    folderDesc: 'Folder Description',
    // Folder table headers
    folderTableName: 'Name',
    folderTableSpace: 'Space',
    folderTableParent: 'Parent Folder',
    folderTableBookmarks: 'Bookmarks',
    folderTableActions: 'Actions',
    // Folder form
    folderFormParent: 'Parent Folder',
    folderFormParentNone: 'None',
    folderFormParentSelect: 'Select Parent Folder',
    subFolder: '(Sub Folder)',
    
    // Bookmarks
    bookmarks: 'Bookmarks',
    allBookmarks: 'All Bookmarks',
    createBookmark: 'Create Bookmark',
    bookmarkTitle: 'Bookmark Title',
    bookmarkUrl: 'URL',
    bookmarkDesc: 'Description',
    iconUrl: 'Icon URL',

    visitWebsite: 'Visit Website',
    
    // Search Engine
    searchEngine: 'Search Engine',
    google: 'Google',
    bing: 'Bing',
    baidu: 'Baidu',
    yandex: 'Yandex',
    searchWith: 'Search with %s',
    
    // Theme
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    
    // Language
    language: 'Language',
    
    // Admin
    admin: 'Admin',
    adminPanel: 'Admin Panel',
    
    // System Settings
    systemSettings: 'System Settings',
    siteSettings: 'Site Settings',
    systemCardSettings: 'System Card Settings',
    saveSystemCard: 'Save Configuration',
    systemCardPreview: 'Card Preview',
    systemCardUrl: 'System Card URL',
    systemCardUrlPlaceholder: 'Enter image URL (supports JPG, PNG, GIF, etc.)',
    defaultWeebooksTitle: 'Leave blank to show default "webooks" title',
    siteTitle: 'Site Title',
    siteTitlePlaceholder: 'Enter site title',
    browserTitleDesc: 'Will be displayed in browser tab title',
    siteIcon: 'Site Icon (Favicon)',
    faviconPlaceholder: 'Enter icon URL (recommended size: 32x32px or 16x16px)',
    browserIconDesc: 'Will be displayed in browser tab and bookmark bar',
    seoDescription: 'SEO Description',
    seoDescPlaceholder: 'Enter site description for SEO optimization',
    seoDescLabel: 'Will be used as meta description, describing main content and purpose',
    seoKeywords: 'SEO Keywords',
    keywordsPlaceholder: 'Enter keywords, separated by commas',
    keywordsDesc: 'Keywords for SEO optimization, helping search engines understand site content',
    saveSiteSettings: 'Save Site Settings',
    siteSettingsDesc: 'Configure site title, icon and SEO information',
    webScraping: 'Web Scraping',
    importExport: 'Import/Export',
    configSaveSuccess: 'Configuration saved successfully!',
    saveFailed: 'Save failed, please check network connection',
    defaultSpaceConfig: 'Default Space Settings',
    defaultSpaceDesc: 'Set the default space for homepage display',
    defaultHomeSpace: 'Homepage Default Space',
    selectDefaultSpace: 'Please select default space',
    saveDefaultSpace: 'Save Default Space',
    defaultSpaceSaveSuccess: 'Default space settings saved successfully!',
    selectDefaultSpaceRequired: 'Please select a default space',
    returnHome: 'Return to Home',
    
    // Messages
    success: 'Success',
    error: 'Error',
    operationFailed: 'Operation failed',
    operationFailedNetwork: 'Operation failed: Network error',
    deleteFailed: 'Delete failed',
    deleteConfirm: 'Are you sure you want to delete?',
    
    // 输入提示
    inputUsername: 'Enter username',
    inputPassword: 'Enter password',
    inputEmailOptional: 'Enter email (optional)',
    required: 'required',
    selectSpacePlaceholder: 'Select space',
    selectFolderPlaceholder: 'Select folder',
    testPasswordPreset: 'Test password preset: admin123',
    initFailed: 'Initialization failed',
    initFailedRetry: 'Initialization failed, please try again',
    
    // 状态消息
    loginExpired: 'Your login has expired, please login again',
    pleaseLogin: 'Please login first',
    noDescription: 'No description',
    
    // 系统卡图
    systemCardUrlLabel: 'System Card URL (9:16 aspect ratio)',
    spaceCardImageUrl: 'https://example.com/card-image.jpg',
    spaceCardImageDesc: 'Enter a 9:16 aspect ratio image URL, will be displayed above spaces in the sidebar',
    fetchFoldersFailed: 'Failed to fetch folders',
    checkInitFailed: 'Failed to check initialization status',
    setDefaultSpaceFailed: 'Failed to set default space',
    fetchBookmarksFailed: 'Failed to fetch bookmarks',
    noBookmarks: 'No bookmarks yet',
    fetchSpacesFailed: 'Failed to fetch spaces',
    fetchFoldersFailedSide: 'Failed to fetch folders',
    systemCardImage: 'System Card Image',
    webooks: 'webooks',
    
    // AdminDashboard specific text
    adminFetchingSpacesData: 'Fetching spaces data...',
    adminSpacesDataFetchFailed: 'Failed to fetch spaces data, status code:',
    adminFetchingSpacesDataFailed: 'Failed to fetch spaces data:',
    adminLoadingSystemConfig: 'Loading system config and spaces data...',
    adminSystemConfigLoaded: 'System config and spaces data loaded',
    adminConfigLoadFailed: 'Failed to load system config and spaces data:',
    adminUpdateSystemCardUrl: 'Update selected space system card URL:',
    adminSwitchSettingsReload: 'Switching to system settings, reloading data',
    adminSaveConfigFailed: 'Failed to save config:',
    adminSaveDefaultSpaceFailed: 'Failed to save default space:',
    adminFetchSystemConfigFailed: 'Failed to fetch system config:',
    adminSaveSiteSettingsFailed: 'Failed to save site settings:',
    adminSystemCardPreview: 'System Card Preview',
    
    // Header component specific text
    toggleMenuAria: 'Toggle menu',
    toggleSearchAria: 'Toggle search',
    searchBookmarksPlaceholder: 'Search bookmarks...',
    searchEnginePlaceholder: 'Search web...',
    searchEngineMode: 'Search Engine',
    
    // Language switching
    switchToChinese: '中文',
    switchToEnglish: 'English',
    
    // BookmarkGrid tooltip
    tooltipInfoDisplay: 'Display complete information for all bookmarks',
    
    // FolderManager delete error
    folderDeleteFailed: 'Delete failed',
    
    // SpaceManager error message
    needLoginToCreateSpace: 'You need to login first to create space',
    
    // Fetch button
    fetchInfo: 'Fetch Website Info',
    fetchingInfo: 'Fetching...',
    fetchSuccess: 'Fetch Success',
    fetchFailed: 'Fetch Failed',
    fetchInfoDesc: 'Automatically fetch website title, description and icon',
    tryAgain: 'Try Again',
    
    // API Key Management
    apiKeyManager: 'API Key Management',
    apiKeyDescription: 'Used for browser extension authentication, please keep your API Key safe',
    yourApiKey: 'Your API Key',
    hideApiKey: 'Hide API Key',
    showApiKey: 'Show API Key',
    hide: 'Hide',
    show: 'Show',
    apiKeyWarning: 'This key is used for browser extension verification, please do not share with others',
    copyApiKey: 'Copy API Key',
    copyApiKeyClipboard: 'API Key copied to clipboard!',
    generating: 'Generating...',
    noApiKeySet: 'You have not set an API Key yet',
    regenerate: 'Regenerate',
    generateApiKey: 'Generate API Key',
    apiKeyGeneratedSuccess: 'API Key generated successfully!',
    generateApiKeyFailed: 'Failed to generate API Key',
    generateApiKeyFailedNetwork: 'Failed to generate API Key: Network error',
    copyFailedManual: 'Copy failed, please copy manually',
    
    // Import/Export Features
    importExportTitle: 'Chrome/Edge/Firefox Bookmark Import/Export',
    importExportDesc: 'Support importing HTML bookmark files from Chrome, Edge, Firefox and other browsers, export format is also compatible with corresponding browsers',
    importBookmarks: 'Import Bookmarks',
    importBookmarksDesc: 'Import bookmark data from HTML files, automatically fetch website icons and create folders named with import time',
    dragDropHtmlFile: 'Drag HTML bookmark file here, or',
    selectFile: 'Select File',
    startImport: 'Start Import',
    importing: 'Importing...',
    importFailed: 'Import failed',
    importFailedNetwork: 'Import failed: Network error',
    folderLabel: 'Folder:',
    viewErrorDetails: 'View Error Details',
    exportFailed: 'Export failed',
    exportFailedNetwork: 'Export failed: Network error',
    exportBookmarks: 'Export Bookmarks',
    exportBookmarkDesc: 'Export bookmarks as HTML files, compatible with Chrome/Edge and other mainstream browsers',
    exportScopeTitle: 'Select Export Scope',
    selectFolder: 'Select Folder',
    selectFolderSpace: 'Select Space',
    reloadFolder: 'Reload',
    netscapeBookmarkFormat: 'Support NETSCAPE-Bookmark-file-1 format HTML bookmarks (exported from Chrome, Edge, Firefox and other browsers)',
    noFolderInSpace: 'No folders in this space yet',
    
    // Batch Operations
    spaceSelectionStatus: 'Space Selection Status',
    allSpaces: 'All Spaces',
    exitBatchMode: 'Exit Batch Mode',
    batchOperations: 'Batch Operations',
    selectAll: 'Select All',
    selectedXBookmarks: 'Selected X bookmarks',
    selectedCount: 'Selected {count} bookmarks',
    clearSelection: 'Clear Selection',
    batchMove: 'Batch Move',
    batchMoveTitle: 'Batch Move Bookmarks ({count})',
    targetSpace: 'Target Space',
    targetFolder: 'Target Folder',
    confirmMove: 'Confirm Move',
    batchDelete: 'Batch Delete',
    deletedXBookmarks: 'Deleted X bookmarks',
    batchDeletedCount: 'Deleted {count} bookmarks',
    batchMovedCount: 'Moved {count} bookmarks',
    batchDeleteFailed: 'Batch delete failed',
    batchMoveFailed: 'Batch move failed',
    
    // Folder and Bookmark Status
    noFolder: 'No Folder',
    uncategorizedBookmarks: 'Uncategorized Bookmarks',
    
    // Accessibility labels
    selectOptions: 'Select options',
    
    // System Card Description
    systemCardDesc: 'Set the system card for the space, which will be displayed at the top of the sidebar. Recommended size: 520px × 120px',
  }
}

export type TranslationKey = keyof typeof translations.zh
export type Language = 'zh' | 'en'
