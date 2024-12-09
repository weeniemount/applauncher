let closeonapp = true

async function applyconfig() {
    var config = await window.electron.getConfig()

    darkmode(config.darkmode)
    closeonapp = config.closeonapp

    refreshapps(config)
}

async function refreshapps(config) {
    if (config && config.apps && config.apps.length > 0) {
        const appsContent = document.getElementById("apps-content");

        appsContent.innerHTML = '';

        for (const app of config.apps) {
            const appDiv = document.createElement("div");
            appDiv.id = "app";

            const appIcon = document.createElement("img");
            appIcon.id = "appicon";
            if (app[1] == "builtinimage") {
                appIcon.src = app[2];
            } else if (app[1] == "localimage") {
                var editedstring = app[2].replace(/\\/g, '/');
                const image = await window.electron.getImage(editedstring)

                appIcon.src = `data:image/png;base64,${image}`;
            }
            appIcon.alt = app[0];

            const appText = document.createElement("p");
            appText.id = "apptext";
            appText.textContent = app[0];

            appDiv.appendChild(appIcon)
            appDiv.appendChild(appText);

            if (app[3] == "link") {
                const linkIcon = document.createElement("img");
                linkIcon.id = "linkicon";
                linkIcon.src = "images/link.png"
                appDiv.appendChild(linkIcon)

                appDiv.onclick = function() {
                    window.electron.openLink(app[4]);
                    if (closeonapp) {
                        window.electron.quitApp()
                    }
                }
            } else if (app[3] == "program") {
                appDiv.onclick = function() {
                    window.electron.openProgram(app[4]);
                    if (closeonapp) {
                        window.electron.quitApp()
                    }
                }
            }
            appsContent.appendChild(appDiv);

        };
    } else if (config.apps.length == 0) {
        const appsContent = document.getElementById("apps-content");
    }
}

function darkmode(variable) {
    if (variable) {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark')
    }
}


applyconfig();

document.getElementById("searchbarurl").addEventListener("change", function() {
    const searchbarText = document.getElementById("searchbar").value

    if (searchbarText == "") {
        document.getElementById("apps-content").hidden = true;
        document.getElementById("searchpage").hidden = false;
    } else {
        document.getElementById("apps-content").hidden = false;
        document.getElementById("searchpage").hidden = true;
    }
});

// electron stuff

document.getElementById("hamburgermenu").onclick = function() {
    window.electron.showHamburgerMenu();
}

window.electron.refreshAppsList(() => {
    console.log("refreshing apps list")
    refreshapps();
})

window.electron.onHamburgerMenuCommand((command) => {
    console.log(`Context menu command received: ${command}`);

    if (command === 'opensettings') {
        window.electron.openSettings();
    } else if (command === 'addapp') {
        window.electron.openCreateAnApp();
    } else if (command === 'githubissues') {
        window.electron.openLink("https://github.com/weeniemount/applauncher/issues");
    } else if (command === 'about') {
        window.electron.openAbout();
    }
});

window.electron.onMessage('launcher-refreshconfig', (event) => {
    applyconfig()
});