const { app, BrowserWindow, ipcMain, Menu, shell  } = require('electron');
const path = require('path');
const { createConfigIfNeeded, readConfig } = require('./config.js');
const { title } = require('process');
const fs = require('fs')

createConfigIfNeeded();

const createWindow = () => {
  const config = readConfig()
  
  const win = new BrowserWindow({
    width: 402,
    height: 502,
    frame: config["titlebar"],
    icon: path.join(__dirname, 'icons/windows.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'pages', 'main', 'preload.js'), // Set up preload to enable secure communication
      nodeIntegration: false,
      experimentalFeatures: false,
      serviceWorkers: false,
      spellcheck: false,
    },
  });

  win.loadFile('src/pages/main/index.html');

  ipcMain.on('hamburger-options', (event) => {
    const hamburgeroptions = Menu.buildFromTemplate([
      { label: 'Settings', click: () => event.sender.send('hamburger-options-command', 'action1') },
      { label: 'Help', click: () => event.sender.send('hamburger-options-command', 'action2') },
      { label: 'Send feedback', click: () => event.sender.send('hamburger-options-command', 'action2') },
    ]);

    hamburgeroptions.popup({
      window: win,
    });
  });
};

// html to main communication

ipcMain.handle('get-config', () => {
  const config = readConfig()
  return config;
});

ipcMain.on('open-link', (event, url) => {
  shell.openExternal(url).then(() => {
      console.log(`Opened external link: ${url}`);
  }).catch(err => {
      console.error('Failed to open link:', err);
  });
});

ipcMain.on('quit-app', () => {
  app.quit();
});

ipcMain.handle('get-image', async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath);
      return fileData.toString('base64');
    } else {
      return "filenotfound";
    }
  } catch (error) {
    console.error('Error reading image:', error);
    return "fileerror";
  }
});

app.whenReady().then(createWindow);
