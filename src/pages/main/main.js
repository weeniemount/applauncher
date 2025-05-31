let closeonapp = true
let amountofpages = 1
let selectedpage = 1
let searching = false
let draggedAppName = null;

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
    if (winconfig["chromeostitlebar"] === true && winconfig["titlebar"] === true) {
        document.getElementById("chrome-titlebar").style.display = "flex"
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
    window.electron.windowAction("close", "launcher")
}
document.getElementById("minimize").onclick = function() {
    window.electron.windowAction("minimize", "launcher")
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
            // Browser app is not draggable, no drag events added
            
            // Set browser app name based on the selected browser
            let browserName = "Chrome";
            if (config.browserappiconam == "firefox") {
                browserName = "Firefox";
            } else if (config.browserappiconam == "chromium") {
                browserName = "Chromium";
            } else if (config.browserappiconam == "ie") {
                browserName = "Internet Explorer";
            } else if (config.browserappiconam == "edge") {
                browserName = "Microsoft Edge";
            } else if (config.browserappiconam == "opera") {
                browserName = "Opera";
            } else if (config.browserappiconam == "operagx") {
                browserName = "Opera GX";
            } else if (config.browserappiconam == "brave") {
                browserName = "Brave";
            } else if (config.browserappiconam == "vivaldi") {
                browserName = "Vivaldi";
            } else if (config.browserappiconam == "safari") {
                browserName = "Safari";
            }
            appDiv.dataset.appName = browserName;

            const appIcon = document.createElement("img");
            appIcon.id = "appicon";
            appIcon.alt = "browser";
            
            const appText = document.createElement("p");
            appText.id = "apptext";
            appText.textContent = browserName;

            if (config.browserappiconam == "chrome") {
                appIcon.src = `../../defaultapps/browser/chrome_${config.browsericonera}.svg`;
            } else if (config.browserappiconam == "firefox") {
                if (config.browsericonera != "2011") {
                    appIcon.src = `../../defaultapps/browser/firefox_${config.browsericonera}.svg`;
                } else {
                    appIcon.src = `../../defaultapps/browser/firefox_2011.png`;
                }
            } else if (config.browserappiconam == "chromium") {
                appIcon.src = `../../defaultapps/browser/chromium_${config.browsericonera}.svg`;
            } else if (config.browserappiconam == "ie") {
                appIcon.src = `../../defaultapps/browser/ie_${config.browsericonera}.svg`;
            } else if (config.browserappiconam == "edge") {
                appIcon.src = `../../defaultapps/browser/edge_${config.browsericonera}.svg`;
            } else if (config.browserappiconam == "opera") {
                appIcon.src = `../../defaultapps/browser/opera_${config.browsericonera}.svg`;
            } else if (config.browserappiconam == "operagx") {
                appIcon.src = `../../defaultapps/browser/operagx.svg`;
            } else if (config.browserappiconam == "brave") {
                appIcon.src = `../../defaultapps/browser/brave.svg`;
            } else if (config.browserappiconam == "vivaldi") {
                if (config.browsericonera != "2015") {
                    appIcon.src = `../../defaultapps/browser/vivaldi_${config.browsericonera}.webp`;
                } else {
                    appIcon.src = `../../defaultapps/browser/vivaldi_${config.browsericonera}.svg`;
                }
            }

            appDiv.appendChild(appIcon)
            appDiv.appendChild(appText);
            appDiv.onclick = function() {
                window.electron.openBrowser();
                if (config.closeonapp) {
                    setTimeout(() => {
                        window.electron.quitApp();
                    }, 100);
                }
            }
            appsContent.appendChild(appDiv);
            appsrollover++
        }

        for (const app of config.apps) {
            const appDiv = document.createElement("div");
            appDiv.id = "app";
            appDiv.draggable = true;
            appDiv.addEventListener('dragstart', handleDragStart);
            appDiv.addEventListener('dragend', handleDragEnd);
            appDiv.addEventListener('dragover', handleDragOver);
            appDiv.addEventListener('dragleave', handleDragLeave);
            appDiv.addEventListener('drop', handleDrop);
            appDiv.dataset.appName = app[0];

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
            } else if (app[3] == "dino") {
                appDiv.onclick = function() {
                    window.electron.dino();
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
                else if (app[3] === "installedcrx") {
                    window.electron.openCrxApp(app[4]);
                }
                else if (app[3] === "dino") {
                    window.electron.dino();
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
        let appFound = false;
        
        for (const app of config.apps) {
            if (app[0] == appname) {
                appFound = true;
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
                    appinfoicon.style.objectFit = "fill"
                } else if (app[1] === "crxicon") {
                    const image = await window.electron.getCrxImage(app[2], app[4]);
                    appinfoicon.src = `data:image/png;base64,${image}`;
                    appinfoicon.style.objectFit = "fill"
                } else if (app[1] === "noicon") {
                    appinfoicon.src = '../../defaultapps/noicon.png';
                    appinfoicon.style.objectFit = "fill"
                }
                break;
            }
        }
        
        if (!appFound) {
            console.error(`App ${appname} not found in config`);
            return;
        }
        
        document.getElementById("appinfo").style.display = "block"
        document.getElementById("appinfotext").innerHTML = appname
        document.getElementById("applauncherbody").style.display = "none"
    } else if (command === 'uninstall') {
        window.electron.uninstallApp(appname);
    } else if (command === 'shortcuts') {
        console.log('Create shortcut clicked from context menu for:', appname);
        window.electron.createShortcut(appname);
    }
});

