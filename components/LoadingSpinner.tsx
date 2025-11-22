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
      <div 
        className={`${containerSizeClasses[size]} animate-spin relative`}
      >
        <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-800"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
        <Image 
          src="/anx.gif" 
          alt="加载中" 
          className={`${sizeClasses[size]} opacity-60 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`}
          style={{ mixBlendMode: 'multiply' }}
          width={size === 'sm' ? 16 : size === 'md' ? 24 : 32}
          height={size === 'sm' ? 16 : size === 'md' ? 24 : 32}
          unoptimized
        />
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