/**
 * Core Application Logic for Ihsanpark Society Maintenance Dashboard
 */

// State Management
let state = {
  members: [],
  filteredMembers: [],
  searchQuery: "",
  connectionStatus: "loading", // 'loading', 'online', 'offline'
  editIndex: null, // null = Add mode, otherwise contains target index/ID
  quickPayIndex: null // Track bungalow index currently in Quick Pay modal
};

// DOM References
const elements = {
  // Search
  searchInput: document.getElementById("search"),
  searchClear: document.getElementById("search-clear"),
  
  // Results & Counts
  resultsList: document.getElementById("results"),
  countBadge: document.getElementById("count"),
  syncStatusLabel: document.getElementById("sync-status-label"),
  toast: document.getElementById("toast"),
  
  // KPI Metrics
  statOutstanding: document.getElementById("stat-outstanding"),
  statEfficiency: document.getElementById("stat-efficiency"),
  efficiencyBar: document.getElementById("efficiency-bar"),
  statPaidCount: document.getElementById("stat-paid-count"),
  statRemainingCount: document.getElementById("stat-remaining-count"),
  
  // Modal Elements (Add/Edit)
  modalOverlay: document.getElementById("modal-overlay"),
  openModalBtn: document.getElementById("open-modal-btn"),
  closeModalBtn: document.getElementById("close-modal-btn"),
  cancelModalBtn: document.getElementById("cancel-modal-btn"),
  memberForm: document.getElementById("member-form"),
  submitBtn: document.getElementById("submit-btn"),
  submitSpinner: document.getElementById("submit-spinner"),
  
  // Modal Inputs & Calc Display
  bungalow: document.getElementById("bungalow"),
  status: document.getElementById("status"),
  ownerName: document.getElementById("owner-name"),
  phone: document.getElementById("phone"),
  lastBillNumber: document.getElementById("last-bill-number"),
  monthsDesc: document.getElementById("months-desc"),
  rate: document.getElementById("rate"),
  remainingMonths: document.getElementById("remaining-months"),
  method: document.getElementById("method"),
  calcTotalDisplay: document.getElementById("calc-total-remaining"),
  
  // Input Error Message fields
  bungalowError: document.getElementById("bungalow-error"),
  ownerNameError: document.getElementById("owner-name-error"),
  rateError: document.getElementById("rate-error"),
  remainingMonthsError: document.getElementById("remaining-months-error"),
  lastBillNumberError: document.getElementById("last-bill-number-error"),

  // Quick Pay Modal elements
  qpOverlay: document.getElementById("quickpay-overlay"),
  qpBungalowDisplay: document.getElementById("qp-bungalow-display"),
  qpAmountDisplay: document.getElementById("qp-amount-display"),
  qpMethod: document.getElementById("qp-method"),
  qpCancelBtn: document.getElementById("cancel-quickpay-btn"),
  qpCloseBtn: document.getElementById("close-quickpay-btn"),
  qpForm: document.getElementById("quickpay-form"),
  qpSubmitBtn: document.getElementById("submit-quickpay-btn"),
  qpSpinner: document.getElementById("quickpay-spinner"),

  // Tab Navigation Elements
  navBtnList: document.getElementById("nav-btn-list"),
  navBtnStats: document.getElementById("nav-btn-stats"),
  panelList: document.getElementById("panel-list"),
  panelStats: document.getElementById("panel-stats")
};

// Initial Setup
document.addEventListener("DOMContentLoaded", () => {
  initSecurityGate();
  registerServiceWorker();
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('PWA Service Worker registered successfully!', reg))
      .catch((err) => console.error('PWA Service Worker registration failed:', err));
  }
}

// Security Gate
function initSecurityGate() {
  const unlockedAt = localStorage.getItem("unlockedAt");
  let isUnlocked = false;
  
  if (unlockedAt) {
    const elapsed = Date.now() - Number(unlockedAt);
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (elapsed < twentyFourHours) {
      isUnlocked = true;
    } else {
      localStorage.removeItem("unlockedAt");
    }
  }

  const lockScreen = document.getElementById("lock-screen");
  const appShell = document.getElementById("app-shell");

  if (isUnlocked) {
    if (lockScreen) lockScreen.style.display = "none";
    if (appShell) appShell.style.display = "flex";
    fetchData();
    setupEventListeners();
  } else {
    if (lockScreen) lockScreen.style.display = "flex";
    if (appShell) appShell.style.display = "none";
    setupSecurityEventListeners();
  }
}

