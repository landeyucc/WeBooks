/**
 * Webooks 文档网站专用JavaScript功能
 */

// 文档网站特有的功能
const DocsSite = {
    
    // 侧边栏导航控制
    sidebar: {
        toggle() {
            const sidebar = document.querySelector('.docs-sidebar');
            const mainContent = document.querySelector('.docs-main');
            
            if (sidebar && mainContent) {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('sidebar-collapsed');
                
                // 保存状态到localStorage
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebar-collapsed', isCollapsed);
            }
        },
        
        init() {
            // 从localStorage恢复状态
            const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
            const sidebar = document.querySelector('.docs-sidebar');
            const mainContent = document.querySelector('.docs-main');
            
            if (isCollapsed && sidebar && mainContent) {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('sidebar-collapsed');
            }
            
            // 切换按钮
            const toggleBtn = document.querySelector('.sidebar-toggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => this.toggle());
            }
        }
    },
    
    // 代码块功能
    codeBlocks: {
        init() {
            this.addCopyButtons();
            this.highlightCurrentLine();
            this.addLineNumbers();
        },
        
        addCopyButtons() {
            const codeBlocks = document.querySelectorAll('.docs-content pre');
            
            codeBlocks.forEach(codeBlock => {
                if (codeBlock.querySelector('.copy-btn')) return;
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="m5 15-4-4 4-4"></path>
                        <path d="M5 5h8a2 2 0 0 1 2 2v8"></path>
                    </svg>
                `;
                copyBtn.title = '复制代码';
                
                copyBtn.addEventListener('click', async () => {
                    try {
                        const code = codeBlock.querySelector('code').textContent;
                        await navigator.clipboard.writeText(code);
                        
                        // 显示成功状态
                        const originalContent = copyBtn.innerHTML;
                        copyBtn.innerHTML = `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20,6 9,17 4,12"></polyline>
                            </svg>
                        `;
                        
                        this.showNotification('代码已复制到剪贴板', 'success');
                        
                        setTimeout(() => {
                            copyBtn.innerHTML = originalContent;
                        }, 2000);
                        
                    } catch (error) {
                        this.showNotification('复制失败，请手动选择代码', 'error');
                    }
                });
                
                codeBlock.style.position = 'relative';
                codeBlock.appendChild(copyBtn);
            });
        },
        
        highlightCurrentLine() {
            const codeBlocks = document.querySelectorAll('.docs-content pre');
            
            codeBlocks.forEach(codeBlock => {
                codeBlock.addEventListener('click', (e) => {
                    // 移除之前的高亮
                    const existingHighlight = codeBlock.querySelector('.line-highlight');
                    if (existingHighlight) {
                        existingHighlight.remove();
                    }
                    
                    // 创建新的高亮
                    const highlight = document.createElement('div');
                    highlight.className = 'line-highlight';
                    
                    const lineHeight = parseInt(getComputedStyle(codeBlock.querySelector('code')).lineHeight);
                    const rect = codeBlock.getBoundingClientRect();
                    const clickY = e.clientY - rect.top;
                    const lineNumber = Math.floor(clickY / lineHeight) + 1;
                    
                    highlight.style.cssText = `
                        position: absolute;
                        top: ${(lineNumber - 1) * lineHeight}px;
                        left: 0;
                        right: 0;
                        height: ${lineHeight}px;
                        background: rgba(var(--primary-color-rgb), 0.1);
                        border-left: 3px solid var(--primary-color);
                        pointer-events: none;
                    `;
                    
                    codeBlock.appendChild(highlight);
                });
            });
        },
        
        addLineNumbers() {
            const codeBlocks = document.querySelectorAll('.docs-content pre code');
            
            codeBlocks.forEach(codeBlock => {
                if (codeBlock.hasAttribute('data-line-numbers')) {
                    const code = codeBlock.textContent;
                    const lines = code.split('\n');
                    const lineNumbers = lines.map((_, index) => index + 1).join('\n');
                    
                    const wrapper = document.createElement('div');
                    wrapper.className = 'code-with-line-numbers';
                    
                    const lineNumbersEl = document.createElement('pre');
                    lineNumbersEl.className = 'line-numbers';
                    lineNumbersEl.textContent = lineNumbers;
                    
                    codeBlock.parentNode.insertBefore(wrapper, codeBlock);
                    wrapper.appendChild(lineNumbersEl);
                    wrapper.appendChild(codeBlock);
                }
            });
        }
    },
    
    // 搜索功能
    search: {
        init() {
            this.createSearchBox();
            this.bindEvents();
        },
        
        createSearchBox() {
            const header = document.querySelector('.docs-header');
            if (!header) return;
            
            const searchContainer = document.createElement('div');
            searchContainer.className = 'search-container';
            searchContainer.innerHTML = `
                <div class="search-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input type="text" id="docs-search" placeholder="搜索文档..." autocomplete="off">
                    <span class="search-shortcut">⌘K</span>
                </div>
            `;
            
            header.appendChild(searchContainer);
            
            // 搜索框样式
            const searchStyles = `
                .search-container {
                    position: relative;
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                }
                
                .search-box {
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-light);
                    border-radius: 8px;
                    padding: 8px 12px;
                    min-width: 300px;
                    transition: all 0.2s ease;
                }
                
                .search-box:focus-within {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.1);
                }
                
                .search-box svg {
                    color: var(--text-muted);
                    margin-right: 8px;
                }
                
                .search-box input {
                    flex: 1;
                    border: none;
                    background: none;
                    outline: none;
                    color: var(--text-primary);
                    font-size: 14px;
                }
                
                .search-box input::placeholder {
                    color: var(--text-muted);
                }
                
                .search-shortcut {
                    color: var(--text-muted);
                    font-size: 12px;
                    padding: 2px 6px;
                    background: var(--bg-tertiary);
                    border-radius: 4px;
                    margin-left: 8px;
                }
                
                .search-results {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: var(--bg-white);
                    border: 1px solid var(--border-light);
                    border-radius: 8px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                    max-height: 400px;
                    overflow-y: auto;
                    z-index: 1000;
                    display: none;
                }
                
                .search-result-item {
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-light);
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }
                
                .search-result-item:hover,
                .search-result-item.active {
                    background: var(--bg-secondary);
                }
                
                .search-result-item:last-child {
                    border-bottom: none;
                }
                
                .search-result-title {
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }
                
                .search-result-snippet {
                    font-size: 13px;
                    color: var(--text-secondary);
                    line-height: 1.4;
                }
                
                .search-result-url {
                    font-size: 12px;
                    color: var(--text-muted);
                    margin-top: 4px;
                }
            `;
            
            this.injectStyles(searchStyles);
        },
        
        bindEvents() {
            const searchInput = document.getElementById('docs-search');
            if (!searchInput) return;
            
            let searchTimeout;
            let currentResultIndex = -1;
            let searchResults = [];
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                if (query.length < 2) {
                    this.hideResults();
                    return;
                }
                
                searchTimeout = setTimeout(() => {
                    this.performSearch(query);
                }, 300);
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (!searchResults.length) return;
                
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        currentResultIndex = Math.min(currentResultIndex + 1, searchResults.length - 1);
                        this.updateActiveResult(currentResultIndex);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        currentResultIndex = Math.max(currentResultIndex - 1, -1);
                        this.updateActiveResult(currentResultIndex);
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (currentResultIndex >= 0) {
                            window.location.href = searchResults[currentResultIndex].url;
                        }
                        break;
                    case 'Escape':
                        this.hideResults();
                        searchInput.blur();
                        break;
                }
            });
            
            // 点击其他地方隐藏结果
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    this.hideResults();
                }
            });
        },
        
        performSearch(query) {
            // 模拟搜索结果（实际项目中应该连接到搜索引擎）
            const mockResults = [
                {
                    title: '快速开始指南',
                    snippet: '了解如何快速设置和使用 Webooks 书签管理工具...',
                    url: 'quick-start.html'
                },
                {
                    title: 'API 文档',
                    snippet: '完整的 REST API 参考，包括认证、端点和使用示例...',
                    url: 'api.html'
                },
                {
                    title: '书签管理',
                    snippet: '学习如何创建、编辑、删除和组织你的书签...',
                    url: 'api.html#bookmarks'
                },
                {
                    title: '部署指南',
                    snippet: '在各种环境中部署 Webooks 的详细说明...',
                    url: 'deployment.html'
                }
            ];
            
            const results = mockResults.filter(result => 
                result.title.toLowerCase().includes(query.toLowerCase()) ||
                result.snippet.toLowerCase().includes(query.toLowerCase())
            );
            
            this.displayResults(results);
        },
        
        displayResults(results) {
            const searchContainer = document.querySelector('.search-container');
            if (!searchContainer) return;
            
            // 移除之前的结果
            const existingResults = searchContainer.querySelector('.search-results');
            if (existingResults) {
                existingResults.remove();
            }
            
            if (!results.length) {
                return;
            }
            
            // 创建结果列表
            const resultsContainer = document.createElement('div');
            resultsContainer.className = 'search-results';
            
            results.forEach((result, index) => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <div class="search-result-title">${this.highlightQuery(result.title)}</div>
                    <div class="search-result-snippet">${this.highlightQuery(result.snippet)}</div>
                    <div class="search-result-url">${result.url}</div>
                `;
                
                resultItem.addEventListener('click', () => {
                    window.location.href = result.url;
                });
                
                resultsContainer.appendChild(resultItem);
            });
            
            searchContainer.appendChild(resultsContainer);
            resultsContainer.style.display = 'block';
        },
        
        highlightQuery(text) {
            const searchInput = document.getElementById('docs-search');
            const query = searchInput ? searchInput.value.trim() : '';
            
            if (!query) return text;
            
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        },
        
        updateActiveResult(index) {
            const results = document.querySelectorAll('.search-result-item');
            results.forEach((result, i) => {
                result.classList.toggle('active', i === index);
            });
        },
        
        hideResults() {
            const results = document.querySelector('.search-results');
            if (results) {
                results.style.display = 'none';
            }
        }
    },
    
    // 页面导航
    navigation: {
        init() {
            this.highlightCurrentSection();
            this.addNavigationArrows();
        },
        
        highlightCurrentSection() {
            const sections = document.querySelectorAll('.docs-content h1, .docs-content h2, .docs-content h3');
            const navLinks = document.querySelectorAll('.docs-nav-menu a');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        
                        navLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            }, {
                rootMargin: '-20% 0px -70% 0px',
                threshold: 0
            });
            
            sections.forEach(section => {
                if (section.id) {
                    observer.observe(section);
                }
            });
        },
        
        addNavigationArrows() {
            const content = document.querySelector('.docs-content');
            if (!content) return;
            
            const headings = Array.from(content.querySelectorAll('h1, h2, h3'));
            if (headings.length < 2) return;
            
            // 创建导航箭头容器
            const navArrows = document.createElement('div');
            navArrows.className = 'navigation-arrows';
            
            const prevBtn = document.createElement('button');
            prevBtn.className = 'nav-arrow nav-prev';
            prevBtn.innerHTML = '←';
            prevBtn.title = '上一节';
            
            const nextBtn = document.createElement('button');
            nextBtn.className = 'nav-arrow nav-next';
            nextBtn.innerHTML = '→';
            nextBtn.title = '下一节';
            
            navArrows.appendChild(prevBtn);
            navArrows.appendChild(nextBtn);
            
            content.appendChild(navArrows);
            
            // 箭头导航功能
            let currentIndex = 0;
            
            function updateNavigation() {
                if (currentIndex <= 0) {
                    prevBtn.style.opacity = '0.5';
                    prevBtn.disabled = true;
                } else {
                    prevBtn.style.opacity = '1';
                    prevBtn.disabled = false;
                }
                
                if (currentIndex >= headings.length - 1) {
                    nextBtn.style.opacity = '0.5';
                    nextBtn.disabled = true;
                } else {
                    nextBtn.style.opacity = '1';
                    nextBtn.disabled = false;
                }
            }
            
            function scrollToHeading(index) {
                if (index >= 0 && index < headings.length) {
                    headings[index].scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    currentIndex = index;
                    updateNavigation();
                }
            }
            
            prevBtn.addEventListener('click', () => {
                if (currentIndex > 0) {
                    scrollToHeading(currentIndex - 1);
                }
            });
            
            nextBtn.addEventListener('click', () => {
                if (currentIndex < headings.length - 1) {
                    scrollToHeading(currentIndex + 1);
                }
            });
            
            // 初始化导航状态
            updateNavigation();
            
            // 监听滚动以更新当前章节
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    const scrollPosition = window.pageYOffset + 100;
                    
                    for (let i = headings.length - 1; i >= 0; i--) {
                        if (headings[i].offsetTop <= scrollPosition) {
                            currentIndex = i;
                            updateNavigation();
                            break;
                        }
                    }
                }, 100);
            });
        }
    },
    
    // 进度指示器
    progressIndicator: {
        init() {
            this.createIndicator();
            this.bindEvents();
        },
        
        createIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'reading-progress';
            indicator.innerHTML = '<div class="reading-progress-bar"></div>';
            
            // 进度条样式
            const progressStyles = `
                .reading-progress {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: rgba(var(--primary-color-rgb), 0.1);
                    z-index: 9999;
                }
                
                .reading-progress-bar {
                    height: 100%;
                    background: var(--primary-color);
                    width: 0%;
                    transition: width 0.1s ease;
                }
            `;
            
            document.body.appendChild(indicator);
            this.injectStyles(progressStyles);
        },
        
        bindEvents() {
            const content = document.querySelector('.docs-content');
            if (!content) return;
            
            const progressBar = document.querySelector('.reading-progress-bar');
            
            window.addEventListener('scroll', () => {
                if (!content || !progressBar) return;
                
                const contentTop = content.offsetTop;
                const contentHeight = content.offsetHeight;
                const windowHeight = window.innerHeight;
                const scrollTop = window.pageYOffset;
                
                const progress = Math.min(
                    Math.max((scrollTop - contentTop) / (contentHeight - windowHeight), 0),
                    1
                );
                
                progressBar.style.width = `${progress * 100}%`;
            });
        }
    },
    
    // 工具方法
    injectStyles(css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    },
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease',
            maxWidth: '400px'
        });
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },
    
    // 初始化所有功能
    init() {
        this.sidebar.init();
        this.codeBlocks.init();
        this.search.init();
        this.navigation.init();
        this.progressIndicator.init();
        
        console.log('文档网站功能初始化完成');
    }
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DocsSite.init());
} else {
    DocsSite.init();
}

// 导出到全局作用域
window.DocsSite = DocsSite;