import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FoldableSectionProps {
  title: string
  icon?: React.ReactNode
  defaultExpanded?: boolean
  children: React.ReactNode
}

export default function FoldableSection({
  title,
  icon,
  defaultExpanded = false,
  children
}: FoldableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="foldable-section border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="foldable-header w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="foldable-icon">{icon}</span>}
          <span className="foldable-title">{title}</span>
        </div>
        <ChevronDown
          className={`foldable-chevron w-5 h-5 transition-transform duration-300 ${
            isExpanded ? 'rotate-0 text-blue-500' : '-rotate-90 text-gray-400'
          }`}
        />
      </button>
      <div
        className={`foldable-content transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="foldable-content-inner p-3 space-y-2">
          {children}
        </div>
      </div>
    </div>
  )
}
