document.getElementById('chooseappicon').addEventListener('click', async () => {
    const file = await window.electron.chooseAppIcon();
    console.log(file[0]);
    document.getElementById("appicon").src = `data:image/png;base64,${file[1]}`;
});