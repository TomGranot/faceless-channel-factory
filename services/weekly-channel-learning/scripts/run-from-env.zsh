#!/bin/zsh
set -euo pipefail

SCRIPT_DIR=${0:A:h}
SERVICE_ROOT=${SCRIPT_DIR:h}
COMMAND=${1:-run}

if [[ -z ${WEEKLY_LEARNING_CONFIG:-} ]]; then
  print -u2 "WEEKLY_LEARNING_CONFIG is required."
  exit 2
fi

cd "$SERVICE_ROOT"
exec /usr/bin/env node src/cli.mjs "$COMMAND" --config "$WEEKLY_LEARNING_CONFIG"
