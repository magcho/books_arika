/**
 * BookDetail component tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BookDetail } from '../../src/components/BookDetail/BookDetail'
import type { BookWithLocations } from '../../src/types'
import { createMockBook } from '../fixtures/books'

describe('BookDetail', () => {
  it('should render book detail', () => {
    const book: BookWithLocations = {
      ...createMockBook({ title: 'Book 1', author: 'Author 1' }),
      locations: [],
    }

    render(<BookDetail book={book} />)
    expect(screen.getByText('Book 1')).toBeInTheDocument()
    expect(screen.getByText(/著者: Author 1/)).toBeInTheDocument()
  })

  it('should display book ISBN', () => {
    const book: BookWithLocations = {
      ...createMockBook({ isbn: '9784123456789' }),
      locations: [],
    }

    render(<BookDetail book={book} />)
    expect(screen.getByText(/ISBN: 9784123456789/)).toBeInTheDocument()
  })

  it('should display doujin flag', () => {
    const book: BookWithLocations = {
      ...createMockBook({ is_doujin: true }),
      locations: [],
    }

    render(<BookDetail book={book} />)
    expect(screen.getByText('同人誌')).toBeInTheDocument()
  })

  it('should display book locations', () => {
    const book: BookWithLocations = {
      ...createMockBook({ title: 'Book 1' }),
      locations: [
        { id: 1, user_id: 'default-user', name: '本棚', type: 'Physical', created_at: '', updated_at: '' },
        { id: 2, user_id: 'default-user', name: 'Kindle', type: 'Digital', created_at: '', updated_at: '' },
      ],
    }

    render(<BookDetail book={book} />)
    expect(screen.getByText('所有場所:')).toBeInTheDocument()
    expect(screen.getByText('本棚 (物理)')).toBeInTheDocument()
    expect(screen.getByText('Kindle (デジタル)')).toBeInTheDocument()
  })

  it('should display message when no locations', () => {
    const book: BookWithLocations = {
      ...createMockBook({ title: 'Book 1' }),
      locations: [],
    }

    render(<BookDetail book={book} />)
    expect(screen.getByText('場所情報が登録されていません')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn()
    const book: BookWithLocations = {
      ...createMockBook({ title: 'Book 1' }),
      locations: [],
    }

    render(<BookDetail book={book} onClose={mockOnClose} />)
    const closeButton = screen.getByLabelText('閉じる')
    fireEvent.click(closeButton)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should display book thumbnail when available', () => {
    const book: BookWithLocations = {
      ...createMockBook({
        title: 'Book 1',
        thumbnail_url: 'https://example.com/thumbnail.jpg',
      }),
      locations: [],
    }

    render(<BookDetail book={book} />)
    const img = screen.getByAltText('Book 1')
    expect(img).toHaveAttribute('src', 'https://example.com/thumbnail.jpg')
  })
})
