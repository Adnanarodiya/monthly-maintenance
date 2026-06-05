// Configuration for Ihsanpark Society Maintenance Web App
window.APP_CONFIG = {
  // Live Google Sheet CSV export URL (Publish your sheet as CSV and paste here)
  sheetUrl: "https://script.google.com/macros/s/AKfycbynMZ-LyK6N_tAn0iGt2W59YW5QOEp0Qtnr4pSR2melWMwgZkNrMowrNTK7v-pS7YaQaA/exec",

  // Live Google Apps Script submission URL for adding/editing/deleting members
  submitUrl: "https://script.google.com/macros/s/AKfycbynMZ-LyK6N_tAn0iGt2W59YW5QOEp0Qtnr4pSR2melWMwgZkNrMowrNTK7v-pS7YaQaA/exec",

  // Fallback data if Google Sheet is unreachable or before setup is completed
  fallbackData: [
    {
      index: 1,
      bungalow: "A-1/A",
      status: "Remaining",
      method: "None",
      bankMoney: 0,
      ownerName: "દુકાન ઈરફાન ભાઇ 300",
      monthsDesc: "ઓગસ્ટ2023થી બાકી *5+12+12+6",
      rate: 300,
      remainingMonths: 35,
      totalRemaining: 10500
    },
    {
      index: 2,
      bungalow: "A-1/A",
      status: "Remaining",
      method: "None",
      bankMoney: 0,
      ownerName: "દુકાન-૩ ફારૂક ખાલીક ભાઈ 300",
      monthsDesc: "",
      rate: 300,
      remainingMonths: 1,
      totalRemaining: 300
    },
    {
      index: 3,
      bungalow: "A-13",
      status: "Remaining",
      method: "None",
      bankMoney: 0,
      ownerName: "શોપિંગ સેન્ટર સઅદ -7દુકાન+2 મકાન",
      monthsDesc: "ઓક્ટોબર 2025 થી બાકી 2 મકાન ના",
      rate: 300,
      remainingMonths: 1,
      totalRemaining: 300
    },
    {
      index: 4,
      bungalow: "A-1",
      status: "Remaining",
      method: "None",
      bankMoney: 0,
      ownerName: "ઈદ્રીસભાઈ કરીમભાઇ મેમણ",
      monthsDesc: "એપ્રિલ 2025 થી  બાકી *9+6",
      rate: 700,
      remainingMonths: 15,
      totalRemaining: 10500
    },
    {
      index: 5,
      bungalow: "A-2",
      status: "Remaining",
      method: "None",
      bankMoney: 0,
      ownerName: "રઇસઅહમદ રાયન",
      monthsDesc: "-",
      rate: 700,
      remainingMonths: 1,
      totalRemaining: 700
    },
    {
      index: 6,
      bungalow: "A-3",
      status: "PAID",
      method: "None",
      bankMoney: 0,
      ownerName: "ઈરશાદભાઈ નૌશાદભાઈ શૈખ",
      monthsDesc: "મે 2026 સુધી એન્ડવાસ",
      rate: 700,
      remainingMonths: 0,
      totalRemaining: 0
    },
  ]
};
