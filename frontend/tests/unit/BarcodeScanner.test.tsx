/**
 * BarcodeScanner component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BarcodeScanner } from '../../src/components/BarcodeScanner/BarcodeScanner'

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn()
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
})

describe('BarcodeScanner', () => {
  const mockOnScan = vi.fn()
  const mockOnError = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render barcode scanner', () => {
    render(
      <BarcodeScanner
        onScan={mockOnScan}
        onError={mockOnError}
        onClose={mockOnClose}
      />
    )
    expect(screen.getByText(/バーコードスキャン/i)).toBeInTheDocument()
  })

  it('should allow manual ISBN input', () => {
    render(
      <BarcodeScanner
        onScan={mockOnScan}
        onError={mockOnError}
        onClose={mockOnClose}
      />
    )

    const isbnInput = screen.getByPlaceholderText(/ISBN/i)
    fireEvent.change(isbnInput, { target: { value: '9784123456789' } })

    const submitButton = screen.getByText(/確定/i)
    fireEvent.click(submitButton)

    expect(mockOnScan).toHaveBeenCalledWith('9784123456789')
  })

  it('should handle camera access error', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

    render(
      <BarcodeScanner
        onScan={mockOnScan}
        onError={mockOnError}
        onClose={mockOnClose}
      />
    )

    const startButton = screen.getByText(/スキャン開始/i)
    fireEvent.click(startButton)

    await vi.waitFor(() => {
      expect(mockOnError).toHaveBeenCalled()
    })
  })
})

