const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const userDataPath = app.getPath('userData');

const configFilePath = path.join(userDataPath, 'config.json');

const defaultConfig = {
  titlebar: false,
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

module.exports = { createConfigIfNeeded, readConfig, updateConfig };