function setupSecurityEventListeners() {
  const digits = [
    document.getElementById("pin-1"),
    document.getElementById("pin-2"),
    document.getElementById("pin-3"),
    document.getElementById("pin-4")
  ];
  const lockForm = document.getElementById("lock-form");
  const lockContainer = document.getElementById("lock-container");
  const lockError = document.getElementById("lock-error");
  const lockScreen = document.getElementById("lock-screen");
  const appShell = document.getElementById("app-shell");

  // Focus the first field
  if (digits[0]) digits[0].focus();

  // Handle inputs typing and backspaces
  digits.forEach((input, index) => {
    if (!input) return;

    // input event for normal typing (mobile & desktop)
    input.addEventListener("input", (e) => {
      const value = e.target.value;
      if (value.length > 0) {
        // If we typed a digit, focus the next one
        if (index < 3) {
          digits[index + 1].focus();
        } else {
          // Auto-submit when the 4th digit is typed
          const pinValue = digits.map(input => input.value).join("");
          if (pinValue.length === 4) {
            lockForm.dispatchEvent(new Event("submit"));
          }
        }
      }
    });

    // keydown event specifically for Backspace
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        if (input.value === "" && index > 0) {
          // If current field is empty, go to previous field and clear it
          digits[index - 1].focus();
          digits[index - 1].value = "";
        } else {
          // Just clear current field
          input.value = "";
        }
      }
    });

    // paste event (e.g. if user pastes the PIN)
    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pastedData = (e.clipboardData || window.clipboardData).getData("text");
      const cleanedData = pastedData.replace(/[^0-9]/g, "").slice(0, 4);
      
      for (let i = 0; i < cleanedData.length; i++) {
        if (digits[i]) {
          digits[i].value = cleanedData[i];
        }
      }
      
      // Focus the last filled or next focusable
      const focusIndex = Math.min(cleanedData.length, 3);
      if (digits[focusIndex]) digits[focusIndex].focus();

      // Auto-submit if 4 digits were pasted
      const pinValue = digits.map(input => input.value).join("");
      if (pinValue.length === 4) {
        lockForm.dispatchEvent(new Event("submit"));
      }
    });
  });

  // Submit form validation
  if (lockForm) {
    lockForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const pinValue = digits.map(input => input.value).join("");
      
      if (pinValue === "7866") {
        // Correct pin - Remember for 24 hours
        localStorage.setItem("unlockedAt", Date.now().toString());
        
        // Premium fadeout animation
        lockScreen.style.transition = "opacity 0.35s ease, transform 0.35s ease";
        lockScreen.style.opacity = "0";
        lockScreen.style.transform = "scale(1.05)";
        
        setTimeout(() => {
          lockScreen.style.display = "none";
          appShell.style.display = "flex";
          
          // Load data and normal listeners
          fetchData();
          setupEventListeners();
        }, 350);
        
      } else {
        // Incorrect pin: shake container and show error
        lockError.textContent = "Incorrect PIN. Access Denied.";
        lockContainer.classList.add("shake");
        
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        
        setTimeout(() => {
          lockContainer.classList.remove("shake");
        }, 400);

        // Reset and refocus first input
        digits.forEach(input => {
          if (input) input.value = "";
        });
        if (digits[0]) digits[0].focus();
      }
    });
  }
}

// No theme helper functions needed (always light mode)

// Data Fetching
async function fetchData() {
  showLoading();

  const url = window.APP_CONFIG.sheetUrl;
  const submitUrl = window.APP_CONFIG.submitUrl;

  // Use submitUrl for fetching if sheetUrl is not configured but submitUrl is (since it acts as GET too)
  const readUrl = url || submitUrl;

  if (!readUrl) {
    console.warn("No Google Sheet read URL configured. Using offline fallback.");
    loadFallbackData();
    return;
  }

  try {
    const fetchUrl = `${readUrl}${readUrl.includes("?") ? "&" : "?"}t=${new Date().getTime()}`;
    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    let parsedData = [];

    if (contentType.includes("json") || readUrl.includes("exec")) {
      // Direct Apps Script JSON GET
      parsedData = await response.json();
      // If error payload returned from Apps Script
      if (parsedData.status === "error") {
        throw new Error(parsedData.message);
      }
    } else {
      // Standard published CSV export URL
      const csvText = await response.text();
      parsedData = parseCSV(csvText);
    }

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error("No society records returned.");
    }

    state.members = parsedData;
    state.connectionStatus = "online";
    elements.syncStatusLabel.innerHTML = `<i class="ti ti-cloud-check"></i> Connected`;
    elements.syncStatusLabel.style.color = "#10b981";
    
    applyFilters();
  } catch (error) {
    console.warn("Google Sheet Sync Failed. Using offline cached fallback.", error);
    loadFallbackData();
  }
}

function loadFallbackData() {
  state.members = window.APP_CONFIG.fallbackData.map(m => ({
    ...m,
    status: m.remainingMonths === 0 ? "PAID" : "Remaining"
  }));
  state.connectionStatus = "offline";
  elements.syncStatusLabel.innerHTML = `<i class="ti ti-cloud-off"></i> Offline Mode`;
  elements.syncStatusLabel.style.color = "#ef4444";
  showToast("⚠️ Operating in local offline mode");
  applyFilters();
}

