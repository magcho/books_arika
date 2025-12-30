/**
 * Book Detail Component
 * Displays detailed information about a book including locations
 */

import type { BookWithLocations } from '../../types'

interface BookDetailProps {
  book: BookWithLocations
  onClose?: () => void
}

export function BookDetail({ book, onClose }: BookDetailProps) {
  return (
    <div className="book-detail">
      {onClose && (
        <button onClick={onClose} className="close-button" aria-label="閉じる">
          ×
        </button>
      )}
      {book.thumbnail_url && (
        <img src={book.thumbnail_url} alt={book.title} className="book-detail-thumbnail" />
      )}
      <div className="book-detail-info">
        <h2 className="book-detail-title">{book.title}</h2>
        {book.author && <p className="book-detail-author">著者: {book.author}</p>}
        {book.isbn && <p className="book-detail-isbn">ISBN: {book.isbn}</p>}
        {book.is_doujin && <p className="book-detail-doujin">同人誌</p>}
        {book.locations && book.locations.length > 0 && (
          <div className="book-detail-locations">
            <h3>所有場所:</h3>
            <ul>
              {book.locations.map((location) => (
                <li key={location.id}>
                  {location.name} ({location.type === 'Physical' ? '物理' : 'デジタル'})
                </li>
              ))}
            </ul>
          </div>
        )}
        {(!book.locations || book.locations.length === 0) && (
          <p className="book-detail-no-locations">場所情報が登録されていません</p>
        )}
      </div>
    </div>
  )
}
