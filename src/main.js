const { app, BrowserWindow, ipcMain, Menu, shell, dialog, screen } = require('electron');
const path = require('path');
const { createConfigIfNeeded, readConfig, updateConfig, getdefaultconfig } = require('./config.js');
const fs = require('fs')
const { spawn } = require('child_process');
const JSZip = require('jszip');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const { openCrxApp, chooseAndExtractCrx, sampleCrxInstall } = require('./crx.js');
const pngToIco = require('png-to-ico');

createConfigIfNeeded();

app.commandLine.appendSwitch('disable-crash-reporter');

// Check for --launch-crx parameter
const launchCrxId = process.argv.find(arg => arg.startsWith('--launch-crx='))?.split('=')[1];
const dinoId = process.argv.find(arg => arg.startsWith('--dino'))?.split('=')[1];

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
  sandbox: true,
  backgroundThrottling: false,
  offscreen: false,
  devTools: true, // Disable DevTools
  webgl: false, // Disable WebGL
  webaudio: false, // Disable WebAudio
  plugins: false, // Disable plugins
  accelerated2dCanvas: false, // Disable accelerated 2D canvas
  hardwareAcceleration: false, // Disable hardware acceleration
  disableBlinkFeatures: "Auxclick,BackspaceDefaultHandler,Gamepad,KeyboardEventKey,Notification,PointerEvent,TouchEvent,WebAnimationsAPI,WebBluetooth,WebUSB,WebVR", // Disable unnecessary Blink features
  partition: 'nopersist',
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

let applauncher

ipcMain.on('launcher-refreshconfig', () => {
  refreshConfig()
});

