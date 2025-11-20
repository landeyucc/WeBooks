'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'

interface Space {
  id: string
  name: string
  description: string | null
  iconUrl: string | null
  systemCardUrl: string | null
  _count?: { bookmarks: number; folders: number }
}

export default function SpaceManager() {
  const { token, t, isAuthenticated } = useApp()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    iconUrl: '',
    systemCardUrl: ''
  })

  // 优化：添加请求去重缓存ref，避免重复API调用
  const lastRequestRef = useRef<string>('')

  const fetchSpaces = useCallback(async () => {
    // 优化：添加请求去重逻辑，避免重复API调用
    const requestKey = `space-manager-${isAuthenticated}-${token}`
    if (lastRequestRef.current === requestKey) {
      return
    }
    lastRequestRef.current = requestKey

    setLoading(true)
    try {
      const response = await fetch('/api/spaces', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setSpaces(data.spaces || [])
    } catch {
      console.error(t('operationFailedNetwork'))
    } finally {
      setLoading(false)
    }
  }, [token, t, isAuthenticated])

  useEffect(() => {
    // 只有在用户已认证的情况下才获取空间
    if (isAuthenticated && token) {
      fetchSpaces()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, token, fetchSpaces])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 检查认证状态
    if (!token) {
      alert(t('needLoginToCreateSpace'))
      return
    }
    
    try {
      console.log('Token exists:', !!token)
      console.log('Form data:', formData)
      
      const url = editingSpace
        ? `/api/spaces/${editingSpace.id}`
        : '/api/spaces'
      
      const method = editingSpace ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchSpaces()
        handleCloseModal()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error(t('operationFailed'), errorData)
        
        // 根据错误类型显示更友好的消息
        let errorMessage = `${t('operationFailed')}: ${response.status}`
        if (errorData.error) {
          if (errorData.error.includes('用户不存在')) {
            errorMessage = t('loginExpired')
          } else if (errorData.error.includes('未授权')) {
            errorMessage = t('pleaseLogin')
          } else {
            errorMessage = errorData.error
          }
        }
        
        alert(errorMessage)
      }
    } catch {
      console.error(t('operationFailed'))
      alert(t('operationFailedNetwork'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return

    try {
      const response = await fetch(`/api/spaces/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        await fetchSpaces()
      } else {
        alert(t('deleteFailed'))
      }
    } catch {
      alert(t('deleteFailed'))
    }
  }

  const handleEdit = (space: Space) => {
    setEditingSpace(space)
    setFormData({
      name: space.name,
      description: space.description || '',
      iconUrl: space.iconUrl || '',
      systemCardUrl: space.systemCardUrl || ''
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSpace(null)
    setFormData({
      name: '',
      description: '',
      iconUrl: '',
      systemCardUrl: ''
    })
  }

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      iconUrl: '',
      systemCardUrl: ''
    })
    setShowModal(true)
  }

  if (loading) {
    return <div>{t('loading')}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('spaces')} ({spaces.length})
        </h2>
        <button onClick={handleCreate} className="btn-primary">
          {t('createSpace')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spaces.map((space) => (
          <div key={space.id} className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {space.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {space.description || t('noDescription')}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>
                {t('bookmarks')}: {space._count?.bookmarks || 0} | {t('folders')}: {space._count?.folders || 0}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(space)}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('edit')}
                </button>
                <button
                  onClick={() => handleDelete(space.id)}
                  className="text-red-600 dark:text-red-400 hover:underline"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingSpace ? t('edit') : t('create')} {t('spaces')}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('spaceName')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('spaceDesc')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('iconUrl')}</label>
                <input
                  type="url"
                  value={formData.iconUrl}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('systemCardUrlLabel')}</label>
                <input
                  type="url"
                  value={formData.systemCardUrl}
                  onChange={(e) => setFormData({ ...formData, systemCardUrl: e.target.value })}
                  placeholder={t('spaceCardImageUrl')}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">{t('spaceCardImageDesc')}</p>
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
