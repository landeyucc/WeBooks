'use client';

import React, { useState } from 'react';
import Image from 'next/image';

// RobustImage 组件
interface RobustImageProps extends Omit<React.ComponentProps<typeof Image>, 'width' | 'height'> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export default function RobustImage({
  src,
  alt,
  className = '',
  fallbackSrc,
  onError,
  ...imageProps
}: RobustImageProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [showFallback, setShowFallback] = useState(false);
  const maxRetries = 2;

  // 清理 URL
  const cleanUrl = currentSrc.trim().replace(/^[\s(]+|[\s)]+$/g, '');

  // 检查是否是有效的图片 URL
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    
    // 检查是否为base64 data URI格式
    if (url.startsWith('data:')) {
      // 检查是否为图片data URI
      const dataUriMatch = url.match(/^data:image\/(jpg|jpeg|png|gif|webp|svg|ico);base64,/i)
      return !!dataUriMatch
    }
    
    // 检查是否是有效的 URL
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // 如果已经显示占位符，直接返回
    if (showFallback) return;
    
    // 如果有 fallbackSrc 且还没尝试过，先尝试 fallbackSrc
    if (retryCount === 0 && fallbackSrc && currentSrc !== fallbackSrc) {
      setRetryCount(1);
      setCurrentSrc(fallbackSrc);
      return;
    }
    
    // 如果已达到最大重试次数，显示占位符
    if (retryCount >= maxRetries) {
      setShowFallback(true);
      return;
    }
    
    // 否则增加重试次数，再次尝试
    setRetryCount(prev => prev + 1);
    
    // 如果有自定义错误处理器则调用它
    if (onError) {
      onError(e);
    }
  };

  // 显示占位符
  if (showFallback || !isValidImageUrl(cleanUrl)) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-600 ${className}`}>
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  // 对于外部 URL，设置为不可优化
  const isExternal = cleanUrl.startsWith('http') || cleanUrl.startsWith('data:');
  const unoptimized = isExternal;

  return (
    <Image
      key={`${currentSrc}-${retryCount}`}
      src={cleanUrl}
      alt={alt}
      className={className}
      onError={handleError}
      unoptimized={unoptimized}
      width={48}
      height={48}
      {...imageProps}
    />
  );
}

export type { RobustImageProps };