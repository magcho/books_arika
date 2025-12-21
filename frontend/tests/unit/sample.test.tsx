/**
 * Sample test to verify test infrastructure works
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Test Infrastructure', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true)
  })

  it('should support React Testing Library', () => {
    render(<div>Test</div>)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})

