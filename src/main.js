const { app, BrowserWindow, ipcMain, Menu, shell  } = require('electron');
const path = require('path');
const { createConfigIfNeeded, readConfig } = require('./config.js');
const { title } = require('process');
const fs = require('fs')
const { spawn } = require('child_process');

createConfigIfNeeded();

const createWindow = () => {
  const config = readConfig()
  
  const win = new BrowserWindow({
    width: 402,
    height: 502,
    frame: config["titlebar"],
    icon: path.join(__dirname, 'icons/applauncher.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Set up preload to enable secure communication
      nodeIntegration: false,
      experimentalFeatures: false,
      serviceWorkers: false,
      spellcheck: false,
    },
  });

  win.loadFile('src/pages/main/index.html');

  ipcMain.on('hamburger-options', (event) => {
    const hamburgeroptions = Menu.buildFromTemplate([
      { label: 'Add an app...', click: () => event.sender.send('hamburger-options-command', 'addapp') },
      { type: 'separator'},
      { label: 'Settings', click: () => event.sender.send('hamburger-options-command', 'opensettings') },
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

ipcMain.on('open-program', (event, program) => {
  const programtoopen = spawn(program, [], {
    detached: true,
    stdio: 'ignore'  // Ignore stdout and stderr
  });
});

ipcMain.on('open-settings', () => {
  const win = new BrowserWindow({
    width: 750,
    height: 550,
    frame: true,
    name: "Settings",
    icon: path.join(__dirname, 'icons/settings.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Set up preload to enable secure communication
      nodeIntegration: false,
      experimentalFeatures: false,
      serviceWorkers: false,
      spellcheck: false,
    },
  });

  win.loadFile('src/pages/settings/index.html');
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

ipcMain.handle('choose-app-icon', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'], // This opens a file dialog (use 'openDirectory' for folders)
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }
    ],
  });

  return [result.filePaths, fs.readFileSync(filePath).toString('base64')]; // Return the file paths selected by the user
});

app.whenReady().then(createWindow);
