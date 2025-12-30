/**
 * Book List Page
 * Main page for viewing and searching registered books
 */

import { useState, useEffect, useCallback } from 'react'
import { listBooks, getBookDetail } from '../services/book_api'
import { BookList } from '../components/BookList/BookList'
import { BookDetail } from '../components/BookDetail/BookDetail'
import { SearchBar } from '../components/SearchBar/SearchBar'
import type { BookWithLocations } from '../types'
import { DEFAULT_USER_ID } from '../config/constants'
import { ApiClientError } from '../services/api'

export function BookListPage() {
  const [books, setBooks] = useState<BookWithLocations[]>([])
  const [filteredBooks, setFilteredBooks] = useState<BookWithLocations[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<BookWithLocations | null>(null)

  const loadBooks = useCallback(async (search?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await listBooks(DEFAULT_USER_ID, search)
      const booksList = response.books || []
      setBooks(booksList)
      setFilteredBooks(booksList)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || '書籍一覧の取得に失敗しました')
      } else {
        setError('書籍一覧の取得に失敗しました')
      }
      setBooks([])
      setFilteredBooks([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      if (query.trim() === '') {
        setFilteredBooks(books)
      } else {
        // Real-time filtering: filter locally first, then search on server
        const localFiltered = books.filter(
          (book) =>
            book.title.toLowerCase().includes(query.toLowerCase()) ||
            (book.author && book.author.toLowerCase().includes(query.toLowerCase()))
        )
        setFilteredBooks(localFiltered)

        // Also trigger server-side search for more accurate results
        loadBooks(query)
      }
    },
    [books, loadBooks]
  )

  const handleBookClick = useCallback(async (book: BookWithLocations) => {
    setIsLoadingDetail(true)
    setError(null)
    try {
      // Fetch book detail with locations from API
      const bookDetail = await getBookDetail(book.isbn, DEFAULT_USER_ID)
      setSelectedBook(bookDetail)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || '書籍詳細の取得に失敗しました')
      } else {
        setError('書籍詳細の取得に失敗しました')
      }
      // Fallback: use the book from list if detail fetch fails
      setSelectedBook(book)
    } finally {
      setIsLoadingDetail(false)
    }
  }, [])

  const handleCloseDetail = () => {
    setSelectedBook(null)
  }

  if (selectedBook) {
    if (isLoadingDetail) {
      return (
        <div className="book-detail-loading">
          <div className="loading">読み込み中...</div>
        </div>
      )
    }
    return (
      <div>
        <BookDetail book={selectedBook} onClose={handleCloseDetail} />
      </div>
    )
  }

  return (
    <div className="book-list-page">
      <h1>書籍一覧</h1>
      <SearchBar value={searchQuery} onChange={setSearchQuery} onSearch={handleSearch} />
      {isLoading && (
        <div className="loading" role="status" aria-live="polite">
          <div className="loading-spinner">読み込み中...</div>
        </div>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {!isLoading && !error && (
        <BookList
          books={filteredBooks}
          onBookClick={handleBookClick}
          emptyMessage={
            searchQuery.trim() !== '' ? '該当する書籍が見つかりません' : '書籍が登録されていません'
          }
        />
      )}
    </div>
  )
}
