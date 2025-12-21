/**
 * BookRegisterPage integration tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BookRegisterPage } from '../../src/pages/BookRegisterPage'
import { createBook } from '../../src/services/book_api'

// Mock the API functions
vi.mock('../../src/services/book_api', () => ({
  createBook: vi.fn(),
  searchBooks: vi.fn(),
  searchByBarcode: vi.fn(),
}))

describe('BookRegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render book register page', () => {
    render(<BookRegisterPage />)
    expect(screen.getByText(/書籍登録/i)).toBeInTheDocument()
  })
})

