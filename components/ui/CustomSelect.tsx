'use client'

import { useState, useRef, useEffect } from 'react'
import type { Key } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option<T extends Key | null | undefined = string> {
  value: T
  label: string
}

interface CustomSelectProps<T extends Key | null | undefined = string> {
  value: string
  onChange: (value: T) => void
  options: Option<T>[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function CustomSelect<T extends Key | null | undefined = string>({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  className = ''
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [showOnTop, setShowOnTop] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLUListElement>(null)

  // 获取当前选中的选项
  const selectedOption = options.find(option => option.value === value)

  // 检测空间并确定展开方向
  const checkSpaceAndSetDirection = () => {
    if (!selectRef.current) return
    
    const rect = selectRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const dropdownHeight = Math.min(options.length * 48 + 16, 240) // 估算下拉菜单高度
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    
    // 如果下方空间不足且上方空间充足，则向上展开
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      setShowOnTop(true)
    } else {
      setShowOnTop(false)
    }
  }

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 窗口大小改变时重新检测空间
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        checkSpaceAndSetDirection()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsOpen(false)
          selectRef.current?.blur()
          break
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex(prev => prev > 0 ? prev - 1 : prev)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (focusedIndex >= 0) {
            onChange(options[focusedIndex].value)
            setIsOpen(false)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusedIndex, options, onChange])

  // 滚动到选中项
  useEffect(() => {
    if (isOpen && optionsRef.current && focusedIndex >= 0) {
      const focusedElement = optionsRef.current.children[focusedIndex] as HTMLElement
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [focusedIndex, isOpen])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      setFocusedIndex(
        selectedOption 
          ? options.findIndex(opt => opt.value === selectedOption.value)
          : -1
      )
      
      // 检测空间并设置展开方向
      if (!isOpen) {
        // 延迟执行，确保元素已渲染
        setTimeout(checkSpaceAndSetDirection, 0)
      }
    }
  }

  const handleOptionClick = (optionValue: T) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div 
      ref={selectRef}
      className={`relative ${className}`}
    >
      {/* Select 触发器 */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          neu-select w-full px-4 py-3 text-left flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-primary' : ''}
        `}
        aria-expanded={`${isOpen}`}
        aria-haspopup="listbox"
        aria-label={selectedOption ? selectedOption.label : placeholder}
      >
        <span className="text-gray-800 dark:text-gray-200">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 下拉选项 */}
      {isOpen && (
        <div className={`absolute left-0 right-0 z-50 ${
          showOnTop 
            ? 'bottom-full mb-2' 
            : 'top-full mt-2'
        }`}>
          <ul 
            ref={optionsRef}
            className="neu-card max-h-60 overflow-y-auto scrollbar-thin py-2"
            role="listbox"
            aria-label={placeholder || "Select options"}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value
              const isFocused = index === focusedIndex
              
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={`${isSelected}`}
                  className={`
                    px-4 py-3 text-sm cursor-pointer transition-all duration-150 rounded-[12px] mx-2 my-1
                    ${isSelected 
                      ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-medium' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                    ${isFocused ? 'bg-gray-50 dark:bg-gray-600' : ''}
                  `}
                  onClick={() => handleOptionClick(option.value)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  {option.label}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}