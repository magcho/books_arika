import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('VRT Baseline Comparison', () => {
  it('should have regconfig.json with baseline configuration', () => {
    const regConfigPath = join(process.cwd(), 'regconfig.json');
    expect(existsSync(regConfigPath)).toBe(true);

    const config = JSON.parse(readFileSync(regConfigPath, 'utf-8'));
    
    // ベースライン設定が含まれているか確認
    expect(config.core).toBeDefined();
    expect(config.core.expectedDir).toBeDefined();
    expect(config.core.actualDir).toBeDefined();
    expect(config.core.diffDir).toBeDefined();
  });

  it('should have threshold configured in regconfig.json', () => {
    const regConfigPath = join(process.cwd(), 'regconfig.json');
    const config = JSON.parse(readFileSync(regConfigPath, 'utf-8'));
    
    // 閾値が設定されているか確認
    expect(config.threshold).toBeDefined();
    expect(typeof config.threshold).toBe('number');
    expect(config.threshold).toBeGreaterThanOrEqual(0);
    expect(config.threshold).toBeLessThanOrEqual(1);
  });

  it('should have reg-keygen-git-hash-plugin configured', () => {
    const regConfigPath = join(process.cwd(), 'regconfig.json');
    const config = JSON.parse(readFileSync(regConfigPath, 'utf-8'));
    
    // Gitハッシュプラグインが設定されているか確認
    expect(config.plugins).toBeDefined();
    expect(config.plugins['reg-keygen-git-hash-plugin']).toBeDefined();
  });
});

