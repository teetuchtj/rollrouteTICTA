/*
 * RollRoute — main application: rendering, search/filter, place detail,
 * and the add/rate flow. Wires together data.js, storage.js, map.js and
 * a11y.js.
 */
(function () {
  "use strict";

  var state = {
    filters: { categories: {}, statuses: {}, path: {}, query: "" },
    viewMode: "walkrun", // 'access' (accessibility-first) | 'walkrun' (default, same data, path-quality lens)
    lastFocused: null,
    addFlow: null, // { mode: 'new'|'update', place, lat, lng, category, status, features:{}, path:{}, photoDataUrl }
    activeSheet: null,
    activeHighlightIds: null,
    route: null // { startLatLng, endLatLng, routes:[], activeIndex, flaggedByRoute:[[placeId,...],...] }
  };

  /* Path-quality quick filters: each one reads naturally for a wheelchair
     user, a stroller parent, and a runner alike — one dataset, one map. */
  var PATH_FILTERS = [
    { id: "stepfree", th: "เส้นทางไม่มีขั้นบันได", en: "Step-free routes", icon: "featureEntrance",
      test: function (p) { return (p.features || []).indexOf("step_free_entrance") !== -1; } },
    { id: "paved", th: "พื้นเรียบ", en: "Paved surface", icon: "pathSurface",
      test: function (p) { return p.path && p.path.surface === "paved"; } },
    { id: "shaded", th: "มีร่มเงา", en: "Shaded", icon: "pathShade",
      test: function (p) { return p.path && (p.path.shade === "good" || p.path.shade === "partial"); } },
    { id: "lit", th: "สว่างตอนกลางคืน", en: "Lit at night", icon: "pathLight",
      test: function (p) { return p.path && (p.path.lighting === "good" || p.path.lighting === "partial"); } },
    { id: "wide", th: "กว้าง สวนกันได้", en: "Wide enough to pass", icon: "pathWidth",
      test: function (p) { return p.path && p.path.width === "wide"; } }
  ];

  function pathAttrById(id) {
    return window.RR_PATH_ATTRS.filter(function (a) { return a.id === id; })[0];
  }

  function pathOptionLabel(attr, optionId) {
    var opt = attr.options.filter(function (o) { return o.id === optionId; })[0];
    return opt ? pick(opt.th, opt.en) : null;
  }

  var FEATURE_MAX_NOTE = 220;
  var pickerMap = null;
  var pickerMarker = null;
  var routeControl = null;

  var EMERGENCY_RESULT_LIMIT = 6;
  var ROUTE_WARNING_RADIUS_M = 45;

  /* ---------------- Shared utilities: live region, distance/date formatting ---------------- */

  function announceLive(msg) {
    var live = document.getElementById("a11y-live");
    if (!live) return;
    live.textContent = "";
    window.setTimeout(function () { live.textContent = msg; }, 30);
  }

  function formatDistance(meters) {
    if (meters < 1000) return Math.round(meters) + " " + pick("ม.", "m");
    return (meters / 1000).toFixed(1) + " " + pick("กม.", "km");
  }

  function formatDuration(seconds) {
    var mins = Math.max(1, Math.round(seconds / 60));
    return mins + " " + pick("นาที", "min");
  }

  function buildPlaceUrl(placeId) {
    // Demo-only link builder: encodes a ?place= deep link off the current
    // page URL. On a real deployed https:// origin this becomes a shareable
    // link that auto-opens the place (see the deep-link check in init());
    // on a local file:// preview it still encodes correctly, it just isn't
    // reachable from another device until the site is actually hosted.
    var base = window.location.href.split("?")[0].split("#")[0];
    return base + "?place=" + encodeURIComponent(placeId);
  }

  function renderQr(container, text, size) {
    container.innerHTML = "";
    if (typeof QRCode === "undefined") {
      var link = document.createElement("a");
      link.href = text;
      link.textContent = text;
      link.target = "_blank";
      link.rel = "noopener";
      container.appendChild(link);
      return;
    }
    new QRCode(container, { text: text, width: size || 160, height: size || 160, correctLevel: QRCode.CorrectLevel.M });
  }

  /* ---------------- Utilities ---------------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function lang() { return window.RR_A11Y.getLang(); }
  function pick(th, en) { return lang() === "en" ? en : th; }

  function categoryById(id) {
    return window.RR_CATEGORIES.filter(function (c) { return c.id === id; })[0] || window.RR_CATEGORIES[window.RR_CATEGORIES.length - 1];
  }
  function featureById(id) {
    return window.RR_FEATURES.filter(function (f) { return f.id === id; })[0];
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(lang() === "en" ? "en-GB" : "th-TH", { year: "numeric", month: "short", day: "numeric" });
    } catch (e) { return iso; }
  }

  function renderStaticIcons(scope) {
    $all("[data-icon]", scope).forEach(function (el) {
      el.innerHTML = window.rrIcon(el.getAttribute("data-icon"));
    });
  }

  /* ---------------- Data / filtering ---------------- */

  function getPlaces() { return window.RR_STORE.getAllPlaces(); }

  function matchesFilters(place) {
    var f = state.filters;
    var catKeys = Object.keys(f.categories);
    if (catKeys.length && !f.categories[place.category]) return false;
    var statusKeys = Object.keys(f.statuses);
    if (statusKeys.length && !f.statuses[place.status]) return false;
    var pathKeys = Object.keys(f.path);
    for (var i = 0; i < pathKeys.length; i++) {
      var pf = PATH_FILTERS.filter(function (x) { return x.id === pathKeys[i]; })[0];
      if (pf && !pf.test(place)) return false;
    }
    if (f.query) {
      var q = f.query.trim().toLowerCase();
      var hay = (place.name_th + " " + (place.name_en || "") + " " + (place.address_th || "")).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function filteredPlaces() {
    return getPlaces().filter(matchesFilters);
  }

  function refresh() {
    var places = filteredPlaces();
    window.RR_MAP.renderMarkers(places, openDetailSheet, state.activeHighlightIds);
    updateHeaderStats();
    updateNoResults(places);
    updateCounterTargets();
  }

  function updateHeaderStats() {
    var all = getPlaces();
    var totalContrib = all.reduce(function (sum, p) { return sum + (p.contributorCount || 0); }, 0);
    var el = $("#header-stats");
    if (!el) return;
    el.innerHTML =
      "<span><strong>" + all.length + "</strong> " + pick("สถานที่", "places") + "</span>" +
      "<span><strong>" + totalContrib + "</strong> " + pick("การให้ข้อมูล", "contributions") + "</span>";
  }

  function updateNoResults(places) {
    var existing = $("#no-results-note");
    if (existing) existing.remove();
    if (places.length > 0) return;
    var note = document.createElement("div");
    note.id = "no-results-note";
    note.className = "no-results";
    note.style.position = "absolute";
    note.style.left = "50%";
    note.style.top = "50%";
    note.style.transform = "translate(-50%,-50%)";
    note.style.background = "var(--color-bg-elevated)";
    note.style.border = "1px solid var(--color-border)";
    note.style.borderRadius = "var(--radius-md)";
    note.style.zIndex = "15";
    note.style.boxShadow = "var(--shadow-md)";
    note.textContent = pick("ไม่พบสถานที่ ลองปรับตัวกรอง", "No matches. Try different filters.");
    $(".map-section").appendChild(note);
  }

  /* ---------------- Legend ---------------- */

  function renderLegend() {
    var body = $("#legend-body");
    if (!body) return;
    body.innerHTML = window.RR_STATUS_ORDER.map(function (id) {
      var s = window.RR_STATUSES[id];
      return (
        '<div class="legend-item">' +
        '<span class="legend-swatch">' + window.RR_MAP.statusSwatchHTML(id, 22) + "</span>" +
        "<span>" + pick(s.th, s.en) + "</span>" +
        "</div>"
      );
    }).join("");
  }

  /* ---------------- Filter chips ---------------- */

  function renderFilterChips() {
    var catEl = $("#filter-categories");
    var statEl = $("#filter-statuses");
    if (catEl) {
      catEl.innerHTML = window.RR_CATEGORIES.map(function (c) {
        var pressed = !!state.filters.categories[c.id];
        return (
          '<button type="button" class="chip" data-cat="' + c.id + '" aria-pressed="' + pressed + '">' +
          window.rrIcon(c.icon) + "<span>" + pick(c.th, c.en) + "</span></button>"
        );
      }).join("");
    }
    if (statEl) {
      statEl.innerHTML = window.RR_STATUS_ORDER.map(function (id) {
        var s = window.RR_STATUSES[id];
        var pressed = !!state.filters.statuses[id];
        return (
          '<button type="button" class="chip status-chip-' + id + '" data-status="' + id + '" aria-pressed="' + pressed + '">' +
          window.RR_MAP.statusSwatchHTML(id, 16) + "<span>" + pick(s.th, s.en) + "</span></button>"
        );
      }).join("");
    }

    $all("[data-cat]", catEl).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-cat");
        if (state.filters.categories[id]) delete state.filters.categories[id];
        else state.filters.categories[id] = true;
        renderFilterChips();
        refresh();
      });
    });
    $all("[data-status]", statEl).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-status");
        if (state.filters.statuses[id]) delete state.filters.statuses[id];
        else state.filters.statuses[id] = true;
        renderFilterChips();
        refresh();
      });
    });

    var pathEl = $("#filter-path");
    if (pathEl) {
      pathEl.innerHTML = PATH_FILTERS.map(function (pf) {
        var pressed = !!state.filters.path[pf.id];
        return (
          '<button type="button" class="chip" data-path-filter="' + pf.id + '" aria-pressed="' + pressed + '">' +
          window.rrIcon(pf.icon) + "<span>" + pick(pf.th, pf.en) + "</span></button>"
        );
      }).join("");
      $all("[data-path-filter]", pathEl).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-path-filter");
          if (state.filters.path[id]) delete state.filters.path[id];
          else state.filters.path[id] = true;
          renderFilterChips();
          refresh();
        });
      });
    }
  }

  /* ---------------- Sheets (generic) ---------------- */

  function focusablesIn(el) {
    return $all('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', el)
      .filter(function (n) { return !n.disabled && n.offsetParent !== null; });
  }

  function openSheet(sheetEl) {
    state.lastFocused = document.activeElement;
    $("#sheet-backdrop").classList.add("open");
    sheetEl.classList.add("open");
    sheetEl.setAttribute("data-readable-active", "true");
    $("#readable-default").setAttribute("data-readable-active", "false");
    state.activeSheet = sheetEl;
    document.body.style.overflow = "hidden";
    window.setTimeout(function () {
      var f = focusablesIn(sheetEl);
      if (f.length) f[0].focus();
    }, 50);
  }

  function closeSheet(sheetEl) {
    sheetEl.classList.remove("open");
    sheetEl.setAttribute("data-readable-active", "false");
    $("#sheet-backdrop").classList.remove("open");
    document.body.style.overflow = "";
    state.activeSheet = null;
    window.RR_A11Y.stopSpeaking();
    if (!$("#detail-sheet").classList.contains("open") && !$("#add-sheet").classList.contains("open")) {
      $("#readable-default").setAttribute("data-readable-active", "true");
    }
    if (state.lastFocused && document.body.contains(state.lastFocused)) state.lastFocused.focus();
  }

  var ALL_SHEET_SELECTORS = ["#detail-sheet", "#add-sheet", "#route-sheet", "#nearby-sheet", "#claim-sheet"];

  function closeAllSheets() {
    ALL_SHEET_SELECTORS.forEach(function (sel) {
      var el = $(sel);
      if (el && el.classList.contains("open")) closeSheet(el);
    });
    if (routeControl) {
      window.RR_MAP.getMap().removeControl(routeControl);
      routeControl = null;
    }
    if (state.activeHighlightIds) {
      state.activeHighlightIds = null;
      refresh();
    }
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" && e.key !== "Tab") return;
    if (!state.activeSheet) return;
    if (e.key === "Escape") { closeAllSheets(); return; }
    var f = focusablesIn(state.activeSheet);
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  $("#sheet-backdrop") && $("#sheet-backdrop").addEventListener("click", closeAllSheets);
  $("#detail-sheet-close") && $("#detail-sheet-close").addEventListener("click", closeAllSheets);
  $("#add-sheet-close") && $("#add-sheet-close").addEventListener("click", function () {
    if (pickerMap) { pickerMap.remove(); pickerMap = null; }
    closeAllSheets();
  });
  $("#route-sheet-close") && $("#route-sheet-close").addEventListener("click", closeAllSheets);
  $("#nearby-sheet-close") && $("#nearby-sheet-close").addEventListener("click", closeAllSheets);
  $("#claim-sheet-close") && $("#claim-sheet-close").addEventListener("click", closeAllSheets);

  /* ---------------- Place detail sheet ---------------- */

  function openDetailSheet(placeId) {
    var place = window.RR_STORE.getPlace(placeId);
    if (!place) return;
    renderDetailContent(place);
    openSheet($("#detail-sheet"));
  }

  function renderDetailContent(place) {
    state.currentDetailId = place.id;
    var statusInfo = window.RR_STATUSES[place.status] || window.RR_STATUSES.unrated;
    var cat = categoryById(place.category);

    $("#detail-sheet-title").textContent = place.name_th || place.name_en;

    var presentFeatures = (place.features || []).map(featureById).filter(Boolean);
    var featuresHtml = presentFeatures.length
      ? presentFeatures.map(function (f) {
          return '<div class="feature-item">' + window.rrIcon(f.icon) + "<span>" + pick(f.th, f.en) + "</span></div>";
        }).join("")
      : '<p class="form-hint" style="margin:0">' + pick("ยังไม่มีการระบุสิ่งอำนวยความสะดวก", "No facilities recorded yet") + "</p>";

    var notesHtml = (place.notes && place.notes.length)
      ? place.notes.map(function (n) {
          return (
            '<div class="note-item"><p class="note-text">' + escapeHtml(n.text) + "</p>" +
            '<p class="note-meta">' + escapeHtml(n.author) + " · " + formatDate(n.createdAt) + "</p></div>"
          );
        }).join("")
      : '<p class="form-hint" style="margin:0">' + pick("ยังไม่มีบันทึกเพิ่มเติมจากผู้ร่วมให้ข้อมูล", "No contributor notes yet") + "</p>";

    var seedNote = place.isSeed === false ? "" :
      '<p class="form-hint">' + pick("ข้อมูลตัวอย่างเพื่อการสาธิต", "Fictional demo data") + "</p>";

    var photos = place.photos || [];
    var galleryHtml = photos.length
      ? '<h3 class="section-label">' + pick("ภาพถ่ายจากผู้ร่วมให้ข้อมูล", "Contributor photos") + '</h3>' +
        '<div class="gallery-strip" id="gallery-strip" role="group" aria-label="' + pick("ภาพถ่ายสถานที่นี้", "Photos of this place") + '">' +
          photos.map(function (ph, i) {
            return '<button type="button" class="gallery-thumb" data-photo-index="' + i + '" data-th-aria="ดูภาพขยาย ภาพที่ ' + (i + 1) + '" data-en-aria="View enlarged photo ' + (i + 1) + '" aria-label="' + pick("ดูภาพขยาย ภาพที่ " + (i + 1), "View enlarged photo " + (i + 1)) + '"><img src="' + ph.dataUrl + '" alt="" /></button>';
          }).join("") +
        "</div>" +
        '<div id="gallery-enlarged-slot"></div>'
      : "";

    var verifiedBadge = place.verifiedByOwner
      ? '<span class="badge badge-verified">' + window.rrIcon("shieldCheck") + "<span>" + pick("ยืนยันโดยเจ้าของสถานที่", "Verified by owner") + "</span></span>"
      : "";

    var pathAttrsHtml = place.path
      ? window.RR_PATH_ATTRS.map(function (attr) {
          var valueLabel = pathOptionLabel(attr, place.path[attr.id]);
          if (!valueLabel) return "";
          return '<div class="path-attr-item">' + window.rrIcon(attr.icon) +
            '<div><span class="attr-name">' + pick(attr.th, attr.en) + '</span>' +
            '<span class="attr-value">' + valueLabel + "</span></div></div>";
        }).join("")
      : '<p class="form-hint" style="margin:0">' + pick("ยังไม่มีข้อมูลเส้นทาง ช่วยเพิ่มได้ด้วยปุ่มให้ข้อมูลอัปเดต", "No path info yet — add some via the update button") + "</p>";

    var facilitiesSection =
      '<h3 class="section-label">' + pick("สิ่งอำนวยความสะดวก", "Facilities") + '</h3>' +
      '<div class="feature-list">' + featuresHtml + "</div>";
    var pathSection =
      '<h3 class="section-label">' + pick("คุณภาพเส้นทาง", "Path quality") + '</h3>' +
      '<div class="path-attr-list">' + pathAttrsHtml + "</div>";

    // Same data in both modes — only the section ORDER shifts. The
    // accessibility status banner always leads; nothing is ever hidden.
    var middleSections = state.viewMode === "walkrun"
      ? pathSection + facilitiesSection
      : facilitiesSection + pathSection;

    $("#detail-sheet-body").innerHTML =
      '<div class="detail-status-banner status-banner-' + place.status + '">' +
        window.rrIcon(statusInfo.icon) +
        '<div><div class="label">' + pick(statusInfo.th, statusInfo.en) + '</div>' +
        '<div class="sub">' + pick("ผู้ร่วมให้ข้อมูล", "Contributors") + " " + (place.contributorCount || 0) + " " + pick("คน", "") +
          " · " + pick("อัปเดตล่าสุด", "Last updated") + " " + formatDate(place.lastUpdated) + "</div></div>" +
      "</div>" +
      '<div class="detail-meta">' +
        verifiedBadge +
        '<span class="badge">' + window.rrIcon(cat.icon) + "<span>" + pick(cat.th, cat.en) + "</span></span>" +
        (place.address_th ? '<span class="badge">' + window.rrIcon("mapPin") + "<span>" + escapeHtml(place.address_th) + "</span></span>" : "") +
      "</div>" +
      seedNote +
      middleSections +
      galleryHtml +
      '<h3 class="section-label">' + pick("บันทึกจากผู้ร่วมให้ข้อมูล", "Contributor notes") + '</h3>' +
      '<div class="note-list">' + notesHtml + "</div>";

    if (photos.length) {
      $all("[data-photo-index]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var i = parseInt(btn.getAttribute("data-photo-index"), 10);
          var slot = $("#gallery-enlarged-slot");
          var alreadyShown = slot.getAttribute("data-shown-index") === String(i);
          if (alreadyShown) { slot.innerHTML = ""; slot.removeAttribute("data-shown-index"); return; }
          slot.innerHTML = '<div class="gallery-enlarged"><img src="' + photos[i].dataUrl + '" alt="" /></div>';
          slot.setAttribute("data-shown-index", String(i));
        });
      });
    }

    var verifyMeta = place.verifyCount
      ? pick("ยืนยันความถูกต้องแล้ว ", "Confirmed accurate ") + place.verifyCount + pick(" ครั้ง · ล่าสุด ", " times · last on ") + formatDate(place.lastVerifiedAt)
      : pick("ยังไม่มีใครยืนยันความถูกต้อง", "No one has confirmed this yet");

    var claimOrPrintHtml = place.verifiedByOwner
      ? '<button type="button" class="btn btn-ghost btn-block" id="print-sticker-btn">' + window.rrIcon("printer") + "<span>" + pick("พิมพ์สติกเกอร์ QR", "Print QR sticker") + "</span></button>"
      : '<button type="button" class="btn btn-ghost btn-block" id="claim-place-btn">' + window.rrIcon("shieldCheck") + "<span>" + pick("อ้างสิทธิ์เจ้าของสถานที่", "Claim this place") + "</span></button>";

    $("#detail-sheet-footer").innerHTML =
      '<p class="verify-meta">' + verifyMeta + "</p>" +
      '<div class="verify-row">' +
        '<button type="button" class="btn btn-primary" id="verify-confirm-btn">' + window.rrIcon("thumbsUp") + "<span>" + pick("ยังถูกต้องอยู่", "Still accurate") + "</span></button>" +
        '<button type="button" class="btn btn-ghost" id="verify-update-btn">' + window.rrIcon("edit") + "<span>" + pick("ไม่ถูกต้องแล้ว", "No longer accurate") + "</span></button>" +
      "</div>" +
      claimOrPrintHtml;

    $("#verify-confirm-btn").addEventListener("click", function () {
      var updated = window.RR_STORE.confirmStillAccurate(place.id);
      renderDetailContent(updated);
      refresh();
      showToast(pick("ขอบคุณสำหรับการยืนยัน!", "Thanks for confirming!"));
      announceLive(pick("ยืนยันความถูกต้องแล้ว", "Marked as confirmed"));
    });
    $("#verify-update-btn").addEventListener("click", function () {
      closeSheet($("#detail-sheet"));
      window.setTimeout(function () { openAddSheet("update", place); }, 220);
    });
    if (place.verifiedByOwner) {
      $("#print-sticker-btn").addEventListener("click", function () { openPrintSticker(place); });
    } else {
      $("#claim-place-btn").addEventListener("click", function () {
        closeSheet($("#detail-sheet"));
        window.setTimeout(function () { openClaimSheet(place); }, 220);
      });
    }
  }

  /* ---------------- Add / rate sheet ---------------- */

  function openAddSheet(mode, existingPlace) {
    // Pre-fill from the current data on updates (feature: "no longer
    // accurate" correction flow) so contributors only touch what's wrong.
    var prefillFeatures = {};
    if (existingPlace && existingPlace.features) {
      existingPlace.features.forEach(function (id) { prefillFeatures[id] = true; });
    }
    state.addFlow = {
      mode: mode,
      place: existingPlace || null,
      lat: existingPlace ? existingPlace.lat : window.RR_MAP.center()[0],
      lng: existingPlace ? existingPlace.lng : window.RR_MAP.center()[1],
      category: existingPlace ? existingPlace.category : null,
      status: existingPlace && existingPlace.status !== "unrated" ? existingPlace.status : null,
      features: prefillFeatures,
      path: existingPlace && existingPlace.path ? Object.assign({}, existingPlace.path) : {},
      photoDataUrl: null
    };

    $("#add-sheet-title").textContent = mode === "update"
      ? pick("ให้ข้อมูลอัปเดต", "Add an update")
      : pick("เพิ่มสถานที่ใหม่", "Add a new place");

    var locationSectionHtml = mode === "update"
      ? '<div class="location-picker"><div class="location-status">' + window.rrIcon("mapPin") +
        "<span>" + pick("กำลังให้ข้อมูลสำหรับ", "Updating") + " <strong>" + escapeHtml(existingPlace.name_th) + "</strong></span></div></div>"
      : buildLocationPickerHtml();

    var nameFieldHtml = mode === "update" ? "" :
      '<div class="form-field">' +
        '<label class="form-label" for="place-name-input" data-th="ชื่อสถานที่" data-en="Place name">' + pick("ชื่อสถานที่", "Place name") + "</label>" +
        '<input type="text" id="place-name-input" class="text-input" maxlength="80" data-th-placeholder="เช่น ร้านกาแฟริมทาง" data-en-placeholder="e.g. Corner coffee shop" placeholder="' + pick("เช่น ร้านกาแฟริมทาง", "e.g. Corner coffee shop") + '" />' +
      "</div>";

    var categoryFieldHtml = mode === "update" ? "" :
      '<div class="form-field">' +
        '<span class="form-label">' + pick("หมวดหมู่", "Category") + "</span>" +
        '<div class="category-grid" id="category-grid" role="group" aria-label="' + pick("เลือกหมวดหมู่สถานที่", "Choose place category") + '">' +
          window.RR_CATEGORIES.map(function (c) {
            return '<button type="button" class="category-choice" data-cat-choice="' + c.id + '" aria-pressed="false">' +
              window.rrIcon(c.icon) + "<span>" + pick(c.th, c.en) + "</span></button>";
          }).join("") +
        "</div></div>";

    $("#add-sheet-body").innerHTML =
      locationSectionHtml +
      nameFieldHtml +
      categoryFieldHtml +
      '<div class="form-field">' +
        '<span class="form-label">' + pick("สถานะความเข้าถึง", "Accessibility status") + "</span>" +
        '<div class="big-choice-grid" id="status-grid" role="group" aria-label="' + pick("เลือกสถานะความเข้าถึง", "Choose accessibility status") + '">' +
          ["full", "partial", "none"].map(function (id) {
            var s = window.RR_STATUSES[id];
            var pressed = state.addFlow.status === id;
            return '<button type="button" class="big-choice choice-' + id + '" data-status-choice="' + id + '" aria-pressed="' + pressed + '">' +
              window.rrIcon(s.icon) + "<span>" + pick(s.short_th, s.en) + "</span></button>";
          }).join("") +
        "</div>" +
        '<p class="form-error" id="status-error" data-th="กรุณาเลือกสถานะความเข้าถึง" data-en="Please choose an accessibility status">' + pick("กรุณาเลือกสถานะความเข้าถึง", "Please choose an accessibility status") + "</p>" +
      "</div>" +
      '<div class="form-field">' +
        '<span class="form-label">' + pick("สิ่งอำนวยความสะดวก", "Facilities") + "</span>" +
        '<div class="feature-toggle-list" id="feature-toggle-list">' +
          window.RR_FEATURES.map(function (f) {
            var pressed = !!state.addFlow.features[f.id];
            return '<button type="button" class="feature-toggle" data-feature="' + f.id + '" aria-pressed="' + pressed + '">' +
              window.rrIcon(f.icon).replace('<svg ', '<svg class="icon-feature" ') +
              "<span>" + pick(f.th, f.en) + "</span>" +
              window.rrIcon("check").replace('<svg ', '<svg class="icon-check" ') +
              "</button>";
          }).join("") +
        "</div></div>" +
      '<div class="form-field">' +
        '<span class="form-label">' + pick("คุณภาพเส้นทาง (ไม่บังคับ)", "Path quality (optional)") + "</span>" +
        '<p class="form-hint" style="margin:0 0 10px">' + pick("ข้อมูลเดียวกันนี้ช่วยทั้งผู้ใช้รถเข็น คนเข็นรถเข็นเด็ก และนักวิ่ง", "The same info helps wheelchair users, stroller parents, and runners alike") + "</p>" +
        window.RR_PATH_ATTRS.map(function (attr) {
          return '<div class="path-picker-group">' +
            '<span class="path-picker-label" id="path-label-' + attr.id + '">' + window.rrIcon(attr.icon) + "<span>" + pick(attr.th, attr.en) + "</span></span>" +
            '<div class="chip-row" role="group" aria-labelledby="path-label-' + attr.id + '">' +
              attr.options.map(function (opt) {
                var pressed = state.addFlow.path[attr.id] === opt.id;
                return '<button type="button" class="chip" data-path-attr="' + attr.id + '" data-path-option="' + opt.id + '" aria-pressed="' + pressed + '">' +
                  "<span>" + pick(opt.th, opt.en) + "</span></button>";
              }).join("") +
            "</div></div>";
        }).join("") +
      "</div>" +
      '<div class="form-field">' +
        '<span class="form-label">' + pick("ภาพถ่าย (ไม่บังคับ)", "Photo (optional)") + "</span>" +
        '<div class="photo-input-row">' +
          '<button type="button" class="btn btn-ghost" id="photo-pick-btn">' + window.rrIcon("camera") + "<span>" + pick("ถ่ายภาพ / แนบไฟล์", "Take photo / attach file") + "</span></button>" +
          '<input type="file" accept="image/*" capture="environment" id="photo-file-input" class="visually-hidden" data-th-aria="ถ่ายภาพหรือแนบไฟล์ภาพ" data-en-aria="Take a photo or attach an image file" aria-label="' + pick("ถ่ายภาพหรือแนบไฟล์ภาพ", "Take a photo or attach an image file") + '" />' +
        "</div>" +
        '<div class="photo-thumb-grid" id="photo-thumb-grid"></div>' +
      "</div>" +
      '<div class="form-field">' +
        '<label class="form-label" for="note-input">' + pick("บันทึกเพิ่มเติม (ไม่บังคับ)", "Additional note (optional)") + "</label>" +
        '<textarea id="note-input" class="textarea-input" maxlength="' + FEATURE_MAX_NOTE + '" data-th-placeholder="เช่น ทางลาดค่อนข้างชัน หรือ มีเจ้าหน้าที่ช่วยเหลือ" data-en-placeholder="e.g. the ramp is fairly steep, staff are happy to help" placeholder="' + pick("เช่น ทางลาดค่อนข้างชัน หรือ มีเจ้าหน้าที่ช่วยเหลือ", "e.g. the ramp is fairly steep, staff are happy to help") + '"></textarea>' +
        '<p class="form-hint">' + pick("ไม่ต้องใช้ข้อมูลส่วนตัว", "No personal info needed") + "</p>" +
      "</div>" +
      '<div class="form-field">' +
        '<label class="form-label" for="nickname-input">' + pick("ชื่อเล่นของคุณ (ไม่บังคับ)", "Your nickname (optional)") + "</label>" +
        '<input type="text" id="nickname-input" class="text-input" maxlength="24" value="' + escapeHtml(window.RR_STORE.getNickname()) + '" data-th-placeholder="จะแสดงแทนชื่อ ผู้ใช้นิรนาม" data-en-placeholder="Shown instead of Anonymous user" placeholder="' + pick("จะแสดงแทนชื่อ ผู้ใช้นิรนาม", "Shown instead of Anonymous user") + '" />' +
      "</div>";

    $("#add-sheet-footer").innerHTML =
      '<button type="button" class="btn btn-primary btn-block" id="submit-contribution-btn">' +
        window.rrIcon("check") + "<span>" + pick("บันทึกข้อมูล", "Save contribution") + "</span></button>";

    wireAddSheetEvents(mode, existingPlace);
    openSheet($("#add-sheet"));

    if (mode !== "update") {
      window.setTimeout(function () { initLocationPicker(state.addFlow.lat, state.addFlow.lng); }, 60);
    }
  }

  function buildLocationPickerHtml() {
    return (
      '<div class="location-picker">' +
        '<div class="location-status" id="location-status">' + window.rrIcon("mapPin") +
          "<span>" + pick("ลากหมุดเพื่อเลือกตำแหน่ง", "Drag the pin to set location") + "</span></div>" +
        '<div class="picker-action-row">' +
          '<button type="button" class="btn btn-ghost" id="use-current-location-btn">' + window.rrIcon("locate") +
            "<span>" + pick("ใช้ตำแหน่งปัจจุบันของฉัน", "Use my current location") + "</span></button>" +
        "</div>" +
        '<div class="location-picker-map" id="location-picker-map-el"></div>' +
      "</div>"
    );
  }

  function initLocationPicker(lat, lng) {
    var el = document.getElementById("location-picker-map-el");
    if (!el) return;
    if (pickerMap) { pickerMap.remove(); pickerMap = null; }
    pickerMap = L.map(el, { zoomControl: false, attributionControl: false }).setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(pickerMap);
    pickerMarker = L.marker([lat, lng], {
      draggable: true,
      icon: L.divIcon({
        className: "rr-marker",
        html: window.RR_MAP.statusSwatchHTML("unrated", 32).replace("background:#5b6470", "background:#c97a1a"),
        iconSize: [32, 32], iconAnchor: [16, 16]
      })
    }).addTo(pickerMap);
    pickerMarker.on("dragend", function () {
      var ll = pickerMarker.getLatLng();
      setPickedLocation(ll.lat, ll.lng);
    });
    pickerMap.on("click", function (e) {
      pickerMarker.setLatLng(e.latlng);
      setPickedLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  function setPickedLocation(lat, lng) {
    state.addFlow.lat = lat;
    state.addFlow.lng = lng;
    var statusEl = $("#location-status span");
    if (statusEl) {
      statusEl.textContent = pick("ตำแหน่งที่เลือก: ", "Selected location: ") + lat.toFixed(5) + ", " + lng.toFixed(5);
    }
  }

  function renderPhotoThumb(dataUrl) {
    var grid = $("#photo-thumb-grid");
    if (!grid) return;
    grid.innerHTML = dataUrl
      ? '<div class="photo-thumb"><img src="' + dataUrl + '" alt="" />' +
        '<button type="button" class="photo-thumb-remove" id="photo-remove-btn" data-th-aria="นำภาพนี้ออก" data-en-aria="Remove this photo" aria-label="' + pick("นำภาพนี้ออก", "Remove this photo") + '">' + window.rrIcon("close") + "</button></div>"
      : "";
    if (dataUrl) {
      $("#photo-remove-btn").addEventListener("click", function () {
        state.addFlow.photoDataUrl = null;
        renderPhotoThumb(null);
      });
    }
  }

  function wireAddSheetEvents(mode, existingPlace) {
    if (mode !== "update") {
      var nameInputEl = $("#place-name-input");
      if (nameInputEl) {
        nameInputEl.addEventListener("input", function () { nameInputEl.removeAttribute("aria-invalid"); });
      }
      $all("[data-cat-choice]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          $all("[data-cat-choice]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          btn.setAttribute("aria-pressed", "true");
          state.addFlow.category = btn.getAttribute("data-cat-choice");
        });
      });
      var useLocBtn = $("#use-current-location-btn");
      if (useLocBtn) {
        useLocBtn.addEventListener("click", function () {
          var original = useLocBtn.innerHTML;
          useLocBtn.disabled = true;
          window.RR_MAP.locateUser(
            function (lat, lng) {
              useLocBtn.disabled = false;
              useLocBtn.innerHTML = original;
              if (pickerMap) { pickerMap.setView([lat, lng], 16); pickerMarker.setLatLng([lat, lng]); }
              setPickedLocation(lat, lng);
            },
            function () {
              useLocBtn.disabled = false;
              useLocBtn.innerHTML = original;
              showToast(pick("ไม่สามารถระบุตำแหน่งของคุณได้ กรุณาลากหมุดบนแผนที่แทน", "Could not get your location. Please drag the pin on the map instead."));
            }
          );
        });
      }
    }

    $all("[data-status-choice]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $all("[data-status-choice]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        state.addFlow.status = btn.getAttribute("data-status-choice");
        $("#status-error").classList.remove("show");
      });
    });

    var photoPickBtn = $("#photo-pick-btn");
    var photoFileInput = $("#photo-file-input");
    if (photoPickBtn && photoFileInput) {
      photoPickBtn.addEventListener("click", function () { photoFileInput.click(); });
      photoFileInput.addEventListener("change", function () {
        var file = photoFileInput.files && photoFileInput.files[0];
        if (!file) return;
        var originalLabel = photoPickBtn.innerHTML;
        photoPickBtn.disabled = true;
        window.RR_STORE.resizePhoto(file, 640).then(function (dataUrl) {
          photoPickBtn.disabled = false;
          photoPickBtn.innerHTML = originalLabel;
          state.addFlow.photoDataUrl = dataUrl;
          renderPhotoThumb(dataUrl);
          photoFileInput.value = "";
        }).catch(function () {
          photoPickBtn.disabled = false;
          photoPickBtn.innerHTML = originalLabel;
          showToast(pick("ไม่สามารถแนบภาพนี้ได้ ลองอีกครั้ง", "Could not attach this photo. Please try again."));
          photoFileInput.value = "";
        });
      });
    }

    $all("[data-feature]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-feature");
        var pressed = btn.getAttribute("aria-pressed") === "true";
        btn.setAttribute("aria-pressed", String(!pressed));
        if (pressed) delete state.addFlow.features[id]; else state.addFlow.features[id] = true;
      });
    });

    $all("[data-path-attr]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var attrId = btn.getAttribute("data-path-attr");
        var optionId = btn.getAttribute("data-path-option");
        var wasPressed = btn.getAttribute("aria-pressed") === "true";
        $all('[data-path-attr="' + attrId + '"]').forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        if (wasPressed) {
          delete state.addFlow.path[attrId];
        } else {
          btn.setAttribute("aria-pressed", "true");
          state.addFlow.path[attrId] = optionId;
        }
      });
    });

    $("#submit-contribution-btn").addEventListener("click", function () {
      submitContribution(mode, existingPlace);
    });
  }

  function submitContribution(mode, existingPlace) {
    var flow = state.addFlow;
    if (!flow.status) {
      $("#status-error").classList.add("show");
      $("#status-grid").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    var nickname = $("#nickname-input") ? $("#nickname-input").value.trim() : "";
    window.RR_STORE.setNickname(nickname);

    var note = $("#note-input") ? $("#note-input").value.trim() : "";
    var featureIds = Object.keys(flow.features);
    var pathData = Object.keys(flow.path).length ? flow.path : null;

    if (mode === "update") {
      window.RR_STORE.addContribution(existingPlace.id, { status: flow.status, features: featureIds, note: note, photoDataUrl: flow.photoDataUrl, path: pathData });
    } else {
      var nameInput = $("#place-name-input");
      var name = nameInput ? nameInput.value.trim() : "";
      if (!name) {
        nameInput.focus();
        nameInput.setAttribute("aria-invalid", "true");
        showToast(pick("กรุณาใส่ชื่อสถานที่", "Please enter a place name"));
        return;
      }
      if (!flow.category) {
        showToast(pick("กรุณาเลือกหมวดหมู่ของสถานที่", "Please choose a category for the place"));
        $("#category-grid").scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      window.RR_STORE.addNewPlace({
        name_th: name, name_en: "", category: flow.category,
        lat: flow.lat, lng: flow.lng, status: flow.status, features: featureIds, note: note, photoDataUrl: flow.photoDataUrl, path: pathData
      });
    }

    if (pickerMap) { pickerMap.remove(); pickerMap = null; }
    closeSheet($("#add-sheet"));
    refresh();
    showToast(pick("บันทึกข้อมูลเรียบร้อยแล้ว ขอบคุณที่ช่วยกันทำแผนที่นี้", "Saved. Thank you for helping build this map."));
  }

  /* ---------------- Printable sticker (feature 5) ---------------- */

  function openPrintSticker(place) {
    var root = document.getElementById("print-sticker-root");
    var url = buildPlaceUrl(place.id);
    root.innerHTML =
      '<div class="sticker-content">' +
        '<div class="sticker-brand">RollRoute</div>' +
        '<div class="sticker-place-name">' + escapeHtml(place.name_th) + "</div>" +
        '<div class="sticker-qr" id="sticker-qr-slot"></div>' +
        '<div class="sticker-label">' + pick("ตรวจสอบความเข้าถึงได้ที่ RollRoute", "Check accessibility on RollRoute") + "</div>" +
        '<div class="sticker-label">' + escapeHtml(url) + "</div>" +
      "</div>";
    renderQr(document.getElementById("sticker-qr-slot"), url, 180);
    window.setTimeout(function () { window.print(); }, 150);
  }

  /* ---------------- Claim / verify listing (feature 5) ---------------- */

  function openClaimSheet(place) {
    renderClaimForm(place);
    openSheet($("#claim-sheet"));
  }

  function renderClaimForm(place) {
    $("#claim-sheet-title").textContent = pick("อ้างสิทธิ์: ", "Claim: ") + place.name_th;
    $("#claim-sheet-body").innerHTML =
      '<p class="claim-intro">' + pick(
        "ยืนยันว่าคุณเป็นเจ้าของหรือผู้ดูแลสถานที่นี้ เพื่อติดป้าย “ยืนยันโดยเจ้าของ” ให้ผู้ใช้คนอื่นเห็นว่าข้อมูลนี้น่าเชื่อถือเป็นพิเศษ",
        "Confirm you own or manage this place to add a “Verified by owner” badge, so other users know this listing is especially trustworthy."
      ) + "</p>" +
      '<div class="form-field">' +
        '<label class="form-label" for="claim-contact-input">' + pick("ชื่อธุรกิจ หรือบทบาทของคุณ", "Business name or your role") + "</label>" +
        '<input type="text" id="claim-contact-input" class="text-input" maxlength="60" data-th-placeholder="เช่น เจ้าของร้าน, ผู้จัดการสาขา" data-en-placeholder="e.g. Owner, Branch manager" placeholder="' + pick("เช่น เจ้าของร้าน, ผู้จัดการสาขา", "e.g. Owner, Branch manager") + '" />' +
        '<p class="form-hint">' + pick("ไม่ต้องใช้เลขบัตรประชาชนหรือข้อมูลอ่อนไหวอื่น ๆ", "No ID number or other sensitive data needed") + "</p>" +
      "</div>" +
      '<div class="claim-checkbox-row">' +
        '<input type="checkbox" id="claim-confirm-checkbox" />' +
        '<label for="claim-confirm-checkbox">' + pick("ฉันยืนยันว่าเป็นเจ้าของหรือได้รับมอบหมายให้ดูแลสถานที่นี้", "I confirm I am the owner or an authorized representative of this place") + "</label>" +
      "</div>" +
      '<p class="form-error" id="claim-error">' + pick("กรุณากรอกข้อมูลและติ๊กยืนยันก่อนส่ง", "Please fill in the field and tick the confirmation box") + "</p>" +
      '<button type="button" class="btn btn-primary btn-block" id="claim-submit-btn">' + window.rrIcon("shieldCheck") + "<span>" + pick("ยืนยันการอ้างสิทธิ์", "Confirm claim") + "</span></button>" +
      '<p class="form-hint" style="text-align:center;margin-top:10px">' + pick(
        "ขั้นตอนนี้เป็นการยืนยันแบบง่ายสำหรับต้นแบบเท่านั้น",
        "This is a simplified confirmation for the prototype only"
      ) + "</p>";

    $("#claim-submit-btn").addEventListener("click", function () {
      var contact = $("#claim-contact-input").value.trim();
      var confirmed = $("#claim-confirm-checkbox").checked;
      if (!contact || !confirmed) {
        $("#claim-error").classList.add("show");
        return;
      }
      // Production note: a real claim flow would verify `contact` against
      // an actual business registration / tax ID or a mailed verification
      // code (as e.g. Google Business Profile does) before setting
      // verifiedByOwner — this prototype only requires a single
      // self-reported confirmation step, per the brief's "no real ID
      // verification needed at this stage" constraint.
      var updated = window.RR_STORE.claimPlace(place.id, { contact: contact });
      refresh();
      announceLive(pick("อ้างสิทธิ์สถานที่นี้สำเร็จแล้ว", "This place has been claimed"));
      renderClaimSuccess(updated);
    });
  }

  function renderClaimSuccess(place) {
    var url = buildPlaceUrl(place.id);
    $("#claim-sheet-body").innerHTML =
      '<div class="claim-success">' +
        '<div class="claim-success-badge">' + window.rrIcon("shieldCheck") + "<span>" + pick("ยืนยันโดยเจ้าของสถานที่แล้ว", "Verified by owner") + "</span></div>" +
        '<p class="claim-intro">' + pick("พิมพ์สติกเกอร์นี้ไปติดที่หน้าร้าน ให้ลูกค้าสแกนเพื่อดูข้อมูลความเข้าถึงได้ทันที", "Print this sticker and post it at your entrance so visitors can scan it to see accessibility info instantly.") + "</p>" +
        '<div class="qr-box" id="claim-qr-slot"></div>' +
        '<p class="qr-caption">' + escapeHtml(url) + "</p>" +
        '<button type="button" class="btn btn-primary btn-block" id="claim-print-btn">' + window.rrIcon("printer") + "<span>" + pick("พิมพ์สติกเกอร์", "Print sticker") + "</span></button>" +
      "</div>";
    renderQr(document.getElementById("claim-qr-slot"), url, 170);
    $("#claim-print-btn").addEventListener("click", function () { openPrintSticker(place); });
  }

  /* ---------------- Nearby places / emergency nearest point ----------------
     One shared "find places near me, sorted by distance" flow, powering
     two entry points: the prominent near-me CTA (broad — anything rated
     accessible) and the emergency shortcut tucked in the More menu
     (narrow — specifically restrooms/hospitals/transit/government that
     are fully accessible). Same list UI, same location/sort logic. */

  function nearbyPlaces(mode) {
    if (mode === "emergency") {
      return getPlaces().filter(function (p) {
        if (p.status !== "full") return false;
        var features = p.features || [];
        return features.indexOf("accessible_restroom") !== -1 ||
          p.category === "hospital" || p.category === "transit" || p.category === "government";
      });
    }
    return getPlaces().filter(function (p) { return p.status === "full" || p.status === "partial"; });
  }

  function openNearbySheet(mode) {
    dismissCoachHint();
    $("#nearby-sheet-title").textContent = mode === "emergency"
      ? pick("จุดเข้าถึงได้ที่ใกล้ที่สุด", "Nearest accessible points")
      : pick("สถานที่ใกล้คุณ", "Places near you");
    renderNearbyLoading();
    openSheet($("#nearby-sheet"));
    window.RR_MAP.locateUser(
      function (lat, lng) { onNearbyLocated(mode, lat, lng); },
      function () { onNearbyLocationError(mode); }
    );
  }

  function renderNearbyLoading() {
    $("#nearby-sheet-body").innerHTML =
      '<div class="nearest-state">' + window.rrIcon("locate") +
        "<p>" + pick("กำลังค้นหาตำแหน่งของคุณ...", "Finding your location...") + "</p></div>";
  }

  function onNearbyLocated(mode, lat, lng) {
    var results = nearbyPlaces(mode)
      .map(function (p) { return Object.assign({}, p, { _distance: window.RR_MAP.distanceMeters(lat, lng, p.lat, p.lng) }); })
      .sort(function (a, b) { return a._distance - b._distance; })
      .slice(0, EMERGENCY_RESULT_LIMIT);

    if (!results.length) {
      $("#nearby-sheet-body").innerHTML =
        '<div class="nearest-state">' + window.rrIcon("emergency") +
          "<p>" + pick("ไม่พบสถานที่ที่เข้าถึงได้ในฐานข้อมูลขณะนี้", "No accessible places found in the current data") + "</p></div>";
      return;
    }

    var highlightIds = {};
    results.forEach(function (p) { highlightIds[p.id] = true; });
    state.activeHighlightIds = highlightIds;
    refresh();
    window.RR_MAP.flyTo(lat, lng, 13);
    window.RR_MAP.fitToPlaces(results.concat([{ lat: lat, lng: lng }]));

    var introText = mode === "emergency"
      ? pick(
          "จุดที่เข้าถึงได้เต็มที่ ใกล้ตำแหน่งปัจจุบันของคุณที่สุด เรียงจากใกล้ไปไกล นี่ไม่ใช่บริการฉุกเฉินอย่างเป็นทางการ หากเป็นเหตุฉุกเฉินร้ายแรงให้โทร 1669",
          "Fully accessible points nearest your current location, closest first. This is not an official emergency service — for a serious emergency, call 1669."
        )
      : pick("เรียงจากใกล้ไปไกล จากตำแหน่งปัจจุบันของคุณ", "Sorted nearest first, from your current location");

    $("#nearby-sheet-body").innerHTML =
      '<p class="claim-intro">' + introText + "</p>" +
      '<div class="nearest-list">' +
        results.map(function (p, i) {
          var cat = categoryById(p.category);
          var statusInfo = window.RR_STATUSES[p.status] || window.RR_STATUSES.unrated;
          return (
            '<button type="button" class="nearest-item reveal" style="transition-delay:' + Math.min(i * 40, 240) + 'ms" data-nearest-id="' + p.id + '">' +
              '<span class="nearest-item-swatch">' + window.RR_MAP.statusSwatchHTML(p.status, 30) + "</span>" +
              '<span class="nearest-item-info"><span class="nearest-item-name">' + escapeHtml(p.name_th) + "</span>" +
                '<span class="nearest-item-meta">' + pick(cat.th, cat.en) + " · " + pick(statusInfo.th, statusInfo.en) + "</span></span>" +
              '<span class="nearest-item-distance">' + formatDistance(p._distance) + "</span>" +
            "</button>"
          );
        }).join("") +
      "</div>";

    $all("[data-nearest-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-nearest-id");
        closeAllSheets();
        window.setTimeout(function () {
          openDetailSheet(id);
          var p = window.RR_STORE.getPlace(id);
          if (p) window.RR_MAP.flyTo(p.lat, p.lng, 17);
        }, 220);
      });
    });
    setupRevealAnimations();

    announceLive(pick(results.length + " สถานที่ใกล้คุณพร้อมแล้ว", results.length + " nearby places ready"));
  }

  function onNearbyLocationError(mode) {
    $("#nearby-sheet-body").innerHTML =
      '<div class="nearest-state">' + window.rrIcon("locate") +
        "<p>" + pick("ไม่สามารถระบุตำแหน่งของคุณได้ กรุณาเปิดสิทธิ์การเข้าถึงตำแหน่ง หรือค้นหาด้วยตนเองแทน", "Could not get your location. Please allow location access, or search manually instead.") + "</p>" +
        '<button type="button" class="btn btn-primary" id="nearby-manual-search-btn">' + window.rrIcon("search") + "<span>" + pick("ค้นหาด้วยตนเอง", "Search manually") + "</span></button></div>";
    $("#nearby-manual-search-btn").addEventListener("click", function () {
      closeAllSheets();
      window.setTimeout(function () { $("#search-input").focus(); }, 220);
    });
  }

  /* ---------------- Route planning (feature 1) ---------------- */

  function placeOptionsHtml(selectedValue) {
    return getPlaces().map(function (p) {
      var sel = selectedValue === p.id ? " selected" : "";
      return '<option value="' + p.id + '"' + sel + ">" + escapeHtml(p.name_th) + "</option>";
    }).join("");
  }

  function openRouteSheet() {
    state.route = { routes: [], activeIndex: 0, flaggedByRoute: [] };
    renderRouteForm();
    openSheet($("#route-sheet"));
  }

  function renderRouteForm() {
    $("#route-sheet-body").innerHTML =
      '<div class="route-caveat">' + window.rrIcon("info") +
        "<p>" + pick(
          "เส้นทางเดินเท้าต้นแบบจากบริการทดลอง OSRM อาจไม่ครอบคลุมทุกอุปสรรค เช่น บันไดหรือทางเข้าที่ปิดกั้น โปรดใช้วิจารณญาณประกอบ",
          "Prototype walking routing via the free OSRM demo service — it may not account for every obstacle such as stairs or blocked entrances. Use your judgement alongside it."
        ) + "</p>" +
      "</div>" +
      '<div class="route-endpoint-row">' +
        '<div class="route-endpoint-fields">' +
          '<div class="form-field" style="margin-bottom:12px">' +
            '<label class="form-label" for="route-start-select">' + pick("จุดเริ่มต้น", "Start") + "</label>" +
            '<select id="route-start-select" class="text-input">' +
              '<option value="current">' + pick("ตำแหน่งปัจจุบันของฉัน", "My current location") + "</option>" +
              placeOptionsHtml(null) +
            "</select>" +
          "</div>" +
          '<div class="form-field" style="margin-bottom:0">' +
            '<label class="form-label" for="route-end-select">' + pick("จุดหมาย", "Destination") + "</label>" +
            '<select id="route-end-select" class="text-input">' +
              '<option value="">' + pick("-- เลือกจุดหมาย --", "-- choose a destination --") + "</option>" +
              '<option value="current">' + pick("ตำแหน่งปัจจุบันของฉัน", "My current location") + "</option>" +
              placeOptionsHtml(null) +
            "</select>" +
          "</div>" +
        "</div>" +
        '<button type="button" class="route-swap-btn" id="route-swap-btn" data-th-aria="สลับจุดเริ่มต้นและจุดหมาย" data-en-aria="Swap start and destination" aria-label="' + pick("สลับจุดเริ่มต้นและจุดหมาย", "Swap start and destination") + '">' + window.rrIcon("route") + "</button>" +
      "</div>" +
      '<p class="form-error" id="route-error">' + pick("กรุณาเลือกจุดเริ่มต้นและจุดหมาย", "Please choose a start and a destination") + "</p>" +
      '<div id="route-results"></div>';

    $("#route-swap-btn").addEventListener("click", function () {
      var startSel = $("#route-start-select"), endSel = $("#route-end-select");
      var tmp = startSel.value;
      startSel.value = endSel.value || "current";
      endSel.value = tmp;
    });

    $("#route-sheet-footer").innerHTML =
      '<button type="button" class="btn btn-primary btn-block" id="route-find-btn">' + window.rrIcon("route") + "<span>" + pick("ค้นหาเส้นทาง", "Find route") + "</span></button>";
    $("#route-find-btn").addEventListener("click", computeRoute);
  }

  function resolveEndpoint(value, onResolved, onError) {
    if (value === "current") {
      window.RR_MAP.locateUser(
        function (lat, lng) { onResolved({ lat: lat, lng: lng }); },
        onError
      );
      return;
    }
    var place = window.RR_STORE.getPlace(value);
    if (!place) { onError(); return; }
    onResolved({ lat: place.lat, lng: place.lng });
  }

  function computeRoute() {
    var startValue = $("#route-start-select").value;
    var endValue = $("#route-end-select").value;
    if (!startValue || !endValue) {
      $("#route-error").classList.add("show");
      return;
    }
    $("#route-error").classList.remove("show");
    var resultsEl = $("#route-results");
    resultsEl.innerHTML = '<div class="nearest-state">' + window.rrIcon("route") + "<p>" + pick("กำลังคำนวณเส้นทาง...", "Calculating route...") + "</p></div>";

    resolveEndpoint(startValue, function (start) {
      resolveEndpoint(endValue, function (end) {
        drawRoute(start, end);
      }, function () {
        resultsEl.innerHTML = "";
        showToast(pick("ไม่สามารถระบุจุดหมายได้", "Could not resolve the destination"));
      });
    }, function () {
      resultsEl.innerHTML = "";
      showToast(pick("ไม่สามารถระบุตำแหน่งปัจจุบันของคุณได้", "Could not determine your current location"));
    });
  }

  function drawRoute(start, end) {
    var map = window.RR_MAP.getMap();
    if (routeControl) { map.removeControl(routeControl); routeControl = null; }

    routeControl = L.Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
        profile: "foot",
        alternatives: true
      }),
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      createMarker: function (i, wp) {
        return L.marker(wp.latLng, { icon: window.RR_MAP.buildRoutePointIcon(i === 0 ? "start" : "end"), keyboard: false, interactive: false });
      },
      lineOptions: { styles: [{ color: "#0b5566", weight: 6, opacity: 0.88 }] },
      altLineOptions: { styles: [{ color: "#8a5a12", weight: 5, opacity: 0.55, dashArray: "2,10" }] }
    }).addTo(map);

    routeControl.on("routesfound", onRoutesFound);
    routeControl.on("routingerror", onRoutingError);
  }

  function onRoutesFound(e) {
    var notAccessiblePlaces = getPlaces().filter(function (p) { return p.status === "none"; });

    var routes = e.routes.map(function (route) {
      var flagged = notAccessiblePlaces.filter(function (place) {
        return route.coordinates.some(function (c) {
          return window.RR_MAP.distanceMeters(c.lat, c.lng, place.lat, place.lng) < ROUTE_WARNING_RADIUS_M;
        });
      });
      return { route: route, flagged: flagged };
    });

    state.route.routes = routes;
    state.route.activeIndex = 0;
    selectRouteForDisplay(0);
    announceLive(pick("พบเส้นทางแล้ว", "Route found"));
  }

  function onRoutingError() {
    $("#route-results").innerHTML =
      '<div class="route-warning">' + window.rrIcon("emergency") +
        "<div><strong>" + pick("ไม่สามารถคำนวณเส้นทางได้", "Could not calculate a route") + "</strong>" +
        "<p>" + pick("บริการทดลอง OSRM อาจไม่พบเส้นทางสำหรับจุดนี้ ลองเลือกจุดที่ใกล้ถนนมากขึ้น หรือลองใหม่อีกครั้ง", "The free OSRM demo could not find a route for these points. Try points closer to a road, or try again.") + "</p></div>" +
      "</div>";
    announceLive(pick("ไม่สามารถคำนวณเส้นทางได้", "Could not calculate a route"));
  }

  function selectRouteForDisplay(index) {
    state.route.activeIndex = index;
    var entry = state.route.routes[index];
    var route = entry.route;
    var flagged = entry.flagged;

    var highlightIds = {};
    flagged.forEach(function (p) { highlightIds[p.id] = true; });
    state.activeHighlightIds = Object.keys(highlightIds).length ? highlightIds : null;
    refresh();

    var warningHtml = flagged.length
      ? '<div class="route-warning">' + window.rrIcon("emergency") +
          "<div><strong>" + pick("เส้นทางนี้ผ่านใกล้จุดที่เข้าถึงไม่ได้", "This route passes near a point marked not accessible") + "</strong>" +
          "<p>" + pick("อาจมีบันไดหรือสิ่งกีดขวาง — เป็นการแจ้งเตือนแบบประมาณการเท่านั้น", "There may be stairs or an obstruction — this is a best-effort estimate only.") + "</p>" +
          '<div class="route-warning-list">' +
            flagged.map(function (p) {
              return '<button type="button" data-flagged-id="' + p.id + '">' + escapeHtml(p.name_th) + "</button>";
            }).join("") +
          "</div></div></div>"
      : "";

    var altListHtml = state.route.routes.length > 1
      ? '<div class="route-alt-list" role="group" aria-label="' + pick("เส้นทางเลือก", "Alternative routes") + '">' +
          state.route.routes.map(function (r, i) {
            var flagCount = r.flagged.length;
            var flagLabel = flagCount
              ? pick(flagCount + " จุดที่มีปัญหา", flagCount + " flagged point" + (flagCount > 1 ? "s" : ""))
              : pick("ไม่พบจุดที่มีปัญหา", "No flagged points");
            return '<button type="button" class="route-alt-item" data-route-index="' + i + '" aria-pressed="' + (i === index) + '">' +
              "<span>" + pick("เส้นทางที่ ", "Route ") + (i + 1) + " · " + formatDistance(r.route.summary.totalDistance) + "</span>" +
              '<span class="alt-flags' + (flagCount ? "" : " ok") + '">' + flagLabel + "</span></button>";
          }).join("") +
        "</div>"
      : "";

    var stepsHtml = (route.instructions || []).map(function (instr, i) {
      return (
        '<div class="route-step-item">' +
          '<span class="route-step-index">' + (i + 1) + "</span>" +
          "<div><div>" + escapeHtml(instr.text || pick("เดินตามเส้นทาง", "Continue")) + "</div>" +
          '<div class="route-step-dist">' + formatDistance(instr.distance || 0) + "</div></div>" +
        "</div>"
      );
    }).join("");

    // The public OSRM demo's "foot" profile accepts the request but, in
    // practice, returns driving-network timing (tens of km/h) rather than a
    // real walking speed — so we ignore route.summary.totalTime and
    // estimate duration ourselves from the distance at a mobility-aid
    // walking pace (~1.1 m/s) instead of showing a misleading number.
    var estimatedSeconds = route.summary.totalDistance / 1.1;

    $("#route-results").innerHTML =
      '<div class="route-summary">' +
        '<div class="route-summary-item"><strong>' + formatDistance(route.summary.totalDistance) + "</strong><span>" + pick("ระยะทาง", "Distance") + "</span></div>" +
        '<div class="route-summary-item"><strong>' + formatDuration(estimatedSeconds) + "</strong><span>" + pick("เวลาโดยประมาณ (เดิน)", "Est. time (walking)") + "</span></div>" +
      "</div>" +
      warningHtml + altListHtml +
      '<h3 class="section-label">' + pick("ขั้นตอนการเดิน (ข้อความจากระบบนำทาง เป็นภาษาอังกฤษ)", "Walking steps (from the routing engine, in English)") + '</h3>' +
      '<div class="route-steps">' + stepsHtml + "</div>";

    $all("[data-flagged-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-flagged-id");
        var p = window.RR_STORE.getPlace(id);
        if (p) window.RR_MAP.flyTo(p.lat, p.lng, 17);
      });
    });
    $all("[data-route-index]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectRouteForDisplay(parseInt(btn.getAttribute("data-route-index"), 10));
      });
    });
  }

  /* ---------------- Toast ---------------- */

  var toastTimer = null;
  function showToast(message) {
    var toast = $("#toast");
    $("#toast-message").textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("show"); }, 4200);
  }

  /* ---------------- Search / filter panel wiring ---------------- */

  function wireSearchAndFilterPanel() {
    var input = $("#search-input");
    input.addEventListener("input", function () {
      state.filters.query = input.value;
      refresh();
    });

    var toggleBtn = $("#filter-toggle");
    var panel = $("#filter-panel");
    toggleBtn.addEventListener("click", function () {
      var expanded = toggleBtn.getAttribute("aria-expanded") === "true";
      toggleBtn.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
    });

    $("#filter-reset").addEventListener("click", function () {
      state.filters.categories = {};
      state.filters.statuses = {};
      state.filters.path = {};
      renderFilterChips();
      refresh();
    });

    var legendToggle = $("#legend-toggle");
    var legendBody = $("#legend-body");
    legendToggle.addEventListener("click", function () {
      var expanded = legendToggle.getAttribute("aria-expanded") === "true";
      legendToggle.setAttribute("aria-expanded", String(!expanded));
      legendBody.style.display = expanded ? "none" : "flex";
    });
  }

  function wireLocateAndFab() {
    $("#locate-btn").addEventListener("click", function () {
      dismissCoachHint();
      var btn = $("#locate-btn");
      btn.disabled = true;
      window.RR_MAP.locateUser(
        function (lat, lng) {
          btn.disabled = false;
          window.RR_MAP.flyTo(lat, lng, 15);
          announceLive(pick("แสดงตำแหน่งปัจจุบันของคุณบนแผนที่แล้ว", "Your current location is now shown on the map"));
        },
        function () {
          btn.disabled = false;
          showToast(pick("ไม่พบตำแหน่งของคุณ ลองค้นหาสถานที่แทน", "Location unavailable — search for a place instead"));
          announceLive(pick("ไม่สามารถระบุตำแหน่งได้", "Could not determine your location"));
        }
      );
    });
    $("#nearme-cta").addEventListener("click", function () { openNearbySheet("nearby"); });
    $("#fab-add").addEventListener("click", function () { dismissCoachHint(); openAddSheet("new"); });
    $("#brand-home-link").addEventListener("click", function (e) {
      e.preventDefault();
      window.RR_MAP.resetView();
      closeAllSheets();
    });
    wireMoreMenu();
    wireCoachHint();
  }

  /* ---------------- Secondary tools menu ("More") ---------------- */

  function wireMoreMenu() {
    var fabMore = $("#fab-more");
    var menu = $("#more-menu");

    function openMenu() {
      menu.hidden = false;
      fabMore.setAttribute("aria-expanded", "true");
      var first = menu.querySelector(".more-menu-item");
      if (first) first.focus();
    }
    function closeMenu(returnFocus) {
      menu.hidden = true;
      fabMore.setAttribute("aria-expanded", "false");
      if (returnFocus) fabMore.focus();
    }

    fabMore.addEventListener("click", function () {
      if (menu.hidden) openMenu(); else closeMenu(false);
    });
    document.addEventListener("click", function (e) {
      if (!menu.hidden && !menu.contains(e.target) && e.target !== fabMore && !fabMore.contains(e.target)) {
        closeMenu(false);
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) closeMenu(true);
    });
    $("#menu-route-btn").addEventListener("click", function () {
      closeMenu(false);
      openRouteSheet();
    });
    $("#menu-emergency-btn").addEventListener("click", function () {
      closeMenu(false);
      openNearbySheet("emergency");
    });
  }

  /* ---------------- One-time coach hint ---------------- */

  var COACH_HINT_KEY = "rollroute_hint_seen_v1";

  function wireCoachHint() {
    var hint = $("#coach-hint");
    if (!hint) return;
    if (!window.localStorage.getItem(COACH_HINT_KEY)) {
      hint.hidden = false;
    }
    $("#coach-hint-dismiss").addEventListener("click", dismissCoachHint);
  }

  function dismissCoachHint() {
    var hint = $("#coach-hint");
    if (!hint || hint.hidden) return;
    hint.hidden = true;
    try { window.localStorage.setItem(COACH_HINT_KEY, "1"); } catch (e) { /* private mode — hint just reappears next visit, harmless */ }
  }

  /* ---------------- View mode (accessibility-first / walk-run lens) ---------------- */

  function setViewMode(mode, silent) {
    state.viewMode = mode === "walkrun" ? "walkrun" : "access";
    document.body.classList.toggle("mode-walkrun", state.viewMode === "walkrun");
    var accessBtn = $("#mode-access-btn");
    var walkBtn = $("#mode-walkrun-btn");
    if (accessBtn) accessBtn.setAttribute("aria-pressed", String(state.viewMode === "access"));
    if (walkBtn) walkBtn.setAttribute("aria-pressed", String(state.viewMode === "walkrun"));
    window.RR_STORE.setPrefs({ viewMode: state.viewMode });
    // If a detail sheet is open, re-render it so section emphasis follows the mode.
    if ($("#detail-sheet").classList.contains("open") && state.currentDetailId) {
      var p = window.RR_STORE.getPlace(state.currentDetailId);
      if (p) renderDetailContent(p);
    }
    if (!silent) {
      announceLive(state.viewMode === "walkrun"
        ? pick("โหมดเดิน-วิ่ง: เน้นพื้นผิว ร่มเงา และแสงสว่าง ข้อมูลการเข้าถึงยังแสดงครบ", "Walk/run mode: emphasizes surface, shade, and lighting. Accessibility data is still fully shown.")
        : pick("โหมดการเข้าถึง: เน้นสถานะสำหรับผู้ใช้รถเข็นและรถเข็นเด็ก", "Accessibility mode: emphasizes wheelchair and stroller access status."));
    }
  }

  function wireModeSwitch() {
    var accessBtn = $("#mode-access-btn");
    var walkBtn = $("#mode-walkrun-btn");
    if (!accessBtn || !walkBtn) return;
    accessBtn.addEventListener("click", function () { setViewMode("access"); });
    walkBtn.addEventListener("click", function () { setViewMode("walkrun"); });
  }

  /* ---------------- Scroll-triggered motion (reveal, counters) ---------------- */

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function setupRevealAnimations() {
    var els = $all(".reveal");
    if (!els.length) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in-view"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { observer.observe(el); });
  }

  function animateCounter(el, target, duration) {
    if (prefersReducedMotion()) { el.textContent = target.toLocaleString("th-TH"); return; }
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString("th-TH");
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  function setupCounters() {
    var counters = $all("[data-counter]");
    if (!counters.length) return;
    if (!("IntersectionObserver" in window)) {
      counters.forEach(function (el) {
        animateCounter(el, parseInt(el.getAttribute("data-counter-target"), 10) || 0, 1200);
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var target = parseInt(entry.target.getAttribute("data-counter-target"), 10) || 0;
          animateCounter(entry.target, target, 1300);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { observer.observe(el); });
  }

  function updateCounterTargets() {
    var all = getPlaces();
    var totalContrib = all.reduce(function (sum, p) { return sum + (p.contributorCount || 0); }, 0);
    var placesEl = $("#stat-places");
    var contribEl = $("#stat-contributions");
    var catEl = $("#stat-categories");
    if (placesEl) placesEl.setAttribute("data-counter-target", all.length);
    if (contribEl) contribEl.setAttribute("data-counter-target", totalContrib);
    if (catEl) catEl.setAttribute("data-counter-target", window.RR_CATEGORIES.length);
  }

  function renderCategoryStrip() {
    var row = $("#category-strip-row");
    if (!row) return;
    row.innerHTML = window.RR_CATEGORIES.map(function (c) {
      return '<span class="strip-item">' + window.rrIcon(c.icon) + "<span>" + pick(c.th, c.en) + "</span></span>";
    }).join("");
  }

  function setupScrollEffects() {
    var progress = $("#scroll-progress");
    var backToTop = $("#back-to-top");
    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var scrollTop = doc.scrollTop || document.body.scrollTop;
      var height = doc.scrollHeight - doc.clientHeight;
      var pct = height > 0 ? (scrollTop / height) * 100 : 0;
      if (progress) progress.style.width = pct + "%";
      if (backToTop) backToTop.classList.toggle("visible", scrollTop > window.innerHeight * 0.6);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
    if (backToTop) {
      backToTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      });
    }
  }

  /* ---------------- Language change re-render ---------------- */

  document.addEventListener("rr:langchange", function () {
    renderLegend();
    renderFilterChips();
    updateHeaderStats();
    renderCategoryStrip();
  });

  /* ---------------- Init ---------------- */

  function init() {
    window.RR_MAP.init("map");
    window.RR_A11Y.init("a11y-bar", "a11y-live");
    renderStaticIcons(document);
    renderLegend();
    renderFilterChips();
    renderCategoryStrip();
    wireSearchAndFilterPanel();
    wireLocateAndFab();
    wireModeSwitch();
    setViewMode((window.RR_STORE.getPrefs() || {}).viewMode || "walkrun", true);
    refresh();
    setupRevealAnimations();
    setupCounters();
    setupScrollEffects();

    // Never prompts for permission — only centers here if the browser
    // already has a previously-granted "allow" for this origin.
    window.RR_MAP.tryAutoLocate(function (lat, lng) {
      window.RR_MAP.flyTo(lat, lng, 14);
    });

    document.addEventListener("rr:a11ychange", function (e) {
      if (e.detail && e.detail.type === "fontScale") {
        window.setTimeout(function () { window.RR_MAP.invalidateSize(); }, 260);
      }
    });

    // QR "claim sticker" deep link: ?place=<id> auto-opens that place.
    var deepLinkId = new URLSearchParams(window.location.search).get("place");
    if (deepLinkId) {
      var deepLinkPlace = window.RR_STORE.getPlace(deepLinkId);
      if (deepLinkPlace) {
        window.setTimeout(function () {
          window.RR_MAP.flyTo(deepLinkPlace.lat, deepLinkPlace.lng, 16);
          openDetailSheet(deepLinkId);
        }, 500);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
