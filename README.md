# Ihsanpark Society Maintenance Dashboard

A modern, responsive, and lightweight Single Page Application (SPA) dashboard designed to manage and track monthly society maintenance payments. It syncs in real-time with a Google Sheets spreadsheet via a custom Google Apps Script Web App API backend.

---

## 🚀 Key Features

- **📊 Dynamic KPI Metrics Dashboard**:
  - **Total Outstanding**: Real-time summary of unpaid dues formatted in Indian Rupees (₹).
  - **Collection Progress**: A beautiful progress bar showing the percentage of completed collections.
  - **Status Ratios**: Clear indicators comparing the count of `Paid` vs. `Remaining` bungalows.

- **🏠 Bungalow Ledger Management**:
  - List view of all bungalow records displaying: Bungalow Number, Status (`PAID` or `Remaining`), Owner Name, Month Details/Remarks, Monthly Rate, Remaining Months, Bank Money, and Payment Method.
  - Client-side real-time fuzzy search by bungalow number, owner name, or remarks.

- **⚡ Instant Operations**:
  - **Quick Pay**: Mark any dues as paid instantly with a single click (supports cash or UPI/GPay).
  - **Add, Edit & Delete**: Full CRUD capabilities directly from the web interface, synced back to the sheet.
  - **WhatsApp Reminder Engine**: Instantly pre-fills formatted, polite Gujarati/English invoices or payment reminders and opens WhatsApp Web/App for direct communication.

- **☁️ Real-time Google Sheets Sync**:
  - Direct communication with Google Sheets using HTTP fetch.
  - Resilient offline fallback: If the Google Sheet is unreachable or internet connectivity drops, the app switches to local storage/config fallback data and displays a warning status.

---

## 🛠️ Technology Stack

- **Frontend**: 
  - **HTML5**: Semantic structures and accessible modals.
  - **Vanilla CSS3**: Beautiful modern UI featuring custom variables, CSS Grid, Flexbox, smooth transitions, custom animations, and complete mobile responsiveness.
  - **Tabler Icons**: Clean, developer-friendly icon pack.
  - **Vanilla JavaScript**: State-driven UI, async fetch handlers, and local search logic.
- **Backend API**:
  - **Google Apps Script**: Lightweight middleware receiving `GET` requests (fetching rows) and `POST` requests (for Add/Edit/Delete actions).
- **Database**:
  - **Google Sheets**: Serves as the actual data store, allowing easy manual edits from spreadsheets.

---

## 📂 Project Structure

```bash
├── index.html        # Main app shell, KPI containers, and modals
├── app.js            # Frontend logic (State, UI rendering, WhatsApp engine, Sync API)
├── config.example.js # Template for credentials & fallback data
├── config.js         # Active configuration (gitignored to protect secrets)
├── style.css         # Styling system (Layouts, themes, animations, responsiveness)
├── AppScript.js      # Backend script for Google Apps Script deployment
├── *.csv             # CSV backups and template spreadsheets
└── .gitignore        # Standard Git exclusions including config.js
```

---

## 🔧 Google Sheets & Backend Setup

To link this dashboard with a live Google Spreadsheet:

1. **Prepare your Google Sheet**:
   - Create a spreadsheet with headers in **Row 3** (Data starts at **Row 4**):
     - Column A: `NO:-` (Serial number)
     - Column B: `BOUNGLOW`
     - Column C: `Status` (PAID / Remaining)
     - Column D: `Method` (None / Cash / UPI)
     - Column E: `Bank Money` (₹ received)
     - Column F: `OWNER NAME`
     - Column G: `MONTH'S` (Remarks / details)
     - Column H: `RATE` (Monthly rate, e.g., 700)
     - Column I: `REMAINING MONTHS`
     - Column J: `TOTAL REMAINING` (Calculated automatically as Rate × Months)
     - Column K: `Phone Number`
     - Column L: `Last Bill Number`
     - Column M: `Payment Date`
     - Column N: `Coverage Start`
     - Column O: `Coverage End`
     - Column P: `Additional Pending Amount` (optional legacy/past due amount)
     - Column Q: `Additional Pending Note` (optional note shown in WhatsApp when Column P is greater than 0)

2. **Deploy the Apps Script**:
   - In Google Sheets, click **Extensions** > **Apps Script**.
   - Copy the entire content of [AppScript.js](AppScript.js) and paste it into the script editor.
   - Save the project.
   - Click **Deploy** > **New deployment**.
   - Select **Web app** as the deployment type.
   - Configure:
     - **Execute as**: `Me`
     - **Who has access**: `Anyone`
   - Click **Deploy** and authorize permissions.
   - Copy the generated **Web App URL**.

3. **Configure the Web App**:
   - Copy `config.example.js` to create your local `config.js` file:
     ```bash
     cp config.example.js config.js
     ```
   - Open your newly created `config.js` file.
   - Paste the Web App URL into both `sheetUrl` and `submitUrl`:
     ```javascript
     window.APP_CONFIG = {
       sheetUrl: "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL",
       submitUrl: "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL",
       fallbackData: [ ... ]
     };
     ```
   - *Note: `config.js` is added to `.gitignore` so your private API URLs remain secure and will not be pushed to GitHub.*

---

## 💻 Local Development

1. Setup your local config file:
   ```bash
   cp config.example.js config.js
   ```
2. Serve the files locally using any simple HTTP server:
   ```bash
   npx http-server -p 8083
   ```
3. Open `http://localhost:8083` in your browser.
4. If syncing with Google Sheets fails, the app automatically switches to the `fallbackData` configured in `config.js` and updates the sync indicator to `Offline Mode`.

---

## ⚡ Deployment to Vercel

You can deploy this application to Vercel in seconds with automated CI/CD and secure credential management:

### 1. Push to GitHub
Make sure you have committed and pushed your latest changes to GitHub (with `config.js` ignored).

### 2. Deploy on Vercel Dashboard
1. Go to the [Vercel Dashboard](https://vercel.com) and log in.
2. Click **Add New** > **Project**.
3. Import your `monthly-maintenance` repository from GitHub.
4. In the **Build & Development Settings**, Vercel will automatically detect `package.json` and set the build command to `npm run build` (which runs `generate-config.js`).
5. Expand the **Environment Variables** section and add:
   - **`SHEET_URL`**: Set your Google Apps Script URL.
   - **`SUBMIT_URL`**: Set your Google Apps Script URL.
6. Click **Deploy**.

Vercel will dynamically generate `config.js` with your private URLs during build time. The secret credentials are kept secure in Vercel's environment variables and never exposed to the public GitHub repository!

