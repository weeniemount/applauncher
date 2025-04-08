let closeonapp = true
let amountofpages = 1
let selectedpage = 1
let searching = false

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function applyconfig() {
    var config = await window.electron.getConfig()

    darkmode(config.darkmode)
    closeonapp = config.closeonapp

    refreshapps(config)
    resizePageIndicators();
}

async function titlebar() {
    let winconfig = await window.electron.getConfig()
    if (winconfig["chromeostitlebar"] === true) {
        document.getElementById("titlebar").style.display = "flex"
        document.getElementById("applauncherbody").style.marginTop = "36px"
        document.getElementById("appinfo").style.marginTop = "36px"

        document.getElementById("applauncherbody").style.borderLeft = "#373837 1px solid"
        document.getElementById("applauncherbody").style.borderRight = "#373837 1px solid"
        document.getElementById("applauncherbody").style.borderBottom = "#373837 1px solid"

        document.getElementById("searchicon").style.marginTop = "36px"
        document.getElementById("searchbarurl").style.marginTop = "36px"
        document.getElementById("hamburgermenu").style.marginTop = "36px"
    }
}

titlebar()

document.getElementById("close").onclick = function() {
    window.electron.windowAction("close")
}
document.getElementById("minimize").onclick = function() {
    window.electron.windowAction("minimize")
}
document.getElementById("maximize").onclick = function() {
    window.electron.windowAction("maximize")
}

function pageswap(page) {
    selectedpage = page
    for (let i = 1; i <= amountofpages; i++) {
        if (i == page) {
            document.getElementById(`page${i}`).style.display = "flex"
            document.getElementById(`pageindicator${i}`).classList = "pageindicator"
        } else {
            document.getElementById(`page${i}`).style.display = "none"
            document.getElementById(`pageindicator${i}`).classList = "pageindicator disabled"
        }
    }
}


