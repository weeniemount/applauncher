const { app, BrowserWindow, ipcMain, Menu, shell, dialog, screen } = require('electron');
const path = require('path');
const { createConfigIfNeeded, readConfig, updateConfig, getdefaultconfig } = require('./config.js');
const fs = require('fs')
const { spawn } = require('child_process');
const JSZip = require('jszip');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

async function openCrxApp(crxId) {
  const crxpath = path.join(app.getPath('userData'), `installedcrx`, crxId);
  const manifestPath = path.join(crxpath, 'manifest.json');

  if (fs.existsSync(manifestPath)) {
    const manifestData = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestData);

    let mainScriptPath = null;

    if (manifest.app && manifest.app.background && manifest.app.background.scripts && manifest.app.background.scripts.length > 0) {
      const backgroundScript = manifest.app.background.scripts[0];
      mainScriptPath = path.join(crxpath, backgroundScript);
    }

    if (mainScriptPath) {
      const mainJsContent = fs.readFileSync(mainScriptPath, 'utf-8');
      const htmlFiles = mainJsContent.match(/['"](.+?\.html)['"]/g);

      let width = 800;  // Default width
      let height = 600; // Default height

      // Extract width and height from bounds in main.js
      const boundsMatch = mainJsContent.match(/(bounds|innerBounds|outerBounds)\s*:\s*{\s*width:\s*(\d+),\s*height:\s*(\d+)\s*}/);
      if (boundsMatch) {
        width = parseInt(boundsMatch[2], 10);
        height = parseInt(boundsMatch[3], 10);
      }

      if (htmlFiles && htmlFiles.length > 0) {
        const htmlPaths = htmlFiles.map(match => path.join(crxpath, match.replace(/['"]/g, '')));
        const scriptName = path.basename(htmlPaths[0], '.html');
        const scriptFilePath = path.join(crxpath, `${scriptName}.html`);

        let htmlContent = fs.readFileSync(scriptFilePath, 'utf-8');

        const newWin = new BrowserWindow({
          width: width,
          height: height,
          resizable: false,
          title: '',                  // Ensure no title
          icon: path.join(__dirname, 'icons/empty.ico'),                // No icon
          autoHideMenuBar: true,       // No menu bar
          webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'), // Use your preload script
          }
        });

        newWin.loadURL(scriptFilePath); // Load the modified HTML content

        newWin.on('closed', () => {
          console.log('Window closed.');
        });

      } else {
        console.log('No HTML files found in the main.js script');
      }
    } else {
      console.log('No background scripts found in the manifest.json');
    }
  } else {
    console.log('Manifest.json not found');
  }
}

async function chooseAndExtractCrx() {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Chrome Apps', extensions: ['crx'] }
        ],
      });
    
      const crxdata = fs.readFileSync(result.filePaths[0])
      const jszipcrx = await JSZip.loadAsync(crxdata);
    
      if (!jszipcrx.files["manifest.json"]) {
        console.log("erm... that isnt a valid crx!!")
        return "erm... that isnt a valid crx!!"
      }
    
      console.log("ima go extract funny " + path.basename(result.filePaths[0]) + " now lol")
    
      const filename = path.basename(result.filePaths[0], '.crx');
      const extractPath = path.join(app.getPath('userData'), `installedcrx`, `${filename}`);
    
      if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true });
      }
    
      for (const [relativePath, zipEntry] of Object.entries(jszipcrx.files)) {
        const outputPath = path.join(extractPath, relativePath);
    
        if (zipEntry.dir) {
          fs.mkdirSync(outputPath, { recursive: true });
        } else {
          fs.mkdirSync(path.dirname(outputPath), { recursive: true });
          const content = await zipEntry.async("nodebuffer");
          fs.writeFileSync(outputPath, content);
          //console.log(`Extracted: ${outputPath}`);
        }
      }
    
      const manifestPath = path.join(extractPath, 'manifest.json');
      const manifestData = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);
    
      let iconpathvery = "noicon"
      let appname
    
      if (manifest.icons && typeof manifest.icons === 'object') {
        const iconPaths = Object.values(manifest.icons);
        if (iconPaths.length > 0) {
          iconpathvery = iconPaths[0];
        } else {
          iconpathvery = "noicon"
        }
      }
      
      
      if (manifest.name) {
        console.log("App Name: " + manifest.name);
        appname = manifest.name
      } else {
        console.log("No name found in the manifest.json");
        appname = "No Named App"
      }
    
      const config = await readConfig()
    
      if (iconpathvery == "noicon") {
        config.apps.push([appname, "noicon", "", "installedcrx", filename])
      } else {
        config.apps.push([appname, "crxicon", iconpathvery, "installedcrx", filename])
      } 
    
      updateConfig(config)
      console.log("it went okay")
      return "it went okay"
}

async function sampleCrxInstall() {
    const crxpath = path.join(__dirname, "samplecrx", "PELIMFLKPJIICNAJDJCMEKPIOACMAHKH_1_2_0_0.crx")
    const crxdata = fs.readFileSync(crxpath)
    const jszipcrx = await JSZip.loadAsync(crxdata);

    const extractPath = path.join(app.getPath('userData'), `installedcrx`, `PELIMFLKPJIICNAJDJCMEKPIOACMAHKH_1_2_0_0`);

    if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true });
    }

    for (const [relativePath, zipEntry] of Object.entries(jszipcrx.files)) {
    const outputPath = path.join(extractPath, relativePath);

    if (zipEntry.dir) {
        fs.mkdirSync(outputPath, { recursive: true });
    } else {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        const content = await zipEntry.async("nodebuffer");
        fs.writeFileSync(outputPath, content);
        //console.log(`Extracted: ${outputPath}`);
    }
    }

    const manifestPath = path.join(extractPath, 'manifest.json');
    const manifestData = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);

    let iconpathvery = "noicon"
    let appname

    if (manifest.icons && typeof manifest.icons === 'object') {
        const iconPaths = Object.values(manifest.icons);
        if (iconPaths.length > 0) {
            iconpathvery = iconPaths[0];
        }
    }
    
    appname = manifest.name
    const config = await readConfig()

    config.apps.push([appname, "crxicon", iconpathvery, "installedcrx", "PELIMFLKPJIICNAJDJCMEKPIOACMAHKH_1_2_0_0"])

    updateConfig(config)
    console.log("it went okay")
    return "it went okay"
}

module.exports = {
    openCrxApp,
    chooseAndExtractCrx,
    sampleCrxInstall
}