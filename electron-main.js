const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Project Rift',
    backgroundColor: '#101010'
  });

  win.loadFile('public/index.html');
}

app.whenReady().then(createWindow);
