import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('VRT Screenshot Capture', () => {
  it('should have test-runner.ts with screenshot configuration', () => {
    const testRunnerPath = join(process.cwd(), '.storybook', 'test-runner.ts');
    expect(existsSync(testRunnerPath)).toBe(true);

    const content = readFileSync(testRunnerPath, 'utf-8');
    
    // スクリーンショット取得の設定が含まれているか確認
    expect(content).toContain('screenshot');
    expect(content).toContain('screenshots/actual');
    expect(content).toContain('fullPage');
  });

  it('should have postVisit hook configured for screenshot capture', () => {
    const testRunnerPath = join(process.cwd(), '.storybook', 'test-runner.ts');
    const content = readFileSync(testRunnerPath, 'utf-8');
    
    // postVisitフックが定義されているか確認
    expect(content).toContain('postVisit');
  });

  it('should have wait time configured for rendering completion', () => {
    const testRunnerPath = join(process.cwd(), '.storybook', 'test-runner.ts');
    const content = readFileSync(testRunnerPath, 'utf-8');
    
    // 待機時間の設定が含まれているか確認
    expect(content).toContain('waitForTimeout');
  });
});

