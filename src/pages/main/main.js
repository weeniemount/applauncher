async function refreshapps() {
    const config = await window.electron.getConfig();

    if (config && config.apps) {
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
                    window.electron.quitApp()
                }
            } else if (app[3] == "program") {
                appDiv.onclick = function() {
                    window.electron.openProgram(app[4]);
                    window.electron.quitApp()
                }
            }
            appsContent.appendChild(appDiv);

        };
    }
}

refreshapps();

// electron stuff

document.getElementById("hamburgermenu").onclick = function() {
    window.electron.showHamburgerMenu();
}

window.electron.onHamburgerMenuCommand((command) => {
    console.log(`Context menu command received: ${command}`);

    if (command === 'opensettings') {
        window.electron.openSettings();
    } else if (command === 'addapp') {
        alert('heyo');
    }
});
