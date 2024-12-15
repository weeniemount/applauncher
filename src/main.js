const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');
const path = require('path');
const { createConfigIfNeeded, readConfig, updateConfig, getdefaultconfig } = require('./config.js');
const { title } = require('process');
const fs = require('fs')
const { spawn } = require('child_process');
const os = require('os');

createConfigIfNeeded();

const createWindow = () => {
  const config = readConfig()

  const iconMapWin = {
    default: 'icons/applauncher.ico',
    canary: 'icons/applauncher-canary.ico',
    chromium: 'icons/applauncher-chromium.ico',
  };

  const iconMapLinux = {
    default: 'icons/linux/',
    canary: 'icons/applauncher-canary.ico',
    chromium: 'icons/applauncher-chromium.ico',
  };
  
  const win = new BrowserWindow({
    width: 402,
    height: 502,
    frame: config["titlebar"],
    autoHideMenuBar: true,
    resizable: false,
    icon: path.join(__dirname, iconMapWin[config.appicon] || iconMapWin.default),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Set up preload to enable secure communication
      nodeIntegration: false,
      experimentalFeatures: false,
      serviceWorkers: false,
      spellcheck: false,
    },
  });

  win.loadFile('src/pages/main/index.html');

  ipcMain.on('launcher-refreshconfig', () => {
    // Logic to refresh or fetch updated config
    win.webContents.send('launcher-refreshconfig');
  });

  ipcMain.on('hamburger-options', (event) => {
    const hamburgeroptions = Menu.buildFromTemplate([
      { label: 'Add an app...', click: () => event.sender.send('hamburger-options-command', 'addapp') },
      { type: 'separator'},
      { label: 'Settings', click: () => event.sender.send('hamburger-options-command', 'opensettings') },
      { label: 'Help', click: () => event.sender.send('hamburger-options-command', 'action2') },
      { label: 'Send feedback', click: () => event.sender.send('hamburger-options-command', 'githubissues') },
      { type: 'separator'},
      { label: 'About', click: () => event.sender.send('hamburger-options-command', 'about') },
      { role: 'quit' }
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

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('update-config', (event, newconfig) => {
  //console.log("hello")
  updateConfig(newconfig)
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
    autoHideMenuBar: true,
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

let createanapp;

ipcMain.on('open-createanapp', () => {
  if (createanapp && !createanapp.isDestroyed()) {
    createanapp.focus();
  } else {
    createanapp = new BrowserWindow({
      width: 260,
      height: 540,
      frame: false,
      name: "create-an-app",
      icon: path.join(__dirname, 'icons/settings.ico'),
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        experimentalFeatures: false,
        serviceWorkers: false,
        spellcheck: false,
      },
    });

    createanapp.loadFile('src/pages/createapp/index.html');

    ipcMain.on('close-createanapp', () => {
      if (createanapp && !createanapp.isDestroyed()) {
        createanapp.close(); 
      }
    });

    createanapp.on('closed', () => {
      createanapp = null;
    });
  }
});

let about;

ipcMain.on('open-about', () => {
  if (about && !about.isDestroyed()) {
    about.focus();
  } else {
    about = new BrowserWindow({
      width: 570,
      height: 385,
      frame: false,
      name: "about",
      resizable: false,
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        experimentalFeatures: false,
        serviceWorkers: false,
        spellcheck: false,
      },
    });

    about.loadFile('src/pages/about/index.html');

    ipcMain.on('close-about', () => {
      if (about && !about.isDestroyed()) {
        about.close(); 
      }
    });

    about.on('closed', () => {
      about = null;
    });
  }
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

ipcMain.handle('get-defaultconfig', async (event, filePath) => {
  let defaultconfig = getdefaultconfig()
  return defaultconfig
});

ipcMain.handle('choose-app-icon', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'], // This opens a file dialog (use 'openDirectory' for folders)
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }
    ],
  });

  return [result.filePaths, fs.readFileSync(result.filePaths[0]).toString('base64')]; // Return the file paths selected by the user
});

ipcMain.handle('choose-program', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'], // This opens a file dialog (use 'openDirectory' for folders)
    filters: [
      { name: 'Programs', extensions: ['exe', 'bat', 'cmd'] }
    ],
  });

  return result.filePaths; // Return the file paths selected by the user
});

app.whenReady().then(createWindow);
