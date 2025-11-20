'use client';

import React, { useState } from 'react';
import Image from 'next/image';

// RobustImage 组件 - 确保所有必要的属性都被正确设置
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
  const [imgError, setImgError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // 清理 URL（移除前后空格和括号）
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
    if (!imgError && fallbackSrc) {
      setImgError(true);
      setCurrentSrc(fallbackSrc);
      return;
    }
    
    // 如果有自定义错误处理器，调用它
    if (onError) {
      onError(e);
    } else {
      console.warn(`Failed to load image: ${currentSrc}`);
    }
  };

  // 如果 URL 无效，返回默认占位符
  if (!isValidImageUrl(cleanUrl)) {
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
      src={cleanUrl}
      alt={alt}
      className={className}
      onError={handleError}
      unoptimized={unoptimized}
      // 对于 Next.js Image 组件，我们需要提供 width 和 height
      // 由于这些是动态内容，我们使用一个合理的默认值
      width={48}
      height={48}
      {...imageProps}
    />
  );
}

// 导出类型定义
export type { RobustImageProps };