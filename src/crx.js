const { app, BrowserWindow, ipcMain, Menu, shell, dialog, screen } = require('electron');
const path = require('path');
const { createConfigIfNeeded, readConfig, updateConfig, getdefaultconfig } = require('./config.js');
const fs = require('fs');
const { spawn } = require('child_process');
const JSZip = require('jszip');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const pngToIco = require('png-to-ico');
const url = require('url'); // Add URL module for file URL handling

async function getAppIcon(manifest, crxpath) {
  let iconPath = null;
  
  // Try to find the largest icon from manifest
  if (manifest.icons) {
    const iconSizes = Object.keys(manifest.icons).map(size => parseInt(size));
    const largestSize = Math.max(...iconSizes);
    const iconFile = manifest.icons[largestSize];
    if (iconFile) {
      iconPath = path.join(crxpath, iconFile);
    }
  }

  if (!iconPath || !fs.existsSync(iconPath)) {
    // Fallback to default noicon.png
    iconPath = path.join(__dirname, 'defaultapps/noicon.png');
  }

  // Convert icon to appropriate format for platform
  try {
    const iconDir = path.join(app.getPath('userData'), 'crxicons');
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir, { recursive: true });
    }

    const iconName = path.basename(iconPath, path.extname(iconPath));
    const platformExt = process.platform === 'win32' ? 'ico' : 
                       process.platform === 'darwin' ? 'icns' : 'png';
    const platformIconPath = path.join(iconDir, `${iconName}_${process.platform}.${platformExt}`);

    // Handle platform-specific icon conversion
    if (process.platform === 'win32') {
      // Convert to ICO for Windows
      const buf = await pngToIco(iconPath);
      fs.writeFileSync(platformIconPath, buf);
    } else if (process.platform === 'darwin') {
      // For macOS, use the PNG directly since Electron can handle it
      // In the future, you might want to add proper ICNS conversion here
      fs.copyFileSync(iconPath, platformIconPath.replace('.icns', '.png'));
      return platformIconPath.replace('.icns', '.png');
    } else {
      // For Linux, just copy the PNG if it doesn't exist
      if (!fs.existsSync(platformIconPath)) {
        fs.copyFileSync(iconPath, platformIconPath);
      }
    }

    return platformIconPath;
  } catch (error) {
    console.error('Error converting icon:', error);
    // If conversion fails, return the original noicon.png
    return path.join(__dirname, 'defaultapps/noicon.png');
  }
}

async function openCrxApp(crxId) {
  console.log(`Opening CRX app: ${crxId}`);
  const crxpath = path.join(app.getPath('userData'), 'installedcrx', crxId);
  const manifestPath = path.join(crxpath, 'manifest.json');

  if (fs.existsSync(manifestPath)) {
    console.log(`Manifest file found at: ${manifestPath}`);
    const manifestData = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestData);

    let mainScriptPath = null;

    // Find the main script from the manifest
    if (manifest.app && manifest.app.background && manifest.app.background.scripts && manifest.app.background.scripts.length > 0) {
      const backgroundScript = manifest.app.background.scripts[0];
      mainScriptPath = path.join(crxpath, backgroundScript);
      console.log(`Main script path: ${mainScriptPath}`);
    } else {
      console.log('No background scripts found in manifest.json');
      return;
    }

    if (fs.existsSync(mainScriptPath)) {
      const mainJsContent = fs.readFileSync(mainScriptPath, 'utf-8');
      
      // Extract HTML files referenced in main.js
      // Improved regex to match various HTML filename patterns
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
        // Clean up the file paths from the regex matches
        const cleanedHtmlPaths = htmlFiles.map(match => match.replace(/['"]/g, ''));
        console.log(`Found HTML files: ${cleanedHtmlPaths.join(', ')}`);
        
        // Get the first HTML file
        const firstHtmlFile = cleanedHtmlPaths[0];
        let htmlFilePath = path.join(crxpath, firstHtmlFile);
        
        console.log(`Attempting to load HTML file: ${htmlFilePath}`);
        
        if (!fs.existsSync(htmlFilePath)) {
          console.error(`HTML file does not exist: ${htmlFilePath}`);
          // Try to find the HTML file with a case-insensitive search (helpful on Linux)
          const dirContents = fs.readdirSync(path.dirname(htmlFilePath));
          const matchingFile = dirContents.find(file => 
            file.toLowerCase() === path.basename(htmlFilePath).toLowerCase()
          );
          
          if (matchingFile) {
            const correctedPath = path.join(path.dirname(htmlFilePath), matchingFile);
            console.log(`Found HTML file with different case: ${correctedPath}`);
            htmlFilePath = correctedPath;
          } else {
            console.error('Could not find HTML file, even with case-insensitive search');
            return;
          }
        }

        // Get the app icon
        const appIcon = await getAppIcon(manifest, crxpath);
        console.log(`Using app icon: ${appIcon}`);

        const newWin = new BrowserWindow({
          width: width,
          height: height,
          resizable: true, // Allow resizing for better debugging
          title: manifest.name || 'Chrome App',
          icon: appIcon,
          autoHideMenuBar: true,
          titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default', // Use native macOS titlebar
          trafficLightPosition: process.platform === 'darwin' ? { x: 10, y: 10 } : undefined,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false, // Disable web security to allow local file access
            preload: path.join(__dirname, 'preload.js'),
            enableRemoteModule: true, // Enable remote module if needed by the app
          }
        });

        // Create macOS app menu if needed
        if (process.platform === 'darwin') {
          const template = [
            {
              label: app.name,
              submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
              ]
            },
            {
              label: 'Edit',
              submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
              ]
            },
            {
              label: 'Window',
              submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { type: 'separator' },
                { role: 'front' }
              ]
            }
          ];
          const menu = Menu.buildFromTemplate(template);
          Menu.setApplicationMenu(menu);
        }

        // Use proper file URL format for loading local files
        const fileUrl = url.format({
          pathname: htmlFilePath,
          protocol: 'file:',
          slashes: true
        });
        
        console.log(`Loading URL: ${fileUrl}`);
        newWin.loadURL(fileUrl);
        
        // Show DevTools in development
        if (process.env.NODE_ENV === 'development') {
          newWin.webContents.openDevTools();
        }

        newWin.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
          console.error(`Failed to load: ${errorCode} - ${errorDescription}`);
        });

        newWin.on('closed', () => {
          console.log('Window closed.');
          // Clean up event listeners
          newWin.webContents.removeAllListeners('did-fail-load');
          // Emit event to main process
          ipcMain.emit('crx-window-closed');
        });

      } else {
        console.log('No HTML files found in the main.js script');
      }
    } else {
      console.error(`Main script does not exist: ${mainScriptPath}`);
    }
  } else {
    console.error(`Manifest file not found: ${manifestPath}`);
  }
}

