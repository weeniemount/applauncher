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