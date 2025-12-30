/**
 * Book List Component
 * Displays a list of books with basic information
 */

import type { BookWithLocations } from '../../types'

interface BookListProps {
  books: BookWithLocations[]
  onBookClick?: (book: BookWithLocations) => void
  emptyMessage?: string
}

export function BookList({ books, onBookClick, emptyMessage }: BookListProps) {
  const displayMessage = emptyMessage ?? '書籍が登録されていません'
  const isDefaultMessage = emptyMessage === undefined

  if (books.length === 0) {
    return (
      <div className="book-list-empty" role="status">
        <p>{displayMessage}</p>
        {isDefaultMessage && onBookClick && (
          <p className="empty-action-hint">書籍を登録するには、書籍登録ページに移動してください。</p>
        )}
      </div>
    )
  }

  return (
    <div className="book-list">
      {books.map((book) => (
        <div
          key={book.isbn}
          className="book-item"
          onClick={() => onBookClick?.(book)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onBookClick?.(book)
            }
          }}
        >
          {book.thumbnail_url && (
            <img src={book.thumbnail_url} alt={book.title} className="book-thumbnail" />
          )}
          <div className="book-info">
            <h3 className="book-title">{book.title}</h3>
            {book.author && <p className="book-author">{book.author}</p>}
            {book.locations && book.locations.length > 0 && (
              <div className="book-locations">
                <span className="locations-label">場所:</span>
                {book.locations.map((location) => (
                  <span key={location.id} className="location-tag">
                    {location.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
