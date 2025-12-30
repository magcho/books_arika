/**
 * BookList component tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BookList } from '../../src/components/BookList/BookList'
import type { BookWithLocations } from '../../src/types'
import { createMockBook } from '../fixtures/books'

describe('BookList', () => {
  it('should render book list', () => {
    const books: BookWithLocations[] = [
      {
        ...createMockBook({ title: 'Book 1' }),
        locations: [],
      },
      {
        ...createMockBook({ title: 'Book 2', isbn: '9784123456790' }),
        locations: [],
      },
    ]

    render(<BookList books={books} />)
    expect(screen.getByText('Book 1')).toBeInTheDocument()
    expect(screen.getByText('Book 2')).toBeInTheDocument()
  })

  it('should display empty message when no books', () => {
    render(<BookList books={[]} />)
    expect(screen.getByText('書籍が登録されていません')).toBeInTheDocument()
  })

  it('should display custom empty message', () => {
    render(<BookList books={[]} emptyMessage="カスタムメッセージ" />)
    expect(screen.getByText('カスタムメッセージ')).toBeInTheDocument()
  })

  it('should call onBookClick when book is clicked', () => {
    const mockOnClick = vi.fn()
    const books: BookWithLocations[] = [
      {
        ...createMockBook({ title: 'Book 1' }),
        locations: [],
      },
    ]

    render(<BookList books={books} onBookClick={mockOnClick} />)
    const bookItem = screen.getByText('Book 1').closest('.book-item')
    if (bookItem) {
      fireEvent.click(bookItem)
      expect(mockOnClick).toHaveBeenCalledWith(books[0])
    }
  })

  it('should display book locations', () => {
    const books: BookWithLocations[] = [
      {
        ...createMockBook({ title: 'Book 1' }),
        locations: [
          { id: 1, user_id: 'default-user', name: '本棚', type: 'Physical', created_at: '', updated_at: '' },
          { id: 2, user_id: 'default-user', name: 'Kindle', type: 'Digital', created_at: '', updated_at: '' },
        ],
      },
    ]

    render(<BookList books={books} />)
    expect(screen.getByText('本棚')).toBeInTheDocument()
    expect(screen.getByText('Kindle')).toBeInTheDocument()
  })

  it('should display book author when available', () => {
    const books: BookWithLocations[] = [
      {
        ...createMockBook({ title: 'Book 1', author: 'Author 1' }),
        locations: [],
      },
    ]

    render(<BookList books={books} />)
    expect(screen.getByText('Author 1')).toBeInTheDocument()
  })

  it('should display book thumbnail when available', () => {
    const books: BookWithLocations[] = [
      {
        ...createMockBook({
          title: 'Book 1',
          thumbnail_url: 'https://example.com/thumbnail.jpg',
        }),
        locations: [],
      },
    ]

    render(<BookList books={books} />)
    const img = screen.getByAltText('Book 1')
    expect(img).toHaveAttribute('src', 'https://example.com/thumbnail.jpg')
  })
})
