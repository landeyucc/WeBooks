'use client';

import { useEffect, useRef } from 'react';

interface ThemeLoaderProps {
  defaultTheme?: 'light' | 'dark';
  defaultThemeType?: 'neumorphism' | 'skyblue';
}

export function ThemeLoader({ defaultTheme, defaultThemeType }: ThemeLoaderProps) {
  // 锁定服务器默认值，避免 prop 引用变化导致 useEffect 反复执行
  const defaultsRef = useRef({
    defaultTheme: defaultTheme ?? 'light',
    defaultThemeType: defaultThemeType ?? 'neumorphism'
  });
  // 标记首次初始化已完成，避免重复执行
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // 直接读取 localStorage（与 layout.tsx 的 inline script 保持相同逻辑）
    // 优先级: localStorage > 服务器默认值 > 'light' / 'neumorphism'
    let savedTheme: string | null = null;
    let savedThemeType: string | null = null;
    try {
      savedTheme = localStorage.getItem('theme')
      savedThemeType = localStorage.getItem('themeType')
    } catch {}

    const { defaultTheme: dTheme, defaultThemeType: dType } = defaultsRef.current;
    const effectiveTheme = savedTheme || dTheme || 'light';
    const effectiveThemeType = savedThemeType || dType || 'neumorphism';

    document.documentElement.classList.remove('theme-neumorphism', 'theme-skyblue');
    document.documentElement.classList.add(`theme-${effectiveThemeType}`);
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
  }, []);

  return null;
}