// Parses Published Google Sheet CSV
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const records = [];
  const startLineIndex = 3; // Row 4 (assuming row 3 headers)

  for (let i = startLineIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCSVRow(line);
    
    // Validate rows: Needs Bungalow name in Column 1 (Col B)
    const bungalow = cols[1];
    if (!bungalow || bungalow.trim() === "" || bungalow.toLowerCase().includes("bungalow")) continue;

    const indexVal = cols[0] !== "" ? cols[0] : `M${i}`; // Generate index if missing
    const remainingMonths = Number(cols[8]) || 0;
    const status = remainingMonths === 0 ? "PAID" : "Remaining";
    const method = cols[3] || "None";
    const bankMoney = Number(cols[4]) || 0;
    const ownerName = cols[5] || "";
    const monthsDesc = cols[6] || "";
    const rate = Number(cols[7]) || 0;
    const totalRemaining = Number(cols[9]) || (rate * remainingMonths);
    const phone = cols[10] || "";
    const lastBillNumber = cols[11] || "";

    records.push({
      index: indexVal,
      bungalow: bungalow.trim(),
      status: status,
      method: method,
      bankMoney: bankMoney,
      ownerName: ownerName.trim(),
      monthsDesc: monthsDesc.trim(),
      rate: rate,
      remainingMonths: remainingMonths,
      totalRemaining: totalRemaining,
      phone: phone.trim(),
      lastBillNumber: lastBillNumber.trim()
    });
  }
  return records;
}

// CSV row parser respecting quoted text
function parseCSVRow(rowText) {
  const entries = [];
  let entry = "";
  let insideQuote = false;
  
  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    
    if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === ',' && !insideQuote) {
      entries.push(entry.trim());
      entry = "";
    } else {
      entry += char;
    }
  }
  entries.push(entry.trim());
  
  return entries.map(item => {
    if (item.startsWith('"') && item.endsWith('"')) {
      return item.substring(1, item.length - 1).replace(/""/g, '"');
    }
    return item;
  });
}

// Calculate and Update KPI summary metrics
function calculateMetrics() {
  const list = state.members;
  let totalOutstanding = 0;
  let paidCount = 0;
  let remainingCount = 0;

  list.forEach(m => {
    if (m.status === "PAID") {
      paidCount++;
    } else {
      remainingCount++;
      totalOutstanding += m.totalRemaining;
    }
  });

  const totalMembers = list.length;
  const efficiency = totalMembers > 0 ? Math.round((paidCount / totalMembers) * 100) : 0;

  // Render to DOM with animation/transitions
  elements.statOutstanding.textContent = `₹${totalOutstanding.toLocaleString("en-IN")}`;
  elements.statEfficiency.textContent = `${efficiency}%`;
  elements.efficiencyBar.style.width = `${efficiency}%`;
  elements.statPaidCount.textContent = `${paidCount} Paid`;
  elements.statRemainingCount.textContent = `${remainingCount} Remaining`;
}

// Filter Logic
function applyFilters() {
  const query = state.searchQuery.toLowerCase().trim();

  state.filteredMembers = state.members.filter(m => {
    // Search Query Match
    return !query || 
      m.bungalow.toLowerCase().includes(query) ||
      m.ownerName.toLowerCase().includes(query) ||
      (m.phone && String(m.phone).toLowerCase().includes(query)) ||
      (m.lastBillNumber && String(m.lastBillNumber).toLowerCase().includes(query)) ||
      m.monthsDesc.toLowerCase().includes(query);
  });

  renderMembers(state.filteredMembers);
  calculateMetrics();
}

