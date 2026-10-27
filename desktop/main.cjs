const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

function createWindow() {
  const window = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 900,
    minHeight: 620,
    title: 'DAVIDIAN CORTEX — Israel David',
    backgroundColor: '#080a12',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.loadFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  app.setName('DAVIDIAN CORTEX');
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
