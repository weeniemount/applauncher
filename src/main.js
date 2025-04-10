const { app, BrowserWindow, ipcMain, Menu, shell, dialog, screen } = require('electron');
const path = require('path');
const { createConfigIfNeeded, readConfig, updateConfig, getdefaultconfig } = require('./config.js');
const fs = require('fs')
const { spawn } = require('child_process');
const JSZip = require('jszip');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const { openCrxApp, chooseAndExtractCrx } = require('./crx.js');

createConfigIfNeeded();

const globalWebPreferences = {
  preload: path.join(__dirname, 'preload.js'), // Set up preload to enable secure communication
  contextIsolation: true,
  nodeIntegration: false,
  experimentalFeatures: false,
  serviceWorkers: false,
  spellcheck: false,
  webSecurity: false,
  enableRemoteModule: false,
  webviewTag: false,
  sandbox: false,
  backgroundThrottling: false,
  offscreen: false,
  devTools: true, // Disable DevTools
  webgl: false, // Disable WebGL
  webaudio: false, // Disable WebAudio
  plugins: false, // Disable plugins
  accelerated2dCanvas: false, // Disable accelerated 2D canvas
  hardwareAcceleration: false, // Disable hardware acceleration
  disableBlinkFeatures: "Auxclick,BackspaceDefaultHandler,Gamepad,KeyboardEventKey,Notification,PointerEvent,TouchEvent,WebAnimationsAPI,WebBluetooth,WebUSB,WebVR", // Disable unnecessary Blink features
}

function windowAction(action, window) {
  if (action === 'minimize') {
    window.minimize();
  } else if (action === 'maximize') {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  } else if (action === 'close') {
    window.close();
  }
}

