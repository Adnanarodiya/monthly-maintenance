const fs = require('fs');
const path = require('path');

const examplePath = path.join(__dirname, 'config.example.js');
const publicDir = path.join(__dirname, 'public');
const rootConfigPath = path.join(__dirname, 'config.js');
const publicConfigPath = path.join(publicDir, 'config.js');

if (!fs.existsSync(examplePath)) {
  console.error(`Error: ${examplePath} not found.`);
  process.exit(1);
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

const sheetUrl = (process.env.SHEET_URL || '').trim();
const submitUrl = (process.env.SUBMIT_URL || '').trim();
const placeholder = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';

let content = fs.readFileSync(examplePath, 'utf8');

const resolvedSheetUrl = sheetUrl || placeholder;
const resolvedSubmitUrl = submitUrl || sheetUrl || placeholder;

content = content.replace(placeholder, resolvedSheetUrl);
content = content.replace(placeholder, resolvedSubmitUrl);

fs.writeFileSync(publicConfigPath, content, 'utf8');

// Keep local config.js in sync when env vars are provided (e.g. local build)
if (sheetUrl) {
  fs.writeFileSync(rootConfigPath, content, 'utf8');
  console.log('Generated config.js for local + public/ from environment variables.');
} else if (!fs.existsSync(rootConfigPath)) {
  console.warn('Warning: config.js not found locally. Copy config.example.js to config.js and add your Apps Script URL.');
} else {
  console.log('Generated public/config.js for deployment. Local config.js left unchanged.');
}

if (resolvedSheetUrl.includes(placeholder) || resolvedSubmitUrl.includes(placeholder)) {
  console.warn('WARNING: Google Sheet URL is not configured.');
  console.warn('Set SHEET_URL and SUBMIT_URL in Vercel Environment Variables, then redeploy.');
}

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

console.log('Build assets copied to public/.');
