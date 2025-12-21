#!/bin/bash
# Setup script for Cloudflare D1 database
# Usage: ./scripts/setup-db.sh [local|remote]

set -e

ENV=${1:-local}

if [ "$ENV" = "local" ]; then
  echo "Setting up local D1 database..."
  wrangler d1 execute books-arika-db --local --file=./schema.sql
  echo "Local database setup complete!"
elif [ "$ENV" = "remote" ]; then
  echo "Setting up remote D1 database..."
  echo "WARNING: This will modify the production database. Are you sure? (y/N)"
  read -r response
  if [[ "$response" =~ ^[Yy]$ ]]; then
    wrangler d1 execute books-arika-db --file=./schema.sql
    echo "Remote database setup complete!"
  else
    echo "Cancelled."
    exit 1
  fi
else
  echo "Usage: $0 [local|remote]"
  exit 1
fi