async function refreshConfig() {
  applauncher.webContents.send('launcher-refreshconfig');
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
  applauncher = new BrowserWindow({
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
    applauncher.center()
    applauncher.setPosition(applauncher.getPosition()[0] + config.startoffsetx, applauncher.getPosition()[1] + config.startoffsety)
  } else if (config.startpos == "lefttop") {
    applauncher.setPosition(0 + config.startoffsetx, 0 + config.startoffsety)
  } else if (config.startpos == "righttop") {
    applauncher.setPosition(width - 400 - config.startoffsetx, 0 + config.startoffsety)
  } else if (config.startpos == "leftbottom") {
    applauncher.setPosition(0 + config.startoffsetx, height - 500 - config.startoffsety + 40)
  } else if (config.startpos == "rightbottom") {
    applauncher.setPosition(width - 400 - config.startoffsetx, height - 500 - config.startoffsety + 40)
  } else {
    applauncher.center()
  }

  if (config["chromeostitlebar"] && config["titlebar"]) {
    applauncher.setSize(400, 536)
  }


  applauncher.loadFile('src/pages/main/index.html');

  ipcMain.on('window-action', (event, action, window) => {
    if (window === 'launcher') {
      windowAction(action, applauncher);
    }
  });

  ipcMain.on('launcher-close', () => {
    applauncher.close()
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
      window: applauncher,
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
      window: applauncher,
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


// Track if we're launching a CRX app
let isLaunchingCrx = false;

ipcMain.on('open-chrome-app', async (event, crxId) => {
  isLaunchingCrx = true;
  await openCrxApp(crxId);
});

ipcMain.on('add-sample-crx', async (event) => {
  await sampleCrxInstall()
  refreshConfig()
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

let dino;

function opendino() {
  if (dino && !dino.isDestroyed()) {
    dino.focus();
  } else {
    dino = new BrowserWindow({
      width: 640,
      height: 480,
      frame: false,
      name: "dino",
      resizable: false,
      icon: process.platform === 'linux'
        ? path.join(__dirname, 'defaultapps/dino.png')
        : path.join(__dirname, 'defaultapps/dino.ico'),
      skipTaskbar: false,
      webPreferences: globalWebPreferences
    });

    dino.loadFile('src/pages/dino/index.html');

    ipcMain.on('close-about', () => {
      if (dino && !dino.isDestroyed()) {
        dino.close(); 
      }
    });

    dino.on('closed', () => {
      dino = null;
      if (dinoId) {
        app.quit();
      }
    });
  }
}

ipcMain.on('open-dino', () => {
  opendino()
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
  await chooseAndExtractCrx()
  refreshConfig()
});

// Add uninstall handler
ipcMain.on('uninstall-app', async (event, appname) => {
  const config = await readConfig();
  const appIndex = config.apps.findIndex(app => app[0] === appname);
  
  if (appIndex !== -1) {
    const appData = config.apps[appIndex];
    
    // If it's a CRX app, remove its files
    if (appData[3] === 'installedcrx') {
      const crxPath = path.join(app.getPath('userData'), 'installedcrx', appData[4]);
      try {
        if (fs.existsSync(crxPath)) {
          fs.rmSync(crxPath, { recursive: true, force: true });
        }
      } catch (error) {
        console.error('Error removing CRX files:', error);
      }
    }
    
    // Remove from config
    config.apps.splice(appIndex, 1);
    await updateConfig(config);
    refreshConfig();
  }
});

// Function to convert image to ICO
async function convertToIco(sourcePath, appName) {
  try {
    // On Linux, use the original image path without conversion
    if (process.platform === 'linux') {
      // Make sure the sourcePath exists before returning it
      if (fs.existsSync(sourcePath)) {
        return sourcePath;
      } else {
        console.error(`Image file not found: ${sourcePath}`);
        // Fall back to default icon for Linux
        return path.join(__dirname, 'defaultapps/noicon.png');
      }
    }

    // Create shortcuticons directory if it doesn't exist
    const shortcutIconsDir = path.join(app.getPath('userData'), 'shortcuticons');
    if (!fs.existsSync(shortcutIconsDir)) {
      fs.mkdirSync(shortcutIconsDir, { recursive: true });
    }

    // Generate a unique filename based on app name and timestamp
    const timestamp = Date.now();
    const icoPath = path.join(shortcutIconsDir, `${appName}_${timestamp}.ico`);

    // Convert to ICO
    const buf = await pngToIco(sourcePath);
    fs.writeFileSync(icoPath, buf);

    return icoPath;
  } catch (error) {
    console.error('Error converting image to ICO:', error);
    // Return the default noicon path if conversion fails
    return path.join(__dirname, 'defaultapps/noicon.png');
  }
}

// Add shortcut creation handler
ipcMain.on('create-shortcut', async (event, appname) => {
  console.log('Create shortcut requested for:', appname);
  try {
    const config = await readConfig();
    const appData = config.apps.find(app => app[0] === appname);
    
    if (!appData) {
      console.error(`App ${appname} not found in config`);
      event.sender.send('shortcut-creation-error', `App ${appname} not found`);
      return;
    }
    console.log('Found app data:', appData);

    // For Linux, use the actual Desktop directory rather than the user home
    const desktopPath = process.platform === 'linux' 
      ? path.join(app.getPath('home'), 'Desktop')  // Use actual Desktop folder on Linux
      : path.join(app.getPath('desktop'));
    
    console.log('Desktop path:', desktopPath);
    let shortcutPath;
    let iconPath;

    // Get icon path based on app type
    if (appData[1] === 'builtinimage') {
      const sourcePath = path.join(__dirname, appData[2].replace('../../', ''));
      console.log('Converting builtin image:', sourcePath);
      iconPath = await convertToIco(sourcePath, appname);
    } else if (appData[1] === 'localimage') {
      console.log('Converting local image:', appData[2]);
      iconPath = await convertToIco(appData[2], appname);
    } else if (appData[1] === 'crxicon') {
      const sourcePath = path.join(app.getPath('userData'), 'installedcrx', appData[4], appData[2]);
      console.log('Converting CRX icon:', sourcePath);
      iconPath = await convertToIco(sourcePath, appname);
    } else {
      const sourcePath = path.join(__dirname, 'defaultapps/noicon.png');
      console.log('Using default icon:', sourcePath);
      iconPath = await convertToIco(sourcePath, appname);
    }
    console.log('Icon path:', iconPath);

    if (process.platform === 'win32') {
      // Windows shortcut creation
      shortcutPath = path.join(desktopPath, `${appname}.lnk`);
      console.log('Creating Windows shortcut at:', shortcutPath);
      
      let targetPath;
      if (appData[3] === 'link') {
        targetPath = appData[4];
      } else if (appData[3] === 'program') {
        targetPath = appData[4];
      } else if (appData[3] === 'installedcrx') {
        // For CRX apps, create a shortcut to the launcher with the app ID
        targetPath = process.execPath;
        const args = `--launch-crx=${appData[4]}`;
        console.log('Creating CRX shortcut with args:', args);
        try {
          await execPromise(`powershell "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('${shortcutPath}'); $SC.TargetPath = '${targetPath}'; $SC.Arguments = '${args}'; $SC.IconLocation = '${iconPath}'; $SC.Save()"`);
          console.log('CRX shortcut created successfully');
          event.sender.send('shortcut-creation-success', `Shortcut created for ${appname}`);
        } catch (error) {
          console.error('Error creating CRX shortcut:', error);
          event.sender.send('shortcut-creation-error', `Failed to create shortcut: ${error.message}`);
        }
        return;
      } else if (appData[3] === 'dino') {
        // dino
        targetPath = process.execPath;
        const args = `--dino=true`;
        console.log('Creating CRX shortcut with args:', args);
        try {
          await execPromise(`powershell "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('${shortcutPath}'); $SC.TargetPath = '${targetPath}'; $SC.Arguments = '${args}'; $SC.IconLocation = '${iconPath}'; $SC.Save()"`);
          console.log('CRX shortcut created successfully');
          event.sender.send('shortcut-creation-success', `Shortcut created for ${appname}`);
        } catch (error) {
          console.error('Error creating CRX shortcut:', error);
          event.sender.send('shortcut-creation-error', `Failed to create shortcut: ${error.message}`);
        }
        return;
      }
        
      // Create Windows shortcut
      try {
        await execPromise(`powershell "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('${shortcutPath}'); $SC.TargetPath = '${targetPath}'; $SC.IconLocation = '${iconPath}'; $SC.Save()"`);
        console.log('Shortcut created successfully');
        event.sender.send('shortcut-creation-success', `Shortcut created for ${appname}`);
      } catch (error) {
        console.error('Error creating shortcut:', error);
        event.sender.send('shortcut-creation-error', `Failed to create shortcut: ${error.message}`);
      }
    } else if (process.platform === 'linux') {
      // Linux desktop entry creation
      shortcutPath = path.join(desktopPath, `${appname}.desktop`);
      console.log('Creating Linux desktop entry at:', shortcutPath);
      
      let execCommand;
      if (appData[3] === 'link') {
        execCommand = `xdg-open "${appData[4]}"`;
      } else if (appData[3] === 'program') {
        execCommand = `"${appData[4]}"`;  // Wrap program path in quotes
      } else if (appData[3] === 'installedcrx') {
        // For CRX apps, create a desktop entry that launches the app through the launcher
        execCommand = `"${process.execPath}" --launch-crx=${appData[4]}`;  // Wrap executable path in quotes
      } else if (appData[3] === 'dino') {
        // For Dino game, create a desktop entry that launches the app through the launcher
        execCommand = `"${process.execPath}" --dino=true`;  // Wrap executable path in quotes
      }

      const desktopEntry = `[Desktop Entry]
Type=Application
Name=${appname}
Exec=${execCommand}
Icon=${iconPath}
Terminal=false
Categories=Utility;`;

      try {
        fs.writeFileSync(shortcutPath, desktopEntry);
        // Make the desktop entry executable
        fs.chmodSync(shortcutPath, '755');
        console.log('Desktop entry created successfully');
        event.sender.send('shortcut-creation-success', `Shortcut created for ${appname}`);
      } catch (error) {
        console.error('Error creating desktop entry:', error);
        event.sender.send('shortcut-creation-error', `Failed to create shortcut: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error in shortcut creation:', error);
    event.sender.send('shortcut-creation-error', `Failed to create shortcut: ${error.message}`);
  }
});

app.whenReady().then(() => {
  if (launchCrxId) {
    // If --launch-crx parameter is present, launch the CRX app directly
    openCrxApp(launchCrxId);
  } else if (dinoId) {
    // If --dino parameter is present, launch dino directly
    opendino();
  } else {
    // Otherwise create the main window
    createWindow();
  }
});

// Handle window closing
app.on('window-all-closed', (event) => {
  // Only prevent quitting if we're launching a CRX app
  if (isLaunchingCrx) {
    event.preventDefault();
  } else {
    app.quit();
  }
});

// Only quit when explicitly requested
app.on('before-quit', (event) => {
  // Allow the quit to proceed
  return true;
});

// Add a handler for when CRX windows are closed
ipcMain.on('crx-window-closed', () => {
  isLaunchingCrx = false;
});
