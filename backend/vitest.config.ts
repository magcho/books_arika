import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersProject({
  test: {
    pool: '@cloudflare/vitest-pool-workers',
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          compatibilityDate: '2024-01-01',
        },
      },
    },
    globals: true,
    environment: 'node',
    // CI/CD環境やエージェント実行時はウォッチモードを無効化
    watch: process.env.CI === 'true' ? false : undefined,
    // テスト環境を明示的に設定（レート制限のスキップに使用）
    env: {
      VITEST: 'true',
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['node_modules/', 'tests/', '*.config.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})

