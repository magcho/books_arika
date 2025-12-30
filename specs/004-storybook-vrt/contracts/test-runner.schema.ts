/**
 * @storybook/test-runner設定の型定義
 * 
 * このファイルは、.storybook/test-runner.tsで使用する型定義を提供します。
 */

export interface TestRunnerConfig {
  /**
   * セットアップ処理
   * テスト実行前に一度だけ実行される
   */
  setup?: () => void | Promise<void>;

  /**
   * ストーリー訪問前の処理
   * 各ストーリーを訪問する前に実行される
   */
  preVisit?: (page: any, context: StoryContext) => void | Promise<void>;

  /**
   * ストーリー訪問後の処理
   * 各ストーリーを訪問した後に実行される
   * スクリーンショット取得はここで実施
   */
  postVisit?: (page: any, context: StoryContext) => void | Promise<void>;

  /**
   * タグ
   * テストを分類するためのタグ
   */
  tags?: string[];
}

export interface StoryContext {
  /**
   * ストーリーID
   * 例: "ComponentName--Default"
   */
  id: string;

  /**
   * ストーリー名
   */
  name: string;

  /**
   * ストーリーのタイトル
   */
  title: string;
}

export interface ScreenshotOptions {
  /**
   * スクリーンショット保存先ディレクトリ
   */
  screenshotDir?: string;

  /**
   * レンダリング完了待機時間（ミリ秒）
   */
  waitFor?: number;

  /**
   * 全ページキャプチャ
   */
  fullPage?: boolean;
}


