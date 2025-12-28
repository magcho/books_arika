import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import config from '../../.storybook/main'

describe('Storybook Configuration', () => {
  it('should have correct stories pattern in main.ts', () => {
    // 設定ファイルをインポートして構造を検証
    expect(config.stories).toBeDefined()
    expect(Array.isArray(config.stories)).toBe(true)
    expect(config.stories.length).toBeGreaterThan(0)
    expect(config.stories[0]).toMatch(/\.stories\.@\(js|jsx|ts|tsx\)$/)
  })

  it('should use @storybook/react-vite framework', () => {
    expect(config.framework).toBeDefined()
    if (typeof config.framework === 'object' && config.framework !== null) {
      expect(config.framework.name).toBe('@storybook/react-vite')
    } else {
      expect(config.framework).toBe('@storybook/react-vite')
    }
  })

  it('should have addon-essentials in addons', () => {
    expect(config.addons).toBeDefined()
    expect(Array.isArray(config.addons)).toBe(true)
    expect(config.addons).toContain('@storybook/addon-essentials')
  })

  it('should have MemoryRouter decorator in preview.tsx', () => {
    const previewTsxPath = join(process.cwd(), '.storybook', 'preview.tsx')
    const previewTsxContent = readFileSync(previewTsxPath, 'utf-8')
    
    expect(previewTsxContent).toContain('MemoryRouter')
    expect(previewTsxContent).toContain('react-router-dom')
  })
})

