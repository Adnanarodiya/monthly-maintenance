/**
 * Core Application Logic for Ihsanpark Society Maintenance Dashboard
 */

window.APP_CONFIG = window.APP_CONFIG || {
  sheetUrl: "",
  submitUrl: "",
  fallbackData: []
};

function t(key, vars) {
  return window.I18N ? window.I18N.t(key, vars) : key;
}

function statusLabel(status) {
  return status === "PAID" ? t("status.paid") : t("status.remaining");
}

function methodLabel(method) {
  if (method === "Cash") return t("method.cash");
  if (method === "UPI") return t("method.upi");
  if (method === "None") return t("method.none");
  return method || t("method.none");
}

function methodLabelEn(method) {
  if (method === "Cash") return "Cash";
  if (method === "UPI") return "GPay / UPI";
  if (method === "None") return "None";
  return method || "None";
}

function methodLabelGu(method) {
  if (method === "Cash") return "રોકડા";
  if (method === "UPI") return "GPay / UPI";
  if (method === "None") return "નથી";
  return method || "નથી";
}

function getSheetReadUrl() {
  const readUrl = (window.APP_CONFIG.sheetUrl || window.APP_CONFIG.submitUrl || "").trim();
  if (!readUrl || readUrl.includes("YOUR_GOOGLE_APPS_SCRIPT")) return null;
  return readUrl;
}

// State Management
let state = {
  members: [],
  filteredMembers: [],
  searchQuery: "",
  connectionStatus: "loading", // 'loading', 'online', 'offline'
  editIndex: null, // null = Add mode, otherwise contains target index/ID
  quickPayIndex: null, // Track bungalow index currently in Quick Pay modal
  advancePayIndex: null, // Track bungalow index in Advance Payment modal
  pendingWhatsApp: null // Stored message for thank-you modal
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
  paymentDate: document.getElementById("payment-date"),
  monthsDesc: document.getElementById("months-desc"),
  additionalPendingAmount: document.getElementById("additional-pending-amount"),
  additionalPendingNote: document.getElementById("additional-pending-note"),
  rate: document.getElementById("rate"),
  remainingMonths: document.getElementById("remaining-months"),
  method: document.getElementById("method"),
  calcTotalDisplay: document.getElementById("calc-total-remaining"),
  
  // Input Error Message fields
  bungalowError: document.getElementById("bungalow-error"),
  ownerNameError: document.getElementById("owner-name-error"),
  rateError: document.getElementById("rate-error"),
  remainingMonthsError: document.getElementById("remaining-months-error"),
  additionalPendingAmountError: document.getElementById("additional-pending-amount-error"),
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

  // Advance Payment Modal elements
  advOverlay: document.getElementById("advance-overlay"),
  advBungalowDisplay: document.getElementById("adv-bungalow-display"),
  advRateDisplay: document.getElementById("adv-rate-display"),
  advFromDate: document.getElementById("adv-from-date"),
  advUntilMonth: document.getElementById("adv-until-month"),
  advMethod: document.getElementById("adv-method"),
  advPendingRow: document.getElementById("adv-pending-row"),
  advPendingDisplay: document.getElementById("adv-pending-display"),
  advAdvanceDisplay: document.getElementById("adv-advance-display"),
  advTotalDisplay: document.getElementById("adv-total-display"),
  advCancelBtn: document.getElementById("cancel-advance-btn"),
  advCloseBtn: document.getElementById("close-advance-btn"),
  advForm: document.getElementById("advance-form"),
  advSubmitBtn: document.getElementById("submit-advance-btn"),
  advSpinner: document.getElementById("advance-spinner"),

  // WhatsApp thank-you modal
  waOverlay: document.getElementById("whatsapp-overlay"),
  waOpenBtn: document.getElementById("wa-open-btn"),
  waSkipBtn: document.getElementById("wa-skip-btn"),
  waCloseBtn: document.getElementById("close-whatsapp-btn"),
  waPromptText: document.getElementById("whatsapp-prompt-text"),

  // Tab Navigation Elements
  navBtnList: document.getElementById("nav-btn-list"),
  navBtnStats: document.getElementById("nav-btn-stats"),
  panelList: document.getElementById("panel-list"),
  panelStats: document.getElementById("panel-stats")
};

// Initial Setup
document.addEventListener("DOMContentLoaded", () => {
  if (window.I18N) window.I18N.applyStaticI18n();
  initMobileViewportLock();
  initSecurityGate();
  registerServiceWorker();
});

let openOverlayCount = 0;

function lockMobilePage() {
  openOverlayCount++;
  document.body.classList.add("mobile-locked");
}

function unlockMobilePage() {
  openOverlayCount = Math.max(0, openOverlayCount - 1);
  if (openOverlayCount === 0) {
    document.body.classList.remove("mobile-locked");
  }
}

function resetMobilePageLock() {
  openOverlayCount = 0;
  document.body.classList.remove("mobile-locked");
}

function initMobileViewportLock() {
  // Block pinch-to-zoom in installed PWA (iOS Safari + Android Chrome)
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  document.addEventListener("gesturechange", (e) => e.preventDefault());
  document.addEventListener("gestureend", (e) => e.preventDefault());

  document.addEventListener("touchstart", (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  // Keep layout stable when the on-screen keyboard opens (Android + iOS)
  if (window.visualViewport) {
    const syncViewportOffset = () => {
      const offsetX = window.visualViewport.offsetLeft || 0;
      if (offsetX !== 0) {
        window.scrollTo(0, 0);
      }
    };

    window.visualViewport.addEventListener("resize", syncViewportOffset);
    window.visualViewport.addEventListener("scroll", syncViewportOffset);
  }
}

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
    resetMobilePageLock();
    fetchData();
    setupEventListeners();
  } else {
    if (lockScreen) lockScreen.style.display = "flex";
    if (appShell) appShell.style.display = "none";
    lockMobilePage();
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
          resetMobilePageLock();

          // Load data and normal listeners
          fetchData();
          setupEventListeners();
        }, 350);
        
      } else {
        // Incorrect pin: shake container and show error
        lockError.textContent = t("lock.error");
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

  const readUrl = getSheetReadUrl();

  if (!readUrl) {
    console.warn("Google Sheet URL is missing or not configured in config.js.");
    loadFallbackData("config");
    return;
  }

  try {
    const fetchUrl = `${readUrl}${readUrl.includes("?") ? "&" : "?"}t=${new Date().getTime()}`;
    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    let parsedData = [];

    if (contentType.includes("json") || readUrl.includes("exec")) {
      // Direct Apps Script JSON GET
      parsedData = await response.json();
      // If error payload returned from Apps Script
      if (parsedData && parsedData.status === "error") {
        throw new Error(parsedData.message || "Apps Script returned an error");
      }
    } else {
      // Standard published CSV export URL
      const csvText = await response.text();
      parsedData = parseCSV(csvText);
    }

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error("No society records returned from Google Sheet.");
    }

    state.members = parsedData;
    state.connectionStatus = "online";
    updateSyncStatusLabel("online");
    
    applyFilters();
  } catch (error) {
    console.warn("Google Sheet Sync Failed. Using offline cached fallback.", error);
    loadFallbackData("network", error.message);
  }
}

