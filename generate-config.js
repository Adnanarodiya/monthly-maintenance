const fs = require('fs');
const path = require('path');

const examplePath = path.join(__dirname, 'config.example.js');
const publicDir = path.join(__dirname, 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

const outputPath = path.join(publicDir, 'config.js');

if (!fs.existsSync(examplePath)) {
  console.error(`Error: ${examplePath} not found.`);
  process.exit(1);
}

let content = fs.readFileSync(examplePath, 'utf8');

// Get URLs from Environment Variables or fallback to placeholder
const sheetUrl = process.env.SHEET_URL || "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
const submitUrl = process.env.SUBMIT_URL || "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";

// Replace sheetUrl placeholder (first occurrence)
content = content.replace("YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL", sheetUrl);

// Replace submitUrl placeholder (second occurrence)
content = content.replace("YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL", submitUrl);

// Write config.js to public folder
fs.writeFileSync(outputPath, content, 'utf8');

// Copy static web assets to public folder
fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(publicDir, 'index.html'));
fs.copyFileSync(path.join(__dirname, 'app.js'), path.join(publicDir, 'app.js'));
fs.copyFileSync(path.join(__dirname, 'style.css'), path.join(publicDir, 'style.css'));
if (fs.existsSync(path.join(__dirname, 'logo.png'))) {
  fs.copyFileSync(path.join(__dirname, 'logo.png'), path.join(publicDir, 'logo.png'));
}
if (fs.existsSync(path.join(__dirname, 'manifest.json'))) {
  fs.copyFileSync(path.join(__dirname, 'manifest.json'), path.join(publicDir, 'manifest.json'));
}
if (fs.existsSync(path.join(__dirname, 'sw.js'))) {
  fs.copyFileSync(path.join(__dirname, 'sw.js'), path.join(publicDir, 'sw.js'));
}

console.log('Successfully generated config.js and copied assets to public/ for deployment.');

