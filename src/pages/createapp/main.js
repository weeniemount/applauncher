var iconfilepath
var apptype = "link"
var apppath

async function chooseappicon() {
    console.log("askjfhajksdfh")
    const file = await window.electron.chooseAppIcon();
    console.log(file[0]);
    document.getElementById("appicon").src = `data:image/png;base64,${file[1]}`;
    iconfilepath = file[0]
};

async function chooseapp() {
    const file = await window.electron.chooseProgram();
    console.log(file);
    apppath = file
};

function selectProgram() {
    document.getElementById("applink").style.display = "none";
    document.getElementById("chooseapp").style.display = "block";
    apptype = "program";
};

function selectLink() {
    console.log("nhdifhgjdfgfvdf")
    document.getElementById("applink").style.display = "block";
    document.getElementById("chooseapp").style.display = "none";
    apptype = "link"
};

document.getElementById('makebutton').addEventListener('click', async function() {
    console.log('hrello')
    var config = await window.electron.getConfig();
    var appname = document.getElementById("appname").value

    var newapp = [appname, "localimage", iconfilepath[0], apptype]
    if (apptype == "program") {
        newapp.push(apppath[0])
    } else if (apptype == "link") {
        newapp.push(document.getElementById("applink").value)
    }
    console.log(newapp)
    config.apps.push(newapp)

    console.log(config)
    window.electron.updateConfig(config)
    window.electron.refreshAppsList()
    window.electron.closeCreateAnApp();
});

document.getElementById('cancelbutton').addEventListener('click', function()  {
    window.electron.closeCreateAnApp();
})