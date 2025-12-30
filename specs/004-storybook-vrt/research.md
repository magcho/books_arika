# Research: Storybook Visual Regression Testing

**Feature**: 004-storybook-vrt  
**Date**: 2024-12-19  
**Status**: Complete

## Research Objectives

StorybookストーリーのVRT（Visual Regression Testing）をGitHub Actionsで自動実行するための技術選定と実装方法を調査する。外部サービス依存なし、セキュリティ要件を満たし、GitHub Actionsとの統合が容易なソリューションを選定する。

## Technology Selection

### Decision: @storybook/test-runner + reg-suit

**選定ツール**: @storybook/test-runner + reg-suit

**理由**:
- Storybook公式のテストランナー（@storybook/test-runner）とOSSの差分検出ツール（reg-suit）を組み合わせ
- 外部サービス依存なし（セキュリティ要件に適合）
- GitHub Actionsとの統合が容易
- 完全無料でオープンソース
- カスタマイズ性が高い

**代替案（検討済み）**:
- **Chromatic**: 主流だが外部サービス依存のため除外
- **Playwright単体**: 多機能だがStorybook特化ではないため除外
- **reg-suit単体**: @storybook/test-runnerと組み合わせることでより安定したスクリーンショット取得が可能

## Technical Details

### @storybook/test-runner

**概要**: Storybook公式のテストランナー。Playwrightベースで、すべてのストーリーを自動的にテストできる。

**主な機能**:
- すべてのストーリーの自動実行
- スクリーンショット取得
- カスタムテストロジックの追加
- CI/CD環境での実行

**設定方法**:
- `.storybook/test-runner.ts`に設定ファイルを作成
- スクリーンショット保存先を指定
- ストーリーIDをファイル名として使用

**参考資料**:
- [@storybook/test-runner公式ドキュメント](https://storybook.js.org/docs/react/writing-tests/test-runner)

### reg-suit

**概要**: オープンソースの視覚的回帰テストツール。画像の差分検出とレポート生成を行う。

**主な機能**:
- 画像の差分検出
- ベースライン管理
- 差分レポート生成
- Gitハッシュベースのバージョン管理

**設定方法**:
- `regconfig.json`に設定ファイルを作成
- 作業ディレクトリ、ベースライン、差分画像の保存先を指定
- 差分検出の閾値を設定

**参考資料**:
- [reg-suit公式ドキュメント](https://github.com/reg-viz/reg-suit)

### Playwright

**概要**: @storybook/test-runnerの依存関係として使用される。ブラウザ自動化とスクリーンショット取得を担当。

**主な機能**:
- ヘッドレスブラウザの制御
- スクリーンショット取得
- ページの待機と操作

## Implementation Strategy

### スクリーンショット取得フロー

1. @storybook/test-runnerが各ストーリーを実行
2. Playwrightが各ストーリーのスクリーンショットを取得
3. スクリーンショットを`screenshots/actual/`に保存（ストーリーIDをファイル名として使用）
4. reg-suitがベースラインと比較
5. 差分が検出された場合、差分画像を`.reg/diff/`に保存

### ベースライン管理

**ローカル環境**:
- 初回実行時に自動的にベースラインを作成
- `.reg/expected/`に保存
- 手動更新または自動更新オプションで更新可能

**CI環境**:
- GitHub Actions Artifactsにベースラインを保存
- 次回実行時にArtifactsから取得
- 初回実行時は自動作成

### エラーハンドリング

- エラーが発生したストーリーをスキップ
- 他のストーリーのテストを継続
- 最後にエラーを報告

### 差分検出の閾値

- デフォルト閾値を設定（例：0.01 = 1%）
- 個別のストーリーで上書き可能
- reg-suitの設定で調整

## GitHub Actions統合

### ワークフロー設計

1. リポジトリチェックアウト（`fetch-depth: 0` - reg-suitでGit履歴が必要）
2. Node.jsセットアップ
3. 依存関係インストール
4. Storybookビルド
5. Storybookサーバー起動（バックグラウンド）
6. Storybook起動待機
7. @storybook/test-runnerでスクリーンショット取得
8. reg-suitで差分検出
9. 結果をArtifactsにアップロード

### PRマージブロック

- VRTが失敗した場合、PRのマージをブロック
- GitHub Actionsのステータスチェックとして設定

## Best Practices

### スクリーンショットの安定性

- アニメーションやローディングの完了を待機
- `fullPage: true`オプションで全ページをキャプチャ
- 適切な待機時間を設定

### パフォーマンス最適化

- 並列実行は将来対応（現時点では順次実行）
- 変更検知による部分実行は将来対応
- 実行時間の目標：10分以内

### ベースライン管理

- 初回実行時に自動的にベースラインを作成
- 意図的な変更後は手動または自動更新オプションで更新
- CI環境ではArtifactsに保存して共有

## Dependencies

### パッケージ

- `@storybook/test-runner`: ^0.x.x
- `reg-suit`: ^x.x.x
- `playwright`: ^x.x.x（@storybook/test-runnerの依存関係）

### 環境要件

- Node.js 18+
- Storybook 7.x系（既存）
- GitHub Actions（CI環境）

## Risks and Mitigations

### リスク

1. **実行時間の増加**: ストーリー数が増加すると実行時間が長くなる
   - **対策**: 並列実行の実装を将来検討

2. **ベースラインの管理**: CI環境でのベースライン共有が複雑
   - **対策**: GitHub Actions Artifactsを使用して共有

3. **誤検出**: 環境の違いによる誤検出
   - **対策**: 適切な閾値設定と待機時間の調整

## Conclusion

@storybook/test-runnerとreg-suitの組み合わせにより、外部サービス依存なしでVRTを実現できる。GitHub Actionsとの統合も容易で、セキュリティ要件を満たしながら自動化された視覚的回帰テストを実現できる。


