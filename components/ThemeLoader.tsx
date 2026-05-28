'use client';

import { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

// 导入主题CSS
import '../app/styles/theme-neumorphism.css';
import '../app/styles/theme-skyblue.css';

export function ThemeLoader() {
  const { themeType } = useApp();

  useEffect(() => {
    // 移除所有主题类
    document.documentElement.classList.remove('theme-neumorphism', 'theme-skyblue');
    // 添加当前主题类
    document.documentElement.classList.add(`theme-${themeType}`);
  }, [themeType]);

  return null;
}
