# PRドキュメント整理方針

## 現状の問題点

### 1. ファイルの分散
- ルートディレクトリにPR関連ファイルが散在している
- 同じPRに対して複数のレビューファイルが存在（例：PR_19_REVIEW.md, PR_19_INLINE_REVIEW.md, PR_19_RE_REVIEW.md, PR_19_GITHUB_INLINE_COMMENTS.md）
- ファイル名の命名規則が統一されていない

### 2. 現在のファイル構成

```
ルートディレクトリ/
├── PR_DESCRIPTION.md                    # 全体的な概要
├── PR_US1_DESCRIPTION.md                # User Story 1の説明
├── PR_17_REVIEW.md                      # PR #17の包括的レビュー
├── PR_17_INLINE_REVIEW.md               # PR #17のインラインレビュー
├── PR_19_REVIEW.md                      # PR #19の包括的レビュー
├── PR_19_INLINE_REVIEW.md               # PR #19のインラインレビュー
├── PR_19_RE_REVIEW.md                   # PR #19の再レビュー
├── PR_19_GITHUB_INLINE_COMMENTS.md      # PR #19のGitHubインラインコメント
└── PR_20_REVIEW.md                      # PR #20の包括的レビュー
```

### 3. 問題点の詳細

1. **重複と混乱**
   - 同じPRに対して複数のレビューファイルが存在し、どれが最新か不明確
   - インラインレビューと包括的レビューが分離されているが、関連性が不明確

2. **命名規則の不統一**
   - `PR_XX_REVIEW.md` vs `PR_XX_INLINE_REVIEW.md` vs `PR_XX_RE_REVIEW.md`
   - どのファイルが何を表しているかが不明確

3. **配置場所の問題**
   - ルートディレクトリに散在しており、プロジェクトの構造を乱している
   - `specs/` ディレクトリのように整理された構造がない

## 提案する整理方針

### 1. ディレクトリ構造

```
docs/
└── prs/
    ├── 001-phase1-phase2-setup/
    │   ├── description.md              # PR概要・説明
    │   └── reviews/
    │       ├── review-001.md           # 包括的レビュー（最新版）
    │       └── inline-comments.md      # インラインレビューコメント
    ├── 002-user-story-1-book-registration/
    │   ├── description.md
    │   └── reviews/
    │       └── review-001.md
    ├── 003-user-story-2-location-management/
    │   ├── description.md
    │   └── reviews/
    │       ├── review-001.md           # 初回レビュー
    │       └── review-002.md           # 再レビュー（存在する場合）
    ├── 004-user-story-3-book-search/
    │   ├── description.md
    │   └── reviews/
    │       ├── review-001.md           # 初回レビュー
    │       ├── review-002.md           # 再レビュー
    │       └── inline-comments.md      # インラインレビューコメント
    └── 005-phase6-polish/
        ├── description.md
        └── reviews/
            └── review-001.md
```

### 2. ファイル命名規則

#### 説明ファイル
- `description.md`: PRの概要、実装内容、関連タスク

#### レビューファイル
- `review-001.md`, `review-002.md`, ...: 時系列順の包括的レビュー
  - 初回レビュー: `review-001.md`
  - 再レビュー: `review-002.md`
  - 最新のレビューが常に最後の番号
- `inline-comments.md`: コード行ごとのインラインレビューコメント（必要に応じて）

### 3. ファイル内容の構造

#### description.md の構造
```markdown
# PR #[NUMBER]: [タイトル]

## 概要
[PRの概要]

## 実装内容
[実装した機能の詳細]

## 関連タスク
[関連するタスクIDのリスト]

## 次のステップ
[次のフェーズへの準備状況]
```

#### review-XXX.md の構造
```markdown
# PR #[NUMBER] レビュー: [タイトル]

## レビュー日
[日付]

## レビュアー
[レビュアー名]

## ステータス
✅ 承認可能 / ❌ 承認不可 / ⚠️ 条件付き承認

## レビューチェックリスト
[チェックリスト項目]

## 詳細なレビューコメント
[詳細なコメント]

## 総評
[総合的な評価]

## 対応優先度
[必須対応、推奨改善、軽微な改善]
```

### 4. 移行手順

1. **新規ディレクトリの作成**
   ```bash
   mkdir -p docs/prs/{001,002,003,004,005}
   mkdir -p docs/prs/{001,002,003,004,005}/reviews
   ```

