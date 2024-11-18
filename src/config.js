const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const userDataPath = app.getPath('userData');

const configFilePath = path.join(userDataPath, 'config.json');

const defaultConfig = {
  titlebar: false,
  closeonapp: true,
  darkmode: false,
  appicon: "default",
  apps: [
    ["Web Store", "builtinimage", "../../defaultapps/webstore/48.png", "link", "https://chromewebstore.google.com/"],
    ["Docs", "builtinimage", "../../defaultapps/docs/icon_128.png", "link", "https://docs.google.com/"],
    ["Google Drive", "builtinimage", "../../defaultapps/drive/128.png", "link", "https://drive.google.com"],
    ["Gmail", "builtinimage", "../../defaultapps/gmail/128.png", "link", "https://mail.google.com"],
    ["Google Search", "builtinimage", "../../defaultapps/search/48.png", "link", "https://google.com/?source=search_app"],
    ["YouTube", "builtinimage", "../../defaultapps/youtube/128.png", "link", "https://youtube.com"]
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