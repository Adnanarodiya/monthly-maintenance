/**
 * Google Apps Script for IHSANPARK SOCIETY MAINTENANCE
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Delete any code in the editor and paste this code.
 * 4. Save and click "Deploy" > "New deployment".
 * 5. Select type "Web app".
 * 6. Set Description: "Maintenance API"
 * 7. Set Execute as: "Me"
 * 8. Set Who has access: "Anyone"
 * 9. Click Deploy, authorize permissions, and copy the Web App URL.
 * 10. Paste the copied URL into your config.js as "submitUrl" and "sheetUrl" (if using Apps Script for fetching).
 */

const SHEET_NAME = "Sheet1"; // Change if your sheet has a different name

// Helper to set CORS and JSON headers
function outputJSON(object) {
  return ContentService.createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET Request: Fetches all maintenance records
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return outputJSON({ status: "error", message: "Sheet not found: " + SHEET_NAME });
    }
    
    const data = sheet.getDataRange().getValues();
    const rows = [];
    
    // Assuming row 1: Month title
    // Row 2: Chart Main Header
    // Row 3: Headers (NO:-, BOUNGLOW, Remaining, Method, Bank Money, OWNER NAME, MONTH'S, RATE, REMAINING MONTHS, TOTAL REMAINING)
    // Row 4 (index 3) is where data starts.
    const startRow = 3; 
    
    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (!row[1]) continue; // Skip if bungalow name is empty
      
      rows.push({
        index: row[0] !== "" ? row[0] : "*", // Keep serial number
        bungalow: row[1],
        status: row[2] || "Remaining",
        method: row[3] || "None",
        bankMoney: Number(row[4]) || 0,
        ownerName: row[5] || "",
        monthsDesc: row[6] || "",
        rate: Number(row[7]) || 0,
        remainingMonths: Number(row[8]) || 0,
        totalRemaining: Number(row[9]) || 0,
        phone: row[10] || ""
      });
    }
    
    return outputJSON(rows);
  } catch (error) {
    return outputJSON({ status: "error", message: error.toString() });
  }
}

// POST Request: Performs Add, Edit, Delete actions
function doPost(e) {
  try {
    const jsonString = e.postData.contents;
    const payload = JSON.parse(jsonString);
    const action = payload.action;
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return outputJSON({ status: "error", message: "Sheet not found: " + SHEET_NAME });
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const startRow = 3; // 0-indexed index 3 is Row 4
    
    if (action === "add") {
      // Find the next numeric index
      let maxIndex = 0;
      for (let i = startRow; i < values.length; i++) {
        const idxVal = parseInt(values[i][0]);
        if (!isNaN(idxVal) && idxVal > maxIndex) {
          maxIndex = idxVal;
        }
      }
      const nextIndex = maxIndex + 1;
      
      const bungalow = payload.bungalow || "";
      const status = payload.status || "Remaining";
      const method = payload.method || "None";
      const bankMoney = Number(payload.bankMoney) || 0;
      const ownerName = payload.ownerName || "";
      const monthsDesc = payload.monthsDesc || "";
      const rate = Number(payload.rate) || 0;
      const remainingMonths = Number(payload.remainingMonths) || 0;
      const totalRemaining = rate * remainingMonths;
      const phone = payload.phone || "";
      
      const newRow = [
        nextIndex,         // Column A: NO:-
        bungalow,          // Column B: BOUNGLOW
        status,            // Column C: Status
        method,            // Column D: Method
        bankMoney,         // Column E: Bank Money
        ownerName,         // Column F: OWNER NAME
        monthsDesc,        // Column G: MONTH'S
        rate,              // Column H: Rate
        remainingMonths,   // Column I: Remaining Months
        totalRemaining,    // Column J: Total Remaining
        phone              // Column K: Phone Number
      ];
      
      sheet.appendRow(newRow);
      
      return outputJSON({ status: "success", index: nextIndex });
      
    } else if (action === "edit") {
      const indexToEdit = payload.index;
      let foundRowIndex = -1;
      
      for (let i = startRow; i < values.length; i++) {
        // Match either number or exact string
        if (values[i][0].toString().trim() === indexToEdit.toString().trim()) {
          foundRowIndex = i + 1; // Apps Script sheet rows are 1-indexed
          break;
        }
      }
      
      if (foundRowIndex === -1) {
        return outputJSON({ status: "error", message: "Record with index " + indexToEdit + " not found." });
      }
      
      // Update spreadsheet cells based on payload parameters
      if (payload.bungalow !== undefined) sheet.getRange(foundRowIndex, 2).setValue(payload.bungalow);
      if (payload.status !== undefined) sheet.getRange(foundRowIndex, 3).setValue(payload.status);
      if (payload.method !== undefined) sheet.getRange(foundRowIndex, 4).setValue(payload.method);
      if (payload.bankMoney !== undefined) sheet.getRange(foundRowIndex, 5).setValue(Number(payload.bankMoney));
      if (payload.ownerName !== undefined) sheet.getRange(foundRowIndex, 6).setValue(payload.ownerName);
      if (payload.monthsDesc !== undefined) sheet.getRange(foundRowIndex, 7).setValue(payload.monthsDesc);
      if (payload.rate !== undefined) sheet.getRange(foundRowIndex, 8).setValue(Number(payload.rate));
      if (payload.remainingMonths !== undefined) sheet.getRange(foundRowIndex, 9).setValue(Number(payload.remainingMonths));
      if (payload.phone !== undefined) sheet.getRange(foundRowIndex, 11).setValue(payload.phone);
      
      // Re-calculate Total Remaining: Rate * Remaining Months
      const currentRate = payload.rate !== undefined ? Number(payload.rate) : Number(values[foundRowIndex - 1][7]);
      const currentMonths = payload.remainingMonths !== undefined ? Number(payload.remainingMonths) : Number(values[foundRowIndex - 1][8]);
      sheet.getRange(foundRowIndex, 10).setValue(currentRate * currentMonths);
      
      return outputJSON({ status: "success", index: indexToEdit });
      
    } else if (action === "delete") {
      const indexToDelete = payload.index;
      let foundRowIndex = -1;
      
      for (let i = startRow; i < values.length; i++) {
        if (values[i][0].toString().trim() === indexToDelete.toString().trim()) {
          foundRowIndex = i + 1;
          break;
        }
      }
      
      if (foundRowIndex === -1) {
        return outputJSON({ status: "error", message: "Record with index " + indexToDelete + " not found." });
      }
      
      sheet.deleteRow(foundRowIndex);
      return outputJSON({ status: "success" });
      
    } else {
      return outputJSON({ status: "error", message: "Invalid action: " + action });
    }
  } catch (error) {
    return outputJSON({ status: "error", message: error.toString() });
  }
}
