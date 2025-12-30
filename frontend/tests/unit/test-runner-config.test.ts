import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Test Runner Configuration', () => {
  it('should have valid TypeScript configuration in test-runner.ts', () => {
    const testRunnerPath = join(process.cwd(), '.storybook', 'test-runner.ts');
    expect(existsSync(testRunnerPath)).toBe(true);

    const content = readFileSync(testRunnerPath, 'utf-8');
    
    // TypeScriptの型定義が使用されているか確認
    expect(content).toContain('TestRunnerConfig');
    expect(content).toContain('import');
    expect(content).toContain('from');
  });

  it('should export default configuration', () => {
    const testRunnerPath = join(process.cwd(), '.storybook', 'test-runner.ts');
    const content = readFileSync(testRunnerPath, 'utf-8');
    
    // デフォルトエクスポートが含まれているか確認
    expect(content).toContain('export default');
  });

  it('should have vrt tag configured', () => {
    const testRunnerPath = join(process.cwd(), '.storybook', 'test-runner.ts');
    const content = readFileSync(testRunnerPath, 'utf-8');
    
    // vrtタグが設定されているか確認
    expect(content).toContain('vrt');
    expect(content).toContain('tags');
  });

  it('should have setup hook configured', () => {
    const testRunnerPath = join(process.cwd(), '.storybook', 'test-runner.ts');
    const content = readFileSync(testRunnerPath, 'utf-8');
    
    // setupフックが定義されているか確認
    expect(content).toContain('setup');
  });
});

