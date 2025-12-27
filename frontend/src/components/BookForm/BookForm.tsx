/**
 * Book Form Component
 * Handles book registration via keyword search, barcode scan, or manual entry
 */

import { useState, useEffect, useCallback } from 'react'
import { searchBooks, searchByBarcode, createBook } from '../../services/book_api'
import { listLocations } from '../../services/location_api'
import type { BookSearchResult, BookCreateRequest, Location } from '../../types'
import { BarcodeScanner } from '../BarcodeScanner/BarcodeScanner'
import { ApiClientError } from '../../services/api'

interface BookFormProps {
  onSuccess: () => void
  defaultUserId: string
}

export function BookForm({ onSuccess, defaultUserId }: BookFormProps) {
  const [mode, setMode] = useState<'search' | 'barcode' | 'manual'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null)
  const [manualBook, setManualBook] = useState({
    title: '',
    author: '',
    isbn: '',
    is_doujin: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateInfo, setDuplicateInfo] = useState<{ isbn: string } | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)

  const loadLocations = useCallback(async () => {
    setIsLoadingLocations(true)
    try {
      const response = await listLocations(defaultUserId)
      setLocations(response.locations || [])
    } catch (err) {
      // Show error to user but don't block form submission
      // Locations are optional for book creation
      console.error('Failed to load locations:', err)
      setError('場所一覧の読み込みに失敗しました。場所を選択せずに書籍を登録できます。')
    } finally {
      setIsLoadingLocations(false)
    }
  }, [defaultUserId])

  // Load locations on mount
  useEffect(() => {
    loadLocations()
  }, [loadLocations])

  const handleLocationToggle = (locationId: number) => {
    setSelectedLocationIds((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    )
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('検索キーワードを入力してください')
      return
    }

    setIsSearching(true)
    setError(null)
    setSearchResults([])

    try {
      const results = await searchBooks(searchQuery, 10)
      setSearchResults(results.items || [])
      if (results.items?.length === 0) {
        setError('書籍が見つかりませんでした。手動登録をお試しください。')
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(`検索エラー: ${err.message}`)
      } else {
        setError('検索に失敗しました。手動登録をお試しください。')
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleBarcodeScan = async (isbn: string) => {
    setShowBarcodeScanner(false)
    setIsSearching(true)
    setError(null)

    try {
      const result = await searchByBarcode(isbn)
      setSelectedBook(result)
      setMode('manual')
      setManualBook({
        title: result.title,
        author: result.author || '',
        isbn: result.isbn || '',
        is_doujin: false,
      })
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setError('書籍が見つかりませんでした。手動で情報を入力してください。')
        setMode('manual')
        setManualBook({
          title: '',
          author: '',
          isbn: isbn,
          is_doujin: false,
        })
      } else {
        setError('バーコード検索に失敗しました。手動登録をお試しください。')
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async () => {
    if (mode === 'search' && !selectedBook) {
      setError('書籍を選択してください')
      return
    }

    if (mode === 'manual' && !manualBook.title.trim()) {
      setError('タイトルは必須です')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setDuplicateInfo(null)

    try {
      // Type guard: selectedBook is guaranteed to be non-null when mode === 'search'
      const selectedBookData = mode === 'search' && selectedBook ? selectedBook : null
      
      const bookData: BookCreateRequest = {
        user_id: defaultUserId,
        title: selectedBookData ? selectedBookData.title : manualBook.title,
        author: selectedBookData ? selectedBookData.author : manualBook.author || undefined,
        isbn: selectedBookData ? selectedBookData.isbn : manualBook.isbn || undefined,
        thumbnail_url: selectedBookData ? selectedBookData.thumbnail_url : undefined,
        is_doujin: mode === 'manual' ? manualBook.is_doujin : false,
        location_ids: selectedLocationIds.length > 0 ? selectedLocationIds : undefined,
      }

      await createBook(bookData)
      onSuccess()
      // Reset form
      setMode('search')
      setSearchQuery('')
      setSearchResults([])
      setSelectedBook(null)
      setManualBook({ title: '', author: '', isbn: '', is_doujin: false })
      setSelectedLocationIds([])
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          try {
            const errorData = JSON.parse(err.message)
            if (errorData.error?.details?.existing_isbn) {
              setDuplicateInfo({ isbn: errorData.error.details.existing_isbn })
              setError('この書籍は既に登録されています。')
            } else {
              setError('この書籍は既に登録されています。')
            }
          } catch {
            setError('この書籍は既に登録されています。')
          }
        } else {
          setError(`登録エラー: ${err.message}`)
        }
      } else {
        setError('登録に失敗しました。もう一度お試しください。')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <h2>書籍登録</h2>

      {/* Mode selection */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setMode('search')}
          style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: mode === 'search' ? '#007bff' : '#f0f0f0',
            color: mode === 'search' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          検索
        </button>
        <button
          onClick={() => setShowBarcodeScanner(true)}
          style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          バーコード
        </button>
        <button
          onClick={() => setMode('manual')}
          style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: mode === 'manual' ? '#007bff' : '#f0f0f0',
            color: mode === 'manual' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          手動登録
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {error}
          {duplicateInfo && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              既存のISBN: {duplicateInfo.isbn}
            </div>
          )}
        </div>
      )}

      {/* Search mode */}
      {mode === 'search' && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="タイトルまたは著者名を入力"
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? '検索中...' : '検索'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h3>検索結果</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {searchResults.map((book, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedBook(book)}
                    style={{
                      padding: '1rem',
                      border: selectedBook === book ? '2px solid #007bff' : '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '1rem',
                    }}
                  >
                    {book.thumbnail_url && (
                      <img
                        src={book.thumbnail_url}
                        alt={book.title}
                        style={{ width: '60px', height: '80px', objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{book.title}</div>
                      {book.author && <div style={{ color: '#666' }}>{book.author}</div>}
                      {book.isbn && <div style={{ fontSize: '0.9rem', color: '#999' }}>ISBN: {book.isbn}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location selection */}
          {selectedBook && (
            <>
              {locations.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    所有場所（複数選択可）:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {locations.map((location) => (
                      <label
                        key={location.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedLocationIds.includes(location.id)}
                          onChange={() => handleLocationToggle(location.id)}
                          style={{ marginRight: '0.5rem' }}
                        />
                        <span>
                          {location.name} ({location.type === 'Physical' ? '物理' : 'デジタル'})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? '登録中...' : '登録'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Manual mode */}
      {mode === 'manual' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>タイトル *</label>
              <input
                type="text"
                value={manualBook.title}
                onChange={(e) => setManualBook({ ...manualBook, title: e.target.value })}
                placeholder="タイトル"
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
              />
            </div>
            <div>
              <label>著者</label>
              <input
                type="text"
                value={manualBook.author}
                onChange={(e) => setManualBook({ ...manualBook, author: e.target.value })}
                placeholder="著者名"
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
              />
            </div>
            <div>
              <label>ISBN</label>
              <input
                type="text"
                value={manualBook.isbn}
                onChange={(e) => setManualBook({ ...manualBook, isbn: e.target.value })}
                placeholder="ISBN（任意）"
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
              />
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={manualBook.is_doujin}
                  onChange={(e) => setManualBook({ ...manualBook, is_doujin: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                同人誌
              </label>
            </div>
            {/* Location selection */}
            {locations.length > 0 && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  所有場所（複数選択可）:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {locations.map((location) => (
                    <label
                      key={location.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.5rem',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocationIds.includes(location.id)}
                        onChange={() => handleLocationToggle(location.id)}
                        style={{ marginRight: '0.5rem' }}
                      />
                      <span>
                        {location.name} ({location.type === 'Physical' ? '物理' : 'デジタル'})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !manualBook.title.trim()}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting || !manualBook.title.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? '登録中...' : '登録'}
            </button>
          </div>
        </div>
      )}

      {/* Barcode scanner modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onError={(err) => {
            setError(err.message)
            setShowBarcodeScanner(false)
          }}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  )
}

