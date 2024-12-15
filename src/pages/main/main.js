let closeonapp = true

async function applyconfig() {
    var config = await window.electron.getConfig()

    darkmode(config.darkmode)
    closeonapp = config.closeonapp

    refreshapps(config)
}

async function refreshapps(config) {
    const appsContent = document.getElementById("apps-content");

    appsContent.innerHTML = '';
    if (config && config.apps && config.apps.length > 0) {

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

document.getElementById("searchbarurl").addEventListener("input", async () => {
	if (document.getElementById("searchbarurl").value.trim() === "") {
        document.getElementById("apps-content").style.display = "flex"
        document.getElementById("searchpage").style.display = "none"
    } else {
        document.getElementById("apps-content").style.display = "none"
        document.getElementById("searchpage").style.display = "flex"
        searchbar()
    }
});

async function searchbar() {
    const suggestionsContainer = document.getElementById("searchpage");
    const suggestions = await getSuggestions(document.getElementById("searchbarurl").value.trim());
        document.getElementById("searchpage").innerHTML = ""
        suggestions.forEach((suggestion) => {
            const suggestionElement = document.createElement("div");
            suggestionElement.className = "searchsugesstion";
    
            if (suggestion.startsWith("http://") || suggestion.startsWith("https://")) {
                suggestionElement.innerHTML += (`
                    <div onclick='window.electron.openLink("${suggestion}")' class="searchsugesstion">
                        <div class="page-icon"></div>
                        <div class="suggestionurl-text">${suggestion}</div>
                    </div>`)
            } else {
                suggestionElement.innerHTML += (`
                    <div onclick='window.electron.openLink("https://google.com/search/?q=${suggestion}")' class="searchsugesstion">
                        <div class="search-icon"></div>
                        <div>
                            <div class="suggestion-text">${suggestion}</div>
                            <div class="subtext">Google Search</div>
                        </div>
                    </div>`)
            }
    
            suggestionsContainer.appendChild(suggestionElement);
        });
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