async function chooseAndExtractCrx() {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Chrome Apps', extensions: ['crx'] }
        ],
      });
    
      if (result.canceled || result.filePaths.length === 0) {
        console.log("No file selected");
        return "No file selected";
      }
    
      const crxdata = fs.readFileSync(result.filePaths[0]);
      const jszipcrx = await JSZip.loadAsync(crxdata);
    
      if (!jszipcrx.files["manifest.json"]) {
        console.log("erm... that isnt a valid crx!!");
        return "erm... that isnt a valid crx!!";
      }
    
      console.log("ima go extract funny " + path.basename(result.filePaths[0]) + " now lol");
    
      const filename = path.basename(result.filePaths[0], '.crx');
      // Use path.join for cross-platform compatibility
      const extractPath = path.join(app.getPath('userData'), 'installedcrx', filename);
    
      if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true });
      }
    
      for (const [relativePath, zipEntry] of Object.entries(jszipcrx.files)) {
        // Normalize path separators for the current platform
        const normalizedPath = relativePath.split('/').join(path.sep);
        const outputPath = path.join(extractPath, normalizedPath);
    
        if (zipEntry.dir) {
          fs.mkdirSync(outputPath, { recursive: true });
        } else {
          fs.mkdirSync(path.dirname(outputPath), { recursive: true });
          const content = await zipEntry.async("nodebuffer");
          fs.writeFileSync(outputPath, content);
        }
      }
    
      const manifestPath = path.join(extractPath, 'manifest.json');
      const manifestData = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);
    
      let iconpathvery = "noicon";
      let appname;
    
      if (manifest.icons && typeof manifest.icons === 'object') {
        const iconPaths = Object.values(manifest.icons);
        if (iconPaths.length > 0) {
          // Normalize icon path for the current platform
          iconpathvery = iconPaths[0].split('/').join(path.sep);
        } else {
          iconpathvery = "noicon";
        }
      }
      
      if (manifest.name) {
        console.log("App Name: " + manifest.name);
        appname = manifest.name;
      } else {
        console.log("No name found in the manifest.json");
        appname = "No Named App";
      }
    
      const config = await readConfig();
    
      if (iconpathvery == "noicon") {
        config.apps.push([appname, "noicon", "", "installedcrx", filename]);
      } else {
        config.apps.push([appname, "crxicon", iconpathvery, "installedcrx", filename]);
      } 
    
      updateConfig(config);
      console.log("it went okay");
      return "it went okay";
}

async function sampleCrxInstall() {
    const crxpath = path.join(__dirname, "samplecrx", "PELIMFLKPJIICNAJDJCMEKPIOACMAHKH_1_2_0_0.crx");
    const crxdata = fs.readFileSync(crxpath);
    const jszipcrx = await JSZip.loadAsync(crxdata);

    const extractPath = path.join(app.getPath('userData'), 'installedcrx', 'PELIMFLKPJIICNAJDJCMEKPIOACMAHKH_1_2_0_0');

    if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true });
    }

    for (const [relativePath, zipEntry] of Object.entries(jszipcrx.files)) {
      const normalizedPath = relativePath.split('/').join(path.sep);
      const outputPath = path.join(extractPath, normalizedPath);

      if (zipEntry.dir) {
          fs.mkdirSync(outputPath, { recursive: true });
      } else {
          fs.mkdirSync(path.dirname(outputPath), { recursive: true });
          const content = await zipEntry.async("nodebuffer");
          fs.writeFileSync(outputPath, content);
      }
    }

    const manifestPath = path.join(extractPath, 'manifest.json');
    const manifestData = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);

    let iconpathvery = "noicon";
    let appname;

    if (manifest.icons && typeof manifest.icons === 'object') {
        const iconPaths = Object.values(manifest.icons);
        if (iconPaths.length > 0) {
            // Normalize icon path for the current platform
            iconpathvery = iconPaths[0].split('/').join(path.sep);
        } else {
            iconpathvery = "noicon";
        }
    }
    
    appname = manifest.name;
    const config = await readConfig();

    config.apps.push([appname, "crxicon", iconpathvery, "installedcrx", "PELIMFLKPJIICNAJDJCMEKPIOACMAHKH_1_2_0_0"]);

    updateConfig(config);
    console.log("it went okay");
    return "it went okay";
}

module.exports = {
    openCrxApp,
    chooseAndExtractCrx,
    sampleCrxInstall
};