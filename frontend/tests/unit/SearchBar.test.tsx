/**
 * SearchBar component tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchBar } from '../../src/components/SearchBar/SearchBar'

describe('SearchBar', () => {
  it('should render search input', () => {
    render(<SearchBar value="" onChange={vi.fn()} />)
    const input = screen.getByPlaceholderText('タイトルまたは著者名で検索...')
    expect(input).toBeInTheDocument()
  })

  it('should display custom placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="カスタムプレースホルダー" />)
    expect(screen.getByPlaceholderText('カスタムプレースホルダー')).toBeInTheDocument()
  })

  it('should call onChange when input value changes', () => {
    const mockOnChange = vi.fn()
    render(<SearchBar value="" onChange={mockOnChange} />)
    const input = screen.getByPlaceholderText('タイトルまたは著者名で検索...')
    fireEvent.change(input, { target: { value: 'test query' } })
    expect(mockOnChange).toHaveBeenCalledWith('test query')
  })

  it('should call onSearch when Enter key is pressed', () => {
    const mockOnSearch = vi.fn()
    render(<SearchBar value="test query" onChange={vi.fn()} onSearch={mockOnSearch} />)
    const input = screen.getByPlaceholderText('タイトルまたは著者名で検索...')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockOnSearch).toHaveBeenCalledWith('test query')
  })

  it('should call onSearch when search button is clicked', () => {
    const mockOnSearch = vi.fn()
    render(<SearchBar value="test query" onChange={vi.fn()} onSearch={mockOnSearch} />)
    const searchButton = screen.getByLabelText('検索')
    fireEvent.click(searchButton)
    expect(mockOnSearch).toHaveBeenCalledWith('test query')
  })

  it('should call onSearch on input change when onSearch is provided (real-time search)', () => {
    const mockOnSearch = vi.fn()
    render(<SearchBar value="" onChange={vi.fn()} onSearch={mockOnSearch} />)
    const input = screen.getByPlaceholderText('タイトルまたは著者名で検索...')
    fireEvent.change(input, { target: { value: 'test' } })
    expect(mockOnSearch).toHaveBeenCalledWith('test')
  })

  it('should not show search button when onSearch is not provided', () => {
    render(<SearchBar value="" onChange={vi.fn()} />)
    expect(screen.queryByLabelText('検索')).not.toBeInTheDocument()
  })
})
