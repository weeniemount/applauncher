let titlebar = document.getElementById("titlebarbox")

async function setvalues() {
    let loadconfig = await window.electron.getConfig()

    titlebar.checked = loadconfig.titlebar
}

titlebar.addEventListener('change', async (event) => {
    const isChecked = event.target.checked;

    var config = await window.electron.getConfig()
    config.titlebar = isChecked
    window.electron.updateConfig(config)
});

setvalues();