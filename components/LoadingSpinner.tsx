'use client'

import React from 'react'
import Image from 'next/image'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  const containerSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${containerSizeClasses[size]} relative flex items-center justify-center`}>
        {/* 旋转环 */}
        <div 
          className={`${containerSizeClasses[size]} animate-spin absolute`}
        >
          <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-800"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 dark:border-t-blue-400"></div>
        </div>
        
        {/* anx.gif 图像 - 居中显示，不旋转 */}
        <div className="relative z-10">
          <Image 
            src="/anx.gif" 
            alt="加载中" 
            className={`${sizeClasses[size]} rounded-full`}
            width={size === 'sm' ? 16 : size === 'md' ? 32 : 48}
            height={size === 'sm' ? 16 : size === 'md' ? 32 : 48}
            unoptimized
          />
        </div>
      </div>
      {message && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          {message}
        </p>
      )}
    </div>
  )
}

export default LoadingSpinner