// Render Listings
function renderMembers(list) {
  elements.countBadge.textContent = `${list.length} record${list.length !== 1 ? "s" : ""} listed`;

  if (list.length === 0) {
    elements.resultsList.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-mood-empty"></i>
        <h3>No matching records</h3>
        <p>Try refining your search queries or active filters.</p>
      </div>
    `;
    return;
  }

  elements.resultsList.innerHTML = list.map(m => {
    const isPaid = m.status === "PAID";
    const statusClass = isPaid ? "paid" : "remaining";
    const outstandingClass = isPaid ? "paid" : "";
    const escapedOwner = m.ownerName.replace(/'/g, "\\'");
    
    return `
      <div class="member-card ${statusClass}" id="member-card-${m.index}">
        <div class="card-header-row">
          <div class="bungalow-tag-wrap">
            <span class="bungalow-num">${m.bungalow}</span>
            <span class="status-badge ${statusClass}">${m.status}</span>
          </div>
          
          <div class="card-actions-top">
            <button class="btn-card-action-top edit" onclick="triggerEdit('${m.index}')" title="Edit Record">
              <i class="ti ti-edit"></i>
            </button>
            <button class="btn-card-action-top delete" onclick="triggerDelete('${m.index}', '${m.bungalow}')" title="Delete Record">
              <i class="ti ti-trash"></i>
            </button>
          </div>
        </div>

        <div class="card-body">
          <div class="owner-row">
            <span class="owner-name">${m.ownerName || '<span class="text-muted" style="font-weight: 400; font-size: 0.88rem;">No Owner Registered</span>'}</span>
            ${m.phone ? `
              <a href="tel:${m.phone}" class="owner-phone" title="Call Owner" onclick="event.stopPropagation()">
                <i class="ti ti-phone"></i>
                <span>${m.phone}</span>
              </a>
            ` : ""}
          </div>
          
          ${m.monthsDesc ? `
            <div class="remarks-box">
              <i class="ti ti-info-circle"></i>
              <span>${m.monthsDesc}</span>
            </div>
          ` : ""}

          ${m.lastBillNumber ? `
            <div class="payment-meta-row" style="margin-top: 0.5rem;">
              <div class="payment-meta-item">
                <i class="ti ti-receipt"></i> Last Bill No.: <strong>${m.lastBillNumber}</strong>
              </div>
            </div>
          ` : ""}

          <!-- Ledger Table -->
          <div class="ledger-info-grid">
            <div class="ledger-col">
              <span class="ledger-label">Monthly Rate</span>
              <span class="ledger-val">₹${m.rate}</span>
            </div>
            <div class="ledger-col">
              <span class="ledger-label">Remaining</span>
              <span class="ledger-val">${m.remainingMonths} Months</span>
            </div>
            <div class="ledger-col">
              <span class="ledger-label">Outstanding</span>
              <span class="ledger-val highlight ${outstandingClass}">₹${m.totalRemaining}</span>
            </div>
          </div>
          
          <!-- Payment Meta details -->
          <div class="payment-meta-row">
            <div class="payment-meta-item">
              <i class="ti ti-credit-card"></i> Method: <strong>${m.method}</strong>
            </div>
            ${m.bankMoney > 0 ? `
              <div class="payment-meta-item">
                <i class="ti ti-cash"></i> Bank Money: <strong>₹${m.bankMoney}</strong>
              </div>
            ` : ""}
          </div>
        </div>

        <div class="card-actions-bottom">
          ${isPaid ? `
            <button class="btn-paid-status" title="Paid">
              <i class="ti ti-circle-check"></i> Paid
            </button>
          ` : `
            <button class="btn-share-wa" onclick="sendWhatsAppReminder('${m.index}')" title="WhatsApp Reminder">
              <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp Reminder
            </button>
          `}
          ${!isPaid ? `
            <button class="btn-quick-pay" onclick="triggerQuickPay('${m.index}')" title="Quick Mark Paid via Cash">
              <i class="ti ti-checkbox"></i> Mark Paid
            </button>
          ` : ""}
        </div>
      </div>
    `;
  }).join("");
}

// Loading Placeholder
function showLoading() {
  elements.resultsList.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Syncing maintenance database...</p>
    </div>
  `;
}

// UI Feedback Toast
function showToast(message) {
  elements.toast.innerHTML = `<i class="ti ti-circle-check"></i> ${message}`;
  elements.toast.classList.add("show");
  
  setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2500);
}

function formatWhatsAppPhone(phone) {
  let phoneVal = phone ? String(phone).trim().replace(/[^0-9]/g, "") : "";
  phoneVal = phoneVal.replace(/^0+/, "");
  if (!phoneVal) return "";
  return phoneVal.length === 10 ? "91" + phoneVal : phoneVal;
}

function openWhatsApp(member, message) {
  const encodedText = encodeURIComponent(message);
  const waPhone = formatWhatsAppPhone(member.phone);

  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  window.open(waUrl, "_blank");
  return true;
}

function buildThankYouMessage(member, { monthsPaid, amountPaid, method }) {
  const isFullyPaid = member.remainingMonths === 0 || member.status === "PAID";
  const monthsLabel = monthsPaid === 1 ? "1 month" : `${monthsPaid} months`;

  let message = `Assalamu Alaikum,\n\n*Ihsanpark Society Maintenance — Payment Received* ✅\nBungalow: *${member.bungalow}*\nOwner: *${member.ownerName}*\n\nJazakAllah! Thank you for your maintenance payment.\n\n`;

  if (monthsPaid > 0) {
    message += `You paid: *${monthsLabel}* maintenance (*₹${amountPaid.toLocaleString("en-IN")}*)\n`;
    if (method && method !== "None") {
      message += `Method: *${method}*\n`;
    }
  } else if (isFullyPaid && method && method !== "None") {
    message += `Method: *${method}*\n`;
  }

  if (isFullyPaid) {
    message += `\n*All outstanding dues are now cleared.* ✅\nOutstanding: *₹0* | Remaining: *0 month(s)*`;
    if (member.monthsDesc) {
      message += `\nDetails: ${member.monthsDesc}`;
    }
  } else {
    message += `\n*Remaining outstanding:*\n`;
    message += `• Pending months: *${member.remainingMonths} month(s)*\n`;
    message += `• Amount due: *₹${member.totalRemaining.toLocaleString("en-IN")}*\n`;
    message += `• Rate: ₹${member.rate}/month`;
    if (member.monthsDesc) {
      message += `\n• Details: ${member.monthsDesc}`;
    }
    message += `\n\nPlease clear the remaining dues when possible.`;
  }

  message += `\n\nJazakAllah for your support!`;
  return message;
}

