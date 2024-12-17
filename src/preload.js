const { contextBridge, ipcRenderer } = require('electron');

// Expose the ipcRenderer to the renderer process safely
contextBridge.exposeInMainWorld('electron', {
  sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  onMessage: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  showHamburgerMenu: () => ipcRenderer.send('hamburger-options'),
  onHamburgerMenuCommand: (callback) => ipcRenderer.on('hamburger-options-command', (event, command) => callback(command)),
  openLink: (url) => ipcRenderer.send('open-link', url),
  openCrxApp: (crxid) => ipcRenderer.send('open-chrome-app', crxid),
  quitApp: () => ipcRenderer.send('quit-app'),
  getConfig: async () => {
    return await ipcRenderer.invoke('get-config');
  },
  getImage: async (filePath) => {
    return await ipcRenderer.invoke('get-image', filePath);
  },
  getCrxImage: async (filepath, crxid) => {
    return await ipcRenderer.invoke('get-crx-image', filepath, crxid);
  },
  chooseAppIcon: async () => {
    return await ipcRenderer.invoke('choose-app-icon');
  },
  chooseProgram: async () => {
    return await ipcRenderer.invoke('choose-program');
  },
  installCrx: async () => {
    return await ipcRenderer.invoke('choose-crx');
  },
  getDefaultConfig: async () => {
    return await ipcRenderer.invoke('get-defaultconfig');
  },
  getAppVersion: async () => {
    const version = await ipcRenderer.invoke('get-app-version');
    return version;
  },
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),
  openProgram: (program) => ipcRenderer.send('open-program', program),
  openSettings: () => ipcRenderer.send('open-settings'),
  closeLauncher: () => ipcRenderer.send('launcher-close'),
  openCreateAnApp: () => ipcRenderer.send('open-createanapp'),
  refreshAppsList: (callback) => ipcRenderer.on('refresh-appslist', callback),
  closeCreateAnApp: () => ipcRenderer.send('close-createanapp'),
  launcherRefreshConfig: () => ipcRenderer.send('launcher-refreshconfig'),
  openAbout: () => ipcRenderer.send('open-about'),
  closeAbout: () => ipcRenderer.send('close-about'),
});
