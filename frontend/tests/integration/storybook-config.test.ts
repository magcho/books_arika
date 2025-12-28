import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Storybook Configuration', () => {
  it('should have correct stories pattern in main.ts', () => {
    const mainTsPath = join(process.cwd(), '.storybook', 'main.ts')
    const mainTsContent = readFileSync(mainTsPath, 'utf-8')
    
    expect(mainTsContent).toContain("stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)']")
  })

  it('should use @storybook/react-vite framework', () => {
    const mainTsPath = join(process.cwd(), '.storybook', 'main.ts')
    const mainTsContent = readFileSync(mainTsPath, 'utf-8')
    
    expect(mainTsContent).toContain('@storybook/react-vite')
  })

  it('should have addon-essentials in addons', () => {
    const mainTsPath = join(process.cwd(), '.storybook', 'main.ts')
    const mainTsContent = readFileSync(mainTsPath, 'utf-8')
    
    expect(mainTsContent).toContain('@storybook/addon-essentials')
  })

  it('should have MemoryRouter decorator in preview.tsx', () => {
    const previewTsxPath = join(process.cwd(), '.storybook', 'preview.tsx')
    const previewTsxContent = readFileSync(previewTsxPath, 'utf-8')
    
    expect(previewTsxContent).toContain('MemoryRouter')
    expect(previewTsxContent).toContain('react-router-dom')
  })
})

