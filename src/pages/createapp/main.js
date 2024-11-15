const { app } = require("electron");

var iconfilepath
var apptype
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

async function makeapp() {
    console.log('hrello')
    var config = await window.electron.getConfig();
    var appname = document.getElementById("appname").value

    var newapp = [appname, "localimage", iconfilepath, apptype]
    if (apptype == "program") {
        newapp.push(apppath)
    } else if (apptype == "link") {
        newapp.push(document.getElementById("applink").value)
    }
    console.log(newapp)
    config.apps.push(newapp)
    window.electron.updateConfig(config)
}