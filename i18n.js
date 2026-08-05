/**
 * English / Gujarati i18n for Ihsanpark Society Maintenance Dashboard
 */
(function () {
  const STRINGS = {
    en: {
      "lock.title": "Security PIN",
      "lock.subtitle": "Please enter PIN to access Ihsanpark Maintenance Chart",
      "lock.unlock": "Unlock",
      "lock.error": "Incorrect PIN. Access Denied.",
      "brand.subtitle": "Society Maintenance",
      "btn.add": "Add",
      "btn.addAria": "Add Member Record",
      "search.placeholder": "Search bungalow, owner, remarks...",
      "search.aria": "Search records",
      "search.clear": "Clear Search Input",
      "count.zero": "0 records listed",
      "count.one": "1 record listed",
      "count.many": "{n} records listed",
      "sync.connected": "Connected",
      "sync.notConfigured": "Not Configured",
      "sync.offline": "Offline — Tap to Retry",
      "sync.configTitle": "Add your Google Apps Script URL in config.js",
      "sync.offlineTitle": "Could not reach Google Sheet",
      "kpi.outstanding": "Total Outstanding",
      "kpi.progress": "Collection Progress",
      "kpi.ratio": "Paid vs Remaining",
      "kpi.paid": "{n} Paid",
      "kpi.remaining": "{n} Remaining",
      "tip.summary": "📊 Collection Summary: Metrics recalculate dynamically based on payment status changes. Ensure your connected Google Sheet is synced for real-time updates.",
      "nav.bungalows": "Bungalows",
      "nav.dashboard": "Dashboard",
      "nav.bungalowsAria": "Bungalow List",
      "nav.dashboardAria": "Stats Dashboard",
      "empty.title": "No matching records",
      "empty.body": "Try refining your search queries or active filters.",
      "loading": "Syncing maintenance database...",
      "status.paid": "Paid",
      "status.remaining": "Remaining",
      "advance.until": "Until {date}",
      "advance.activeTitle": "Advance maintenance active",
      "card.noOwner": "No Owner Registered",
      "card.callOwner": "Call Owner",
      "card.lastBill": "Last Bill No.:",
      "card.paymentDate": "Payment Date:",
      "card.monthlyRate": "Monthly Rate",
      "card.remaining": "Remaining",
      "card.months": "{n} Months",
      "card.outstanding": "Outstanding",
      "card.method": "Method:",
      "card.bankMoney": "Bank Money:",
      "card.edit": "Edit Record",
      "card.delete": "Delete Record",
      "card.whatsapp": "WhatsApp",
      "card.whatsappReminder": "WhatsApp Reminder",
      "card.markPaid": "Mark Paid",
      "card.advance": "Advance",
      "card.markPaidTitle": "Quick Mark Paid via Cash",
      "card.advanceTitle": "Record Advance Payment",
      "method.none": "None",
      "method.cash": "Cash",
      "method.upi": "GPay / UPI",
      "modal.addTitle": "Add Bungalow Record",
      "modal.editTitle": "Edit Bungalow Details",
      "modal.close": "Close dialog",
      "modal.bungalow": "Bungalow No.",
      "modal.status": "Status",
      "modal.owner": "Owner Name",
      "modal.phone": "Phone Number",
      "modal.lastBill": "Last Bill Number",
      "modal.paymentDate": "Payment Date",
      "modal.monthsDesc": "Month's Details / Remarks",
      "modal.rate": "Monthly Rate (₹)",
      "modal.remainingMonths": "Months Remaining",
      "modal.method": "Payment Method",
      "modal.calcOutstanding": "Calculated Outstanding:",
      "modal.cancel": "Cancel",
      "modal.addRecord": "Add Record",
      "modal.saveChanges": "Save Changes",
      "modal.bungalowPh": "e.g. A-1/A, B-10",
      "modal.ownerPh": "e.g. ઈરફાન ભાઈ મેમણ",
      "modal.phonePh": "e.g. 9876543210",
      "modal.billPh": "e.g. 6-123 or 6/123",
      "modal.monthsPh": "e.g. ઓક્ટોબર 2025 થી બાકી * 2",
      "qp.title": "Record Payment",
      "qp.bungalow": "Bungalow",
      "qp.outstanding": "Outstanding Dues",
      "qp.confirm": "Confirm Paid",
      "adv.title": "Record Advance Payment",
      "adv.rate": "Monthly Rate",
      "adv.from": "Paid From",
      "adv.until": "Paid Until (Month)",
      "adv.pending": "Pending dues",
      "adv.advance": "Advance",
      "adv.total": "Total",
      "adv.save": "Save & WhatsApp",
      "wa.title": "Payment Recorded",
      "wa.prompt": "Send a thank-you message on WhatsApp?",
      "wa.skip": "Not Now",
      "wa.open": "Open WhatsApp",
      "wa.promptPayment": "Payment saved for Bungalow {bungalow}. Tap Open WhatsApp to send thank-you to {owner}.",
      "wa.promptPaymentNoPhone": "Payment saved. No phone on record — WhatsApp will open so you can pick a contact.",
      "wa.promptAdvance": "Advance payment saved for Bungalow {bungalow}. Tap Open WhatsApp to notify {owner}.",
      "wa.promptAdvanceNoPhone": "Advance payment saved. No phone on record — WhatsApp will open so you can pick a contact.",
      "err.bungalow": "Bungalow number is required.",
      "err.owner": "Owner name is required.",
      "err.rate": "Please enter a valid rate (>=0).",
      "err.months": "Please enter a valid count (>=0).",
      "err.bill": "Use numbers only (e.g. 6-123 or 6/123).",
      "confirm.delete": "Are you sure you want to delete record for Bungalow {bungalow}?",
      "toast.configMissing": "⚠️ config.js missing or URL not set. Copy config.example.js → config.js and paste your Apps Script URL.",
      "toast.syncFailed": "⚠️ Could not load data from Google Sheet. Tap sync status to retry.",
      "toast.offlineBlocked": "⚠️ No internet or sheet not loaded. Connect and refresh to save changes.",
      "toast.advDates": "❌ Please select both start date and end month.",
      "toast.advRange": "❌ End month must be on or after the start date.",
      "toast.advLocal": "🎉 Advance payment saved locally!",
      "toast.advSaved": "🎉 Advance payment saved!",
      "toast.advFail": "❌ Sync failure. Failed to save advance payment.",
      "toast.qpLocal": "🎉 Record updated locally!",
      "toast.qpSaved": "🎉 Status updated successfully!",
      "toast.qpFail": "❌ Sync failure. Failed to update status.",
      "toast.delLocal": "🗑️ Record deleted locally!",
      "toast.delSaved": "🗑️ Record deleted successfully!",
      "toast.delFail": "❌ Sync failure. Failed to delete record.",
      "toast.updLocal": "🎉 Record updated locally!",
      "toast.addLocal": "🎉 Record added locally!",
      "toast.updSaved": "🎉 Record updated successfully!",
      "toast.addSaved": "🎉 Record added successfully!",
      "toast.saveFail": "❌ Connection error. Failed to save changes.",
      "month.one": "1 month",
      "month.many": "{n} months",
      "month.amount": "{months} (₹{amount})",
      "lang.en": "EN",
      "lang.gu": "ગુ"
    },
    gu: {
      "lock.title": "સુરક્ષા પિન",
      "lock.subtitle": "એહસાન પાર્ક મેન્ટેનન્સ ચાર્ટ ખોલવા માટે પિન દાખલ કરો",
      "lock.unlock": "અનલોક",
      "lock.error": "ખોટો પિન. પ્રવેશ નામંજૂર.",
      "brand.subtitle": "સોસાયટી મેન્ટેનન્સ",
      "btn.add": "ઉમેરો",
      "btn.addAria": "નવો રેકોર્ડ ઉમેરો",
      "search.placeholder": "બંગલો, માલિક, નોંધ શોધો...",
      "search.aria": "રેકોર્ડ શોધો",
      "search.clear": "શોધ સાફ કરો",
      "count.zero": "0 રેકોર્ડ",
      "count.one": "1 રેકોર્ડ",
      "count.many": "{n} રેકોર્ડ",
      "sync.connected": "કનેક્ટેડ",
      "sync.notConfigured": "કોન્ફિગ નથી",
      "sync.offline": "ઑફલાઇન — ફરી પ્રયાસ",
      "sync.configTitle": "config.js માં Google Apps Script URL ઉમેરો",
      "sync.offlineTitle": "Google Sheet સુધી પહોંચી શક્યા નહીં",
      "kpi.outstanding": "કુલ બાકી",
      "kpi.progress": "વસૂલાત પ્રગતિ",
      "kpi.ratio": "ચુકવેલ વિરુદ્ધ બાકી",
      "kpi.paid": "{n} ચુકવેલ",
      "kpi.remaining": "{n} બાકી",
      "tip.summary": "📊 વસૂલાત સારાંશ: પેમેન્ટ સ્ટેટસ બદલાય ત્યારે મેટ્રિક્સ તાત્કાલિક અપડેટ થાય છે. રીઅલ-ટાઇમ અપડેટ માટે Google Sheet સિંક રાખો.",
      "nav.bungalows": "બંગલા",
      "nav.dashboard": "ડેશબોર્ડ",
      "nav.bungalowsAria": "બંગલા યાદી",
      "nav.dashboardAria": "આંકડા ડેશબોર્ડ",
      "empty.title": "કોઈ રેકોર્ડ મળ્યો નહીં",
      "empty.body": "શોધ શબ્દ બદલીને ફરી પ્રયાસ કરો.",
      "loading": "મેન્ટેનન્સ ડેટા સિંક થઈ રહ્યો છે...",
      "status.paid": "ચુકવેલું",
      "status.remaining": "બાકી",
      "advance.until": "{date} સુધી",
      "advance.activeTitle": "એડવાન્સ મેન્ટેનન્સ સક્રિય",
      "card.noOwner": "માલિક નોંધાયેલ નથી",
      "card.callOwner": "માલિકને કૉલ કરો",
      "card.lastBill": "છેલ્લું બિલ નં.:",
      "card.paymentDate": "પેમેન્ટ તારીખ:",
      "card.monthlyRate": "માસિક દર",
      "card.remaining": "બાકી",
      "card.months": "{n} મહિના",
      "card.outstanding": "કુલ બાકી",
      "card.method": "પદ્ધતિ:",
      "card.bankMoney": "બેંક રકમ:",
      "card.edit": "ફેરફાર",
      "card.delete": "કાઢી નાખો",
      "card.whatsapp": "વોટ્સએપ",
      "card.whatsappReminder": "વોટ્સએપ રિમાઇન્ડર",
      "card.markPaid": "ચુકવેલું",
      "card.advance": "એડવાન્સ",
      "card.markPaidTitle": "ઝડપથી ચુકવેલું નોંધો",
      "card.advanceTitle": "એડવાન્સ પેમેન્ટ નોંધો",
      "method.none": "નથી",
      "method.cash": "રોકડા",
      "method.upi": "GPay / UPI",
      "modal.addTitle": "નવો બંગલો રેકોર્ડ",
      "modal.editTitle": "બંગલો વિગતો સંપાદિત કરો",
      "modal.close": "બંધ કરો",
      "modal.bungalow": "બંગલો નં.",
      "modal.status": "સ્થિતિ",
      "modal.owner": "માલિકનું નામ",
      "modal.phone": "ફોન નંબર",
      "modal.lastBill": "છેલ્લું બિલ નંબર",
      "modal.paymentDate": "પેમેન્ટ તારીખ",
      "modal.monthsDesc": "મહિનાની વિગત / નોંધ",
      "modal.rate": "માસિક દર (₹)",
      "modal.remainingMonths": "બાકી મહિના",
      "modal.method": "પેમેન્ટ પદ્ધતિ",
      "modal.calcOutstanding": "ગણતરી બાકી:",
      "modal.cancel": "રદ કરો",
      "modal.addRecord": "રેકોર્ડ ઉમેરો",
      "modal.saveChanges": "સાચવો",
      "modal.bungalowPh": "જેમ કે A-1/A, B-10",
      "modal.ownerPh": "જેમ કે ઈરફાન ભાઈ મેમણ",
      "modal.phonePh": "જેમ કે 9876543210",
      "modal.billPh": "જેમ કે 6-123 અથવા 6/123",
      "modal.monthsPh": "જેમ કે ઓક્ટોબર 2025 થી બાકી * 2",
      "qp.title": "પેમેન્ટ નોંધો",
      "qp.bungalow": "બંગલો",
      "qp.outstanding": "બાકી રકમ",
      "qp.confirm": "ચુકવેલું પુષ્ટિ",
      "adv.title": "એડવાન્સ પેમેન્ટ નોંધો",
      "adv.rate": "માસિક દર",
      "adv.from": "થી ચુકવેલું",
      "adv.until": "સુધી (મહિનો)",
      "adv.pending": "બાકી મહિના",
      "adv.advance": "એડવાન્સ",
      "adv.total": "કુલ",
      "adv.save": "સાચવો અને વોટ્સએપ",
      "wa.title": "પેમેન્ટ નોંધાયું",
      "wa.prompt": "વોટ્સએપ પર આભાર સંદેશ મોકલીએ?",
      "wa.skip": "હવે નહીં",
      "wa.open": "વોટ્સએપ ખોલો",
      "wa.promptPayment": "બંગલો {bungalow} માટે પેમેન્ટ સાચવ્યું. {owner} ને આભાર મોકલવા વોટ્સએપ ખોલો.",
      "wa.promptPaymentNoPhone": "પેમેન્ટ સાચવ્યું. ફોન નથી — સંપર્ક પસંદ કરવા વોટ્સએપ ખુલશે.",
      "wa.promptAdvance": "બંગલો {bungalow} માટે એડવાન્સ સાચવ્યું. {owner} ને જણાવવા વોટ્સએપ ખોલો.",
      "wa.promptAdvanceNoPhone": "એડવાન્સ સાચવ્યું. ફોન નથી — સંપર્ક પસંદ કરવા વોટ્સએપ ખુલશે.",
      "err.bungalow": "બંગલો નંબર જરૂરી છે.",
      "err.owner": "માલિકનું નામ જરૂરી છે.",
      "err.rate": "માન્ય દર દાખલ કરો (>=0).",
      "err.months": "માન્ય સંખ્યા દાખલ કરો (>=0).",
      "err.bill": "ફક્ત નંબર વાપરો (જેમ કે 6-123 અથવા 6/123).",
      "confirm.delete": "બંગલો {bungalow} નો રેકોર્ડ કાઢી નાખવો છે?",
      "toast.configMissing": "⚠️ config.js અથવા URL સેટ નથી. config.example.js ને config.js બનાવી URL મૂકો.",
      "toast.syncFailed": "⚠️ Google Sheet માંથી ડેટા લોડ ન થયો. ફરી પ્રયાસ કરો.",
      "toast.offlineBlocked": "⚠️ ઇન્ટરનેટ નથી અથવા શીટ લોડ નથી. સાચવવા માટે કનેક્ટ કરી રિફ્રેશ કરો.",
      "toast.advDates": "❌ શરૂઆત તારીખ અને અંતિમ મહિનો પસંદ કરો.",
      "toast.advRange": "❌ અંતિમ મહિનો શરૂઆત તારીખ પછીનો હોવો જોઈએ.",
      "toast.advLocal": "🎉 એડવાન્સ સ્થાનિક રીતે સાચવ્યું!",
      "toast.advSaved": "🎉 એડવાન્સ પેમેન્ટ સાચવ્યું!",
      "toast.advFail": "❌ સિંક નિષ્ફળ. એડવાન્સ સાચવી શક્યા નહીં.",
      "toast.qpLocal": "🎉 રેકોર્ડ સ્થાનિક રીતે અપડેટ થયો!",
      "toast.qpSaved": "🎉 સ્ટેટસ સફળતાપૂર્વક અપડેટ થયું!",
      "toast.qpFail": "❌ સિંક નિષ્ફળ. સ્ટેટસ અપડેટ ન થયું.",
      "toast.delLocal": "🗑️ રેકોર્ડ સ્થાનિક રીતે કાઢ્યો!",
      "toast.delSaved": "🗑️ રેકોર્ડ સફળતાપૂર્વક કાઢ્યો!",
      "toast.delFail": "❌ સિંક નિષ્ફળ. રેકોર્ડ કાઢી શક્યા નહીં.",
      "toast.updLocal": "🎉 રેકોર્ડ સ્થાનિક રીતે અપડેટ થયો!",
      "toast.addLocal": "🎉 રેકોર્ડ સ્થાનિક રીતે ઉમેરાયો!",
      "toast.updSaved": "🎉 રેકોર્ડ સફળતાપૂર્વક અપડેટ થયો!",
      "toast.addSaved": "🎉 રેકોર્ડ સફળતાપૂર્વક ઉમેરાયો!",
      "toast.saveFail": "❌ કનેક્શન ભૂલ. ફેરફાર સાચવી શક્યા નહીં.",
      "month.one": "1 મહિનો",
      "month.many": "{n} મહિના",
      "month.amount": "{months} (₹{amount})",
      "lang.en": "EN",
      "lang.gu": "ગુ"
    }
  };

  let currentLang = localStorage.getItem("appLang") === "gu" ? "gu" : "en";

  function getLang() {
    return currentLang;
  }

  function t(key, vars) {
    const dict = STRINGS[currentLang] || STRINGS.en;
    let text = dict[key] ?? STRINGS.en[key] ?? key;
    if (vars && typeof vars === "object") {
      Object.keys(vars).forEach((k) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
      });
    }
    return text;
  }

  function applyStaticI18n() {
    document.documentElement.lang = currentLang === "gu" ? "gu" : "en";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const translated = t(key);
      if (el.children.length === 1 && el.children[0].tagName === "I") {
        const icon = el.children[0];
        el.textContent = "";
        el.appendChild(icon);
        el.appendChild(document.createTextNode(" " + translated));
      } else if (el.querySelector("i, svg") && el.querySelector(".btn-text, span:not(.required)")) {
        const textEl = el.querySelector(".btn-text") || Array.from(el.querySelectorAll("span")).find((s) => !s.classList.contains("required"));
        if (textEl) textEl.textContent = translated;
        else el.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = " " + translated;
          }
        });
      } else {
        el.textContent = translated;
      }
    });

    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (key) el.innerHTML = t(key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key) el.setAttribute("placeholder", t(key));
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (key) el.setAttribute("aria-label", t(key));
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (key) el.setAttribute("title", t(key));
    });

    // Status / method select option labels (keep values)
    document.querySelectorAll("option[data-i18n-option]").forEach((opt) => {
      const key = opt.getAttribute("data-i18n-option");
      if (key) opt.textContent = t(key);
    });

    // Language toggle active state
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      const lang = btn.getAttribute("data-lang-btn");
      btn.classList.toggle("active", lang === currentLang);
    });
  }

  function setLang(next, onChange) {
    if (next !== "en" && next !== "gu") return;
    currentLang = next;
    localStorage.setItem("appLang", next);
    applyStaticI18n();
    if (typeof onChange === "function") onChange(next);
  }

  window.I18N = { t, getLang, setLang, applyStaticI18n, STRINGS };
})();