async function refreshapps(config) {
    document.getElementById("pages").innerHTML = ""
    document.getElementById("pageindicatorbar").innerHTML = ""
    document.getElementById("pages").insertAdjacentHTML(`beforeend`, `<div class="page" id="page1"></div>`)
    let appsContent = document.getElementById("page1");
    amountofpages = 1
    selectedpage = 1

    if (config && config.apps && config.apps.length > 0) {
        let appsrollover = 0
        let page = 1
        if (config.showbrowserapp == true) {
            const appDiv = document.createElement("div");
            appDiv.id = "app";

            const appIcon = document.createElement("img");
            appIcon.id = "appicon";
            
            appIcon.alt = "browser";
            
            const appText = document.createElement("p");
            appText.id = "apptext";

            if (config.browserappiconam == "chrome") {
                appIcon.src = `../../defaultapps/browser/chrome_${config.appiconera}.png`;
                appText.textContent = "Chrome";
            } else if (config.browserappiconam == "firefox") {
                appIcon.src = `../../defaultapps/browser/firefox_${config.appiconera}.png`;
                appText.textContent = "Firefox";
            } else if (config.browserappiconam == "chromium") {
                appIcon.src = `../../defaultapps/browser/chromium_${config.appiconera}.png`;
                appText.textContent = "Chromium";
            }

            appDiv.appendChild(appIcon)
            appDiv.appendChild(appText);
            appDiv.onclick = function() {
                window.electron.openBrowser();
                if (config.closeonapp) {
                    setTimeout(() => {
                        window.electron.quitApp();
                    }, 100); // Delay to ensure the browser opens before quitting the app
                }
            }
            appsContent.appendChild(appDiv);
            appsrollover++
        }

        for (const app of config.apps) {
            const appDiv = document.createElement("div");
            appDiv.id = "app";

            const appIcon = document.createElement("img");
            appIcon.id = "appicon";
            if (app[1] == "builtinimage") {
                if (app[0] == "Web Store" || app[0] == "Gmail" || app[0] == "Google Search" || app[0] == "YouTube") {
                    if (config.appiconera == "2011") {
                        if (config.chromiumwebstoreicon && app[0] == "Web Store") {
                            appIcon.src = app[2].replace(".png", "_2011_chromium.png");
                        } else {
                            appIcon.src = app[2].replace(".png", "_2011.png");
                        }
                    } else if (config.appiconera == "2013") {
                        if (app[0] == "Web Store") {
                            if (config.chromiumwebstoreicon) {
                                appIcon.src = app[2].replace(".png", "_2013_chromium.png");
                            } else {
                                appIcon.src = app[2].replace(".png", "_2013.png");
                            }
                        } else {
                            appIcon.src = app[2];
                        }
                    } else if (config.appiconera == "2015") {
                        if (config.chromiumwebstoreicon && app[0] == "Web Store") {
                            appIcon.src = app[2].replace(".png", "_chromium.png");
                        } else {
                            appIcon.src = app[2];
                        }
                    }
                } else {
                    appIcon.src = app[2];
                }
            } else if (app[1] == "localimage") {
                var editedstring = app[2].replace(/\\/g, '/');
                const image = await window.electron.getImage(editedstring)

                if (image.includes("|SVG|")) {
                    appIcon.src = `data:image/svg+xml;base64,${image.replace("|SVG|", "")}`;
                }
                else {
                    appIcon.src = `data:image/png;base64,${image}`;
                }
            } else if (app[1] == "crxicon") {
                const image = await window.electron.getCrxImage(app[2], app[4])

                appIcon.src = `data:image/png;base64,${image}`;
            } else if (app[1] == "noicon") {
                appIcon.src = '../../defaultapps/noicon.png'
            }
            appIcon.alt = app[0];

            const appText = document.createElement("p");
            appText.id = "apptext";
            appText.textContent = app[0];

            appDiv.oncontextmenu = function(e) {
                e.preventDefault();
                window.electron.showAppContextMenu(app[0]);
            }

            appDiv.appendChild(appIcon)
            appDiv.appendChild(appText);

            if (app[3] == "link") {
                appDiv.onclick = function() {
                    window.electron.openLink(app[4]);
                    if (closeonapp) {
                        window.electron.quitApp()
                    }
                }

                if (app[5] == "true") {
                    const linkIcon = document.createElement("img");
                    linkIcon.id = "linkicon";
                    linkIcon.src = "images/link.png"
                    appDiv.appendChild(linkIcon)
                }

            } else if (app[3] == "program") {
                appDiv.onclick = function() {
                    window.electron.openProgram(app[4]);
                    if (closeonapp) {
                        window.electron.quitApp()
                    }
                }
            } else if (app[3] == "installedcrx") {
                appDiv.onclick = function() {
                    window.electron.openCrxApp(app[4]);
                    if (closeonapp) {
                        window.electron.closeLauncher()
                    }
                }
            }

            if (appsrollover >= 16) {
                page++
                amountofpages++
                document.getElementById("pages").insertAdjacentHTML(`beforeend`, `<div class="page" id="page${page}" style="display: none;"></div>`)
                if (page == 2) {document.getElementById("pageindicatorbar").insertAdjacentHTML("beforeend", `<div id="pageindicator1" onclick="pageswap(1)" class="pageindicator">`)}
                document.getElementById("pageindicatorbar").insertAdjacentHTML("beforeend", `<div id="pageindicator${page}" onclick="pageswap(${page})" class="pageindicator disabled">`)
                appsContent = document.getElementById(`page${page}`)
                appsContent.appendChild(appDiv);
                appsrollover = 1
            } else {
                appsContent.appendChild(appDiv);
                appsrollover++
            }
        };
    } else if (config.apps.length == 0) {
        const appsContent = document.getElementById("page1");
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

document.getElementById("searchbarurl").addEventListener("input", async () => {
	if (document.getElementById("searchbarurl").value.trim() === "") {
        document.getElementById(`page${selectedpage}`).style.display = "flex"
        document.getElementById("searchpage").style.display = "none"
        searching = false
    } else {
        document.getElementById(`page${selectedpage}`).style.display = "none"
        document.getElementById("searchpage").style.display = "flex"
        searching = true
        searchbar()
    }
});

async function searchbar() {
    const suggestionsContainer = document.getElementById("searchpage");
    const searchQuery = document.getElementById("searchbarurl").value.trim().toLowerCase();
    
    const googleSuggestions = await getSuggestions(searchQuery);
    const limitedSuggestions = googleSuggestions.slice(0, 4);
    suggestionsContainer.innerHTML = "";
    
    limitedSuggestions.forEach((suggestion) => {
        const suggestionElement = document.createElement("div");
        suggestionElement.className = "searchsugesstion";

        if (suggestion.startsWith("http://") || suggestion.startsWith("https://")) {
            suggestionElement.innerHTML = `
                <div onclick='window.electron.openLink("${suggestion}")' class="searchsugesstion">
                    <div class="page-icon"></div>
                    <div class="suggestionurl-text">${suggestion}</div>
                </div>`;
        } else {
            suggestionElement.innerHTML = `
                <div onclick='window.electron.openLink("https://google.com/search?q=${suggestion}")' class="searchsugesstion">
                    <div class="search-icon"></div>
                    <div>
                        <div class="suggestion-text">${suggestion}</div>
                        <div class="subtext">Google Search</div>
                    </div>
                </div>`;
        }

        suggestionsContainer.appendChild(suggestionElement);
    });

    const apps = await window.electron.getConfig();
    if (apps && apps.apps) {
        const filteredApps = apps.apps.filter(app => app[0].toLowerCase().includes(searchQuery));
        for (const app of filteredApps) {
            const appSuggestion = document.createElement("div");
            appSuggestion.className = "searchsugesstion";

            // Create app icon
            const appIcon = document.createElement("img");
            appIcon.className = "suggestion-icon"; // Apply styles for icons
            appIcon.alt = app[0];

            if (app[1] === "builtinimage") {
                appIcon.src = app[2];
                appIcon.style.width = "24px"
                appIcon.style.marginLeft = "16px"
                appIcon.style.objectFit = "fill"
            } else if (app[1] === "localimage") {
                const editedstring = app[2].replace(/\\/g, '/');
                const image = await window.electron.getImage(editedstring);
                if (image.includes("|SVG|")) {
                    appIcon.src = `data:image/svg+xml;base64,${image.replace("|SVG|", "")}`;
                }
                else {
                    appIcon.src = `data:image/png;base64,${image}`;
                }
                appIcon.style.width = "24px"
                appIcon.style.marginLeft = "16px"
                appIcon.style.objectFit = "fill"
            } else if (app[1] === "crxicon") {
                const image = await window.electron.getCrxImage(app[2], app[4]);
                appIcon.src = `data:image/png;base64,${image}`;
                appIcon.style.width = "24px"
                appIcon.style.marginLeft = "16px"
                appIcon.style.objectFit = "fill"
            } else if (app[1] === "noicon") {
                appIcon.src = '../../defaultapps/noicon.png';
                appIcon.style.width = "24px"
                appIcon.style.marginLeft = "16px"
                appIcon.style.objectFit = "fill"
            }
            // Click behavior
            appSuggestion.onclick = function () {
                if (app[3] === "link") {
                    window.electron.openLink(app[4]);
                } else if (app[3] === "program") {
                    window.electron.openProgram(app[4]);
                }
                if (closeonapp) {
                    window.electron.quitApp();
                }
            };

            // Set the app suggestion content
            appSuggestion.innerHTML = `
                <div class="searchsugesstion">
                    <div class="suggestion-text">${app[0]}</div>
                </div>`;

            // Append the icon before the text
            appSuggestion.prepend(appIcon);
            suggestionsContainer.appendChild(appSuggestion);
        }
    }
}


const getSuggestions = async (query) => {
	const endpoint = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;

	try {
		const response = await fetch(endpoint);
		if (!response.ok) {
			throw new Error("Failed to fetch suggestions");
		}

		const data = await response.json();
		// `data[1]` contains the list of suggestions
		return data[1];
	} catch (error) {
		console.error("Error fetching suggestions:", error);
		return [];
	}
};

window.addEventListener('wheel', (event) => {
    if (!searching) {
        const pageindicatorbar = document.getElementById('pageindicatorbar');
        const pageIndicators = pageindicatorbar.querySelectorAll('.pageindicator');
        if (event.deltaY < 0) {
            if (selectedpage > 1) {
                selectedpage--;
                const currentPage = document.getElementById(`page${selectedpage}`);
                const previousPage = document.getElementById(`page${selectedpage + 1}`);
                if (currentPage) currentPage.style.display = "flex";
                if (previousPage) previousPage.style.display = "none";
                pageIndicators.forEach(indicator => {
                    indicator.classList.add('disabled');
                });
                document.getElementById(`pageindicator${selectedpage }`).classList = "pageindicator"
            }
        } else if (event.deltaY > 0) {
            if (selectedpage < amountofpages) {
                selectedpage++;
                const currentPage = document.getElementById(`page${selectedpage}`);
                const nextPage = document.getElementById(`page${selectedpage - 1}`);
                if (currentPage) currentPage.style.display = "flex";
                if (nextPage) nextPage.style.display = "none";
                
                pageIndicators.forEach(indicator => {
                  indicator.classList.add('disabled');
                });
                document.getElementById(`pageindicator${selectedpage }`).classList = "pageindicator"
            }
        }
    }
});

function resizePageIndicators() {
    const pageIndicatorBar = document.getElementById('pageindicatorbar');
    const pageIndicators = document.querySelectorAll('.pageindicator');
    const pageCount = pageIndicators.length;

    if (pageCount >= 5) {
        let newWidth = 48;
        if (pageCount > 4) {
            newWidth -= (pageCount - 5) * 8;
        }

        pageIndicators.forEach(indicator => {
            indicator.style.width = `${newWidth}px`;
        });
    }
}

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
    } else if (command === 'help') {
        window.electron.openLink("https://support.google.com/chrome_webstore/?p=cws_app_launcher")
    } else if (command === 'choosecrx') {
        window.electron.installCrx()
    }
});

