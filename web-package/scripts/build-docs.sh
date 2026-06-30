#!/usr/bin/env bash
set -euo pipefail

# Build OpenAPI HTML using Redocly CLI and create a zip with cumulocity.json + index.html

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

OPENAPI_DOC="docs/openapi.json"
DOCS_DIR="docs"
OUTPUT_HTML="index.html"
ZIP_NAME="cumulocity-docs.zip"

if [ ! -f "$OPENAPI_DOC" ]; then
  echo "OpenAPI spec not found at $OPENAPI_DOC" >&2
  exit 1
fi

echo "Building docs with @redocly/cli..."
npx @redocly/cli build-docs "$OPENAPI_DOC" -o "$DOCS_DIR/$OUTPUT_HTML"

echo "Creating zip $DOCS_DIR/$ZIP_NAME with cumulocity.json and $OUTPUT_HTML..."
cd "$DOCS_DIR"
if [ ! -f cumulocity.json ]; then
  echo "Warning: cumulocity.json not found in $DOCS_DIR" >&2
fi
zip -j "$ZIP_NAME" cumulocity.json "$OUTPUT_HTML"

echo "Done: $DOCS_DIR/$OUTPUT_HTML and $DOCS_DIR/$ZIP_NAME"
