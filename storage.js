/*
 * RollRoute — persistence layer.
 * Demo storage only: seed data (js/data.js) merged with community
 * contributions kept in the browser's localStorage. No server, no
 * personal identifiers required — contributions are pseudonymous.
 */
(function (global) {
  "use strict";

  var PLACES_KEY = "rollroute_places_v1";
  var PREFS_KEY = "rollroute_prefs_v1";

  function readJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable (private mode / quota) — app still works in-memory for this session */
    }
  }

  function getOverrides() {
    return readJSON(PLACES_KEY, {});
  }

  function saveOverride(place) {
    var overrides = getOverrides();
    overrides[place.id] = place;
    writeJSON(PLACES_KEY, overrides);
  }

  function getAllPlaces() {
    var overrides = getOverrides();
    var seedIds = {};
    var result = global.RR_SEED_PLACES.map(function (seedPlace) {
      seedIds[seedPlace.id] = true;
      return overrides[seedPlace.id] ? overrides[seedPlace.id] : seedPlace;
    });
    Object.keys(overrides).forEach(function (id) {
      if (!seedIds[id]) result.push(overrides[id]);
    });
    return result;
  }

  function getPlace(id) {
    var all = getAllPlaces();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return null;
  }

  function generateId() {
    return "rr-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function getNickname() {
    var prefs = readJSON(PREFS_KEY, {});
    return prefs.nickname || "";
  }

  function setNickname(name) {
    var prefs = readJSON(PREFS_KEY, {});
    prefs.nickname = name;
    writeJSON(PREFS_KEY, prefs);
  }

  function getPrefs() {
    return readJSON(PREFS_KEY, {});
  }

  function setPrefs(partial) {
    var prefs = readJSON(PREFS_KEY, {});
    Object.keys(partial).forEach(function (k) { prefs[k] = partial[k]; });
    writeJSON(PREFS_KEY, prefs);
    return prefs;
  }

  function anonymizedAuthor() {
    var nickname = getNickname();
    if (nickname && nickname.trim()) return nickname.trim().slice(0, 24);
    return "ผู้ใช้นิรนาม " + Math.floor(1000 + Math.random() * 8999);
  }

  /**
   * Resize + re-encode a photo client-side before storing it, so a handful
   * of contributed photos don't blow past the localStorage quota. This is
   * the demo's whole "media pipeline" — in production this upload would go
   * to real object storage (e.g. S3 / Cloud Storage) behind a CDN, and the
   * place record would store a URL instead of a base64 data URI.
   */
  function resizePhoto(file, maxWidth) {
    maxWidth = maxWidth || 640;
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) { reject(new Error("not an image")); return; }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("read failed")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("decode failed")); };
        img.onload = function () {
          var scale = Math.min(1, maxWidth / img.width);
          var canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Create a brand-new place from the add/rate form.
   */
  function addNewPlace(data) {
    var place = {
      id: generateId(),
      name_th: data.name_th,
      name_en: data.name_en || "",
      category: data.category,
      lat: data.lat,
      lng: data.lng,
      address_th: data.address_th || "",
      status: data.status,
      features: data.features || [],
      path: data.path || null,
      contributorCount: 1,
      lastUpdated: nowIso(),
      lastVerifiedAt: null,
      verifyCount: 0,
      isSeed: false,
      verifiedByOwner: false,
      verifiedAt: null,
      ownerContact: "",
      photos: data.photoDataUrl
        ? [{ id: generateId(), dataUrl: data.photoDataUrl, addedAt: nowIso() }]
        : [],
      notes: data.note
        ? [{ id: generateId(), text: data.note, author: anonymizedAuthor(), createdAt: nowIso() }]
        : []
    };
    saveOverride(place);
    return place;
  }

  /**
   * Add a new community contribution (rating/update) to an existing place.
   * The latest contribution's status + feature checklist becomes the
   * place's current status, per the "keep info fresh" model; all notes
   * are retained as history so users can see how it changed over time.
   */
  function addContribution(placeId, data) {
    var existing = getPlace(placeId);
    if (!existing) return null;
    var updated = Object.assign({}, existing);
    updated.status = data.status;
    updated.features = data.features || [];
    if (data.path) updated.path = data.path;
    updated.contributorCount = (existing.contributorCount || 0) + 1;
    updated.lastUpdated = nowIso();
    updated.notes = (existing.notes || []).slice();
    if (data.note) {
      updated.notes.unshift({ id: generateId(), text: data.note, author: anonymizedAuthor(), createdAt: nowIso() });
    }
    updated.photos = (existing.photos || []).slice();
    if (data.photoDataUrl) {
      updated.photos.push({ id: generateId(), dataUrl: data.photoDataUrl, addedAt: nowIso() });
    }
    saveOverride(updated);
    return updated;
  }

  /**
   * One-tap "still accurate?" confirmation — no form, just a timestamp and
   * a counter so other users can judge freshness at a glance.
   */
  function confirmStillAccurate(placeId) {
    var existing = getPlace(placeId);
    if (!existing) return null;
    var updated = Object.assign({}, existing);
    updated.verifyCount = (existing.verifyCount || 0) + 1;
    updated.lastVerifiedAt = nowIso();
    saveOverride(updated);
    return updated;
  }

  /**
   * Venue-owner claim flow. `data.contact` is a short, non-sensitive
   * self-reported label (e.g. "Manager, Ari branch") — never a government
   * ID. Production would replace this single confirmation step with a real
   * verification pipeline (e.g. a business registration / tax ID check,
   * or a postcard-style physical mail confirmation like Google Business
   * Profile uses) before flipping verifiedByOwner to true.
   */
  function claimPlace(placeId, data) {
    var existing = getPlace(placeId);
    if (!existing) return null;
    var updated = Object.assign({}, existing);
    updated.verifiedByOwner = true;
    updated.verifiedAt = nowIso();
    updated.ownerContact = (data && data.contact) || "";
    saveOverride(updated);
    return updated;
  }

  global.RR_STORE = {
    getAllPlaces: getAllPlaces,
    getPlace: getPlace,
    addNewPlace: addNewPlace,
    addContribution: addContribution,
    confirmStillAccurate: confirmStillAccurate,
    claimPlace: claimPlace,
    resizePhoto: resizePhoto,
    getNickname: getNickname,
    setNickname: setNickname,
    getPrefs: getPrefs,
    setPrefs: setPrefs,
    generateId: generateId
  };
})(window);
