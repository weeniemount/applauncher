let titlebar = document.getElementById("titlebarbox")
let closelauncher = document.getElementById("closelauncher")
let darkmode = document.getElementById("darkmode")
let resetapps = document.getElementById("resetapps")

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

resetapps.addEventListener('click', async () => {
    var config = await window.electron.getConfig()
    var defaultconfig = await window.electron.getDefaultConfig()

    config.apps = defaultconfig.apps
    //console.log(defaultconfig)

    window.electron.updateConfig(config)
    window.electron.launcherRefreshConfig();
    appstable()
})

async function appiconradio() {
    const selectedRadio = document.querySelector('input[name="appicon"]:checked');
    
    var config = await window.electron.getConfig()
    config.appicon = selectedRadio.id
    window.electron.updateConfig(config)
    window.electron.launcherRefreshConfig();
}

async function appstable() {
    var config = await window.electron.getConfig()
    const tableBody = document.getElementById('apptable').querySelector('tbody');

    tableBody.innerHTML = ''

    if (config && config.apps && config.apps.length > 0) {
        for (const app of config.apps) {
            const newRow = tableBody.insertRow();

            const nameCell = newRow.insertCell(0);
            nameCell.textContent = app[0]
          
            const pathCell = newRow.insertCell(1);
            pathCell.textContent = app[4]
          
            const iconCell = newRow.insertCell(2);
            
            if (app[1] == "builtinimage") {
                iconCell.innerHTML = `<img src=${app[2]} id='appicon'>`
            } else if (app[1] == "localimage") {
                var editedstring = app[2].replace(/\\/g, '/');
                const image = await window.electron.getImage(editedstring)

                iconCell.innerHTML = `<img src="data:image/png;base64,${image}" id='appicon'>`
            }

            const removeCell = newRow.insertCell(3);
            removeCell.innerHTML = `<a onclick='deleteApp("${app[0]}")'><image src='images/removeapp.png'></a>`
        };
    }
}

async function deleteApp(appname) {
    let config = await window.electron.getConfig()
    const index = config.apps.findIndex(app => app[0] === appname);

    if (index !== -1) {
        const removedApp = config.apps.splice(index, 1);
        console.log("App deleted:", removedApp[0]);
    }

    await window.electron.updateConfig(config)
    appstable();
    window.electron.launcherRefreshConfig();
}

setvalues();
appstable();