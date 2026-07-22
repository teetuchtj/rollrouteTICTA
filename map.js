/*
 * RollRoute — Leaflet map module.
 * Uses OpenStreetMap tiles (no API key). Status markers pair a distinct
 * SHAPE with a distinct ICON GLYPH and a distinct COLOR so meaning never
 * depends on color alone, and every marker has a white halo so it reads
 * clearly against busy map tiles.
 */
(function (global) {
  "use strict";

  // Default view: all of Thailand, not locked to any one city. Roughly
  // the country's mainland extent (Chiang Rai in the north to the
  // Malaysia border in the south, Isaan in the east to the Andaman coast).
  var THAILAND_BOUNDS = [[5.6, 97.3], [20.5, 105.7]];
  var THAILAND_CENTER = [13.5, 101.0];

  var map = null;
  var markerLayer = null;
  var pickMarker = null;
  var pickModeCallback = null;
  var userLocationMarker = null;
  var lastKnownUserLatLng = null; // in-memory only, never persisted or sent anywhere

  var SHAPE_STYLE = {
    full: "border-radius:50%;",
    partial: "border-radius:8px;",
    none: "border-radius:9px;",
    unrated: "border-radius:8px; transform:rotate(45deg);"
  };

  function statusColor(statusId) {
    var map2 = { full: "#1e7a46", partial: "#8a5a12", none: "#b23a2e", unrated: "#5b6470" };
    return map2[statusId] || map2.unrated;
  }

  function statusSwatchHTML(statusId, size) {
    size = size || 22;
    var iconName = (global.RR_STATUSES[statusId] || global.RR_STATUSES.unrated).icon;
    var shape = SHAPE_STYLE[statusId] || SHAPE_STYLE.unrated;
    var innerRotate = statusId === "unrated" ? "transform:rotate(-45deg);" : "";
    return (
      '<span style="display:inline-flex;align-items:center;justify-content:center;width:' + size + "px;height:" + size + "px;" +
      "background:" + statusColor(statusId) + ";color:#fff;box-shadow:0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,0.35);" + shape + '">' +
      '<span style="width:' + Math.round(size * 0.62) + "px;height:" + Math.round(size * 0.62) + "px;display:block;" + innerRotate + '">' +
      global.rrIcon((global.RR_STATUSES[statusId] || global.RR_STATUSES.unrated).icon) +
      "</span></span>"
    );
  }

  function buildDivIcon(statusId, delayMs, highlighted) {
    // The pop-entrance animation lives on this inner wrapper, never on the
    // .rr-marker div itself — Leaflet positions that via an inline
    // translate3d() transform, and an animated transform on the same
    // element would fight (and break) that positioning.
    var delayStyle = delayMs ? ' style="animation-delay:' + delayMs + 'ms"' : "";
    var ring = highlighted ? '<span class="rr-marker-ring" aria-hidden="true"></span>' : "";
    var html = ring + '<span class="rr-marker-pop"' + delayStyle + ">" + statusSwatchHTML(statusId, 34) + "</span>";
    return L.divIcon({
      className: "rr-marker" + (highlighted ? " rr-marker-highlighted" : ""),
      html: html,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -16]
    });
  }

  /** Small round marker for a route's start point (distinct from place pins). */
  function buildRoutePointIcon(kind) {
    var color = kind === "end" ? "#c97a1a" : "#0b5566";
    var glyph = kind === "end" ? global.rrIcon("flag") : global.rrIcon("routeDot");
    var html =
      '<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;' +
      "border-radius:50%;background:" + color + ";color:#fff;box-shadow:0 0 0 3px #fff,0 2px 6px rgba(0,0,0,0.35);\">" +
      '<span style="width:18px;height:18px;display:block;">' + glyph + "</span></span>";
    return L.divIcon({ className: "rr-marker", html: html, iconSize: [32, 32], iconAnchor: [16, 16] });
  }

  function init(containerId) {
    map = L.map(containerId, {
      zoomControl: false
    });
    map.fitBounds(THAILAND_BOUNDS);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.control.zoom({ position: "bottomleft" }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    return map;
  }

  function renderMarkers(places, onOpenDetail, highlightIds) {
    markerLayer.clearLayers();
    places.forEach(function (p, index) {
      var delay = Math.min(index * 22, 260);
      var isHighlighted = !!(highlightIds && highlightIds[p.id]);
      var marker = L.marker([p.lat, p.lng], { icon: buildDivIcon(p.status, delay, isHighlighted), alt: p.name_th, keyboard: true });
      var statusInfo = global.RR_STATUSES[p.status] || global.RR_STATUSES.unrated;
      // One tap/Enter opens the place directly — no intermediate popup step.
      // Leaflet fires "click" for both a real click and Enter/Space on a
      // focused, keyboard-enabled marker, so this covers both input modes.
      marker.on("click", function () { onOpenDetail(p.id); });
      markerLayer.addLayer(marker);
      var el = marker.getElement();
      if (el) {
        el.setAttribute("aria-label", p.name_th + " — " + statusInfo.th);
        el.setAttribute("role", "button");
      }
    });
  }

  function flyTo(lat, lng, zoom) {
    map.flyTo([lat, lng], zoom || 16, { duration: prefersReducedMotion() ? 0 : 0.6 });
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function fitToPlaces(places) {
    if (!places.length) return;
    var bounds = L.latLngBounds(places.map(function (p) { return [p.lat, p.lng]; }));
    map.fitBounds(bounds.pad(0.2));
  }

  function enablePickMode(initialLatLng, onPick) {
    disablePickMode();
    pickModeCallback = onPick;
    var startLatLng = initialLatLng || map.getCenter();
    pickMarker = L.marker(startLatLng, {
      draggable: true,
      icon: L.divIcon({
        className: "rr-marker",
        html: statusSwatchHTML("unrated", 34).replace("background:#5b6470", "background:#c97a1a"),
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      })
    }).addTo(map);
    pickMarker.on("dragend", function () {
      var ll = pickMarker.getLatLng();
      pickModeCallback && pickModeCallback(ll.lat, ll.lng);
    });
    map.on("click", onMapClickForPick);
    pickModeCallback(startLatLng.lat, startLatLng.lng);
  }

  function onMapClickForPick(e) {
    if (!pickMarker) return;
    pickMarker.setLatLng(e.latlng);
    pickModeCallback && pickModeCallback(e.latlng.lat, e.latlng.lng);
  }

  function movePickMarker(lat, lng) {
    if (pickMarker) pickMarker.setLatLng([lat, lng]);
  }

  function disablePickMode() {
    if (pickMarker) { map.removeLayer(pickMarker); pickMarker = null; }
    map.off("click", onMapClickForPick);
    pickModeCallback = null;
  }

  // "You are here" marker — a pulsing dot, deliberately NOT shaped like a
  // place pin (no status shape/glyph), so it can never be mistaken for a
  // mapped location. Position is kept in memory only (lastKnownUserLatLng)
  // for this tab's session; it is never written to storage or sent anywhere.
  function showUserLocationMarker(lat, lng) {
    lastKnownUserLatLng = [lat, lng];
    if (userLocationMarker) {
      userLocationMarker.setLatLng([lat, lng]);
      return;
    }
    var html = '<span class="rr-user-dot" aria-hidden="true"><span class="rr-user-dot-pulse"></span><span class="rr-user-dot-core"></span></span>';
    userLocationMarker = L.marker([lat, lng], {
      icon: L.divIcon({ className: "rr-user-marker", html: html, iconSize: [22, 22], iconAnchor: [11, 11] }),
      keyboard: false,
      interactive: false,
      zIndexOffset: 1000
    }).addTo(map);
  }

  function locateUser(onSuccess, onError) {
    if (!navigator.geolocation) { onError && onError("unsupported"); return; }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        showUserLocationMarker(pos.coords.latitude, pos.coords.longitude);
        onSuccess(pos.coords.latitude, pos.coords.longitude);
      },
      function (err) { onError && onError(err); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  /** Silently check (no permission prompt) whether geolocation was already
   * granted in an earlier visit, so the initial view can center there
   * without ever auto-requesting permission on load. */
  function tryAutoLocate(onSuccess) {
    if (!navigator.permissions || !navigator.permissions.query) return;
    navigator.permissions.query({ name: "geolocation" }).then(function (status) {
      if (status.state === "granted") {
        locateUser(onSuccess, function () {});
      }
    }).catch(function () {});
  }

  function resetView() {
    if (lastKnownUserLatLng) {
      flyTo(lastKnownUserLatLng[0], lastKnownUserLatLng[1], 14);
    } else {
      map.flyToBounds(THAILAND_BOUNDS, { duration: prefersReducedMotion() ? 0 : 0.6 });
    }
  }

  function invalidateSize() {
    if (map) map.invalidateSize();
  }

  function distanceMeters(lat1, lng1, lat2, lng2) {
    return L.latLng(lat1, lng1).distanceTo(L.latLng(lat2, lng2));
  }

  global.RR_MAP = {
    init: init,
    getMap: function () { return map; },
    renderMarkers: renderMarkers,
    flyTo: flyTo,
    fitToPlaces: fitToPlaces,
    enablePickMode: enablePickMode,
    disablePickMode: disablePickMode,
    movePickMarker: movePickMarker,
    locateUser: locateUser,
    tryAutoLocate: tryAutoLocate,
    showUserLocationMarker: showUserLocationMarker,
    resetView: resetView,
    statusSwatchHTML: statusSwatchHTML,
    buildRoutePointIcon: buildRoutePointIcon,
    distanceMeters: distanceMeters,
    invalidateSize: invalidateSize,
    center: function () {
      var c = map ? map.getCenter() : { lat: THAILAND_CENTER[0], lng: THAILAND_CENTER[1] };
      return [c.lat, c.lng];
    }
  };
})(window);
