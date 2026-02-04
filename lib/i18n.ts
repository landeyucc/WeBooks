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
    unlocking: '解锁中...',
    verifying: '验证中...',
    
    // 加密空间
    unlockEncryptedSpace: '解锁加密空间',
    spaceRequiresPassword: '空间',
    requiresPassword: '需要密码访问',
    enterPassword: '请输入密码',
    enterPasswordPlaceholder: '请输入密码',
    unlock: '解锁',
    passwordIncorrect: '密码错误，请重试',
    passwordVerificationFailed: '密码验证失败，请重试',
    
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
    sortBy: '排序',
    sortOrder: '顺序',
    createdAt: '创建时间',
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
    
    // 消息框
    alertTitle: '提示',
    confirmTitle: '确认操作',
    alertConfirm: '确定',
    confirmCancel: '取消',

    // 通知图标
    iconSuccess: '成功:',
    iconError: '错误:',
    iconWarning: '警告:',
    iconInfo: '信息:',
    iconQuestion: '问题:',
    
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
    importExportDesc: '支持从浏览器书签、其他书签管理器导入数据，以及导出为各种格式。',
    
    // Header组件特定文本
    toggleMenuAria: '切换菜单',
    toggleSearchAria: '切换搜索',
    searchBookmarksPlaceholder: '搜索书签...',
    searchEnginePlaceholder: '搜索网络...',
    searchEngineMode: '搜索引擎',
    searchResultsFor: '搜索 "{query}" 的结果 ({count} 个)',
    noSearchResults: '未找到包含 "{query}" 的书签',
    
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
    
    // 批量操作相关
    batchOperation: '批量操作',
    exitBatchMode: '退出批量模式',
    selectedCountBookmarks: '已选择 {count} 个书签',
    clearSelection: '清除选择',
    batchMove: '批量移动',
    batchDelete: '批量删除',
    selectAll: '全选',
    batchMoveBookmarks: '批量移动书签',
    targetSpace: '目标空间',
    targetFolder: '目标文件夹',
    selectTargetSpace: '选择目标空间',
    selectTargetFolder: '选择目标文件夹',
    noFolder: '无文件夹',
    confirmMove: '确认移动',
    uncategorizedBookmarks: '未分类书签',
    allSpaces: '所有空间',
    
    // 导入导出功能
    importBookmarks: '导入书签',
    importBookmarksDesc: '从HTML文件导入书签数据，自动获取网站图标并创建以导入时间命名的文件夹',
    exportBookmarks: '导出书签',
    exportBookmarksDesc: '导出书签为HTML文件，兼容Chrome/Edge等主流浏览器',
    selectFile: '选择文件',
    dragFileHere: '拖拽HTML书签文件到此处，或',
    startImport: '开始导入',
    importing: '导入中...',
    selectExportScope: '选择导出范围',
    allBookmarksExport: '全部书签',
    specifiedSpaceExport: '指定空间',
    specifiedFolderExport: '指定文件夹',
    selectExportSpace: '选择空间',
    selectExportFolder: '选择文件夹',
    exportFolderSpace: '选择空间',
    exportFolderPlaceholder: '选择要导出文件夹的空间',
    folderNoData: '该空间暂无文件夹',
    exportButton: '导出书签',
    exportSystemConfig: '导出系统参数',
    exportSystemConfigDesc: '导出系统配置数据，包括默认空间、网站设置、SEO信息等系统参数，可用于备份或迁移',
    exportSystemConfigButton: '导出系统参数',
    exportSystemConfigSuccess: '系统参数导出成功！',
    importSystemConfig: '导入系统参数',
    importSystemConfigDesc: '从之前导出的JSON文件导入系统配置数据，支持合并和替换两种模式',
    importSystemConfigButton: '导入系统参数',
    importMode: '导入模式',
    mergeMode: '合并模式',
    replaceMode: '替换模式',
    importModeDesc: '合并：保留现有数据，添加新数据；替换：完全替换现有数据',
    selectSystemConfigFile: '选择系统配置文件',
    chooseFile: '选择文件',
    importSuccess: '成功导入 %d 个书签',
    importSystemConfigSuccess: '系统参数导入成功！',
    importFailed: '导入失败',
    networkError: '网络错误',
    selectValidFile: '请选择有效的HTML书签文件',
    invalidFileType: '无效的文件类型',
    invalidJsonFormat: '无效的JSON格式',
    selectBookmarkFileFirst: '请先选择一个书签文件',
    seeErrorDetails: '查看错误详情',
    supportNetscapeFormat: '支持NETSCAPE-Bookmark-file-1格式的HTML书签（Chrome、Edge、Firefox等浏览器导出）',
    
    // 页面标签
    pageFolders: '文件夹',
    pageBookmarks: '书签',
    pageImportExport: '导入导出',
    pageSettings: '系统设置',
    
    
    // 导入导出功能
    
    noFileSelected: '未选择文件',
    exportScopePlaceholder: '选择导出范围',
    exportSpacePlaceholder: '选择要导出的空间',
    
    // 选项卡标签
    tabsSpaces: '空间',
    tabsFolders: '文件夹',
    tabsBookmarks: '书签',
    tabsImportExport: '导入导出',
    tabsSettings: '系统设置',
    
    // 无障碍标签
    selectOptions: '选择选项',
    
    // 系统卡图说明
    systemCardDesc: '设置空间的系统卡图，将显示在侧边栏顶部。推荐尺寸：520px × 120px',
    
    // 密码重置功能
    resetAdminPassword: '重置管理员密码',
    confirmResetPasswordTitle: '重置管理员密码',
    resetPasswordQuestion: '确定要重置管理员 "<strong>{username}</strong>" 的密码吗？',
    newPassword: '新密码',
    newPasswordPlaceholder: '请输入新密码（至少6位）',
    confirmNewPassword: '确认新密码',
    confirmNewPasswordPlaceholder: '请再次输入新密码',
    confirmReset: '确认重置',
    resettingPassword: '重置中...',
    passwordRequired: '请输入新密码',
    passwordLengthMin: '密码长度至少为6位',
    passwordRequiresLetterAndNumber: '密码必须包含字母和数字',
    passwordStrongConfirm: '密码强度良好，使用此密码重置管理员账户',
    passwordStrengthInsufficient: '密码强度不足，请使用至少8位字母数字组合',
    resetPasswordNotification: '重置后请及时通知相关人员',
    passwordMismatch: '两次输入的密码不一致',
    enterPasswordFirst: '请输入新密码',
    passwordTooShort: '密码长度至少为6位',
    passwordResetSuccess: '管理员密码重置成功！新密码为：{password}',
    passwordResetFailed: '密码重置失败',
    passwordResetFailedNetwork: '密码重置失败：网络错误',
    passwordResetFailedMessage: '密码重置失败',
    userInformation: '用户信息',
    userId: '用户ID',
    passwordRequirementsText: '• 密码必须至少6个字符<br/>• 建议使用字母、数字和特殊字符组合<br/>• 重置后请及时通知相关人员',
    
    // 浏览器扩展API Key
    browserExtensionApiKey: '浏览器扩展API Key',
    browserExtensionApiKeyDesc: '用于浏览器扩展连接和认证的API Key，请妥善保管，不要泄露给他人。',
    currentApiKey: '当前API Key',
    noApiKeyPlaceholder: '暂无API Key，请点击生成',
    copy: '复制',
    apiKeyCopiedSuccess: 'API Key已复制到剪贴板',
    apiKeyGeneratedEnabled: '✓ API Key已生成并启用',
    apiKeyNotGeneratedWarning: '⚠ 尚未生成API Key',
    generating: '生成中...',
    regenerate: '重新生成',
    generateApiKey: '生成API Key',
    updateApiKey: '更新API Key',
    confirmRegenerateApiKey: '确定要重新生成API Key吗？旧的API Key将立即失效！',
    usageInstructions: '使用说明：',
    configureToBrowserExtension: '将此API Key配置到浏览器扩展中用于连接和认证',
    oldKeyInvalidAfterRegenerate: '重新生成API Key后，旧Key将立即失效',
    recommendRegularUpdate: '如需安全考虑，建议定期更新API Key',
    adminVisibleOnly: 'API Key仅对已认证的管理员可见，请妥善保管',

    // SpaceManager 加密相关文本
    encrypted: '加密',
    encryptThisSpace: '加密此空间',
    spacePassword: '空间密码',
    keepExistingPassword: '留空则保持原有密码',
    keepExistingPasswordDesc: '留空则保持原有密码不变',
    setPasswordDesc: '设置后访问此空间需要输入密码',
    
    // 其他硬编码文本的国际化
    newApiKeyGenerateSuccess: '新API Key生成成功！',
    generateApiKeyFailed: '生成API Key失败',
    exportFailed: '导出失败',
    loadingMore: '加载更多...',
    loadMore: '加载更多',
    scrollToLoadMore: '滚动加载更多',
    showingAllBookmarks: '已显示加载的 {count} 个书签',
    other: '其他',
    order: '顺序',
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
    unlocking: 'Unlocking...',
    verifying: 'Verifying...',
    
    // Encrypted Space
    unlockEncryptedSpace: 'Unlock Encrypted Space',
    spaceRequiresPassword: 'Space',
    requiresPassword: 'requires password to access',
    enterPassword: 'Enter Password',
    enterPasswordPlaceholder: 'Enter password',
    unlock: 'Unlock',
    passwordIncorrect: 'Incorrect password, please try again',
    passwordVerificationFailed: 'Password verification failed, please try again',
    
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
    sortBy: 'Sort by',
    sortOrder: 'Order',
    createdAt: 'Created at',

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
    
    // 消息框
    alertTitle: 'Alert',
    confirmTitle: 'Confirm Action',
    alertConfirm: 'OK',
    confirmCancel: 'Cancel',

    // 通知图标
    iconSuccess: 'Yes:',
    iconError: 'Error:',
    iconWarning: 'Warning:',
    iconInfo: 'Info:',
    iconQuestion: 'Question:',
    
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
    importExportDesc: 'Supports importing data from browser bookmarks, other bookmark managers, and exporting to various formats.',
    
    // Header component specific text
    toggleMenuAria: 'Toggle menu',
    toggleSearchAria: 'Toggle search',
    searchBookmarksPlaceholder: 'Search bookmarks...',
    searchEnginePlaceholder: 'Search web...',
    searchEngineMode: 'Search Engine',
    searchResultsFor: 'Results for "{query}" ({count})',
    noSearchResults: 'No bookmarks found for "{query}"',
    
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
    
    // Batch operations
    batchOperation: 'Batch Operation',
    exitBatchMode: 'Exit Batch Mode',
    selectedCountBookmarks: 'Selected {count} bookmarks',
    clearSelection: 'Clear Selection',
    batchMove: 'Batch Move',
    batchDelete: 'Batch Delete',
    selectAll: 'Select All',
    batchMoveBookmarks: 'Batch Move Bookmarks',
    targetSpace: 'Target Space',
    targetFolder: 'Target Folder',
    selectTargetSpace: 'Select Target Space',
    selectTargetFolder: 'Select Target Folder',
    noFolder: 'No Folder',
    confirmMove: 'Confirm Move',
    uncategorizedBookmarks: 'Uncategorized Bookmarks',
    allSpaces: 'All Spaces',
    
    // Import/Export functionality
    importBookmarks: 'Import Bookmarks',
    importBookmarksDesc: 'Import bookmark data from HTML files, automatically fetch website icons and create folders named with import time',
    exportBookmarks: 'Export Bookmarks',
    exportBookmarksDesc: 'Export bookmarks as HTML files, compatible with Chrome/Edge and other mainstream browsers',
    selectFile: 'Select File',
    dragFileHere: 'Drag HTML bookmark file here, or',
    startImport: 'Start Import',
    importing: 'Importing...',
    selectExportScope: 'Select Export Scope',
    allBookmarksExport: 'All Bookmarks',
    specifiedSpaceExport: 'Specified Space',
    specifiedFolderExport: 'Specified Folder',
    selectExportSpace: 'Select Space',
    selectExportFolder: 'Select Folder',
    exportFolderSpace: 'Select Space',
    exportFolderPlaceholder: 'Select space for export folder',
    folderNoData: 'No folders in this space',
    exportButton: 'Export Bookmarks',
    exportSystemConfig: 'Export System Config',
    exportSystemConfigDesc: 'Export system configuration data, including default space, site settings, SEO information and other system parameters for backup or migration',
    exportSystemConfigButton: 'Export System Config',
    exportSystemConfigSuccess: 'System config exported successfully!',
    importSystemConfig: 'Import System Config',
    importSystemConfigDesc: 'Import system configuration data from previously exported JSON file, supports both merge and replace modes',
    importSystemConfigButton: 'Import System Config',
    importMode: 'Import Mode',
    mergeMode: 'Merge Mode',
    replaceMode: 'Replace Mode',
    importModeDesc: 'Merge: Keep existing data and add new data; Replace: Completely replace existing data',
    selectSystemConfigFile: 'Select System Config File',
    chooseFile: 'Choose File',
    importSuccess: 'Successfully imported %d bookmarks',
    importSystemConfigSuccess: 'System config imported successfully!',
    importFailed: 'Import failed',
    networkError: 'Network error',
    selectValidFile: 'Please select a valid HTML bookmark file',
    invalidFileType: 'Invalid file type',
    invalidJsonFormat: 'Invalid JSON format',
    selectBookmarkFileFirst: 'Please select a bookmark file first',
    seeErrorDetails: 'View error details',
    supportNetscapeFormat: 'Support NETSCAPE-Bookmark-file-1 format HTML bookmarks (exported from Chrome, Edge, Firefox, etc.)',
    
    // Page tabs
    pageFolders: 'Folders',
    pageBookmarks: 'Bookmarks',
    pageImportExport: 'Import/Export',
    pageSettings: 'System Settings',
    
    noFileSelected: 'No file selected',
    exportScopePlaceholder: 'Select export scope',
    exportSpacePlaceholder: 'Select space to export',
    
    // Tab labels
    tabsSpaces: 'Spaces',
    tabsFolders: 'Folders',
    tabsBookmarks: 'Bookmarks',
    tabsImportExport: 'Import/Export',
    tabsSettings: 'System Settings',
    
    // Accessibility labels
    selectOptions: 'Select options',
    
    // System Card Description
    systemCardDesc: 'Set the system card for the space, which will be displayed at the top of the sidebar. Recommended size: 520px × 120px',
    
    // Password Reset Functionality
    resetAdminPassword: 'Reset Admin Password',
    confirmResetPasswordTitle: 'Reset Admin Password',
    resetPasswordQuestion: 'Are you sure you want to reset admin "<strong>{username}</strong>" password?',
    newPassword: 'New Password',
    newPasswordPlaceholder: 'Enter new password (minimum 6 characters)',
    confirmNewPassword: 'Confirm New Password',
    confirmNewPasswordPlaceholder: 'Enter new password again',
    confirmReset: 'Confirm Reset',
    resettingPassword: 'Resetting...',
    passwordRequired: 'Please enter new password',
    passwordLengthMin: 'Password must be at least 6 characters',
    passwordMismatch: 'Passwords do not match',
    passwordRequiresLetterAndNumber: 'Password must contain letters and numbers',
    passwordStrongConfirm: 'Password strength is good, using this password to reset admin account',
    passwordStrengthInsufficient: 'Password strength is insufficient, please use at least 8 character alphanumeric combination',
    userInformation: 'User Information',
    userId: 'User ID',
    passwordRequirementsText: '• Password must be at least 6 characters<br/>• Recommend using combination of letters, numbers and special characters<br/>• Please notify relevant personnel after reset',
    resetPasswordNotification: 'Please notify relevant personnel after reset',
    enterPasswordFirst: 'Please enter new password',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordResetSuccess: 'Admin password reset successfully! New password: {password}',
    passwordResetFailed: 'Password reset failed',
    passwordResetFailedNetwork: 'Password reset failed: Network error',
    passwordResetFailedMessage: 'Password reset failed',
    
    // Browser Extension API Key
    browserExtensionApiKey: 'Browser Extension API Key',
    browserExtensionApiKeyDesc: 'API Key for browser extension connection and authentication. Please keep it safe and do not share with others.',
    currentApiKey: 'Current API Key',
    noApiKeyPlaceholder: 'No API Key, please click generate',
    copy: 'Copy',
    apiKeyCopiedSuccess: 'API Key copied to clipboard',
    apiKeyGeneratedEnabled: '✓ API Key has been generated and enabled',
    apiKeyNotGeneratedWarning: '⚠ API Key not generated yet',
    generating: 'Generating...',
    regenerate: 'Regenerate',
    generateApiKey: 'Generate API Key',
    updateApiKey: 'Update API Key',
    confirmRegenerateApiKey: 'Are you sure you want to regenerate the API Key? The old Key will be invalidated immediately!',
    usageInstructions: 'Usage Instructions:',
    configureToBrowserExtension: 'Configure this API Key in the browser extension for connection and authentication',
    oldKeyInvalidAfterRegenerate: 'After regenerating the API Key, the old Key will be invalidated immediately',
    recommendRegularUpdate: 'For security reasons, it is recommended to update the API Key regularly',
    adminVisibleOnly: 'API Key is only visible to authenticated administrators, please keep it safe',

    // SpaceManager encryption related text
    encrypted: 'Encrypted',
    encryptThisSpace: 'Encrypt this space',
    spacePassword: 'Space Password',
    keepExistingPassword: 'Leave blank to keep original password',
    keepExistingPasswordDesc: 'Leave blank to keep original password unchanged',
    setPasswordDesc: 'After setting, access to this space requires password entry',
    
    // Other hardcoded text internationalization
    newApiKeyGenerateSuccess: 'New API Key generated successfully!',
    generateApiKeyFailed: 'Failed to generate API Key',
    exportFailed: 'Export failed',
    loadingMore: 'Loading more...',
    loadMore: 'Load more',
    scrollToLoadMore: 'Scroll to load more',
    showingAllBookmarks: 'Showing loaded {count} bookmarks',
    other: 'Other',
    order: 'Order',
  }
}

export type TranslationKey = keyof typeof translations.zh
export type Language = 'zh' | 'en'