function updateSyncStatusLabel(mode, errorMessage = "") {
  if (!elements.syncStatusLabel) return;
  if (mode === "online") {
    elements.syncStatusLabel.innerHTML = `<i class="ti ti-cloud-check"></i> ${t("sync.connected")}`;
    elements.syncStatusLabel.style.color = "#10b981";
    elements.syncStatusLabel.title = "";
  } else if (mode === "config") {
    elements.syncStatusLabel.innerHTML = `<i class="ti ti-cloud-off"></i> ${t("sync.notConfigured")}`;
    elements.syncStatusLabel.title = t("sync.configTitle");
    elements.syncStatusLabel.style.color = "#ef4444";
  } else {
    elements.syncStatusLabel.innerHTML = `<i class="ti ti-cloud-off"></i> ${t("sync.offline")}`;
    elements.syncStatusLabel.title = errorMessage || t("sync.offlineTitle");
    elements.syncStatusLabel.style.color = "#ef4444";
  }
}

function loadFallbackData(reason = "network", errorMessage = "") {
  const fallback = Array.isArray(window.APP_CONFIG.fallbackData)
    ? window.APP_CONFIG.fallbackData
    : [];

  state.members = fallback.map(m => ({
    ...m,
    additionalPendingAmount: Number(m.additionalPendingAmount) || 0,
    additionalPendingNote: m.additionalPendingNote || "",
    status: m.remainingMonths === 0 ? "PAID" : "Remaining"
  }));
  state.connectionStatus = "offline";

  if (reason === "config") {
    updateSyncStatusLabel("config");
    showToast(t("toast.configMissing"));
  } else {
    updateSyncStatusLabel("offline", errorMessage);
    showToast(t("toast.syncFailed"));
  }

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
    const paymentDate = normalizeDateForInput(cols[12] || "");
    const coverageStart = normalizeDateForInput(cols[13] || "");
    const coverageEnd = normalizeDateForInput(cols[14] || "");
    const additionalPendingAmount = Number(cols[15]) || 0;
    const additionalPendingNote = cols[16] || "";

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
      lastBillNumber: lastBillNumber.trim(),
      paymentDate: paymentDate,
      coverageStart: coverageStart,
      coverageEnd: coverageEnd,
      additionalPendingAmount: additionalPendingAmount,
      additionalPendingNote: additionalPendingNote.trim()
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

function getAdditionalPendingAmount(member) {
  return Math.max(0, Number(member.additionalPendingAmount) || 0);
}

function getAdditionalPendingNote(member) {
  return (member.additionalPendingNote || "").trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
    totalOutstanding += getAdditionalPendingAmount(m);
  });

  const totalMembers = list.length;
  const efficiency = totalMembers > 0 ? Math.round((paidCount / totalMembers) * 100) : 0;

  // Render to DOM with animation/transitions
  elements.statOutstanding.textContent = `₹${totalOutstanding.toLocaleString("en-IN")}`;
  elements.statEfficiency.textContent = `${efficiency}%`;
  elements.efficiencyBar.style.width = `${efficiency}%`;
  elements.statPaidCount.textContent = t("kpi.paid", { n: paidCount });
  elements.statRemainingCount.textContent = t("kpi.remaining", { n: remainingCount });
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
      (m.additionalPendingNote && m.additionalPendingNote.toLowerCase().includes(query)) ||
      (getAdditionalPendingAmount(m) > 0 && String(getAdditionalPendingAmount(m)).includes(query)) ||
      m.monthsDesc.toLowerCase().includes(query);
  });

  renderMembers(state.filteredMembers);
  calculateMetrics();
}

