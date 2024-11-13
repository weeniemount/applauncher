const { app, BrowserWindow, ipcMain, Menu, shell  } = require('electron');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 402,
    height: 502,
    frame: false,
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


app.whenReady().then(createWindow);
