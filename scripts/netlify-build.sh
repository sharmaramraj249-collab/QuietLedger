#!/usr/bin/env bash
set -euo pipefail

curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/download/compact-v0.5.2/compact-installer.sh | sh

export PATH="$HOME/.local/bin:$PATH"
compact update 0.31.1
npm run contract:compile
npm run contract:artifacts:check
npm run build