// Render Listings
function renderMembers(list) {
  if (list.length === 0) {
    elements.countBadge.textContent = t("count.zero");
  } else if (list.length === 1) {
    elements.countBadge.textContent = t("count.one");
  } else {
    elements.countBadge.textContent = t("count.many", { n: list.length });
  }

  if (list.length === 0) {
    elements.resultsList.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-mood-empty"></i>
        <h3>${t("empty.title")}</h3>
        <p>${t("empty.body")}</p>
      </div>
    `;
    return;
  }

  elements.resultsList.innerHTML = list.map(m => {
    const isPaid = m.status === "PAID";
    const statusClass = isPaid ? "paid" : "remaining";
    const outstandingClass = isPaid ? "paid" : "";
    const additionalPendingAmount = getAdditionalPendingAmount(m);
    const additionalPendingNote = getAdditionalPendingNote(m);
    const hasAdditionalPending = additionalPendingAmount > 0;
    const advanceActive = isAdvanceActive(m);
    const advanceExpiring = isAdvanceExpiringSoon(m);
    const cardClasses = [
      statusClass,
      hasAdditionalPending ? "additional-pending" : "",
      advanceActive ? "advance" : "",
      advanceExpiring ? "advance-expiring" : ""
    ].filter(Boolean).join(" ");
    const untilDate = window.I18N && window.I18N.getLang() === "gu"
      ? formatMonthYearGujarati(m.coverageEnd)
      : formatMonthYear(m.coverageEnd);
    
    return `
      <div class="member-card ${cardClasses}" id="member-card-${m.index}">
        <div class="card-header-row">
          <div class="bungalow-tag-wrap">
            <span class="bungalow-num">${m.bungalow}</span>
            <span class="status-badge ${statusClass}">${statusLabel(m.status)}</span>
            ${advanceActive ? `
              <span class="advance-badge ${advanceExpiring ? "expiring" : ""}" title="${t("advance.activeTitle")}">
                <i class="ti ti-calendar-check"></i> ${t("advance.until", { date: untilDate })}
              </span>
            ` : ""}
          </div>
          
          <div class="card-actions-top">
            <button class="btn-card-action-top edit" onclick="triggerEdit('${m.index}')" title="${t("card.edit")}">
              <i class="ti ti-edit"></i>
            </button>
            <button class="btn-card-action-top delete" onclick="triggerDelete('${m.index}', '${m.bungalow}')" title="${t("card.delete")}">
              <i class="ti ti-trash"></i>
            </button>
          </div>
        </div>

        <div class="card-body">
          <div class="owner-row">
            <span class="owner-name">${m.ownerName || `<span class="text-muted" style="font-weight: 400; font-size: 0.88rem;">${t("card.noOwner")}</span>`}</span>
            ${m.phone ? `
              <a href="tel:${m.phone}" class="owner-phone" title="${t("card.callOwner")}" onclick="event.stopPropagation()">
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

          ${hasAdditionalPending ? `
            <div class="additional-pending-box">
              <div class="additional-pending-title">
                <i class="ti ti-alert-triangle"></i>
                <span>${t("card.additionalPending")}</span>
                <strong>₹${additionalPendingAmount.toLocaleString("en-IN")}</strong>
              </div>
              ${additionalPendingNote ? `<div class="additional-pending-note">${escapeHtml(additionalPendingNote)}</div>` : ""}
            </div>
          ` : ""}

          ${m.lastBillNumber || m.paymentDate ? `
            <div class="payment-meta-row" style="margin-top: 0.5rem;">
              ${m.lastBillNumber ? `
                <div class="payment-meta-item">
                  <i class="ti ti-receipt"></i> ${t("card.lastBill")} <strong>${m.lastBillNumber}</strong>
                </div>
              ` : ""}
              ${m.paymentDate ? `
                <div class="payment-meta-item">
                  <i class="ti ti-calendar"></i> ${t("card.paymentDate")} <strong>${formatDateDisplay(m.paymentDate)}</strong>
                </div>
              ` : ""}
            </div>
          ` : ""}

          <!-- Ledger Table -->
          <div class="ledger-info-grid">
            <div class="ledger-col">
              <span class="ledger-label">${t("card.monthlyRate")}</span>
              <span class="ledger-val">₹${m.rate}</span>
            </div>
            <div class="ledger-col">
              <span class="ledger-label">${t("card.remaining")}</span>
              <span class="ledger-val">${t("card.months", { n: m.remainingMonths })}</span>
            </div>
            <div class="ledger-col">
              <span class="ledger-label">${t("card.outstanding")}</span>
              <span class="ledger-val highlight ${outstandingClass}">₹${m.totalRemaining}</span>
            </div>
          </div>
          
          <!-- Payment Meta details -->
          <div class="payment-meta-row">
            <div class="payment-meta-item">
              <i class="ti ti-credit-card"></i> ${t("card.method")} <strong>${methodLabel(m.method)}</strong>
            </div>
            ${m.bankMoney > 0 ? `
              <div class="payment-meta-item">
                <i class="ti ti-cash"></i> ${t("card.bankMoney")} <strong>₹${m.bankMoney}</strong>
              </div>
            ` : ""}
          </div>
        </div>

        <div class="card-actions-bottom">
          ${isPaid ? `
            <button class="btn-share-wa" onclick="sendWhatsAppReminder('${m.index}')" title="${t("card.whatsapp")}">
              <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              ${t("card.whatsapp")}
            </button>
          ` : `
            <button class="btn-share-wa" onclick="sendWhatsAppReminder('${m.index}')" title="${t("card.whatsappReminder")}">
              <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              ${t("card.whatsappReminder")}
            </button>
            <button class="btn-quick-pay" onclick="triggerQuickPay('${m.index}')" title="${t("card.markPaidTitle")}">
              <i class="ti ti-checkbox"></i> ${t("card.markPaid")}
            </button>
          `}
          <button class="btn-advance-pay" onclick="triggerAdvancePay('${m.index}')" title="${t("card.advanceTitle")}">
            <i class="ti ti-calendar-dollar"></i> ${t("card.advance")}
          </button>
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
      <p>${t("loading")}</p>
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

function normalizeDateForInput(value) {
  if (!value) return "";
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "";
}

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const GUJARATI_MONTHS = [
  "જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન",
  "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"
];

function formatMonthYear(dateStr) {
  if (!dateStr) return "";
  const normalized = dateStr.length === 7 ? `${dateStr}-01` : dateStr;
  const d = new Date(`${normalized}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function formatMonthYearGujarati(dateStr) {
  if (!dateStr) return "";
  const normalized = dateStr.length === 7 ? `${dateStr}-01` : dateStr;
  const d = new Date(`${normalized}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return `${GUJARATI_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getLastDayOfMonth(yearMonth) {
  const [year, month] = yearMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function countMonthsInRange(startDateStr, endMonthStr) {
  const start = new Date(`${startDateStr}T00:00:00`);
  const [endYear, endMonth] = endMonthStr.split("-").map(Number);
  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1;
  return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
}

function buildAdvanceMonthsDesc(coverageStart, coverageEnd, pendingMonths = 0) {
  const advancePart = `${formatMonthYearGujarati(coverageStart)} થી ${formatMonthYearGujarati(coverageEnd)} સુધી એડવાન્સ`;
  if (pendingMonths > 0) {
    const pendingLabel = pendingMonths === 1 ? "1 મહિનો બાકી" : `${pendingMonths} મહિના બાકી`;
    return `${pendingLabel} + ${advancePart}`;
  }
  return advancePart;
}

function formatMonthsAmount(months, amount) {
  const monthsLabel = months === 1 ? t("month.one") : t("month.many", { n: months });
  return t("month.amount", { months: monthsLabel, amount: amount.toLocaleString("en-IN") });
}

function calculateAdvanceBreakdown(member, fromDate, untilMonth) {
  const rate = Number(member.rate) || 0;
  const pendingMonths = Math.max(0, Number(member.remainingMonths) || 0);
  const pendingAmount = pendingMonths * rate;

  let advanceMonths = 0;
  let advanceAmount = 0;
  if (fromDate && untilMonth) {
    advanceMonths = countMonthsInRange(fromDate, untilMonth);
    if (advanceMonths > 0) {
      advanceAmount = advanceMonths * rate;
    }
  }

  return {
    pendingMonths,
    pendingAmount,
    advanceMonths: Math.max(0, advanceMonths),
    advanceAmount,
    totalMonths: pendingMonths + Math.max(0, advanceMonths),
    totalAmount: pendingAmount + advanceAmount
  };
}

function isAdvanceActive(member) {
  if (!member.coverageEnd) return false;
  const end = new Date(`${member.coverageEnd}T23:59:59`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end >= today;
}

function isAdvanceExpiringSoon(member) {
  if (!isAdvanceActive(member)) return false;
  const end = new Date(`${member.coverageEnd}T23:59:59`);
  const today = new Date();
  const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  return daysLeft <= 30;
}

function getWhatsAppDateLine(lang) {
  const dateStr = formatDateDisplay(getTodayDateString());
  return lang === "gu" ? `તારીખ: *${dateStr}*` : `Date: *${dateStr}*`;
}

function buildAdditionalPendingWhatsAppLines(member, lang) {
  const amount = getAdditionalPendingAmount(member);
  if (amount <= 0) return "";

  const note = getAdditionalPendingNote(member);
  if (lang === "gu") {
    let lines = `\n\n*વધારાની બાકી રકમ: ₹${amount.toLocaleString("en-IN")}*`;
    if (note) {
      lines += `\nવધારાની બાકી નોંધ: ${note}`;
    }
    return lines;
  }

  let lines = `\n\n*Additional pending amount: ₹${amount.toLocaleString("en-IN")}*`;
  if (note) {
    lines += `\nAdditional pending note: ${note}`;
  }
  return lines;
}

function monthsLabelEn(n) {
  return n === 1 ? "1 month" : `${n} months`;
}

function monthsLabelGu(n) {
  return n === 1 ? "1 મહિનો" : `${n} મહિના`;
}

function buildAdvanceThankYouMessage(member, {
  coverageStart,
  coverageEnd,
  amountPaid,
  monthsCovered,
  method,
  pendingMonths = 0,
  pendingAmount = 0
}) {
  const fromEn = formatMonthYear(coverageStart);
  const toEn = formatMonthYear(coverageEnd);
  const fromGu = formatMonthYearGujarati(coverageStart);
  const toGu = formatMonthYearGujarati(coverageEnd);
  const advanceAmount = monthsCovered * member.rate;
  const methodEn = methodLabelEn(method);
  const methodGu = methodLabelGu(method);

  let en = `Assalamu Alaikum,

*Ihsanpark Society Maintenance — Payment Received* ✅
${getWhatsAppDateLine("en")}
Bungalow: *${member.bungalow}*
Owner: *${member.ownerName}*

JazakAllah! Thank you for your maintenance payment.

*Payment breakdown:*`;

  if (pendingMonths > 0) {
    en += `\n• Pending cleared: *${monthsLabelEn(pendingMonths)}* (*₹${pendingAmount.toLocaleString("en-IN")}*)`;
  }
  en += `\n• Advance: *${fromEn}* to *${toEn}* (*${monthsLabelEn(monthsCovered)}* | *₹${advanceAmount.toLocaleString("en-IN")}*)`;
  en += `\n• *Total paid: ₹${amountPaid.toLocaleString("en-IN")}*`;
  en += `\nMethod: *${methodEn}*`;
  en += `\n\nYour maintenance is fully covered until *${toEn}*. ✅`;
  en += buildAdditionalPendingWhatsAppLines(member, "en");

  let gu = `સલામ,

*એહસાન પાર્ક સોસાયટી મેન્ટેનન્સ — પેમેન્ટ મળ્યું* ✅
${getWhatsAppDateLine("gu")}
બંગલો: *${member.bungalow}*
માલિક: *${member.ownerName}*

જઝાકઅલ્લાહ! તમારા મેન્ટેનન્સ પેમેન્ટ બદલ આભાર.

*પેમેન્ટ વિગત:*`;

  if (pendingMonths > 0) {
    gu += `\n• બાકી ચૂકવ્યું: *${monthsLabelGu(pendingMonths)}* (*₹${pendingAmount.toLocaleString("en-IN")}*)`;
  }
  gu += `\n• એડવાન્સ: *${fromGu}* થી *${toGu}* (*${monthsLabelGu(monthsCovered)}* | *₹${advanceAmount.toLocaleString("en-IN")}*)`;
  gu += `\n• *કુલ ચૂકવેલ: ₹${amountPaid.toLocaleString("en-IN")}*`;
  gu += `\nપદ્ધતિ: *${methodGu}*`;
  gu += `\n\nતમારું મેન્ટેનન્સ *${toGu}* સુધી પૂરું કવર છે. ✅`;
  gu += buildAdditionalPendingWhatsAppLines(member, "gu");

  return `${en}\n\n────────────────\n${gu}\n\nJazakAllah!`;
}

function promptAdvanceThankYou(member, advanceInfo) {
  const message = buildAdvanceThankYouMessage(member, advanceInfo);
  const hasPhone = !!formatWhatsAppPhone(member.phone);

  state.pendingWhatsApp = { member, message };

  if (elements.waPromptText) {
    elements.waPromptText.textContent = hasPhone
      ? t("wa.promptAdvance", { bungalow: member.bungalow, owner: member.ownerName })
      : t("wa.promptAdvanceNoPhone");
  }

  openWhatsAppModal();
}

function updateAdvanceCalcDisplay() {
  if (!elements.advAdvanceDisplay || !elements.advTotalDisplay) return;

  const fromDate = elements.advFromDate.value;
  const untilMonth = elements.advUntilMonth.value;
  const index = state.advancePayIndex;
  const member = index
    ? state.members.find(m => m.index.toString() === index.toString())
    : null;

  if (!member) return;

  const breakdown = calculateAdvanceBreakdown(member, fromDate, untilMonth);

  if (elements.advPendingRow) {
    if (breakdown.pendingMonths > 0) {
      elements.advPendingRow.hidden = false;
      elements.advPendingDisplay.textContent = formatMonthsAmount(
        breakdown.pendingMonths,
        breakdown.pendingAmount
      );
    } else {
      elements.advPendingRow.hidden = true;
      elements.advPendingDisplay.textContent = "—";
    }
  }

  if (!fromDate || !untilMonth || breakdown.advanceMonths <= 0) {
    elements.advAdvanceDisplay.textContent = "—";
    elements.advTotalDisplay.textContent = breakdown.pendingMonths > 0
      ? formatMonthsAmount(breakdown.pendingMonths, breakdown.pendingAmount)
      : "—";
    return;
  }

  elements.advAdvanceDisplay.textContent = formatMonthsAmount(
    breakdown.advanceMonths,
    breakdown.advanceAmount
  );
  elements.advTotalDisplay.textContent = formatMonthsAmount(
    breakdown.totalMonths,
    breakdown.totalAmount
  );
}

function buildWhatsAppUrl(member, message) {
  const encodedText = encodeURIComponent(message);
  const waPhone = formatWhatsAppPhone(member.phone);
  return waPhone
    ? `https://wa.me/${waPhone}?text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
}

function openWhatsApp(member, message) {
  const waUrl = buildWhatsAppUrl(member, message);

  // Mobile PWA blocks window.open after async — navigate directly to WhatsApp
  window.location.href = waUrl;
  return true;
}

function openWhatsAppModal() {
  elements.waOverlay.classList.add("open");
  elements.waOverlay.setAttribute("aria-hidden", "false");
  lockMobilePage();
}

function closeWhatsAppModal() {
  elements.waOverlay.classList.remove("open");
  elements.waOverlay.setAttribute("aria-hidden", "true");
  unlockMobilePage();
  state.pendingWhatsApp = null;
}

function buildThankYouMessage(member, { monthsPaid, amountPaid, method }) {
  const isFullyPaid = member.remainingMonths === 0 || member.status === "PAID";
  const methodEn = methodLabelEn(method);
  const methodGu = methodLabelGu(method);

  let en = `Assalamu Alaikum,\n\n*Ihsanpark Society Maintenance — Payment Received* ✅\n${getWhatsAppDateLine("en")}\nBungalow: *${member.bungalow}*\nOwner: *${member.ownerName}*\n\nJazakAllah! Thank you for your maintenance payment.\n\n`;
  let gu = `સલામ,\n\n*એહસાન પાર્ક સોસાયટી મેન્ટેનન્સ — પેમેન્ટ મળ્યું* ✅\n${getWhatsAppDateLine("gu")}\nબંગલો: *${member.bungalow}*\nમાલિક: *${member.ownerName}*\n\nજઝાકઅલ્લાહ! તમારા મેન્ટેનન્સ પેમેન્ટ બદલ આભાર.\n\n`;

  if (monthsPaid > 0) {
    en += `You paid: *${monthsLabelEn(monthsPaid)}* maintenance (*₹${amountPaid.toLocaleString("en-IN")}*)\n`;
    gu += `તમે ચૂકવ્યું: *${monthsLabelGu(monthsPaid)}* મેન્ટેનન્સ (*₹${amountPaid.toLocaleString("en-IN")}*)\n`;
    if (method && method !== "None") {
      en += `Method: *${methodEn}*\n`;
      gu += `પદ્ધતિ: *${methodGu}*\n`;
    }
  } else if (isFullyPaid && method && method !== "None") {
    en += `Method: *${methodEn}*\n`;
    gu += `પદ્ધતિ: *${methodGu}*\n`;
  }

  if (isFullyPaid) {
    if (getAdditionalPendingAmount(member) > 0) {
      en += `\n*Current maintenance dues are now cleared.* ✅\nCurrent outstanding: *₹0* | Current remaining: *0 month(s)*`;
      gu += `\n*હાલનું મેન્ટેનન્સ હવે ચૂકવાઈ ગયું છે.* ✅\nહાલની બાકી: *₹0* | હાલના બાકી મહિના: *0*`;
    } else {
      en += `\n*All outstanding dues are now cleared.* ✅\nOutstanding: *₹0* | Remaining: *0 month(s)*`;
      gu += `\n*બધી બાકી રકમ હવે ચૂકવાઈ ગઈ છે.* ✅\nબાકી: *₹0* | બાકી મહિના: *0*`;
    }
    if (member.monthsDesc) {
      en += `\nDetails: ${member.monthsDesc}`;
      gu += `\nવિગત: ${member.monthsDesc}`;
    }
  } else {
    en += `\n*Remaining outstanding:*\n`;
    en += `• Pending months: *${member.remainingMonths} month(s)*\n`;
    en += `• Amount due: *₹${member.totalRemaining.toLocaleString("en-IN")}*\n`;
    en += `• Rate: ₹${member.rate}/month`;
    gu += `\n*બાકી રકમ:*\n`;
    gu += `• બાકી મહિના: *${monthsLabelGu(member.remainingMonths)}*\n`;
    gu += `• બાકી રકમ: *₹${member.totalRemaining.toLocaleString("en-IN")}*\n`;
    gu += `• દર: ₹${member.rate}/મહિનો`;
    if (member.monthsDesc) {
      en += `\n• Details: ${member.monthsDesc}`;
      gu += `\n• વિગત: ${member.monthsDesc}`;
    }
    en += `\n\nPlease clear the remaining dues when possible.`;
    gu += `\n\nકૃપા કરીને બાકી રકમ જલ્દી ચૂકવો.`;
  }

  en += buildAdditionalPendingWhatsAppLines(member, "en");
  gu += buildAdditionalPendingWhatsAppLines(member, "gu");

  return `${en}\n\n────────────────\n${gu}\n\nJazakAllah!`;
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
  const hasPhone = !!formatWhatsAppPhone(member.phone);

  state.pendingWhatsApp = { member, message };

  if (elements.waPromptText) {
    elements.waPromptText.textContent = hasPhone
      ? t("wa.promptPayment", { bungalow: member.bungalow, owner: member.ownerName })
      : t("wa.promptPaymentNoPhone");
  }

  openWhatsAppModal();
}

// Pre-fill WhatsApp message and redirect
window.sendWhatsAppReminder = function(index) {
  const member = state.members.find(m => m.index.toString() === index.toString());
  if (!member) return;

  const isPaid = member.status === "PAID" || member.remainingMonths === 0;
  let message;

  if (isAdvanceActive(member) && member.coverageStart) {
    const endMonth = member.coverageEnd.slice(0, 7);
    const monthsCovered = countMonthsInRange(member.coverageStart, endMonth);
    message = buildAdvanceThankYouMessage(member, {
      coverageStart: member.coverageStart,
      coverageEnd: member.coverageEnd,
      amountPaid: member.bankMoney || member.rate * monthsCovered,
      monthsCovered,
      method: member.method
    });
  } else if (isPaid) {
    message = buildThankYouMessage(member, { monthsPaid: 0, amountPaid: 0, method: member.method });
  } else {
    const details = member.monthsDesc || "Pending maintenance payment.";
    const detailsGu = member.monthsDesc || "મેન્ટેનન્સ પેમેન્ટ બાકી છે.";
    const en = `Assalamu Alaikum,\n\n*Ihsanpark Society Maintenance Reminder*\n${getWhatsAppDateLine("en")}\nBungalow: *${member.bungalow}*\nOwner: *${member.ownerName}*\n\nOutstanding Amount: *₹${member.totalRemaining.toLocaleString("en-IN")}* ⚠️\nOutstanding Months: *${monthsLabelEn(member.remainingMonths)}*\nRate: ₹${member.rate}/month\nDetails: ${details}${buildAdditionalPendingWhatsAppLines(member, "en")}\n\nPlease clear the dues as soon as possible.`;
    const gu = `સલામ,\n\n*એહસાન પાર્ક સોસાયટી મેન્ટેનન્સ રિમાઇન્ડર*\n${getWhatsAppDateLine("gu")}\nબંગલો: *${member.bungalow}*\nમાલિક: *${member.ownerName}*\n\nબાકી રકમ: *₹${member.totalRemaining.toLocaleString("en-IN")}* ⚠️\nબાકી મહિના: *${monthsLabelGu(member.remainingMonths)}*\nદર: ₹${member.rate}/મહિનો\nવિગત: ${detailsGu}${buildAdditionalPendingWhatsAppLines(member, "gu")}\n\nકૃપા કરીને બાકી રકમ જલ્દી ચૂકવો.`;
    message = `${en}\n\n────────────────\n${gu}\n\nJazakAllah!`;
  }

  openWhatsApp(member, message);
};

// Modal Operations
function openModal() {
  state.editIndex = null;
  document.getElementById("modal-title").textContent = t("modal.addTitle");
  elements.submitBtn.querySelector(".btn-text").textContent = t("modal.addRecord");
  
  elements.modalOverlay.classList.add("open");
  elements.modalOverlay.setAttribute("aria-hidden", "false");
  lockMobilePage();
  elements.bungalow.focus();
  resetForm();
}

function closeModal() {
  elements.modalOverlay.classList.remove("open");
  elements.modalOverlay.setAttribute("aria-hidden", "true");
  unlockMobilePage();
  resetForm();
}

function resetForm() {
  elements.memberForm.reset();
  elements.bungalow.classList.remove("invalid");
  elements.ownerName.classList.remove("invalid");
  elements.rate.classList.remove("invalid");
  elements.remainingMonths.classList.remove("invalid");
  elements.additionalPendingAmount.classList.remove("invalid");
  elements.lastBillNumber.classList.remove("invalid");
  
  elements.bungalowError.textContent = "";
  elements.ownerNameError.textContent = "";
  elements.rateError.textContent = "";
  elements.remainingMonthsError.textContent = "";
  elements.additionalPendingAmountError.textContent = "";
  elements.lastBillNumberError.textContent = "";
  
  // Set default values
  elements.rate.value = 700;
  elements.remainingMonths.value = 1;
  elements.additionalPendingAmount.value = 0;
  elements.additionalPendingNote.value = "";
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

// Insert − or / at cursor in Last Bill Number (mobile numeric keyboards often lack − or /)
function insertBillNumberChar(char) {
  const input = elements.lastBillNumber;
  if (!input || !char) return;

  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const nextValue = input.value.slice(0, start) + char + input.value.slice(end);

  if (!/^[\d\-\/]*$/.test(nextValue)) return;

  input.value = nextValue;
  const cursor = start + char.length;
  input.setSelectionRange(cursor, cursor);
  input.focus();
  input.classList.remove("invalid");
  if (elements.lastBillNumberError) elements.lastBillNumberError.textContent = "";
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
  lockMobilePage();
  elements.qpMethod.focus();
};

function closeQuickPayModal() {
  elements.qpOverlay.classList.remove("open");
  elements.qpOverlay.setAttribute("aria-hidden", "true");
  unlockMobilePage();
  elements.qpForm.reset();
  state.quickPayIndex = null;
}

// Advance Payment - Opens modal to record date-range advance
window.triggerAdvancePay = function(index) {
  const member = state.members.find(m => m.index.toString() === index.toString());
  if (!member) return;

  state.advancePayIndex = index;

  elements.advBungalowDisplay.textContent = member.bungalow;
  elements.advRateDisplay.textContent = `₹${member.rate}`;
  elements.advFromDate.value = getTodayDateString();
  elements.advUntilMonth.value = "";
  elements.advMethod.value = "Cash";

  updateAdvanceCalcDisplay();

  elements.advOverlay.classList.add("open");
  elements.advOverlay.setAttribute("aria-hidden", "false");
  lockMobilePage();
  elements.advFromDate.focus();
};

function closeAdvanceModal() {
  elements.advOverlay.classList.remove("open");
  elements.advOverlay.setAttribute("aria-hidden", "true");
  unlockMobilePage();
  elements.advForm.reset();
  state.advancePayIndex = null;
}

async function handleAdvanceSubmit(e) {
  e.preventDefault();

  if (!state.advancePayIndex) return;
  const index = state.advancePayIndex;
  const member = state.members.find(m => m.index.toString() === index.toString());
  if (!member) return;

  const fromDate = elements.advFromDate.value;
  const untilMonth = elements.advUntilMonth.value;
  const methodVal = elements.advMethod.value;

  if (!fromDate || !untilMonth) {
    showToast(t("toast.advDates"));
    return;
  }

  const monthsCovered = countMonthsInRange(fromDate, untilMonth);
  if (monthsCovered <= 0) {
    showToast(t("toast.advRange"));
    return;
  }

  const breakdown = calculateAdvanceBreakdown(member, fromDate, untilMonth);
  const coverageEnd = getLastDayOfMonth(untilMonth);
  const amountPaid = breakdown.totalAmount;
  const bankMoneyVal = methodVal === "Cash" ? 0 : amountPaid;
  const monthsDesc = buildAdvanceMonthsDesc(fromDate, coverageEnd, breakdown.pendingMonths);
  const paymentDate = getTodayDateString();

  const submitUrl = window.APP_CONFIG.submitUrl;

  const updatedFields = {
    status: "PAID",
    method: methodVal,
    bankMoney: bankMoneyVal,
    remainingMonths: 0,
    totalRemaining: 0,
    monthsDesc: monthsDesc,
    paymentDate: paymentDate,
    coverageStart: fromDate,
    coverageEnd: coverageEnd
  };

  const advanceInfo = {
    coverageStart: fromDate,
    coverageEnd: coverageEnd,
    amountPaid,
    monthsCovered,
    method: methodVal,
    pendingMonths: breakdown.pendingMonths,
    pendingAmount: breakdown.pendingAmount
  };

  if (state.connectionStatus === "offline" || !submitUrl) {
    const localIdx = state.members.findIndex(m => m.index.toString() === index.toString());
    if (localIdx !== -1) {
      const updatedMember = { ...state.members[localIdx], ...updatedFields };
      state.members[localIdx] = updatedMember;
      applyFilters();
      showToast(t("toast.advLocal"));
      closeAdvanceModal();
      promptAdvanceThankYou(updatedMember, advanceInfo);
    }
    return;
  }

  elements.advSubmitBtn.disabled = true;
  elements.advSubmitBtn.classList.add("loading");

  const payload = {
    action: "edit",
    index: index,
    ...updatedFields
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
        const updatedMember = { ...state.members[localIdx], ...updatedFields };
        state.members[localIdx] = updatedMember;
        showToast(t("toast.advSaved"));
        applyFilters();
        closeAdvanceModal();
        promptAdvanceThankYou(updatedMember, advanceInfo);
      }
    } else {
      throw new Error(result.message || "Write rejected by Apps Script");
    }
  } catch (error) {
    console.error("Advance Payment Failed:", error);
    showToast(t("toast.advFail"));
  } finally {
    elements.advSubmitBtn.disabled = false;
    elements.advSubmitBtn.classList.remove("loading");
  }
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
        monthsDesc: "PAID UP TO DATE",
        paymentDate: getTodayDateString()
      };
      state.members[localIdx] = updatedMember;

      applyFilters();
      showToast(t("toast.updLocal"));
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
    monthsDesc: "PAID UP TO DATE",
    paymentDate: getTodayDateString()
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
          monthsDesc: "PAID UP TO DATE",
          paymentDate: getTodayDateString()
        };
        state.members[localIdx] = updatedMember;
        showToast(t("toast.qpSaved"));
        applyFilters();
        closeQuickPayModal();
        promptPaymentThankYou(updatedMember, { monthsPaid, amountPaid, method: methodVal });
      }
    } else {
      throw new Error(result.message || "Write rejected by Apps Script");
    }
  } catch (error) {
    console.error("Quick Pay Failed:", error);
    showToast(t("toast.qpFail"));
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
  elements.paymentDate.value = normalizeDateForInput(member.paymentDate || "");
  elements.monthsDesc.value = member.monthsDesc;
  elements.additionalPendingAmount.value = getAdditionalPendingAmount(member);
  elements.additionalPendingNote.value = getAdditionalPendingNote(member);
  elements.rate.value = member.rate;
  elements.remainingMonths.value = member.remainingMonths;
  elements.method.value = member.method;

  autoCalculateTotal();

  document.getElementById("modal-title").textContent = t("modal.editTitle");
  elements.submitBtn.querySelector(".btn-text").textContent = t("modal.saveChanges");
  
  elements.modalOverlay.classList.add("open");
  elements.modalOverlay.setAttribute("aria-hidden", "false");
  lockMobilePage();
  elements.bungalow.focus();
};

// Delete record trigger
window.triggerDelete = async function(index, bungalow) {
  if (!confirm(t("confirm.delete", { bungalow }))) {
    return;
  }

  const submitUrl = window.APP_CONFIG.submitUrl;

  if (state.connectionStatus === "offline" || !submitUrl) {
    state.members = state.members.filter(m => m.index.toString() !== index.toString());
    applyFilters();
    showToast(t("toast.delLocal"));
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
          showToast(t("toast.delSaved"));
        }, 300);
      } else {
        applyFilters();
        showToast(t("toast.delSaved"));
      }
    } else {
      throw new Error(result.message || "Delete rejected by Apps Script");
    }
  } catch (error) {
    console.error("Delete Failed:", error);
    showToast(t("toast.delFail"));
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
  elements.additionalPendingAmount.classList.remove("invalid");
  elements.lastBillNumber.classList.remove("invalid");
  elements.bungalowError.textContent = "";
  elements.ownerNameError.textContent = "";
  elements.rateError.textContent = "";
  elements.remainingMonthsError.textContent = "";
  elements.additionalPendingAmountError.textContent = "";
  elements.lastBillNumberError.textContent = "";

  let isValid = true;

  const bungalowVal = elements.bungalow.value.trim();
  const ownerVal = elements.ownerName.value.trim();
  const rateVal = Number(elements.rate.value);
  const remainingMonthsVal = Number(elements.remainingMonths.value);
  const additionalPendingAmountRaw = elements.additionalPendingAmount.value.trim();
  const additionalPendingAmountVal = additionalPendingAmountRaw ? Number(additionalPendingAmountRaw) : 0;
  const additionalPendingNoteVal = elements.additionalPendingNote.value.trim();
  const lastBillNumberVal = elements.lastBillNumber.value.trim();

  if (!bungalowVal) {
    elements.bungalow.classList.add("invalid");
    elements.bungalowError.textContent = t("err.bungalow");
    isValid = false;
  }

  if (!ownerVal) {
    elements.ownerName.classList.add("invalid");
    elements.ownerNameError.textContent = t("err.owner");
    isValid = false;
  }

  if (isNaN(rateVal) || rateVal < 0) {
    elements.rate.classList.add("invalid");
    elements.rateError.textContent = t("err.rate");
    isValid = false;
  }

  if (isNaN(remainingMonthsVal) || remainingMonthsVal < 0) {
    elements.remainingMonths.classList.add("invalid");
    elements.remainingMonthsError.textContent = t("err.months");
    isValid = false;
  }

  if (isNaN(additionalPendingAmountVal) || additionalPendingAmountVal < 0) {
    elements.additionalPendingAmount.classList.add("invalid");
    elements.additionalPendingAmountError.textContent = t("err.additionalPendingAmount");
    isValid = false;
  }

  if (lastBillNumberVal && !/^[\d\-\/]+$/.test(lastBillNumberVal)) {
    elements.lastBillNumber.classList.add("invalid");
    elements.lastBillNumberError.textContent = t("err.bill");
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
    paymentDate: elements.paymentDate.value,
    monthsDesc: elements.monthsDesc.value.trim(),
    additionalPendingAmount: additionalPendingAmountVal,
    additionalPendingNote: additionalPendingNoteVal,
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
      showToast(t("toast.updLocal"));
      const paymentInfo = detectPaymentFromEdit(memberBeforeEdit, newRecord);
      if (paymentInfo) {
        promptPaymentThankYou(newRecord, paymentInfo);
      }
    } else {
      state.members.push(newRecord);
      showToast(t("toast.addLocal"));
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
        showToast(t("toast.updSaved"));
        const paymentInfo = detectPaymentFromEdit(memberBeforeEdit, updatedRecord);
        if (paymentInfo) {
          promptPaymentThankYou(updatedRecord, paymentInfo);
        }
      } else {
        state.members.push(updatedRecord);
        showToast(t("toast.addSaved"));
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
    showToast(t("toast.saveFail"));
  } finally {
    elements.submitBtn.disabled = false;
    elements.submitBtn.classList.remove("loading");
  }
}

// Event Listeners setup
function setupEventListeners() {
  // Language toggle
  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.getAttribute("data-lang-btn");
      if (!window.I18N || next === window.I18N.getLang()) return;
      window.I18N.setLang(next, () => {
        if (state.connectionStatus === "online") updateSyncStatusLabel("online");
        else if (state.connectionStatus === "offline") updateSyncStatusLabel("offline");
        applyFilters();
        if (state.advancePayIndex) updateAdvanceCalcDisplay();
      });
    });
  });

  // Tap sync status to retry when offline
  elements.syncStatusLabel.addEventListener("click", () => {
    if (state.connectionStatus === "offline") {
      fetchData();
    }
  });

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

  // Last Bill Number − and / buttons
  document.querySelectorAll(".bill-char-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      insertBillNumberChar(btn.dataset.char || "");
    });
  });

  // WhatsApp thank-you modal
  if (elements.waOpenBtn) {
    elements.waOpenBtn.addEventListener("click", () => {
      if (!state.pendingWhatsApp) return;
      const { member, message } = state.pendingWhatsApp;
      closeWhatsAppModal();
      openWhatsApp(member, message);
    });
  }
  if (elements.waSkipBtn) {
    elements.waSkipBtn.addEventListener("click", closeWhatsAppModal);
  }
  if (elements.waCloseBtn) {
    elements.waCloseBtn.addEventListener("click", closeWhatsAppModal);
  }
  if (elements.waOverlay) {
    elements.waOverlay.addEventListener("click", (e) => {
      if (e.target === elements.waOverlay) {
        closeWhatsAppModal();
      }
    });
  }

  // ESC to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (elements.modalOverlay.classList.contains("open")) {
        closeModal();
      }
      if (elements.qpOverlay.classList.contains("open")) {
        closeQuickPayModal();
      }
      if (elements.advOverlay && elements.advOverlay.classList.contains("open")) {
        closeAdvanceModal();
      }
      if (elements.waOverlay && elements.waOverlay.classList.contains("open")) {
        closeWhatsAppModal();
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

  // Advance Payment Modal listeners
  if (elements.advCancelBtn) {
    elements.advCancelBtn.addEventListener("click", closeAdvanceModal);
  }
  if (elements.advCloseBtn) {
    elements.advCloseBtn.addEventListener("click", closeAdvanceModal);
  }
  if (elements.advOverlay) {
    elements.advOverlay.addEventListener("click", (e) => {
      if (e.target === elements.advOverlay) {
        closeAdvanceModal();
      }
    });
  }
  if (elements.advForm) {
    elements.advForm.addEventListener("submit", handleAdvanceSubmit);
  }
  if (elements.advFromDate) {
    elements.advFromDate.addEventListener("change", updateAdvanceCalcDisplay);
  }
  if (elements.advUntilMonth) {
    elements.advUntilMonth.addEventListener("change", updateAdvanceCalcDisplay);
  }

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
