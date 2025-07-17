const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const userDataPath = app.getPath('userData');

const configFilePath = path.join(userDataPath, 'config.json');

const defaultConfig = {
  titlebar: false,
  closeonapp: true,
  darkmode: false,
  startpos: "center",
  startoffsetx: 0,
  startoffsety: 0,
  appicon: "default",
  appiconera: "2015",
  browsericonera: "2015",
  chromiumwebstoreicon: false,
  showbrowserapp: true,
  browserappiconam: "chrome",
  chromeostitlebar: false,
  titlebarstyle: "chromium",
  checkforupdates: true,
  showshortcutalerts: true,
  apps: [
    ["Web Store", "builtinimage", "../../defaultapps/webstore/icon_256.png", "link", "https://chromewebstore.google.com/", "true"],
    ["Docs", "builtinimage", "../../defaultapps/docs/icon_128.png", "link", "https://docs.google.com/", "true"],
    ["Google Drive", "builtinimage", "../../defaultapps/drive/icon_128.png", "link", "https://drive.google.com", "true"],
    ["Gmail", "builtinimage", "../../defaultapps/gmail/icon_128.png", "link", "https://mail.google.com", "true"],
    ["Google Search", "builtinimage", "../../defaultapps/search/icon_48.png", "link", "https://google.com/?source=search_app", "true"],
    ["YouTube", "builtinimage", "../../defaultapps/youtube/icon_128.png", "link", "https://youtube.com", "true"]
  ]
};

function createConfigIfNeeded() {
  if (!fs.existsSync(configFilePath)) {
    fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
    console.log('Config file created with default values');
  }
}

function readConfig() {
  try {
    const data = fs.readFileSync(configFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading config file', err);
    return defaultConfig;
  }
}

function updateConfig(newConfig) {
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(newConfig, null, 2));
    console.log('Config file updated');
  } catch (err) {
    console.error('Error writing to config file', err);
  }
}

function getdefaultconfig() {
  return defaultConfig
}

module.exports = { createConfigIfNeeded, readConfig, updateConfig, getdefaultconfig };