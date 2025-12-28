import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

describe('Storybook Startup', () => {
  it('should have storybook script in package.json', () => {
    const packageJsonPath = join(process.cwd(), 'package.json')
    expect(existsSync(packageJsonPath)).toBe(true)
    
    const packageJson = JSON.parse(execSync('cat package.json', { encoding: 'utf-8' }))
    expect(packageJson.scripts).toHaveProperty('storybook')
    expect(packageJson.scripts.storybook).toContain('storybook dev')
  })

  it('should have build-storybook script in package.json', () => {
    const packageJson = JSON.parse(execSync('cat package.json', { encoding: 'utf-8' }))
    expect(packageJson.scripts).toHaveProperty('build-storybook')
    expect(packageJson.scripts['build-storybook']).toContain('storybook build')
  })

  it('should have .storybook directory', () => {
    const storybookDir = join(process.cwd(), '.storybook')
    expect(existsSync(storybookDir)).toBe(true)
  })

  it('should have main.ts configuration file', () => {
    const mainTsPath = join(process.cwd(), '.storybook', 'main.ts')
    expect(existsSync(mainTsPath)).toBe(true)
  })

  it('should have preview.ts configuration file', () => {
    const previewTsPath = join(process.cwd(), '.storybook', 'preview.ts')
    expect(existsSync(previewTsPath)).toBe(true)
  })
})

