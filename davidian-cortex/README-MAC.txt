DAVIDIAN CORTEX — MAC SOURCE BUNDLE
Personal knowledge workspace for Israel David.

BUILD THE MAC APP
1. Extract this ZIP on your MacBook Air.
2. Install Node.js LTS from https://nodejs.org if it is not already installed.
3. Double-click “Build DAVIDIAN CORTEX.command”. If macOS blocks it, Control-click the file, choose Open, and confirm.
4. Wait for the build to finish. The desktop-dist folder will open with the .dmg and .zip installers.
5. Open the .dmg, then drag DAVIDIAN CORTEX into Applications.

Alternatively, open Terminal in this extracted folder and run:
  npm install
  npm run build:mac

This ZIP is the complete app source/build bundle, not a prebuilt installer. The installer is generated on your Mac. As it is unsigned, macOS may show a first-launch security warning; use your own security judgment. Apple Developer signing/notarization is not included.

WHAT'S INCLUDED
- frontend/: standalone React/Vite app and its interface assets
- desktop/: Electron native app entry point
- package.json and electron-builder.yml: dependency and Mac packaging setup
- DAVIDIAN_CORTEX.md: features, import guidance, and privacy notes

Cloud provider account-sync still needs your own OAuth/backend configuration. Locally synced iCloud Drive, OneDrive, and Google Drive folders can be imported from the app. Gemini notebook and iCloud Notes exports can be imported as supported text/JSON files.
