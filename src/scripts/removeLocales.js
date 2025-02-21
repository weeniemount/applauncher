// https://www.electron.build/configuration/configuration#afterpack

const fs = require('fs');

exports.default = async function(context) {
    const localeDir = context.appOutDir + '/locales/';

    fs.readdir(localeDir, function(err, files) {
        if (err) {
            console.error('Error reading locale directory:', err);
            return;
        }

        if (!(files && files.length)) return;

        for (let i = 0, len = files.length; i < len; i++) {
            const match = files[i].match(/en-US\.pak/);
            if (match === null) {
                fs.unlinkSync(localeDir + files[i]);
            }
        }
    });
};