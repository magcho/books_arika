/**
 * React component test helpers
 * Custom render function with providers
 */

import { render, type RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

/**
 * Custom render function with providers
 * Can be extended with Router, Context providers, etc.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    ...options,
  })
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react'


