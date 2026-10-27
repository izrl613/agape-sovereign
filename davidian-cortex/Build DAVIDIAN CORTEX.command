#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "Building DAVIDIAN CORTEX for macOS..."
if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js/npm is required. Install the current Node.js LTS from https://nodejs.org, then run this file again."
  read -r -p "Press Return to close this window..."
  exit 1
fi
npm install
npm run build:mac
echo ""
echo "Build complete. Installer files are in the desktop-dist folder."
open desktop-dist
read -r -p "Press Return to close this window..."