function detectPaymentFromEdit(before, after) {
  if (!before || !after) return null;

  const monthsReduced = before.remainingMonths - after.remainingMonths;
  const becameFullyPaid = after.remainingMonths === 0 || after.status === "PAID";

  if (monthsReduced <= 0 && !becameFullyPaid) return null;
  if (before.remainingMonths === 0 && monthsReduced <= 0) return null;

  let monthsPaid = monthsReduced;
  if (becameFullyPaid && monthsPaid <= 0) {
    monthsPaid = before.remainingMonths;
  }

  if (monthsPaid <= 0) return null;

  return {
    monthsPaid,
    amountPaid: before.rate * monthsPaid,
    method: after.method
  };
}

function promptPaymentThankYou(member, paymentInfo) {
  const message = buildThankYouMessage(member, paymentInfo);
  if (!formatWhatsAppPhone(member.phone)) {
    showToast("Payment saved. No phone on record — use WhatsApp picker to send thank-you.");
  }
  if (confirm("Payment recorded! Open WhatsApp to send a thank-you message?")) {
    openWhatsApp(member, message);
  }
}

// Pre-fill WhatsApp message and redirect
window.sendWhatsAppReminder = function(index) {
  const member = state.members.find(m => m.index.toString() === index.toString());
  if (!member) return;

  const isPaid = member.status === "PAID" || member.remainingMonths === 0;
  const message = isPaid
    ? buildThankYouMessage(member, { monthsPaid: 0, amountPaid: 0, method: member.method })
    : `Assalamu Alaikum,\n\n*Ihsanpark Society Maintenance Reminder*\nBungalow: *${member.bungalow}*\nOwner: *${member.ownerName}*\n\nOutstanding Amount: *₹${member.totalRemaining.toLocaleString("en-IN")}* ⚠️\nOutstanding Months: *${member.remainingMonths} month(s)*\nRate: ₹${member.rate}/month\nDetails: ${member.monthsDesc || 'Pending maintenance payment.'}\n\nPlease clear the dues as soon as possible.\n\nJazakAllah!`;

  openWhatsApp(member, message);
};

// Modal Operations
function openModal() {
  state.editIndex = null;
  document.getElementById("modal-title").textContent = "Add Bungalow Record";
  elements.submitBtn.querySelector(".btn-text").textContent = "Add Record";
  
  elements.modalOverlay.classList.add("open");
  elements.modalOverlay.setAttribute("aria-hidden", "false");
  elements.bungalow.focus();
  resetForm();
}

function closeModal() {
  elements.modalOverlay.classList.remove("open");
  elements.modalOverlay.setAttribute("aria-hidden", "true");
  resetForm();
}

function resetForm() {
  elements.memberForm.reset();
  elements.bungalow.classList.remove("invalid");
  elements.ownerName.classList.remove("invalid");
  elements.rate.classList.remove("invalid");
  elements.remainingMonths.classList.remove("invalid");
  elements.lastBillNumber.classList.remove("invalid");
  
  elements.bungalowError.textContent = "";
  elements.ownerNameError.textContent = "";
  elements.rateError.textContent = "";
  elements.remainingMonthsError.textContent = "";
  elements.lastBillNumberError.textContent = "";
  
  // Set default values
  elements.rate.value = 700;
  elements.remainingMonths.value = 1;
  elements.calcTotalDisplay.textContent = "₹700";
  
  state.editIndex = null;
}

// Auto calculates estimated total in the modal form
function autoCalculateTotal() {
  const rateVal = Number(elements.rate.value) || 0;
  const monthsVal = Number(elements.remainingMonths.value) || 0;
  const total = rateVal * monthsVal;
  elements.calcTotalDisplay.textContent = `₹${total.toLocaleString("en-IN")}`;

  // Dynamically update status based on remaining months
  if (monthsVal === 0) {
    elements.status.value = "PAID";
  } else {
    elements.status.value = "Remaining";
  }
}

// Form input change calculations
elements.rate.addEventListener("input", autoCalculateTotal);
elements.remainingMonths.addEventListener("input", autoCalculateTotal);
elements.status.addEventListener("change", () => {
  if (elements.status.value === "PAID") {
    elements.remainingMonths.value = 0;
  } else if (elements.status.value === "Remaining" && (Number(elements.remainingMonths.value) || 0) === 0) {
    elements.remainingMonths.value = 1;
  }
  autoCalculateTotal();
});