window.electron.onAppContextMenuCommand(async (command, appname) => {
    console.log(`Context menu command received: ${command}`);

    let appinfoicon = document.getElementById("appinfoicon")

    if (command === 'appinfo') {
        let config = await window.electron.getConfig()
        for (const app of config.apps) {
            if (app[0] == appname) {
                if (app[1] === "builtinimage") {
                    appinfoicon.src = app[2];
                    appinfoicon.style.objectFit = "fill"
                } else if (app[1] === "localimage") {
                    const editedstring = app[2].replace(/\\/g, '/');
                    const image = await window.electron.getImage(editedstring);
                    if (image.includes("|SVG|")) {
                        appinfoicon.src = `data:image/svg+xml;base64,${image.replace("|SVG|", "")}`;
                    }
                    else {
                        appinfoicon.src = `data:image/png;base64,${image}`;
                    }
                    appIcon.style.objectFit = "fill"
                } else if (app[1] === "crxicon") {
                    const image = await window.electron.getCrxImage(app[2], app[4]);
                    appinfoicon.src = `data:image/png;base64,${image}`;
                    appIcon.style.objectFit = "fill"
                } else if (app[1] === "noicon") {
                    appinfoicon.src = '../../defaultapps/noicon.png';
                    appIcon.style.objectFit = "fill"
                }
            }
            console.error(`App ${appname} not found in config`);
        }
        document.getElementById("appinfo").style.display = "block"
        document.getElementById("appinfotext").innerHTML = appname
        document.getElementById("applauncherbody").style.display = "none"
    }
});

window.electron.onMessage('launcher-refreshconfig', (event) => {
    applyconfig()
});