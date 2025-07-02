let titlebar = document.getElementById("titlebarbox")
let closelauncher = document.getElementById("closelauncher")
let chromiumwebstoreicon = document.getElementById("chromiumwebstoreicon")
let darkmode = document.getElementById("darkmode")
let resetapps = document.getElementById("resetapps")
let showbrowserapp = document.getElementById("showbrowserapp")
let checkforupdates = document.getElementById("checkforupdates")
let showshortcutalerts = document.getElementById("showshortcutalerts")

// Platform detection
const isMac = navigator.platform.toLowerCase().includes('mac');
const isLinux = navigator.platform.toLowerCase().includes('linux');

// Helper function to update config
async function updateConfigAndRefresh(updater) {
    const config = await window.electron.getConfig()
    updater(config)
    await window.electron.updateConfig(config)
    window.electron.launcherRefreshConfig()
}

// Helper function for checkbox changes
function handleCheckboxChange(element, configKey) {
    element.addEventListener('change', async (event) => {
        await updateConfigAndRefresh(config => {
            config[configKey] = event.target.checked
        })
    })
}

// Helper function for radio button changes
function handleRadioChange(name, configKey) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
        radio.addEventListener('change', async () => {
            await updateConfigAndRefresh(config => {
                config[configKey] = radio.id
            })
        })
    })
}

// Helper function for number input changes
function handleNumberInput(element, configKey) {
    element.addEventListener('input', async () => {
        await updateConfigAndRefresh(config => {
            const value = element.value === "" ? 0 : parseInt(element.value)
            config[configKey] = value
            element.value = value
        })
    })
}

async function titlebarfunc(config) {
    if (config["chromeostitlebar"] === true && config["titlebarstyle"] === "chromium") {
        document.getElementById("chrome-titlebar").style.display = "flex"
        document.getElementById("settingsbox").style.marginTop = "36px"
        document.getElementById("settingsbox").style.height = "calc(100vh - 37px)"
        document.getElementById("settingsbox").style.borderLeft = "#373837 1px solid"
        document.getElementById("settingsbox").style.borderRight = "#373837 1px solid"
        document.getElementById("settingsbox").style.borderBottom = "#373837 1px solid"
    } else if (config["chromeostitlebar"] === true && config["titlebarstyle"] === "chrome48") {
        document.getElementById("chrome-titlebar2").style.display = "flex"
        document.getElementById("settingsbox").style.marginTop = "36px"
        document.getElementById("settingsbox").style.height = "calc(100vh - 37px)"
        document.getElementById("settingsbox").style.borderLeft = "#373837 1px solid"
        document.getElementById("settingsbox").style.borderRight = "#373837 1px solid"
        document.getElementById("settingsbox").style.borderBottom = "#373837 1px solid"
    }
}

// Initialize platform-specific UI elements
function initializePlatformSpecific() {
    const taskbarText = document.getElementById('taskbar-icon-text');
    const taskbarOptions = document.getElementById('taskbar-icon-options');

    if (isMac) {
        // Hide taskbar icon options on macOS as it's not supported
        taskbarText.style.display = 'none';
        taskbarOptions.style.display = 'none';
    } else {
        // Show appropriate text for other platforms
        taskbarText.textContent = `App Launcher ${isLinux ? 'dock' : 'taskbar'} icon:`;
    }
}

// Call initialization on window load
window.addEventListener('load', initializePlatformSpecific);

// Window control handlers
document.getElementById("close").onclick = () => window.electron.windowAction("close", "settings")
document.getElementById("minimize").onclick = () => window.electron.windowAction("minimize", "settings")
document.getElementById("maximize").onclick = () => window.electron.windowAction("maximize", "settings")

document.getElementById("close2").onclick = () => window.electron.windowAction("close", "settings")
document.getElementById("minimize2").onclick = () => window.electron.windowAction("minimize", "settings")
document.getElementById("maximize2").onclick = () => window.electron.windowAction("maximize", "settings")

async function setvalues() {
    const config = await window.electron.getConfig()
    titlebarfunc(config)
    
    // Set checkbox values
    titlebar.checked = config.titlebar
    closelauncher.checked = config.closeonapp
    darkmode.checked = config.darkmode
    chromiumwebstoreicon.checked = config.chromiumwebstoreicon
    showbrowserapp.checked = config.showbrowserapp
    checkforupdates.checked = config.checkForUpdates
    showshortcutalerts.checked = config.showShortcutAlerts
    document.getElementById("chromeostitlebarbox").checked = config.chromeostitlebar
    
    // Set radio values
    document.getElementById(config.appicon).checked = true
    document.getElementById(config.browserappiconam).checked = true
    
    // Set era radio values
    document.querySelectorAll('input[name="defaulticonera"]').forEach(radio => {
        if (radio.id === config.appiconera) radio.checked = true
    });
    document.querySelectorAll('input[name="browsericonera"]').forEach(radio => {
        if (radio.id === config.browsericonera) radio.checked = true
    });
    
    document.getElementById(config.startpos).checked = true
    
    // Set number inputs
    document.getElementById("xoffset").value = config.startoffsetx
    document.getElementById("yoffset").value = config.startoffsety

    document.getElementById(config.titlebarstyle).checked = true
}

// Initialize checkbox handlers
handleCheckboxChange(titlebar, 'titlebar')
handleCheckboxChange(closelauncher, 'closeonapp')
handleCheckboxChange(chromiumwebstoreicon, 'chromiumwebstoreicon')
handleCheckboxChange(darkmode, 'darkmode')
handleCheckboxChange(showbrowserapp, 'showbrowserapp')
handleCheckboxChange(checkforupdates, 'checkForUpdates')
handleCheckboxChange(showshortcutalerts, 'showShortcutAlerts')
handleCheckboxChange(document.getElementById("chromeostitlebarbox"), 'chromeostitlebar')

