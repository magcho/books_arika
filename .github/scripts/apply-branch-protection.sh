#!/usr/bin/env bash
# GitHub ブランチ保護ルールセット適用スクリプト
# 使用方法: ./apply-branch-protection.sh [--dry-run] [--dry-run]

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$REPO_ROOT/.github/branch-protection-rulesets.yaml"

# 色付き出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# エラー処理
error() {
    echo -e "${RED}エラー: $1${NC}" >&2
    exit 1
}

info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ドライランモードのフラグ
DRY_RUN=false
if [[ "$1" == "--dry-run" ]] || [[ "$1" == "-n" ]]; then
    DRY_RUN=true
    info "ドライランモード: 実際の変更は行いません"
fi

# 前提条件チェック
check_prerequisites() {
    # GitHub CLIの確認
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) がインストールされていません。\nインストール方法: https://cli.github.com/"
    fi

    # 認証確認
    if ! gh auth status &> /dev/null; then
        error "GitHub CLI が認証されていません。\n認証方法: gh auth login"
    fi

    # 設定ファイルの確認
    if [ ! -f "$CONFIG_FILE" ]; then
        error "設定ファイルが見つかりません: $CONFIG_FILE"
    fi

    # yqの確認（YAMLパース用）
    if ! command -v yq &> /dev/null; then
        warn "yq がインストールされていません。YAMLパースに必要です。"
        warn "インストール方法:"
        warn "  macOS: brew install yq"
        warn "  Linux: https://github.com/mikefarah/yq#install"
        warn ""
        warn "yqがなくても、このスクリプトはGitHub APIを直接使用して設定を適用できます。"
        read -p "続行しますか？ (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    info "前提条件チェック完了"
}

# リポジトリ情報の取得
get_repo_info() {
    local remote_url=$(git config --get remote.origin.url 2>/dev/null || echo "")
    
    if [ -z "$remote_url" ]; then
        error "Gitリポジトリが見つかりません。このスクリプトはGitリポジトリ内で実行してください。"
    fi

    # GitHub URLからowner/repoを抽出
    if [[ "$remote_url" =~ github\.com[:/]([^/]+)/([^/]+)(\.git)?$ ]]; then
        REPO_OWNER="${BASH_REMATCH[1]}"
        REPO_NAME="${BASH_REMATCH[2]%.git}"
    else
        error "GitHubリポジトリではありません: $remote_url"
    fi

    info "リポジトリ: $REPO_OWNER/$REPO_NAME"
}

# ルールセットをJSON形式に変換（yq使用）
convert_to_json() {
    if command -v yq &> /dev/null; then
        yq eval -o=json "$CONFIG_FILE"
    else
        error "yq が必要です。YAMLをJSONに変換できません。"
    fi
}

# 設定ファイルの検証
validate_config() {
    info "設定ファイルを検証中..."
    
    local full_json=$(convert_to_json)
    
    # 必須フィールドのチェック
    local rulesets_count=$(echo "$full_json" | jq '.rulesets | length')
    if [ "$rulesets_count" -eq 0 ]; then
        error "設定ファイルにルールセットが定義されていません"
    fi
    
    # 各ルールセットの必須フィールドをチェック
    echo "$full_json" | jq -c '.rulesets[]' | while IFS= read -r ruleset_json; do
        local name=$(echo "$ruleset_json" | jq -r '.name')
        if [ -z "$name" ] || [ "$name" = "null" ]; then
            error "ルールセットにnameが定義されていません"
        fi
        
        local target=$(echo "$ruleset_json" | jq -r '.target')
        if [ -z "$target" ] || [ "$target" = "null" ]; then
            error "ルールセット '$name' にtargetが定義されていません"
        fi
        
        local enforcement=$(echo "$ruleset_json" | jq -r '.enforcement')
        if [ -z "$enforcement" ] || [ "$enforcement" = "null" ]; then
            error "ルールセット '$name' にenforcementが定義されていません"
        fi
    done
    
    info "✅ 設定ファイルの検証が完了しました"
}

