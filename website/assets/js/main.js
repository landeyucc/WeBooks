/**
 * Webooks 网站主要JavaScript功能
 */

// DOM元素获取
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

// 移动端菜单切换
function toggleMobileMenu() {
    if (navMenu && mobileMenuToggle) {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
        
        // 切换移动端菜单动画
        const spans = mobileMenuToggle.querySelectorAll('span');
        if (mobileMenuToggle.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    }
}

// 监听移动端菜单点击
if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
}

// 平滑滚动到指定元素
function scrollToElement(selector, offset = 0) {
    const element = document.querySelector(selector);
    if (element) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// 复制到剪贴板功能
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        // 备用方案：使用传统的复制方法
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return new Promise((resolve, reject) => {
            if (document.execCommand('copy')) {
                resolve();
            } else {
                reject();
            }
            document.body.removeChild(textArea);
        });
    }
}

// 显示通知消息
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加通知样式
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '9999',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease',
        maxWidth: '400px',
        wordWrap: 'break-word'
    });
    
    // 设置通知类型颜色
    const colors = {
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// 复制代码功能
function initializeCodeCopy() {
    const codeBlocks = document.querySelectorAll('pre');
    
    codeBlocks.forEach(codeBlock => {
        // 检查是否已经有复制按钮
        if (codeBlock.querySelector('.copy-btn')) return;
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '📋';
        copyBtn.title = '复制代码';
        
        // 复制按钮样式
        Object.assign(copyBtn.style, {
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: 'white',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px',
            opacity: '0.7',
            transition: 'opacity 0.2s ease'
        });
        
        copyBtn.addEventListener('mouseenter', () => {
            copyBtn.style.opacity = '1';
        });
        
        copyBtn.addEventListener('mouseleave', () => {
            copyBtn.style.opacity = '0.7';
        });
        
        copyBtn.addEventListener('click', async () => {
            try {
                const code = codeBlock.querySelector('code').textContent;
                await copyToClipboard(code);
                copyBtn.innerHTML = '✅';
                showNotification('代码已复制到剪贴板', 'success');
                
                setTimeout(() => {
                    copyBtn.innerHTML = '📋';
                }, 2000);
            } catch {
                showNotification('复制失败，请手动选择代码', 'error');
            }
        });
        
        // 设置相对定位以容纳绝对定位的按钮
        codeBlock.style.position = 'relative';
        codeBlock.appendChild(copyBtn);
    });
}

// FAQ折叠功能
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('h3');
        if (question) {
            question.style.cursor = 'pointer';
            
            question.addEventListener('click', () => {
                item.classList.toggle('active');
            });
        }
    });
}

// 搜索功能
function initializeSearch() {
    const searchInput = document.getElementById('faq-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const faqItems = document.querySelectorAll('.faq-item');
            
            faqItems.forEach(item => {
                const question = item.querySelector('h3').textContent.toLowerCase();
                const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
                
                if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
}

// 滚动时高亮当前导航项
function initializeScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.docs-nav-menu a[href^="#"], .sidebar-section a[href^="#"]');
    
    if (sections.length === 0 || navLinks.length === 0) return;
    
    const observerOptions = {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                
                // 更新导航链接状态
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

// 页面加载动画
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // 为需要动画的元素添加观察
    const animatedElements = document.querySelectorAll('.feature-card, .quick-start-step, .next-step');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// 键盘导航支持
function initializeKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // ESC 键关闭移动菜单
        if (e.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
            toggleMobileMenu();
        }
        
        // Ctrl/Cmd + K 打开搜索
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('faq-search');
            if (searchInput) {
                searchInput.focus();
            }
        }
    });
}

// 返回顶部按钮
function initializeBackToTop() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.className = 'back-to-top';
    
    // 设置样式
    Object.assign(backToTopBtn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        opacity: '0',
        visibility: 'hidden',
        transition: 'all 0.3s ease',
        zIndex: '1000',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    });
    
    document.body.appendChild(backToTopBtn);
    
    // 监听滚动事件
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.visibility = 'visible';
        } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.visibility = 'hidden';
        }
    });
    
    // 点击返回顶部
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // 悬停效果
    backToTopBtn.addEventListener('mouseenter', () => {
        backToTopBtn.style.transform = 'translateY(-2px)';
        backToTopBtn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
    });
    
    backToTopBtn.addEventListener('mouseleave', () => {
        backToTopBtn.style.transform = 'translateY(0)';
        backToTopBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });
}

// 图片懒加载
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // 备用方案：直接加载所有图片
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

// 代码高亮功能已整合到其他模块中

// 主题切换功能（可选）
function initializeThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        themeToggle.innerHTML = newTheme === 'light' ? '🌙' : '☀️';
    });
    
    // 初始化主题按钮图标
    themeToggle.innerHTML = currentTheme === 'light' ? '🌙' : '☀️';
}

// 错误处理
function initializeErrorHandling() {
    window.addEventListener('error', function(e) {
        console.error('JavaScript错误:', e.error);
        // 可以在这里添加错误上报逻辑
    });
    
    window.addEventListener('unhandledrejection', function(e) {
        console.error('未处理的Promise拒绝:', e.reason);
        e.preventDefault();
    });
}

// 性能监控
function initializePerformanceMonitoring() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log(`页面加载时间: ${loadTime}ms`);
            
            // 可以在这里添加性能数据收集逻辑
        });
    }
}

// 初始化所有功能
function initializeApp() {
    try {
        // 基础功能
        initializeCodeCopy();
        initializeFAQ();
        initializeSearch();
        initializeScrollSpy();
        initializeAnimations();
        initializeKeyboardNavigation();
        initializeBackToTop();
        initializeLazyLoading();
        initializeErrorHandling();
        initializePerformanceMonitoring();
        
        // 可选功能
        initializeThemeToggle();
        
        console.log('Webooks 网站功能初始化完成');
    } catch (error) {
        console.error('初始化过程中发生错误:', error);
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// 导出函数供其他脚本使用
window.Webooks = {
    toggleMobileMenu,
    scrollToElement,
    copyToClipboard,
    showNotification,
    scrollToElement
};

// 为移动端菜单添加额外样式
const additionalStyles = `
    @media (max-width: 768px) {
        .nav-menu {
            position: fixed;
            top: 4rem;
            left: 0;
            right: 0;
            background: var(--bg-white);
            border-bottom: 1px solid var(--border-light);
            flex-direction: column;
            padding: 1rem;
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .nav-menu.active {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
        }
        
        .mobile-menu-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .mobile-menu-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-menu-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
    }
`;

// 注入额外样式
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);