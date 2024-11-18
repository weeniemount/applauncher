let titlebar = document.getElementById("titlebarbox")
let closelauncher = document.getElementById("closelauncher")
let darkmode = document.getElementById("darkmode")

async function setvalues() {
    let loadconfig = await window.electron.getConfig()

    titlebar.checked = loadconfig.titlebar
    closelauncher.checked = loadconfig.closeonapp
    darkmode.checked = loadconfig.darkmode
}

titlebar.addEventListener('change', async (event) => {
    const isChecked = event.target.checked;

    var config = await window.electron.getConfig()
    config.titlebar = isChecked
    window.electron.updateConfig(config)
    window.electron.launcherRefreshConfig();
});

closelauncher.addEventListener('change', async (event) => {
    const isChecked = event.target.checked;

    var config = await window.electron.getConfig()
    config.closeonapp = isChecked
    window.electron.updateConfig(config)
    window.electron.launcherRefreshConfig();
});

darkmode.addEventListener('change', async (event) => {
    const isChecked = event.target.checked;

    var config = await window.electron.getConfig()
    config.darkmode = isChecked
    window.electron.updateConfig(config)
    window.electron.launcherRefreshConfig();
});


async function appiconradio() {
    const selectedRadio = document.querySelector('input[name="appicon"]:checked');
    
    var config = await window.electron.getConfig()
    config.appicon = selectedRadio.id
    window.electron.updateConfig(config)
    window.electron.launcherRefreshConfig();
}

setvalues();