const fs = require('fs');
const path = require('path');

const examplePath = path.join(__dirname, 'config.example.js');
const outputPath = path.join(__dirname, 'config.js');

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

fs.writeFileSync(outputPath, content, 'utf8');
console.log('Successfully generated config.js for deployment.');
