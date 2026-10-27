# DAVIDIAN CORTEX

Standalone project directory for Israel David's personal knowledge workspace, kept inside the `agape-sovereign` repository.

## Run locally

Requires Node.js LTS and npm:

```bash
npm install
npm run dev
```

## Build a macOS app

On a Mac:

```bash
npm install
npm run build:mac
```

This creates a `.dmg` and `.zip` in `desktop-dist/`. Or double-click `Build DAVIDIAN CORTEX.command` to install dependencies and build. Apple signing and notarization are not configured.

## Project features

- Personal knowledge overview and interactive graph
- Upload files and whole nested folders
- Import exported Gemini notebook and iCloud Notes files
- Project spaces with descriptions and linked library files
- Settings for display name, compact list density, local-data export, and clearing local data
- Local question matching against text imported into the browser

Cloud-drive live sync requires provider OAuth apps and a secure backend. Until configured, import folders already synced to your Mac. Imported workspace metadata is currently stored in the browser's local storage.
