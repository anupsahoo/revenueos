#!/usr/bin/env bash
# Renders docs/slides/deck.html to docs/slides/RevenueOS.pdf with headless Chrome.
# Same ten slides as RevenueOS.pptx; different renderer, so not pixel-identical.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$DIR/RevenueOS.pdf" "file://$DIR/deck.html" 2>/dev/null
echo "wrote $DIR/RevenueOS.pdf"
