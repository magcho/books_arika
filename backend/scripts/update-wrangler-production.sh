#!/bin/bash
# Script to update wrangler.toml with production D1 database ID from environment variable
# Usage: ./scripts/update-wrangler-production.sh

set -e

if [ -z "$D1_DATABASE_ID" ]; then
  echo "Error: D1_DATABASE_ID environment variable is not set"
  exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
WRANGLER_TOML="$BACKEND_DIR/wrangler.toml"

# Check if wrangler.toml exists
if [ ! -f "$WRANGLER_TOML" ]; then
  echo "Error: wrangler.toml not found at $WRANGLER_TOML"
  exit 1
fi

# Update the production database_id in wrangler.toml
# Cloudflare Workers GitHub integration uses the default [[d1_databases]] section
# So we update the default section for production deployment
# For local development, use --local flag which ignores this setting
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS - update the default d1_databases section (before [env.production])
  sed -i '' '/^\[\[d1_databases\]\]/,/^\[/ {
    /database_id = /s/.*/database_id = "'"$D1_DATABASE_ID"'"/g
  }' "$WRANGLER_TOML"
  # Also update the production section if it exists
  sed -i '' '/\[env.production\]/,/^\[/ {
    s/database_id = ".*"/database_id = "'"$D1_DATABASE_ID"'"/g
  }' "$WRANGLER_TOML"
else
  # Linux - update the default d1_databases section (before [env.production])
  sed -i '/^\[\[d1_databases\]\]/,/^\[/ {
    /database_id = /s/.*/database_id = "'"$D1_DATABASE_ID"'"/g
  }' "$WRANGLER_TOML"
  # Also update the production section if it exists
  sed -i '/\[env.production\]/,/^\[/ {
    s/database_id = ".*"/database_id = "'"$D1_DATABASE_ID"'"/g
  }' "$WRANGLER_TOML"
fi

echo "Updated wrangler.toml with production D1 database ID: $D1_DATABASE_ID"
