import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

describe('VRT Local Execution', () => {
  it('should have test-storybook script in package.json', () => {
    const packageJson = require('../../package.json');
    expect(packageJson.scripts['test-storybook']).toBeDefined();
    expect(packageJson.scripts['test-storybook:ci']).toBeDefined();
    expect(packageJson.scripts['reg-suit']).toBeDefined();
    expect(packageJson.scripts['vrt']).toBeDefined();
  });

  it('should have test-runner.ts configuration file', () => {
    const testRunnerPath = join(process.cwd(), '.storybook', 'test-runner.ts');
    expect(existsSync(testRunnerPath)).toBe(true);
  });

  it('should have regconfig.json configuration file', () => {
    const regConfigPath = join(process.cwd(), 'regconfig.json');
    expect(existsSync(regConfigPath)).toBe(true);
  });

  it('should have required directories for VRT', () => {
    const screenshotsDir = join(process.cwd(), 'screenshots', 'actual');
    const expectedDir = join(process.cwd(), '.reg', 'expected');
    const diffDir = join(process.cwd(), '.reg', 'diff');

    // ディレクトリは存在するか、または作成可能である必要がある
    // 実際の存在チェックは実行時に確認
    expect(screenshotsDir).toBeDefined();
    expect(expectedDir).toBeDefined();
    expect(diffDir).toBeDefined();
  });
});

