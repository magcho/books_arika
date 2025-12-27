/**
 * Location Manager Component
 * Handles location CRUD operations
 */

import { useState, useEffect, useCallback } from 'react'
import {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../../services/location_api'
import type { Location, LocationCreateRequest, LocationUpdateRequest } from '../../types'
import { ApiClientError } from '../../services/api'

interface LocationManagerProps {
  userId: string
  onLocationChange?: () => void
}

export function LocationManager({ userId, onLocationChange }: LocationManagerProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<LocationCreateRequest>({
    user_id: userId,
    name: '',
    type: 'Physical',
  })

  const loadLocations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await listLocations(userId)
      setLocations(response.locations || [])
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(`エラー: ${err.message}`)
      } else {
        setError('場所一覧の取得に失敗しました')
      }
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadLocations()
  }, [loadLocations])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('場所名を入力してください')
      return
    }

    try {
      await createLocation(formData)
      setFormData({ user_id: userId, name: '', type: 'Physical' })
      await loadLocations()
      onLocationChange?.()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(`作成エラー: ${err.message}`)
      } else {
        setError('場所の作成に失敗しました')
      }
    }
  }

  const handleUpdate = async (id: number, data: LocationUpdateRequest) => {
    setError(null)
    try {
      await updateLocation(id, data, userId)
      setEditingId(null)
      await loadLocations()
      onLocationChange?.()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(`更新エラー: ${err.message}`)
      } else {
        setError('場所の更新に失敗しました')
      }
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この場所を削除しますか？関連する所有情報も削除されます。')) {
      return
    }

    setError(null)
    try {
      await deleteLocation(id, userId)
      await loadLocations()
      onLocationChange?.()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(`削除エラー: ${err.message}`)
      } else {
        setError('場所の削除に失敗しました')
      }
    }
  }

  if (isLoading) {
    return <div>読み込み中...</div>
  }

  return (
    <div>
      <h2>場所管理</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Create Form */}
      <form onSubmit={handleCreate} style={{ marginBottom: '2rem' }}>
        <h3>新しい場所を追加</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            場所名:
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={100}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            形式:
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as 'Physical' | 'Digital',
                })
              }
            >
              <option value="Physical">物理（本棚など）</option>
              <option value="Digital">デジタル（Kindleなど）</option>
            </select>
          </label>
        </div>
        <button type="submit">追加</button>
      </form>

      {/* Location List */}
      <div>
        <h3>登録済みの場所</h3>
        {locations.length === 0 ? (
          <p>場所が登録されていません</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {locations.map((location) => (
              <li
                key={location.id}
                style={{
                  border: '1px solid #ccc',
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {editingId === location.id ? (
                  <EditForm
                    location={location}
                    onSave={(data) => handleUpdate(location.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div>
                      <strong>{location.name}</strong> ({location.type === 'Physical' ? '物理' : 'デジタル'})
                    </div>
                    <div>
                      <button onClick={() => setEditingId(location.id)}>編集</button>
                      <button onClick={() => handleDelete(location.id)}>削除</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

interface EditFormProps {
  location: Location
  onSave: (data: LocationUpdateRequest) => void
  onCancel: () => void
}

function EditForm({ location, onSave, onCancel }: EditFormProps) {
  const [name, setName] = useState(location.name)
  const [type, setType] = useState<'Physical' | 'Digital'>(location.type)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, type })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={100}
        required
        style={{ flex: 1 }}
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as 'Physical' | 'Digital')}
      >
        <option value="Physical">物理</option>
        <option value="Digital">デジタル</option>
      </select>
      <button type="submit">保存</button>
      <button type="button" onClick={onCancel}>
        キャンセル
      </button>
    </form>
  )
}

