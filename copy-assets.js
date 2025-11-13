const fs = require('fs-extra');
const path = require('path');

// Ensure the css directory exists
fs.ensureDirSync(path.join(__dirname, 'css'));

// Copy the built CSS file if it exists
const cssSource = path.join(__dirname, 'src', 'input.css');
const cssDest = path.join(__dirname, 'css', 'style.css');

if (fs.existsSync(cssSource) && !fs.existsSync(cssDest)) {
    fs.copyFileSync(cssSource, cssDest);
}

console.log('Assets copied successfully!');
