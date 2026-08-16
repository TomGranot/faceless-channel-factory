#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="${0:A:h}"
SERVICE_DIR="${SCRIPT_DIR:h}"
ENV_FILE="${INSTAGRAM_COMMENT_DM_ENV:-$SERVICE_DIR/.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  print -u2 "Missing environment file: $ENV_FILE"
  exit 78
fi

cd "$SERVICE_DIR"
set -a
source "$ENV_FILE"
set +a
exec /usr/bin/env node src/run-once.mjs
