const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 402,
    height: 502,
    webPreferences: {
      preload: path.join(__dirname, 'pages', 'main', 'preload.js'), // Set up preload to enable secure communication
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

app.whenReady().then(createWindow);