# ルールセットを作成/更新
apply_ruleset() {
    local ruleset_json="$1"
    local ruleset_name=$(echo "$ruleset_json" | jq -r '.name')
    
    if [ -z "$ruleset_name" ] || [ "$ruleset_name" = "null" ]; then
        error "ルールセット名が取得できませんでした"
    fi
    
    info "ルールセットを適用中: $ruleset_name"
    
    # 既存のルールセットをチェック
    local existing_id=""
    if existing_rulesets=$(gh api "repos/$REPO_OWNER/$REPO_NAME/rulesets" 2>/dev/null); then
        existing_id=$(echo "$existing_rulesets" | jq -r ".[] | select(.name == \"$ruleset_name\") | .id" 2>/dev/null || echo "")
    fi
    
    if [ "$DRY_RUN" = true ]; then
        info "【ドライラン】ルールセット '$ruleset_name' を適用します:"
        echo "$ruleset_json" | jq .
        return 0
    fi
    
    if [ -n "$existing_id" ] && [ "$existing_id" != "null" ] && [ "$existing_id" != "" ]; then
        warn "既存のルールセットが見つかりました (ID: $existing_id)。更新します..."
        local response
        if response=$(gh api -X PUT "repos/$REPO_OWNER/$REPO_NAME/rulesets/$existing_id" \
            --input - <<< "$ruleset_json" 2>&1); then
            info "✅ ルールセットを更新しました: $ruleset_name"
        else
            error "ルールセットの更新に失敗しました。\nAPIレスポンス:\n$response"
        fi
    else
        local response
        if response=$(gh api -X POST "repos/$REPO_OWNER/$REPO_NAME/rulesets" \
            --input - <<< "$ruleset_json" 2>&1); then
            info "✅ ルールセットを作成しました: $ruleset_name"
        else
            error "ルールセットの作成に失敗しました。\nAPIレスポンス:\n$response\n\n設定内容:\n$(echo "$ruleset_json" | jq .)"
        fi
    fi
}

# メイン処理
main() {
    echo "=========================================="
    echo "GitHub ブランチ保護ルールセット適用スクリプト"
    echo "=========================================="
    echo ""

    check_prerequisites
    get_repo_info
    echo ""

    # YAMLをJSONに変換
    if ! command -v yq &> /dev/null; then
        error "yq が必要です。YAMLファイルを処理できません。"
    fi

    # 設定ファイルの検証
    validate_config
    echo ""

    local full_json=$(convert_to_json)
    local rulesets=$(echo "$full_json" | jq -c '.rulesets[]')

    # 各ルールセットを適用
    echo "$rulesets" | while IFS= read -r ruleset_json; do
        # GitHub APIの形式に変換
        # rulesは配列形式である必要がある
        local api_json=$(echo "$ruleset_json" | jq '{
            name: .name,
            target: .target,
            enforcement: .enforcement,
            conditions: (.conditions | if .ref_name and (.ref_name | has("exclude") | not) then .ref_name.exclude = [] | {ref_name: .ref_name} else . end),
            rules: [
                # required_status_checks ルール
                (if .rules.required_status_checks then {
                    type: "required_status_checks",
                    parameters: {
                        strict_required_status_checks_policy: .rules.required_status_checks.strict,
                        required_status_checks: [.rules.required_status_checks.contexts[] | {context: .}]
                    }
                } else empty end),
                # pull_request ルール
                (if .rules.pull_request then {
                    type: "pull_request",
                    parameters: {
                        required_approving_review_count: .rules.pull_request.required_approving_review_count,
                        dismiss_stale_reviews_on_push: .rules.pull_request.dismiss_stale_reviews_on_push,
                        require_code_owner_review: .rules.pull_request.require_code_owner_review,
                        require_last_push_approval: .rules.pull_request.require_last_push_approval,
                        required_review_thread_resolution: .rules.pull_request.required_review_thread_resolution
                    }
                } else empty end),
                # required_linear_history ルール
                (if .rules.required_linear_history == true then {
                    type: "required_linear_history"
                } else empty end),
                # non_fast_forward ルール (allow_force_pushes == false の場合)
                (if .rules.allow_force_pushes == false then {
                    type: "non_fast_forward"
                } else empty end),
                # deletion ルール (allow_deletions == false の場合)
                (if .rules.allow_deletions == false then {
                    type: "deletion"
                } else empty end)
            ] | map(select(. != null and . != {}))
        } + (if .rules.bypass_actors == null or (.rules.bypass_actors | length) == 0 then {} else {bypass_actors: .rules.bypass_actors} end)')
        
        apply_ruleset "$api_json"
        echo ""
    done

    echo "=========================================="
    info "すべてのルールセットの適用が完了しました！"
    echo "=========================================="
    echo ""
    echo "確認方法:"
    echo "  gh api repos/$REPO_OWNER/$REPO_NAME/rulesets"
    echo ""
    echo "または GitHub の Web UI で確認:"
    echo "  https://github.com/$REPO_OWNER/$REPO_NAME/settings/rules"
}

# スクリプト実行
main "$@"

