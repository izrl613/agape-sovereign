# DAVIDIAN CORTEX

**DAVIDIAN CORTEX** is Israel David's local-first personal knowledge workspace. It brings a visual idea map, searchable library, notebook/note imports, project spaces, a conversation workspace, dedicated profile/preferences/privacy settings, and export controls into one desktop-friendly app.

## Run the web workspace

```bash
npm install
npm run dev-frontend
```

## Build the macOS app

Run this on a Mac (or a macOS CI runner):

```bash
npm install
npm run build:mac
```

The installer artifacts are written to `desktop-dist/` as a `.dmg` and `.zip`. The app bundle is named **DAVIDIAN CORTEX**. Electron packaging can be initiated from other operating systems, but macOS signing/notarization and a usable macOS installer require Apple's tooling and credentials; this project intentionally does not embed signing credentials. Set up Apple Developer signing/notarization separately for public distribution.

## Importing your information

- **Files:** use *Add to brain → Upload files*; multi-select is supported.
- **Deep folders:** use *Import an entire folder* or drag a folder into the app. The browser/Electron folder picker traverses nested folders and records their relative paths.
- **Gemini notebooks:** export/share notebook content to `.txt`, `.md`, `.html`, or `.json`, then use *Notebooks & notes → Import Gemini notebooks*.
- **iCloud Notes:** export/share notes to Files (or save as `.txt`, `.md`, `.html`, or `.json`) and import them from *Notebooks & notes*.
- **iCloud Drive, OneDrive, Google Drive:** the file and folder picker imports a folder already synced to your Mac. One-click account sync requires OAuth applications, provider API scopes, a secure token service, and provider-specific import adapters. The current UI does not pretend to connect a cloud account without that setup. Configure each provider's OAuth secrets in a private backend before enabling live cloud sync.

## Data and privacy

This initial workspace stores its index, notes, and conversation in browser/Electron local storage on the current device. Text-like imports under 500 KB are read locally for search and question matching; binary files remain indexed by name, type, path, and size. This prototype does not send imported data to an AI provider, and its answer panel is deliberately a local archive matcher rather than a claim of a connected Gemini/LLM service. Use **Export** to download a JSON copy. Local storage is not a substitute for an encrypted backup; protect your device and exported archive.

For production use with large libraries, replace localStorage with an encrypted IndexedDB/file-backed index and add a consent-based, least-privilege OAuth backend plus durable provider sync. Configure Gemini API access separately if live notebook ingestion or model-generated answers are needed.
