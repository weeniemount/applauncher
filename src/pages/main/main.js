var appslist = [
    ["Web Store", "../../defaultapps/webstore/48.png", "link", "https://chromewebstore.google.com/"],
    ["Docs", "../../defaultapps/docs/icon_128.png", "link", "https://docs.google.com/"],
    ["Drive", "../../defaultapps/drive/128.png", "link", "https://drive.google.com"],
    ["Gmail", "../../defaultapps/gmail/128.png", "link", "https://mail.google.com"],
    ["Google Search", "../../defaultapps/search/48.png", "link", "https://google.com/?source=search_app"],
    ["YouTube", "../../defaultapps/youtube/128.png", "link", "https://youtube.com"]
]

function refreshapps() {
    const appsContent = document.getElementById("apps-content");

    appsContent.innerHTML = '';

    appslist.forEach((app, index) => {
        const appDiv = document.createElement("div");
        appDiv.id = "app";

        const appIcon = document.createElement("img");
        appIcon.id = "appicon";
        appIcon.src = app[1];
        appIcon.alt = app[0];

        const appText = document.createElement("p");
        appText.id = "apptext";
        appText.textContent = app[0];

        appDiv.appendChild(appIcon)
        appDiv.appendChild(appText);

        if (app[2] == "link") {
            appDiv.onclick = function() {
                window.electron.openLink(app[3]);
                window.electron.quitApp()
            }
        }
        appsContent.appendChild(appDiv);

    });
}

refreshapps();

// electron stuff

document.getElementById("hamburgermenu").onclick = function() {
    window.electron.showHamburgerMenu();
}

window.electron.onHamburgerMenuCommand((command) => {
    console.log(`Context menu command received: ${command}`);

    if (command === 'action1') {
        alert('Custom Action 1 triggered!');
    } else if (command === 'action2') {
        alert('Custom Action 2 triggered!');
    }
});
