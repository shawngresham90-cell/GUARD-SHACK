#!/usr/bin/env bash
# Bootstrap the dashcam workspace: create runtime dirs, seed .env, install deps.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${REPO_ROOT}/dashcam"

if [[ ! -d "${APP_DIR}" ]]; then
  echo "error: ${APP_DIR} not found" >&2
  exit 1
fi

cd "${APP_DIR}"

for dir in uploads output; do
  mkdir -p "${dir}"
  touch "${dir}/.gitkeep"
  echo "  ready: dashcam/${dir}/"
done

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    echo "  seeded: dashcam/.env (edit to add XAI_API_KEY)"
  else
    echo "  warn: .env.example missing, skipping .env seed" >&2
  fi
else
  echo "  kept: dashcam/.env (already exists)"
fi

if command -v npm >/dev/null 2>&1; then
  if [[ ! -d node_modules ]]; then
    echo "  installing npm deps..."
    npm install --no-audit --no-fund
  else
    echo "  kept: dashcam/node_modules (already installed)"
  fi
else
  echo "  warn: npm not found on PATH, skipping dependency install" >&2
fi

echo "done. start the app with: (cd dashcam && npm start)"
