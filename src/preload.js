const { contextBridge, ipcRenderer } = require('electron');

// Expose the ipcRenderer to the renderer process safely
contextBridge.exposeInMainWorld('electron', {
  sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  onMessage: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  showHamburgerMenu: () => ipcRenderer.send('hamburger-options'),
  onHamburgerMenuCommand: (callback) => ipcRenderer.on('hamburger-options-command', (event, command) => callback(command)),
  openLink: (url) => ipcRenderer.send('open-link', url),
  quitApp: () => ipcRenderer.send('quit-app'),
  getConfig: async () => {
    return await ipcRenderer.invoke('get-config');
  },
  getImage: async (filePath) => {
    return await ipcRenderer.invoke('get-image', filePath);
  },
  chooseAppIcon: async () => {
    return await ipcRenderer.invoke('choose-app-icon');
  },
  chooseProgram: async () => {
    return await ipcRenderer.invoke('choose-program');
  },
  updateConfig: (config) => ipcRenderer.send('update-config', config),
  openProgram: (program) => ipcRenderer.send('open-program', program),
  openSettings: () => ipcRenderer.send('open-settings'),
  openCreateAnApp: () => ipcRenderer.send('open-createanapp'),
  refreshAppsList: (callback) => ipcRenderer.on('refresh-appslist', callback)
});