const isLinux = process.platform === 'linux';
const createWindow = () => {
  const config = readConfig()
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const iconMapWin = {
    default: 'icons/applauncher.ico',
    canary: 'icons/applauncher-canary.ico',
    chromium: 'icons/applauncher-chromium.ico',
  };

  const iconMapLinux = {
    default: 'icons/linux/icon-48x48.png',
    canary: 'icons/linux/canary.png',
    chromium: 'icons/linux/chromium.png',
  };
  let win = new BrowserWindow({
    width: 400,
    height: 500,
    frame: config["titlebar"] && !config["chromeostitlebar"],
    autoHideMenuBar: true,
    transparent: config["chromeostitlebar"] && config["titlebar"],
    resizable: false,
    icon: path.join(__dirname, isLinux ? (iconMapLinux[config.appicon] || iconMapLinux.default) : (iconMapWin[config.appicon] || iconMapWin.default)),
    webPreferences: globalWebPreferences
  });

  if (config.startpos == "center") {
    win.center()
    win.setPosition(win.getPosition()[0] + config.startoffsetx, win.getPosition()[1] + config.startoffsety)
  } else if (config.startpos == "lefttop") {
    win.setPosition(0 + config.startoffsetx, 0 + config.startoffsety)
  } else if (config.startpos == "righttop") {
    win.setPosition(width - 400 - config.startoffsetx, 0 + config.startoffsety)
  } else if (config.startpos == "leftbottom") {
    win.setPosition(0 + config.startoffsetx, height - 500 - config.startoffsety + 40)
  } else if (config.startpos == "rightbottom") {
    win.setPosition(width - 400 - config.startoffsetx, height - 500 - config.startoffsety + 40)
  } else {
    win.center()
  }

  if (config["chromeostitlebar"] && config["titlebar"]) {
    win.setSize(400, 536)
  }


  win.loadFile('src/pages/main/index.html');

  ipcMain.on('window-action', (event, action, window) => {
    if (window === 'launcher') {
      windowAction(action, win);
    }
  });

  ipcMain.on('launcher-refreshconfig', () => {
    // Logic to refresh or fetch updated config
    win.webContents.send('launcher-refreshconfig');
  });

  ipcMain.on('launcher-close', () => {
    win.close()
  });

  ipcMain.on('hamburger-options', (event) => {
    const hamburgeroptions = Menu.buildFromTemplate([
      { label: 'Add an app...', click: () => event.sender.send('hamburger-options-command', 'addapp') },
      { label: 'Install a CRX...', click: () => event.sender.send('hamburger-options-command', 'choosecrx') },
      { type: 'separator'},
      { label: 'Settings', click: () => event.sender.send('hamburger-options-command', 'opensettings') },
      { label: 'Help', click: () => event.sender.send('hamburger-options-command', 'help') },
      { label: 'Send feedback', click: () => event.sender.send('hamburger-options-command', 'githubissues') },
      { type: 'separator'},
      { label: 'About', click: () => event.sender.send('hamburger-options-command', 'about') },
      { role: 'quit' }
    ]);

    hamburgeroptions.popup({
      window: win,
    });
  });

  ipcMain.on('context-options-app', (event, appname) => {
    const contextoptions = Menu.buildFromTemplate([
      { label: 'Create shortcuts...', click: () => event.sender.send('context-options-command-app', 'shortcuts', appname) },
      { type: 'separator'},
      { label: 'Uninstall...', click: () => event.sender.send('context-options-command-app', 'uninstall', appname) },
      { label: 'App info', click: () => event.sender.send('context-options-command-app', 'appinfo', appname) },
    ]);
  
    contextoptions.popup({
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

ipcMain.on('open-browser', async () => {
  try {
    let browserPath;

    if (process.platform === 'linux') {
      // For Linux, use xdg-open to open the default browser
      browserPath = 'xdg-open';
    } else if (process.platform === 'win32') {
      // For Windows, query the registry to get the default browser
      const { stdout } = await execPromise(
        'C:\\Windows\\System32\\reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice" /v ProgId'
      );

      const match = stdout.match(/REG_SZ\s+(.+)/);
      if (!match) throw new Error('Could not determine default browser.');

      const progId = match[1].trim();
      const { stdout: browserPathOutput } = await execPromise(
        `C:\\Windows\\System32\\reg query "HKEY_CLASSES_ROOT\\${progId}\\shell\\open\\command" /ve`
      );

      const pathMatch = browserPathOutput.match(/REG_SZ\s+(.+)/);
      if (!pathMatch) throw new Error('Could not find browser executable.');

      browserPath = pathMatch[1].trim();
      browserPath = browserPath.split('"')[1] || browserPath.split(' ')[0];
    } else {
      throw new Error('Unsupported platform');
    }

    exec(`"${browserPath}"`, (err) => {
      if (err) console.error('Error launching browser:', err);
    });
  } catch (error) {
    console.error('Failed to open default browser:', error);
  }
});


ipcMain.on('open-chrome-app', (event, crxId) => {
  openCrxApp(crxId)
});



ipcMain.on('open-program', (event, program) => {
  const programtoopen = spawn(program, [], {
    detached: true,
    stdio: 'ignore'  // Ignore stdout and stderr
  });
});

let settings

ipcMain.on('open-settings', () => {
  const config = readConfig()
  if (settings && !settings.isDestroyed()) {
    settings.focus();
  } else {
    settings = new BrowserWindow({
    width: 770,
    height: 550,
    frame: !config["chromeostitlebar"],
    transparent: config["chromeostitlebar"],
    autoHideMenuBar: true,
    name: "Settings",
    icon: path.join(__dirname, 'icons/settings.ico'),
    webPreferences: globalWebPreferences
  });

  if (config["chromeostitlebar"]) {
    settings.setSize(770, 586)
  }

  ipcMain.on('window-action', (event, action, window) => {
    if (window === 'settings') {
      try {
        windowAction(action, settings);
      } catch (error) {
        console.error('i dont feel like fixing this. plus, it literally doesnt affect anything and just gives an error for no reason');
      }
    }
  });

  settings.on('closed', () => {
    settings = null;
  });

  settings.loadFile('src/pages/settings/index.html');
  settings.webContents.setZoomFactor(1);
  }
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
      webPreferences: globalWebPreferences
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
      webPreferences: globalWebPreferences
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
      const fileExtension = path.extname(filePath).toLowerCase();
      const fileData = fs.readFileSync(filePath);

      if (fileExtension === '.svg') {
        return "|SVG|" + fileData.toString('base64'); // Return SVG content as a string
      } else {
        return fileData.toString('base64'); // Return other image types as base64
      }
    } else {
      return "filenotfound";
    }
  } catch (error) {
    console.error('Error reading image:', error);
    return "fileerror";
  }
});

ipcMain.handle('get-crx-image', async (event, filepath, crxid) => {
  const pathto = path.join(app.getPath('userData'), "installedcrx", crxid, filepath)
  
  try {
    if (fs.existsSync(pathto)) {
      const fileData = fs.readFileSync(pathto);
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
      { name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp', 'svg'] }
    ],
  });
  const fileExtension = path.extname(result.filePaths[0]).toLowerCase();

  if (fileExtension == '.svg') {
    return [result.filePaths, "|SVG|" + fs.readFileSync(result.filePaths[0]).toString('base64')]; // Return the file paths selected by the user
  } else {
    return [result.filePaths, fs.readFileSync(result.filePaths[0]).toString('base64')]; // Return the file paths selected by the user
  }
});

ipcMain.handle('choose-program', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: isLinux ? [] : [
      { name: 'Programs', extensions: ['exe', 'bat', 'cmd'] }
    ],
  });

  return result.filePaths; // Return the file paths selected by the user
});

ipcMain.handle('choose-crx', async () => {
  chooseAndExtractCrx()
});

app.whenReady().then(createWindow);