// Quick Pay operation - Opens modal to ask method & amount
window.triggerQuickPay = function(index) {
  const member = state.members.find(m => m.index.toString() === index.toString());
  if (!member) return;

  state.quickPayIndex = index;
  
  // Set details in modal
  elements.qpBungalowDisplay.textContent = member.bungalow;
  elements.qpAmountDisplay.textContent = `₹${member.totalRemaining.toLocaleString("en-IN")}`;
  
  // Reset method
  elements.qpMethod.value = "Cash";

  // Open modal
  elements.qpOverlay.classList.add("open");
  elements.qpOverlay.setAttribute("aria-hidden", "false");
  elements.qpMethod.focus();
};

function closeQuickPayModal() {
  elements.qpOverlay.classList.remove("open");
  elements.qpOverlay.setAttribute("aria-hidden", "true");
  elements.qpForm.reset();
  state.quickPayIndex = null;
}

// Handles the actual Quick Pay submission
async function handleQuickPaySubmit(e) {
  e.preventDefault();
  
  if (!state.quickPayIndex) return;
  const index = state.quickPayIndex;
  const member = state.members.find(m => m.index.toString() === index.toString());
  if (!member) return;

  const methodVal = elements.qpMethod.value;
  const bankMoneyVal = methodVal === "Cash" ? 0 : member.totalRemaining;
  const monthsPaid = member.remainingMonths;
  const amountPaid = member.totalRemaining;

  const submitUrl = window.APP_CONFIG.submitUrl;
  
  // If offline or submitUrl isn't configured, do local state change
  if (state.connectionStatus === "offline" || !submitUrl) {
    const localIdx = state.members.findIndex(m => m.index.toString() === index.toString());
    if (localIdx !== -1) {
      const updatedMember = {
        ...state.members[localIdx],
        status: "PAID",
        method: methodVal,
        bankMoney: bankMoneyVal,
        remainingMonths: 0,
        totalRemaining: 0,
        monthsDesc: "PAID UP TO DATE"
      };
      state.members[localIdx] = updatedMember;

      applyFilters();
      showToast("🎉 Record updated locally!");
      closeQuickPayModal();
      promptPaymentThankYou(updatedMember, { monthsPaid, amountPaid, method: methodVal });
    }
    return;
  }

  // Set loading state
  elements.qpSubmitBtn.disabled = true;
  elements.qpSubmitBtn.classList.add("loading");

  const payload = {
    action: "edit",
    index: index,
    status: "PAID",
    method: methodVal,
    bankMoney: bankMoneyVal,
    remainingMonths: 0,
    monthsDesc: "PAID UP TO DATE"
  };

  try {
    const response = await fetch(submitUrl, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Server response failed");

    const result = await response.json();
    if (result.status === "success") {
      const localIdx = state.members.findIndex(m => m.index.toString() === index.toString());
      if (localIdx !== -1) {
        const updatedMember = {
          ...state.members[localIdx],
          status: "PAID",
          method: methodVal,
          bankMoney: bankMoneyVal,
          remainingMonths: 0,
          totalRemaining: 0,
          monthsDesc: "PAID UP TO DATE"
        };
        state.members[localIdx] = updatedMember;
        showToast("🎉 Status updated successfully!");
        applyFilters();
        closeQuickPayModal();
        promptPaymentThankYou(updatedMember, { monthsPaid, amountPaid, method: methodVal });
      }
    } else {
      throw new Error(result.message || "Write rejected by Apps Script");
    }
  } catch (error) {
    console.error("Quick Pay Failed:", error);
    showToast("❌ Sync failure. Failed to update status.");
  } finally {
    elements.qpSubmitBtn.disabled = false;
    elements.qpSubmitBtn.classList.remove("loading");
  }
}

// Edit Record Modal Pre-fill trigger
window.triggerEdit = function(index) {
  const member = state.members.find(m => m.index.toString() === index.toString());
  if (!member) return;

  state.editIndex = index;

  // Pre-fill forms
  elements.bungalow.value = member.bungalow;
  elements.status.value = member.status;
  elements.ownerName.value = member.ownerName;
  elements.phone.value = member.phone || "";
  elements.lastBillNumber.value = member.lastBillNumber || "";
  elements.monthsDesc.value = member.monthsDesc;
  elements.rate.value = member.rate;
  elements.remainingMonths.value = member.remainingMonths;
  elements.method.value = member.method;

  autoCalculateTotal();

  document.getElementById("modal-title").textContent = "Edit Bungalow Details";
  elements.submitBtn.querySelector(".btn-text").textContent = "Save Changes";
  
  elements.modalOverlay.classList.add("open");
  elements.modalOverlay.setAttribute("aria-hidden", "false");
  elements.bungalow.focus();
};

// Delete record trigger
window.triggerDelete = async function(index, bungalow) {
  if (!confirm(`Are you sure you want to delete record for Bungalow ${bungalow}?`)) {
    return;
  }

  const submitUrl = window.APP_CONFIG.submitUrl;

  if (state.connectionStatus === "offline" || !submitUrl) {
    state.members = state.members.filter(m => m.index.toString() !== index.toString());
    applyFilters();
    showToast("🗑️ Record deleted locally!");
    return;
  }

  const card = document.getElementById(`member-card-${index}`);
  if (card) {
    card.style.opacity = "0.5";
    card.style.pointerEvents = "none";
  }

  try {
    const response = await fetch(submitUrl, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "delete",
        index: index
      })
    });

    if (!response.ok) throw new Error("Delete failed");

    const result = await response.json();
    if (result.status === "success") {
      state.members = state.members.filter(m => m.index.toString() !== index.toString());
      if (card) {
        card.style.transform = "scale(0.9) translateY(-10px)";
        card.style.opacity = "0";
        setTimeout(() => {
          applyFilters();
          showToast("🗑️ Record deleted successfully!");
        }, 300);
      } else {
        applyFilters();
        showToast("🗑️ Record deleted successfully!");
      }
    } else {
      throw new Error(result.message || "Delete rejected by Apps Script");
    }
  } catch (error) {
    console.error("Delete Failed:", error);
    showToast("❌ Sync failure. Failed to delete record.");
    if (card) {
      card.style.opacity = "1";
      card.style.pointerEvents = "auto";
    }
  }
};