// Add click handler for the create shortcut button in app info
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('createshortcut').onclick = function() {
        const appname = document.getElementById("appinfotext").innerHTML;
        console.log('Create shortcut clicked for:', appname);
        window.electron.createShortcut(appname);
    };

    // Add click handler for the remove button in app info
    document.getElementById('removeapp').onclick = function() {
        const appname = document.getElementById("appinfotext").innerHTML;
        window.electron.uninstallApp(appname);
        document.getElementById("appinfo").style.display = "none";
        document.getElementById("applauncherbody").style.display = "block";
    };

    // Handle shortcut creation success
    window.electron.onShortcutCreationSuccess((message) => {
        console.log('Shortcut creation success:', message);
        // You could show a notification or update UI here
        alert(message);
    });

    // Handle shortcut creation error
    window.electron.onShortcutCreationError((message) => {
        console.error('Shortcut creation error:', message);
        // You could show an error notification or update UI here
        alert('Error: ' + message);
    });
});

window.electron.onMessage('launcher-refreshconfig', (event) => {
    applyconfig()
});

function handleDragStart(e) {
    this.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.appName);
    draggedAppName = this.dataset.appName;
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    // Remove pushing-right class from all apps
    document.querySelectorAll('#app').forEach(app => {
        app.classList.remove('pushing-right');
    });
    draggedAppName = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (this.dataset.appName !== draggedAppName) {
        // Get all apps in the current page
        const currentPage = this.closest('.page');
        const apps = Array.from(currentPage.querySelectorAll('#app'));
        const draggedIndex = apps.findIndex(app => app.dataset.appName === draggedAppName);
        const targetIndex = apps.findIndex(app => app === this);
        
        // Only push apps that are after the target in the list
        apps.forEach((app, index) => {
            if (index > targetIndex && app.dataset.appName !== draggedAppName) {
                app.classList.add('pushing-right');
            } else {
                app.classList.remove('pushing-right');
            }
        });
    }
    return false;
}

function handleDragLeave(e) {
    // We'll handle cleanup in dragEnd
}

async function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    const draggedName = e.dataTransfer.getData('text/plain');
    const targetName = this.dataset.appName;
    
    if (draggedName && draggedName !== targetName) {
        try {
            console.log('Getting config...');
            const config = await window.electron.getConfig();
            console.log('Current config:', config);
            
            const apps = config.apps;
            console.log('Dragged app name:', draggedName);
            console.log('Target app name:', targetName);
            
            // Handle browser app specially
            let draggedIndex = -1;
            let targetIndex = -1;
            
            if (draggedName === "Chrome" || draggedName === "Firefox" || draggedName === "Chromium") {
                draggedIndex = -1; // Browser app is not in the apps array
            } else {
                draggedIndex = apps.findIndex(app => app[0] === draggedName);
            }
            
            if (targetName === "Chrome" || targetName === "Firefox" || targetName === "Chromium") {
                targetIndex = 0; // Insert at the beginning for browser app
            } else {
                targetIndex = apps.findIndex(app => app[0] === targetName);
            }
            
            console.log('Dragged index:', draggedIndex, 'Target index:', targetIndex);
            
            if (draggedIndex !== -1 || targetIndex !== -1) {
                // Reorder the apps array
                if (draggedIndex !== -1) {
                    const [movedApp] = apps.splice(draggedIndex, 1);
                    apps.splice(targetIndex, 0, movedApp);
                }
                
                console.log('Updated apps array:', apps);
                
                // Update the config
                console.log('Updating config...');
                await window.electron.updateConfig({...config, apps: apps});
                
                // Refresh the display
                console.log('Refreshing display...');
                await applyconfig();
            }
        } catch (error) {
            console.error('Error during drag and drop:', error);
        }
    }
    return false;
}



/* shhhh */


const konamiCode = [
    "ArrowUp", "ArrowUp",
    "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight",
    "ArrowLeft", "ArrowRight",
    "b", "a"
];
let konamiIndex = 0;

window.addEventListener("keydown", async function(e) {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            let config = await window.electron.getConfig();

            // Check if "Dino" app already exists
            const hasDino = config.apps.some(app => app[0] === "Dino");
            if (!hasDino) {
                config.apps.push(["Dino", "builtinimage", "../../defaultapps/dino.png", "dino"]);
                await window.electron.updateConfig(config);
                refreshapps(config);
            }

            // Konami code complete!
            window.electron.dino();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});