// Initialize radio handlers
handleRadioChange('appicon', 'appicon')
handleRadioChange('startpos', 'startpos')
handleRadioChange('browsericon', 'browserappiconam')
handleRadioChange('defaulticonera', 'appiconera')
handleRadioChange('browsericonera', 'browsericonera')
handleRadioChange('titlebarstyle', 'titlebarstyle')

// Initialize number input handlers
handleNumberInput(document.getElementById("xoffset"), 'startoffsetx')
handleNumberInput(document.getElementById("yoffset"), 'startoffsety')

// Reset apps handler
resetapps.addEventListener('click', async () => {
    const [config, defaultconfig] = await Promise.all([
        window.electron.getConfig(),
        window.electron.getDefaultConfig()
    ])
    config.apps = defaultconfig.apps
    await window.electron.updateConfig(config)
    window.electron.launcherRefreshConfig()
    appstable()
})

async function appstable() {
    const config = await window.electron.getConfig()
    const tableBody = document.getElementById('apptable').querySelector('tbody')
    tableBody.innerHTML = ''

    if (config?.apps?.length > 0) {
        for (const app of config.apps) {
            const newRow = tableBody.insertRow()
            newRow.insertCell(0).textContent = app[0]
            if (app[3] == "dino") {
                newRow.insertCell(1).textContent = "chrome://dino"
            } else {
                newRow.insertCell(1).textContent = app[4]
            }
            
            const iconCell = newRow.insertCell(2)
            const iconHtml = await getAppIconHtml(app)
            iconCell.innerHTML = iconHtml
            
            const removeCell = newRow.insertCell(3)
            removeCell.innerHTML = `<a onclick='deleteApp("${app[0]}")'><image src='images/removeapp.png'></a>`
        }
    }
}

async function getAppIconHtml(app) {
    if (app[1] === "builtinimage") {
        return `<img src=${app[2]} id='appicon'>`
    } else if (app[1] === "localimage") {
        const editedstring = app[2].replace(/\\/g, '/')
        const image = await window.electron.getImage(editedstring)
        if (image.includes("|SVG|")) {
            return `<img src="data:image/svg+xml;base64,${image.replace("|SVG|", "")}" id='appicon'>`
        }
        return `<img src="data:image/png;base64,${image}" id='appicon'>`
    } else if (app[1] === "crxicon") {
        const image = await window.electron.getCrxImage(app[2], app[4])
        return `<img src="data:image/png;base64,${image}" id='appicon'>`
    }
    return `<img src='../../defaultapps/noicon.png' id='appicon'>`
}

async function deleteApp(appname) {
    const config = await window.electron.getConfig()
    const index = config.apps.findIndex(app => app[0] === appname)
    if (index !== -1) {
        config.apps.splice(index, 1)
        await window.electron.updateConfig(config)
        appstable()
        window.electron.launcherRefreshConfig()
    }
}

async function addoptionalapp(app) {
    const appConfigs = {
        slides: ["Slides", "builtinimage", "../../defaultapps/slides/icon_128.png", "link", "https://docs.google.com/presentation/", "true"],
        sheets: ["Sheets", "builtinimage", "../../defaultapps/sheets/icon_128.png", "link", "https://docs.google.com/spreadsheets/", "true"],
        keep: ["Keep", "builtinimage", "../../defaultapps/keep/icon_128.png", "link", "https://keep.google.com/", "true"],
        webstore: ["Web Store", "builtinimage", "../../defaultapps/webstore/icon_256.png", "link", "https://chromewebstore.google.com/", "true"],
        docs: ["Docs", "builtinimage", "../../defaultapps/docs/icon_128.png", "link", "https://docs.google.com/", "true"],
        drive: ["Google Drive", "builtinimage", "../../defaultapps/drive/icon_128.png", "link", "https://drive.google.com", "true"],
        gmail: ["Gmail", "builtinimage", "../../defaultapps/gmail/icon_128.png", "link", "https://mail.google.com", "true"],
        search: ["Google Search", "builtinimage", "../../defaultapps/search/icon_48.png", "link", "https://google.com/?source=search_app", "true"],
        youtube: ["YouTube", "builtinimage", "../../defaultapps/youtube/icon_128.png", "link", "https://youtube.com", "true"]
    }

    const config = await window.electron.getConfig()
    if (appConfigs[app]) {
        config.apps.push(appConfigs[app])
        await window.electron.updateConfig(config)
        appstable()
        window.electron.launcherRefreshConfig()
    }
}

document.getElementById("resetconfig").addEventListener('click', async () => {
    const defaultConfig = await window.electron.getDefaultConfig()
    await window.electron.updateConfig(defaultConfig)
    window.electron.launcherRefreshConfig()
    setvalues()
    appstable()
})

document.getElementById("backupconfig").addEventListener('click', async () => {
    const result = await window.electron.backupConfig();
    if (result.success) {
        alert("Backup saved successfully!");
    } else if (result.error) {
        alert("Backup failed: " + result.error);
    }
});

document.getElementById("restoreconfig").addEventListener('click', async () => {
    const result = await window.electron.restoreConfig();
    if (result.success) {
        window.electron.launcherRefreshConfig();
        setvalues();
        appstable();
        alert("Config restored successfully!");
    } else if (result.error) {
        alert("Restore failed: " + result.error);
    }
});

// Initialize
setvalues()
appstable()