// Form Validation and Submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Clear errors
  elements.bungalow.classList.remove("invalid");
  elements.ownerName.classList.remove("invalid");
  elements.rate.classList.remove("invalid");
  elements.remainingMonths.classList.remove("invalid");
  elements.lastBillNumber.classList.remove("invalid");
  elements.bungalowError.textContent = "";
  elements.ownerNameError.textContent = "";
  elements.rateError.textContent = "";
  elements.remainingMonthsError.textContent = "";
  elements.lastBillNumberError.textContent = "";

  let isValid = true;

  const bungalowVal = elements.bungalow.value.trim();
  const ownerVal = elements.ownerName.value.trim();
  const rateVal = Number(elements.rate.value);
  const remainingMonthsVal = Number(elements.remainingMonths.value);
  const lastBillNumberVal = elements.lastBillNumber.value.trim();

  if (!bungalowVal) {
    elements.bungalow.classList.add("invalid");
    elements.bungalowError.textContent = "Bungalow number is required.";
    isValid = false;
  }

  if (!ownerVal) {
    elements.ownerName.classList.add("invalid");
    elements.ownerNameError.textContent = "Owner name is required.";
    isValid = false;
  }

  if (isNaN(rateVal) || rateVal < 0) {
    elements.rate.classList.add("invalid");
    elements.rateError.textContent = "Please enter a valid rate (>=0).";
    isValid = false;
  }

  if (isNaN(remainingMonthsVal) || remainingMonthsVal < 0) {
    elements.remainingMonths.classList.add("invalid");
    elements.remainingMonthsError.textContent = "Please enter a valid count (>=0).";
    isValid = false;
  }

  if (lastBillNumberVal && !/^[\d\-\/]+$/.test(lastBillNumberVal)) {
    elements.lastBillNumber.classList.add("invalid");
    elements.lastBillNumberError.textContent = "Use numbers only (e.g. 6-123 or 6/123).";
    isValid = false;
  }

  if (!isValid) {
    const firstInvalid = elements.memberForm.querySelector("input.invalid");
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const submitUrl = window.APP_CONFIG.submitUrl;
  const isEditing = state.editIndex !== null;
  const memberBeforeEdit = isEditing
    ? state.members.find(m => m.index.toString() === state.editIndex.toString())
    : null;

  let bankMoneyVal = 0;
  if (elements.method.value === "UPI") {
    if (isEditing) {
      const member = state.members.find(m => m.index.toString() === state.editIndex.toString());
      if (member) {
        if (elements.status.value === "PAID" || remainingMonthsVal === 0) {
          bankMoneyVal = member.totalRemaining;
        } else if (remainingMonthsVal < member.remainingMonths) {
          bankMoneyVal = rateVal * (member.remainingMonths - remainingMonthsVal);
        }
      }
    } else {
      if (elements.status.value === "PAID" || remainingMonthsVal === 0) {
        bankMoneyVal = rateVal;
      }
    }
  }

  // Local State Update payload
  const payload = {
    action: isEditing ? "edit" : "add",
    bungalow: bungalowVal,
    status: elements.status.value,
    ownerName: ownerVal,
    phone: elements.phone.value.trim(),
    lastBillNumber: lastBillNumberVal,
    monthsDesc: elements.monthsDesc.value.trim(),
    rate: rateVal,
    remainingMonths: remainingMonthsVal,
    method: elements.method.value,
    bankMoney: bankMoneyVal
  };

  if (isEditing) {
    payload.index = state.editIndex;
  }

  // If offline, apply locally
  if (state.connectionStatus === "offline" || !submitUrl) {
    const targetIdx = isEditing ? state.editIndex : `L${new Date().getTime()}`;
    const newRecord = {
      index: targetIdx,
      ...payload,
      totalRemaining: payload.rate * payload.remainingMonths
    };

    if (isEditing) {
      const localIdx = state.members.findIndex(m => m.index.toString() === state.editIndex.toString());
      if (localIdx !== -1) state.members[localIdx] = newRecord;
      showToast("🎉 Record updated locally!");
      const paymentInfo = detectPaymentFromEdit(memberBeforeEdit, newRecord);
      if (paymentInfo) {
        promptPaymentThankYou(newRecord, paymentInfo);
      }
    } else {
      state.members.push(newRecord);
      showToast("🎉 Record added locally!");
    }

    applyFilters();
    closeModal();
    return;
  }

  // Set loading state
  elements.submitBtn.disabled = true;
  elements.submitBtn.classList.add("loading");

  try {
    const response = await fetch(submitUrl, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Sync write failed");

    const result = await response.json();

    if (result.status === "success") {
      const targetIndex = result.index || payload.index || (state.members.length + 1);
      const updatedRecord = {
        index: targetIndex,
        ...payload,
        totalRemaining: payload.rate * payload.remainingMonths
      };

      if (isEditing) {
        const localIdx = state.members.findIndex(m => m.index.toString() === state.editIndex.toString());
        if (localIdx !== -1) state.members[localIdx] = updatedRecord;
        showToast("🎉 Record updated successfully!");
        const paymentInfo = detectPaymentFromEdit(memberBeforeEdit, updatedRecord);
        if (paymentInfo) {
          promptPaymentThankYou(updatedRecord, paymentInfo);
        }
      } else {
        state.members.push(updatedRecord);
        showToast("🎉 Record added successfully!");
      }

      applyFilters();
      closeModal();

      // Highlight target card
      setTimeout(() => {
        const targetCard = document.getElementById(`member-card-${targetIndex}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          targetCard.style.outline = "2px solid var(--primary)";
          setTimeout(() => { targetCard.style.outline = "none"; }, 2500);
        }
      }, 500);
    } else {
      throw new Error(result.message || "Write rejected by Apps Script");
    }
  } catch (error) {
    console.error("Submission failed:", error);
    showToast("❌ Connection error. Failed to save changes.");
  } finally {
    elements.submitBtn.disabled = false;
    elements.submitBtn.classList.remove("loading");
  }
}

// Event Listeners setup
function setupEventListeners() {
  // Live search input
  elements.searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    if (state.searchQuery) {
      elements.searchClear.classList.add("visible");
    } else {
      elements.searchClear.classList.remove("visible");
    }
    applyFilters();
  });

  // Clear search field
  elements.searchClear.addEventListener("click", () => {
    elements.searchInput.value = "";
    state.searchQuery = "";
    elements.searchClear.classList.remove("visible");
    applyFilters();
    elements.searchInput.focus();
  });

  // Modal show/hide
  elements.openModalBtn.addEventListener("click", openModal);
  elements.closeModalBtn.addEventListener("click", closeModal);
  elements.cancelModalBtn.addEventListener("click", closeModal);
  
  elements.modalOverlay.addEventListener("click", (e) => {
    if (e.target === elements.modalOverlay) {
      closeModal();
    }
  });

  // Submit form
  elements.memberForm.addEventListener("submit", handleFormSubmit);

  // ESC to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (elements.modalOverlay.classList.contains("open")) {
        closeModal();
      }
      if (elements.qpOverlay.classList.contains("open")) {
        closeQuickPayModal();
      }
    }
  });

  // Quick Pay Modal Toggle listeners
  elements.qpCancelBtn.addEventListener("click", closeQuickPayModal);
  elements.qpCloseBtn.addEventListener("click", closeQuickPayModal);
  
  elements.qpOverlay.addEventListener("click", (e) => {
    if (e.target === elements.qpOverlay) {
      closeQuickPayModal();
    }
  });
  // Quick Pay submit form
  elements.qpForm.addEventListener("submit", handleQuickPaySubmit);

  // Bottom Navigation Switching
  elements.navBtnList.addEventListener("click", () => {
    elements.navBtnList.classList.add("active");
    elements.navBtnStats.classList.remove("active");
    elements.panelList.classList.add("active");
    elements.panelStats.classList.remove("active");
  });

  elements.navBtnStats.addEventListener("click", () => {
    elements.navBtnStats.classList.add("active");
    elements.navBtnList.classList.remove("active");
    elements.panelStats.classList.add("active");
    elements.panelList.classList.remove("active");
  });
}
