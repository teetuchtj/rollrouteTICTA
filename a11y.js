/*
 * RollRoute — accessibility toolbar.
 * Text size steps, high-contrast mode, Web Speech API read-aloud (th-TH),
 * and a TH/EN language toggle. Persists preferences to localStorage.
 * Dispatches "rr:langchange" and "rr:a11ychange" on document so other
 * modules can react (re-render dynamic content, resize the map, etc).
 */
(function (global) {
  "use strict";

  var SCALE_STEPS = [1, 1.125, 1.25, 1.375];
  var SCALE_LABELS_TH = ["ปกติ", "กลาง", "ใหญ่", "ใหญ่พิเศษ"];
  var SCALE_LABELS_EN = ["Normal", "Medium", "Large", "Extra large"];

  var state = {
    scaleIndex: 0,
    highContrast: false,
    lang: "th",
    speaking: false
  };

  var els = {};

  function t(th, en) {
    return state.lang === "en" ? en : th;
  }

  function announce(msg) {
    if (!els.liveRegion) return;
    els.liveRegion.textContent = "";
    window.setTimeout(function () { els.liveRegion.textContent = msg; }, 30);
  }

  function applyFontScale() {
    document.documentElement.style.setProperty("--font-scale", SCALE_STEPS[state.scaleIndex]);
    if (els.scaleLabel) els.scaleLabel.textContent = state.scaleIndex + 1 + "/" + SCALE_STEPS.length;
    if (els.decBtn) els.decBtn.disabled = state.scaleIndex === 0;
    if (els.incBtn) els.incBtn.disabled = state.scaleIndex === SCALE_STEPS.length - 1;
    document.dispatchEvent(new CustomEvent("rr:a11ychange", { detail: { type: "fontScale" } }));
  }

  function applyContrast() {
    document.documentElement.classList.toggle("hc-mode", state.highContrast);
    if (els.contrastBtn) els.contrastBtn.setAttribute("aria-pressed", String(state.highContrast));
    document.dispatchEvent(new CustomEvent("rr:a11ychange", { detail: { type: "contrast" } }));
  }

  function applyStaticI18n() {
    document.documentElement.setAttribute("lang", state.lang === "en" ? "en" : "th");
    var nodes = document.querySelectorAll("[data-th]");
    nodes.forEach(function (node) {
      var val = node.getAttribute(state.lang === "en" ? "data-en" : "data-th");
      if (val !== null) node.textContent = val;
    });
    var ariaNodes = document.querySelectorAll("[data-th-aria]");
    ariaNodes.forEach(function (node) {
      var val = node.getAttribute(state.lang === "en" ? "data-en-aria" : "data-th-aria");
      if (val !== null) node.setAttribute("aria-label", val);
    });
    var phNodes = document.querySelectorAll("[data-th-placeholder]");
    phNodes.forEach(function (node) {
      var val = node.getAttribute(state.lang === "en" ? "data-en-placeholder" : "data-th-placeholder");
      if (val !== null) node.setAttribute("placeholder", val);
    });
    if (els.langBtn) {
      els.langBtn.querySelector(".a11y-lang-code").textContent = state.lang === "en" ? "TH" : "EN";
      els.langBtn.setAttribute("aria-label", t("เปลี่ยนเป็นภาษาอังกฤษ", "Switch to Thai"));
    }
    document.title = t(
      "RollRoute — แผนที่ความเข้าถึงสำหรับรถเข็นในไทย",
      "RollRoute — Wheelchair accessibility map for Thailand"
    );
  }

  function setLang(lang) {
    state.lang = lang;
    global.RR_STORE && global.RR_STORE.setPrefs({ lang: lang });
    applyStaticI18n();
    document.dispatchEvent(new CustomEvent("rr:langchange", { detail: { lang: lang } }));
    announce(t("เปลี่ยนภาษาเป็นไทยแล้ว", "Language switched to English"));
  }

  function getReadableText() {
    var region = document.querySelector('[data-readable-active="true"]');
    if (!region) region = document.getElementById("readable-default");
    if (!region) return "";
    var clone = region.cloneNode(true);
    clone.querySelectorAll("[data-readable-skip]").forEach(function (n) { n.remove(); });
    return clone.innerText || clone.textContent || "";
  }

  function pickThaiVoice() {
    var voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].lang && voices[i].lang.toLowerCase().indexOf("th") === 0) return voices[i];
    }
    return null;
  }

  function stopSpeaking() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    state.speaking = false;
    updateSpeakBtn();
  }

  function toggleSpeak() {
    if (!("speechSynthesis" in window)) {
      announce(t("เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง", "This browser does not support read-aloud"));
      return;
    }
    if (state.speaking) {
      stopSpeaking();
      return;
    }
    var text = getReadableText();
    if (!text || !text.trim()) {
      announce(t("ไม่มีข้อความให้อ่านในขณะนี้", "No text to read right now"));
      return;
    }
    var utter = new SpeechSynthesisUtterance(text.trim().slice(0, 3000));
    utter.lang = "th-TH";
    var voice = pickThaiVoice();
    if (voice) utter.voice = voice;
    utter.rate = 0.98;
    utter.onend = function () { state.speaking = false; updateSpeakBtn(); };
    utter.onerror = function () { state.speaking = false; updateSpeakBtn(); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    state.speaking = true;
    updateSpeakBtn();
  }

  function updateSpeakBtn() {
    if (!els.speakBtn) return;
    els.speakBtn.setAttribute("aria-pressed", String(state.speaking));
    els.speakBtn.innerHTML =
      (state.speaking ? global.rrIcon("speakerOff") : global.rrIcon("speaker")) +
      '<span data-th="' + (state.speaking ? "หยุดอ่าน" : "อ่านออกเสียง") + '" data-en="' + (state.speaking ? "Stop" : "Read aloud") + '">' +
      t(state.speaking ? "หยุดอ่าน" : "อ่านออกเสียง", state.speaking ? "Stop" : "Read aloud") +
      "</span>";
  }

  function buildBar(container) {
    container.innerHTML =
      '<div class="a11y-group" role="group" aria-label="' + t("ขนาดตัวอักษร", "Text size") + '">' +
        '<button type="button" class="a11y-btn icon-only" id="a11y-dec" data-th-aria="ลดขนาดตัวอักษร" data-en-aria="Decrease text size">' + global.rrIcon("textSize") + "<span aria-hidden=\"true\">−</span></button>" +
        '<span class="a11y-scale-label" id="a11y-scale-label" aria-hidden="true">1/4</span>' +
        '<button type="button" class="a11y-btn icon-only" id="a11y-inc" data-th-aria="เพิ่มขนาดตัวอักษร" data-en-aria="Increase text size">' + global.rrIcon("textSize") + "<span aria-hidden=\"true\">+</span></button>" +
      "</div>" +
      '<div class="a11y-group">' +
        '<button type="button" class="a11y-btn" id="a11y-contrast" aria-pressed="false" data-th-aria="สลับโหมดคอนทราสต์สูง" data-en-aria="Toggle high contrast mode">' +
          global.rrIcon("contrast") + '<span data-th="คอนทราสต์สูง" data-en="High contrast">คอนทราสต์สูง</span>' +
        "</button>" +
      "</div>" +
      '<div class="a11y-group">' +
        '<button type="button" class="a11y-btn" id="a11y-speak" aria-pressed="false" data-th-aria="อ่านหน้านี้ออกเสียง" data-en-aria="Read this page aloud">' +
          global.rrIcon("speaker") + '<span data-th="อ่านออกเสียง" data-en="Read aloud">อ่านออกเสียง</span>' +
        "</button>" +
      "</div>" +
      '<div class="a11y-group">' +
        '<button type="button" class="a11y-btn" id="a11y-lang" data-th-aria="เปลี่ยนเป็นภาษาอังกฤษ" data-en-aria="Switch to Thai">' +
          global.rrIcon("globe") + '<span class="a11y-lang-code">EN</span>' +
        "</button>" +
      "</div>";

    els.decBtn = container.querySelector("#a11y-dec");
    els.incBtn = container.querySelector("#a11y-inc");
    els.scaleLabel = container.querySelector("#a11y-scale-label");
    els.contrastBtn = container.querySelector("#a11y-contrast");
    els.speakBtn = container.querySelector("#a11y-speak");
    els.langBtn = container.querySelector("#a11y-lang");

    els.decBtn.addEventListener("click", function () {
      if (state.scaleIndex > 0) { state.scaleIndex--; applyFontScale(); persistPrefs(); announceScale(); }
    });
    els.incBtn.addEventListener("click", function () {
      if (state.scaleIndex < SCALE_STEPS.length - 1) { state.scaleIndex++; applyFontScale(); persistPrefs(); announceScale(); }
    });
    els.contrastBtn.addEventListener("click", function () {
      state.highContrast = !state.highContrast;
      applyContrast();
      persistPrefs();
      announce(t(
        state.highContrast ? "เปิดโหมดคอนทราสต์สูงแล้ว" : "ปิดโหมดคอนทราสต์สูงแล้ว",
        state.highContrast ? "High contrast mode on" : "High contrast mode off"
      ));
    });
    els.speakBtn.addEventListener("click", toggleSpeak);
    els.langBtn.addEventListener("click", function () {
      setLang(state.lang === "th" ? "en" : "th");
    });
  }

  function announceScale() {
    var labels = state.lang === "en" ? SCALE_LABELS_EN : SCALE_LABELS_TH;
    announce(t("ขนาดตัวอักษร: ", "Text size: ") + labels[state.scaleIndex]);
  }

  function persistPrefs() {
    global.RR_STORE && global.RR_STORE.setPrefs({
      scaleIndex: state.scaleIndex,
      highContrast: state.highContrast,
      lang: state.lang
    });
  }

  function init(barContainerId, liveRegionId) {
    var container = document.getElementById(barContainerId);
    els.liveRegion = document.getElementById(liveRegionId);
    if (!container) return;

    var prefs = (global.RR_STORE && global.RR_STORE.getPrefs()) || {};
    state.scaleIndex = typeof prefs.scaleIndex === "number" ? prefs.scaleIndex : 0;
    state.highContrast = !!prefs.highContrast;
    state.lang = prefs.lang === "en" ? "en" : "th";

    buildBar(container);
    applyFontScale();
    applyContrast();
    applyStaticI18n();
    updateSpeakBtn();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = function () {};
    }
    window.addEventListener("beforeunload", stopSpeaking);
  }

  global.RR_A11Y = {
    init: init,
    getLang: function () { return state.lang; },
    stopSpeaking: stopSpeaking,
    t: t
  };
})(window);
