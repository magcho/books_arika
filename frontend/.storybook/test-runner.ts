import type { TestRunnerConfig } from '@storybook/test-runner';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

// エラーを記録するための配列
const errors: Array<{ storyId: string; error: string }> = [];

const config: TestRunnerConfig = {
  setup: async () => {
    // スクリーンショット保存先ディレクトリを作成
    const screenshotDir = 'screenshots/actual';
    try {
      await mkdir(screenshotDir, { recursive: true });
      console.log(`[VRT] スクリーンショット保存先ディレクトリを作成しました: ${screenshotDir}`);
    } catch (error) {
      // ディレクトリが既に存在する場合は無視
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        console.error(`[VRT] ディレクトリ作成エラー: ${error}`);
        throw error;
      }
    }
  },
  preVisit: async (page, context) => {
    // ストーリー訪問前の処理（必要に応じて）
    // アニメーションやローディングの完了を待機
    try {
      // DOMContentLoadedを待機（より確実）
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {
        console.warn(`[VRT] DOMContentLoadedタイムアウト (${context.id})、続行します`);
      });
      // networkidleの待機を短縮（タイムアウトを3秒に設定）
      await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {
        // networkidleがタイムアウトしても続行
        console.warn(`[VRT] networkidleタイムアウト (${context.id})、続行します`);
      });
      console.log(`[VRT] ストーリーを読み込み中: ${context.id}`);
    } catch (error) {
      console.warn(`[VRT] ストーリー読み込み警告 (${context.id}): ${error}`);
      // エラーを記録するが、処理は継続
      errors.push({
        storyId: context.id,
        error: `読み込みエラー: ${error}`,
      });
    }
  },
  postVisit: async (page, context) => {
    try {
      // レンダリング完了を待機（1秒）
      await page.waitForTimeout(1000);
      
      // スクリーンショット取得
      const screenshotPath = `screenshots/actual/${context.id}.png`;
      const screenshotDir = dirname(screenshotPath);
      
      try {
        await mkdir(screenshotDir, { recursive: true });
      } catch (error) {
        // ディレクトリが既に存在する場合は無視
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
          throw error;
        }
      }
      
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });
      
      console.log(`[VRT] スクリーンショットを取得しました: ${screenshotPath}`);
    } catch (error) {
      // エラーが発生したストーリーをスキップし、他のストーリーのテストを継続
      const errorMessage = `スクリーンショット取得エラー: ${error}`;
      console.error(`[VRT] ${context.id}: ${errorMessage}`);
      errors.push({
        storyId: context.id,
        error: errorMessage,
      });
      // エラーをスローせず、処理を継続
    }
  },
  tags: ['vrt'],
  teardown: async () => {
    // すべてのストーリーのテスト完了後、エラーを報告
    if (errors.length > 0) {
      console.error('\n[VRT] エラーが発生したストーリー:');
      errors.forEach(({ storyId, error }) => {
        console.error(`  - ${storyId}: ${error}`);
      });
      console.error(`[VRT] 合計 ${errors.length} 件のエラーが発生しました。\n`);
    } else {
      console.log('[VRT] すべてのストーリーのスクリーンショット取得が完了しました。');
    }
  },
};

export default config;

