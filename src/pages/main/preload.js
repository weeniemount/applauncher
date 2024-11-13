const { contextBridge, ipcRenderer } = require('electron');

// Expose the ipcRenderer to the renderer process safely
contextBridge.exposeInMainWorld('electron', {
  sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  onMessage: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  showHamburgerMenu: () => ipcRenderer.send('hamburger-options'),
  onHamburgerMenuCommand: (callback) => ipcRenderer.on('hamburger-options-command', (event, command) => callback(command)),
  openLink: (url) => ipcRenderer.send('open-link', url),
  quitApp: () => ipcRenderer.send('quit-app'),
});
