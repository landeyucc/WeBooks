import React, { useState, useCallback } from 'react'

// 热更新回调接口
interface HotUpdateCallbacks {
  [key: string]: () => void
}

// 热更新状态接口
interface HotUpdateState {
  updateKey: string
  timestamp: number
}

// 热更新配置接口
interface HotUpdateConfig {
  updateKey: string
  onUpdate?: () => void
}

// 热更新事件类型
interface HotUpdateEvent {
  updateKey: string
  timestamp: number
  data?: unknown
}

// 热更新Hook返回类型
interface UseHotUpdateReturn {
  triggerUpdate: (config: HotUpdateConfig) => void
  updateKey: string
  timestamp: number
  isUpdating: boolean
  updateData: (data: unknown) => void
  pendingUpdates: string[]
  clearUpdates: () => void
}

// 全局热更新管理器
class HotUpdateManager {
  private callbacks: HotUpdateCallbacks = {}
  private listeners: Set<(event: HotUpdateEvent) => void> = new Set()
  private updateStates: { [key: string]: HotUpdateState } = {}

  // 注册热更新回调
  registerCallback(updateKey: string, callback: () => void): void {
    this.callbacks[updateKey] = callback
  }

  // 取消注册热更新回调
  unregisterCallback(updateKey: string): void {
    delete this.callbacks[updateKey]
  }

  // 添加监听器
  addListener(listener: (event: HotUpdateEvent) => void): void {
    this.listeners.add(listener)
  }

  // 移除监听器
  removeListener(listener: (event: HotUpdateEvent) => void): void {
    this.listeners.delete(listener)
  }

  // 触发热更新
  trigger(updateKey: string, data?: unknown): void {
    // 更新状态
    this.updateStates[updateKey] = {
      updateKey,
      timestamp: Date.now()
    }

    // 执行回调
    if (this.callbacks[updateKey]) {
      this.callbacks[updateKey]()
    }

    // 发送事件
    const event: HotUpdateEvent = {
      updateKey,
      timestamp: Date.now(),
      data
    }

    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('热更新监听器执行错误:', error)
      }
    })
  }

  // 获取更新状态
  getUpdateState(updateKey: string): HotUpdateState | null {
    return this.updateStates[updateKey] || null
  }

  // 获取所有更新状态
  getAllUpdateStates(): { [key: string]: HotUpdateState } {
    return { ...this.updateStates }
  }
}

// 创建全局热更新管理器实例
export const hotUpdateManager = new HotUpdateManager()

// 热更新Hook
export function useHotUpdate(): UseHotUpdateReturn {
  const [updateKey, setUpdateKey] = useState('')
  const [timestamp, setTimestamp] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<string[]>([])

  // 触发热更新
  const triggerUpdate = useCallback((config: HotUpdateConfig) => {
    console.log('useHotUpdate triggerUpdate 被调用', config)
    setIsUpdating(true)
    const { updateKey: key, onUpdate } = config

    // 注册回调
    if (onUpdate) {
      console.log('注册热更新回调:', key)
      hotUpdateManager.registerCallback(key, onUpdate)
    }

    // 延迟一小段时间再触发，确保回调注册完成
    setTimeout(() => {
      console.log(`延迟触发热更新: ${key}`)
      hotUpdateManager.trigger(key)
    }, 50)

    // 更新状态
    setUpdateKey(key)
    setTimestamp(Date.now())
    setPendingUpdates(prev => [...prev, key])

    // 短暂延迟后重置更新状态
    setTimeout(() => {
      setIsUpdating(false)
      setPendingUpdates(prev => prev.filter(k => k !== key))
    }, 1000)
  }, [])

  // 更新数据
  const updateData = useCallback((data: unknown) => {
    if (updateKey) {
      hotUpdateManager.trigger(updateKey, data)
    }
  }, [updateKey])

  // 清除更新
  const clearUpdates = useCallback(() => {
    setPendingUpdates([])
    setUpdateKey('')
    setTimestamp(0)
  }, [])

  return {
    triggerUpdate,
    updateKey,
    timestamp,
    isUpdating,
    updateData,
    pendingUpdates,
    clearUpdates
  }
}

// 热更新触发器组件
interface HotUpdateTriggerProps {
  updateKey: string
  onUpdate?: () => void
  children: React.ReactNode
  className?: string
}

export function HotUpdateTrigger({ updateKey, onUpdate, children, className }: HotUpdateTriggerProps) {
  const [updateCounter, setUpdateCounter] = React.useState(0)
  const [isUpdating, setIsUpdating] = React.useState(false)

  // 组件挂载时注册回调
  React.useEffect(() => {
    if (onUpdate) {
      hotUpdateManager.registerCallback(updateKey, onUpdate)
      return () => {
        hotUpdateManager.unregisterCallback(updateKey)
      }
    }
  }, [updateKey, onUpdate])

  // 监听热更新事件
  React.useEffect(() => {
    const handleUpdate = (event: HotUpdateEvent) => {
      if (event.updateKey === updateKey) {
        console.log(`热更新事件接收: ${updateKey}`)
        setIsUpdating(true)
        // 增加计数器，触发组件重新渲染
        setUpdateCounter(prev => prev + 1)
      }
    }

    hotUpdateManager.addListener(handleUpdate)
    return () => {
      hotUpdateManager.removeListener(handleUpdate)
    }
  }, [updateKey])

  // 组件重新渲染完成后执行onUpdate
  React.useEffect(() => {
    if (updateCounter > 0 && !isUpdating && onUpdate) {
      // 延迟执行，确保组件重新渲染完成
      const timer = setTimeout(() => {
        console.log('执行热更新回调:', updateKey)
        setIsUpdating(false)
        onUpdate()
      }, 200)
      
      return () => clearTimeout(timer)
    } else if (updateCounter > 0 && isUpdating) {
      // 重置更新状态
      setIsUpdating(false)
    }
  }, [updateCounter, updateKey, onUpdate, isUpdating])

  return (
    <div 
      className={className}
      data-hot-update-key={updateKey}
      key={`hot-update-${updateKey}-${updateCounter}`}
    >
      {children}
    </div>
  )
}

export default useHotUpdate