/**
 * ExportButton component unit tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportButton } from '../../src/components/ExportButton/ExportButton'
import * as exportApi from '../../src/services/export_api'
import { ApiClientError } from '../../src/services/api'

// Mock export API
vi.mock('../../src/services/export_api')

describe('ExportButton', () => {
  const userId = 'test-user'
  const mockExportUserData = vi.mocked(exportApi.exportUserData)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render export button', () => {
    render(<ExportButton userId={userId} />)
    expect(screen.getByText('データをエクスポート')).toBeInTheDocument()
  })

  it('should call exportUserData when button is clicked', async () => {
    const user = userEvent.setup()
    mockExportUserData.mockResolvedValue(undefined)

    render(<ExportButton userId={userId} />)
    const button = screen.getByText('データをエクスポート')
    await user.click(button)

    expect(mockExportUserData).toHaveBeenCalledWith(userId)
  })

  it('should show loading state while exporting', async () => {
    const user = userEvent.setup()
    let resolveExport: () => void
    const exportPromise = new Promise<void>((resolve) => {
      resolveExport = resolve
    })
    mockExportUserData.mockReturnValue(exportPromise)

    render(<ExportButton userId={userId} />)
    const button = screen.getByText('データをエクスポート')
    await user.click(button)

    expect(screen.getByText('エクスポート中...')).toBeInTheDocument()
    expect(button).toBeDisabled()

    resolveExport!()
    await waitFor(() => {
      expect(screen.queryByText('エクスポート中...')).not.toBeInTheDocument()
    })
  })

  it('should display error message when export fails', async () => {
    const user = userEvent.setup()
    mockExportUserData.mockRejectedValue(new ApiClientError('エクスポートエラー', 'EXPORT_ERROR'))

    render(<ExportButton userId={userId} />)
    const button = screen.getByText('データをエクスポート')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/エラー:/i)).toBeInTheDocument()
      expect(screen.getByText(/エクスポートエラー/i)).toBeInTheDocument()
    })
  })

  it('should call onSuccess callback when export succeeds', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    mockExportUserData.mockResolvedValue(undefined)

    render(<ExportButton userId={userId} onSuccess={onSuccess} />)
    const button = screen.getByText('データをエクスポート')
    await user.click(button)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should handle generic error', async () => {
    const user = userEvent.setup()
    mockExportUserData.mockRejectedValue(new Error('Network error'))

    render(<ExportButton userId={userId} />)
    const button = screen.getByText('データをエクスポート')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/エラー:/i)).toBeInTheDocument()
    })
  })
})