2. **既存ファイルの移行**
   - `PR_DESCRIPTION.md` → `docs/prs/001-phase1-phase2-setup/description.md`
   - `PR_US1_DESCRIPTION.md` → `docs/prs/002-user-story-1-book-registration/description.md`
   - `PR_17_REVIEW.md` → `docs/prs/003-user-story-2-location-management/reviews/review-001.md`
   - `PR_17_INLINE_REVIEW.md` → `docs/prs/003-user-story-2-location-management/reviews/inline-comments.md`
   - `PR_19_REVIEW.md` → `docs/prs/004-user-story-3-book-search/reviews/review-001.md`
   - `PR_19_INLINE_REVIEW.md` → `docs/prs/004-user-story-3-book-search/reviews/inline-comments.md`
   - `PR_19_RE_REVIEW.md` → `docs/prs/004-user-story-3-book-search/reviews/review-002.md`
   - `PR_19_GITHUB_INLINE_COMMENTS.md` → `docs/prs/004-user-story-3-book-search/reviews/inline-comments.md`（統合または別ファイル）
   - `PR_20_REVIEW.md` → `docs/prs/005-phase6-polish/reviews/review-001.md`

3. **README.mdの作成**
   - `docs/prs/README.md` にディレクトリ構造と命名規則を記載

### 5. 今後の運用ルール

1. **新しいPRの作成時**
   - `docs/prs/[NNN-feature-name]/` ディレクトリを作成
   - `description.md` を作成
   - `reviews/` ディレクトリを作成

2. **レビューの追加時**
   - 既存のレビューファイルを確認
   - 最新のレビュー番号を確認（例：`review-001.md` が最新なら `review-002.md` を作成）
   - インラインレビューコメントは `inline-comments.md` に追加または更新

3. **PR完了時**
   - 最終的なレビューを `review-XXX.md` として保存
   - 承認ステータスを明確に記載

### 6. メリット

1. **整理された構造**
   - PRごとにディレクトリが分離され、関連ドキュメントが一箇所に集約
   - `specs/` ディレクトリと同様の構造で一貫性がある

2. **時系列の明確化**
   - レビューファイルが番号順で時系列が明確
   - 最新のレビューが一目で分かる

3. **検索性の向上**
   - ディレクトリ名でPRの内容が推測可能
   - ファイル名が統一され、検索しやすい

4. **保守性の向上**
   - 新しいPRを追加する際のルールが明確
   - 既存のPRドキュメントを参照しやすい

## 実装チェックリスト

- [x] `docs/prs/` ディレクトリ構造の作成
- [x] 既存PRドキュメントの移行
- [x] `docs/prs/README.md` の作成
- [x] ルートディレクトリの旧ファイル削除（移行確認後）
- [x] `.gitignore` の確認（必要に応じて更新）

## 移行完了状況

### 移行済みファイル

1. **001-phase1-phase2-setup/**
   - `description.md` ← `PR_DESCRIPTION.md`

2. **002-user-story-1-book-registration/**
   - `description.md` ← `PR_US1_DESCRIPTION.md`

3. **003-user-story-2-location-management/**
   - `reviews/review-001.md` ← `PR_17_REVIEW.md`
   - `reviews/inline-comments.md` ← `PR_17_INLINE_REVIEW.md`

4. **004-user-story-3-book-search/**
   - `reviews/review-001.md` ← `PR_19_REVIEW.md`
   - `reviews/review-002.md` ← `PR_19_RE_REVIEW.md`
   - `reviews/inline-comments.md` ← `PR_19_INLINE_REVIEW.md`
   - `reviews/github-inline-comments.md` ← `PR_19_GITHUB_INLINE_COMMENTS.md`

5. **005-phase6-polish/**
   - `reviews/review-001.md` ← `PR_20_REVIEW.md`

### 削除完了

ルートディレクトリの旧ファイルは削除済みです。すべてのPRドキュメントは `docs/prs/` ディレクトリに整理されています。

## レビューコメントの管理方針

**重要**: レビューコメントはGitHubのPRに直接記載します。markdownファイルとしてコミットする必要はありません。

- レビューコメントはPRのコメント機能を使用
- `reviews/` ディレクトリにレビューファイルを保存しない
- PRのコメント履歴が自動的にGitHubに保存されるため、別途markdownファイルで管理する必要はない

