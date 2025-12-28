import { describe, it, expect } from 'glob'
import { existsSync } from 'fs'
import { join } from 'path'

describe('Storybook Story Files', () => {
  const componentsDir = join(process.cwd(), 'src', 'components')
  
  it('should have BarcodeScanner.stories.tsx', () => {
    const storyPath = join(componentsDir, 'BarcodeScanner', 'BarcodeScanner.stories.tsx')
    expect(existsSync(storyPath)).toBe(true)
  })

  it('should have BookForm.stories.tsx', () => {
    const storyPath = join(componentsDir, 'BookForm', 'BookForm.stories.tsx')
    expect(existsSync(storyPath)).toBe(true)
  })

  it('should have LocationManager.stories.tsx', () => {
    const storyPath = join(componentsDir, 'LocationManager', 'LocationManager.stories.tsx')
    expect(existsSync(storyPath)).toBe(true)
  })
})

