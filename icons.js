/*
 * RollRoute custom icon set — all hand-authored geometric SVG paths.
 * No emoji, no third-party icon libraries, no external logos.
 * Every status icon pairs a distinct SHAPE with a distinct GLYPH so
 * meaning never depends on color alone.
 */
(function (global) {
  "use strict";

  function svg(inner, viewBox) {
    return (
      '<svg viewBox="' + (viewBox || "0 0 24 24") + '" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      inner +
      "</svg>"
    );
  }

  var S = 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

  var ICONS = {
    /* ---- Brand mark: wheel + route ---- */
    logo: function () {
      return svg(
        '<circle cx="11" cy="13" r="7.2" ' + S + ' fill="none"/>' +
        '<circle cx="11" cy="13" r="1.6" fill="currentColor"/>' +
        '<path d="M11 13 L11 6.3 M11 13 L15.8 16.4 M11 13 L6.1 10.4" ' + S + '/>' +
        '<path d="M15.5 4.5 C18 5 20 7.4 19.6 10.6" ' + S + '/>' +
        '<circle cx="19.6" cy="4.8" r="2" fill="currentColor"/>'
      );
    },

    /* ---- Status: shape + glyph ---- */
    statusFull: function () {
      return svg(
        '<circle cx="12" cy="12" r="9.2" ' + S + '/>' +
        '<path d="M7.5 12.3 L10.4 15.2 L16.5 8.7" ' + S + '/>'
      );
    },
    statusPartial: function () {
      return svg(
        '<path d="M12 3.2 L21 19.5 L3 19.5 Z" ' + S + '/>' +
        '<path d="M7.2 15.3 H16.8" ' + S + '/>'
      );
    },
    statusNone: function () {
      return svg(
        '<rect x="3.3" y="3.3" width="17.4" height="17.4" rx="4.5" ' + S + '/>' +
        '<path d="M8.6 8.6 L15.4 15.4 M15.4 8.6 L8.6 15.4" ' + S + '/>'
      );
    },
    statusUnrated: function () {
      return svg(
        '<path d="M12 2.5 L21.5 12 L12 21.5 L2.5 12 Z" ' + S + '/>' +
        '<path d="M9.9 9.6 c0-1.6 1.3-2.7 2.7-2.7 1.5 0 2.6 1 2.6 2.4 0 1.7-2.6 1.9-2.6 3.9" ' + S + '/>' +
        '<circle cx="12.1" cy="16.1" r="0.25" fill="currentColor" ' + S + '/>'
      );
    },

    /* ---- Feature icons ---- */
    featureEntrance: function () {
      return svg(
        '<path d="M6 21 V4.6 L15 3 V21" ' + S + '/>' +
        '<path d="M6 21 H18" ' + S + '/>' +
        '<path d="M17 10 L20.4 12.6 L17 15.2" ' + S + '/>' +
        '<path d="M9 21 V13.5" ' + S + '/>'
      );
    },
    featureRamp: function () {
      return svg(
        '<path d="M3 19 H21" ' + S + '/>' +
        '<path d="M3 19 L15 7.5 H21 V19" ' + S + '/>' +
        '<circle cx="16.3" cy="15.8" r="2.1" ' + S + '/>'
      );
    },
    featureRestroom: function () {
      return svg(
        '<circle cx="9.3" cy="5.6" r="1.9" ' + S + '/>' +
        '<path d="M9.3 8.6 V13.4 M9.3 10.4 H14.2" ' + S + '/>' +
        '<circle cx="14.6" cy="16.6" r="4.4" ' + S + '/>' +
        '<path d="M9.3 13.4 L12.4 16.9" ' + S + '/>'
      );
    },
    featureElevator: function () {
      return svg(
        '<rect x="4.5" y="3" width="15" height="18" rx="2" ' + S + '/>' +
        '<path d="M10 8.5 L12 6.2 L14 8.5" ' + S + '/>' +
        '<path d="M10 15.5 L12 17.8 L14 15.5" ' + S + '/>'
      );
    },
    featureWideDoor: function () {
      return svg(
        '<rect x="5" y="3.4" width="14" height="17.2" rx="1.3" ' + S + '/>' +
        '<path d="M2 21 H22" ' + S + '/>' +
        '<path d="M6.5 3.4 L4 2 M17.5 3.4 L20 2" ' + S + '/>'
      );
    },
    featureParking: function () {
      return svg(
        '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="3.4" ' + S + '/>' +
        '<path d="M9 17 V7.4 H12.6 a2.9 2.9 0 0 1 0 5.8 H9" ' + S + '/>'
      );
    },

    /* ---- UI icons ---- */
    search: function () {
      return svg('<circle cx="10.5" cy="10.5" r="6.5" ' + S + '/><path d="M15.3 15.3 L20.5 20.5" ' + S + '/>');
    },
    filter: function () {
      return svg(
        '<path d="M4 6 H20 M7 12 H17 M10.5 18 H13.5" ' + S + '/>' +
        '<circle cx="8" cy="6" r="1.6" fill="currentColor"/>' +
        '<circle cx="16" cy="12" r="1.6" fill="currentColor"/>'
      );
    },
    close: function () {
      return svg('<path d="M5.5 5.5 L18.5 18.5 M18.5 5.5 L5.5 18.5" ' + S + '/>');
    },
    plus: function () {
      return svg('<path d="M12 4.5 V19.5 M4.5 12 H19.5" ' + S + '/>');
    },
    speaker: function () {
      return svg(
        '<path d="M4 9.5 H8 L13 5 V19 L8 14.5 H4 Z" ' + S + ' stroke-linejoin="round"/>' +
        '<path d="M16.3 8.2 a5.4 5.4 0 0 1 0 7.6 M18.8 5.7 a9 9 0 0 1 0 12.6" ' + S + '/>'
      );
    },
    speakerOff: function () {
      return svg(
        '<path d="M4 9.5 H8 L13 5 V19 L8 14.5 H4 Z" ' + S + ' stroke-linejoin="round"/>' +
        '<path d="M16 9 L20.5 15 M20.5 9 L16 15" ' + S + '/>'
      );
    },
    contrast: function () {
      return svg(
        '<circle cx="12" cy="12" r="9" ' + S + '/>' +
        '<path d="M12 3 A9 9 0 0 1 12 21 Z" fill="currentColor"/>'
      );
    },
    textSize: function () {
      return svg(
        '<path d="M4 18 L8.3 6 L12.6 18 M5.4 14 H11.2" ' + S + '/>' +
        '<path d="M14.5 18 V10.4 h2.3 a2.6 2.6 0 0 1 0 5.2 h-2.3 M14.5 13 h2.6 a2.4 2.4 0 0 1 0 4.8 h-2.9" ' + S + '/>'
      );
    },
    globe: function () {
      return svg(
        '<circle cx="12" cy="12" r="9" ' + S + '/>' +
        '<path d="M3 12 H21 M12 3 C15 6.5 15 17.5 12 21 C9 17.5 9 6.5 12 3 Z" ' + S + '/>'
      );
    },
    locate: function () {
      return svg(
        '<circle cx="12" cy="12" r="2.6" fill="currentColor"/>' +
        '<path d="M12 2.5 V6 M12 18 V21.5 M2.5 12 H6 M18 12 H21.5" ' + S + '/>' +
        '<circle cx="12" cy="12" r="7.2" ' + S + '/>'
      );
    },
    chevronDown: function () {
      return svg('<path d="M5.5 9 L12 15.5 L18.5 9" ' + S + '/>');
    },
    chevronRight: function () {
      return svg('<path d="M9 5.5 L15.5 12 L9 18.5" ' + S + '/>');
    },
    info: function () {
      return svg(
        '<circle cx="12" cy="12" r="9" ' + S + '/>' +
        '<path d="M12 11 V16.5" ' + S + '/><circle cx="12" cy="7.6" r="0.3" fill="currentColor" ' + S + '/>'
      );
    },
    clock: function () {
      return svg('<circle cx="12" cy="12" r="9" ' + S + '/><path d="M12 6.8 V12 L15.8 14.3" ' + S + '/>');
    },
    people: function () {
      return svg(
        '<circle cx="8.3" cy="8" r="2.6" ' + S + '/>' +
        '<path d="M3 19 c0-3.3 2.3-5.4 5.3-5.4 S13.6 15.7 13.6 19" ' + S + '/>' +
        '<circle cx="16.2" cy="8.6" r="2.1" ' + S + '/>' +
        '<path d="M14.8 13.9 c2.8 0 5.2 1.9 5.2 5.1" ' + S + '/>'
      );
    },
    mapPin: function () {
      return svg(
        '<path d="M12 21 C8 16.7 5 13 5 9.4 A7 7 0 0 1 19 9.4 C19 13 16 16.7 12 21 Z" ' + S + '/>' +
        '<circle cx="12" cy="9.4" r="2.4" ' + S + '/>'
      );
    },
    check: function () {
      return svg('<path d="M5 12.5 L9.5 17 L19 6.5" ' + S + '/>');
    },
    crosshair: function () {
      return svg(
        '<circle cx="12" cy="12" r="1.4" fill="currentColor"/>' +
        '<path d="M12 2.5 V8 M12 16 V21.5 M2.5 12 H8 M16 12 H21.5" ' + S + '/>'
      );
    },
    edit: function () {
      return svg(
        '<path d="M4 20 L4.6 16.4 L15.5 5.5 a2 2 0 0 1 2.8 0 l1.2 1.2 a2 2 0 0 1 0 2.8 L8.6 20.4 Z" ' + S + '/>' +
        '<path d="M13.6 7.4 L16.6 10.4" ' + S + '/>'
      );
    },
    arrowLeft: function () {
      return svg('<path d="M18.5 12 H5.5 M11 5.5 L4.5 12 L11 18.5" ' + S + '/>');
    },

    /* ---- Category icons ---- */
    catRestaurant: function () {
      return svg(
        '<path d="M6.5 2.8 V10.5 M4.5 2.8 V7.6 a2 2 0 0 0 4 0 V2.8 M6.5 10.5 V21.2" ' + S + '/>' +
        '<path d="M17 2.8 c-2 0-3.2 2-3.2 4.6 0 2 1 3.4 2.4 3.9 V21.2 M17 2.8 V21.2" ' + S + '/>'
      );
    },
    catCafe: function () {
      return svg(
        '<path d="M4.5 9 H16 V15 a5.5 5.5 0 0 1-5.5 5.5 H10 A5.5 5.5 0 0 1 4.5 15 Z" ' + S + '/>' +
        '<path d="M16 10.5 H18 a2.6 2.6 0 0 1 0 5.2 H16" ' + S + '/>' +
        '<path d="M8 2.5 c-1 1.3.6 1.7-.4 3.2 M12 2.5 c-1 1.3.6 1.7-.4 3.2" ' + S + '/>'
      );
    },
    catHospital: function () {
      return svg(
        '<circle cx="12" cy="12" r="9.3" ' + S + '/>' +
        '<path d="M12 7.5 V16.5 M7.5 12 H16.5" ' + S + '/>'
      );
    },
    catGovernment: function () {
      return svg(
        '<path d="M3.3 9.5 L12 4 L20.7 9.5 Z" ' + S + '/>' +
        '<path d="M5 9.5 V19 M9.3 9.5 V19 M14.7 9.5 V19 M19 9.5 V19 M3 19 H21" ' + S + '/>'
      );
    },
    catTransit: function () {
      return svg(
        '<rect x="4.3" y="3.5" width="15.4" height="13" rx="3" ' + S + '/>' +
        '<path d="M4.3 10.5 H19.7" ' + S + '/>' +
        '<circle cx="8" cy="19.2" r="1.3" ' + S + '/>' +
        '<circle cx="16" cy="19.2" r="1.3" ' + S + '/>' +
        '<path d="M7.5 19.2 H4.8 M16.5 19.2 H19.2" ' + S + '/>'
      );
    },
    catShop: function () {
      return svg(
        '<path d="M4 8.2 L5.2 3.5 H18.8 L20 8.2" ' + S + '/>' +
        '<path d="M4 8.2 a2.3 2.3 0 0 0 4.6 0 2.3 2.3 0 0 0 4.6 0 2.3 2.3 0 0 0 4.6 0 2.3 2.3 0 0 0 4.2 0" ' + S + '/>' +
        '<path d="M5.3 9.4 V20.5 H18.7 V9.4" ' + S + '/>'
      );
    },
    catSchool: function () {
      return svg(
        '<path d="M2.5 8.5 L12 4 L21.5 8.5 L12 13 Z" ' + S + '/>' +
        '<path d="M7 10.8 V15.5 c0 1.8 2.3 3.2 5 3.2 s5-1.4 5-3.2 V10.8" ' + S + '/>' +
        '<path d="M21.5 8.5 V15" ' + S + '/>'
      );
    },
    catPark: function () {
      return svg(
        '<path d="M12 3.3 L17 11.5 H14.6 L18.5 17.5 H5.5 L9.4 11.5 H7 Z" ' + S + ' stroke-linejoin="round"/>' +
        '<path d="M12 17.5 V21" ' + S + '/>'
      );
    },
    catTemple: function () {
      return svg(
        '<path d="M12 2.3 L14 5.2 H10 Z" ' + S + ' stroke-linejoin="round"/>' +
        '<path d="M6.5 9 L12 5.6 L17.5 9 Z" ' + S + ' stroke-linejoin="round"/>' +
        '<path d="M4.5 13 L12 8.7 L19.5 13 Z" ' + S + ' stroke-linejoin="round"/>' +
        '<path d="M5.5 13 V20.5 H18.5 V13 M9 20.5 V15.5 H15 V20.5" ' + S + '/>'
      );
    },
    catPharmacy: function () {
      return svg(
        '<rect x="3.3" y="3.3" width="17.4" height="17.4" rx="5" ' + S + '/>' +
        '<path d="M12 7.5 V16.5 M7.5 12 H16.5" ' + S + '/>'
      );
    },
    catOther: function () {
      return svg('<circle cx="12" cy="12" r="9.2" ' + S + '/><circle cx="12" cy="12" r="2.6" fill="currentColor"/>');
    },

    /* ---- Route planning ---- */
    route: function () {
      return svg(
        '<circle cx="6" cy="6" r="2.6" ' + S + '/>' +
        '<circle cx="18" cy="18" r="2.6" ' + S + '/>' +
        '<path d="M6 8.6 V13 a4 4 0 0 0 4 4 H14 a4 4 0 0 0 4 -4 v-0.4" ' + S + '/>'
      );
    },
    flag: function () {
      return svg(
        '<path d="M6 21 V3.6" ' + S + '/>' +
        '<path d="M6 4.2 H17.5 L14.6 8 L17.5 11.8 H6" ' + S + ' stroke-linejoin="round"/>'
      );
    },
    routeDot: function () {
      return svg('<circle cx="12" cy="12" r="5.5" fill="currentColor"/><circle cx="12" cy="12" r="9" ' + S + '/>');
    },

    /* ---- Verify / confirm ---- */
    thumbsUp: function () {
      return svg(
        '<path d="M7.5 20 V10.4 H4.5 V20 Z" ' + S + ' stroke-linejoin="round"/>' +
        '<path d="M7.5 10.4 L11.3 3.6 a1.8 1.8 0 0 1 3.2 1.6 L13.2 9 H18 a2 2 0 0 1 1.9 2.7 L17.7 18 a2 2 0 0 1 -1.9 1.3 H7.5" ' + S + ' stroke-linejoin="round"/>'
      );
    },

    /* ---- Photo attachment ---- */
    camera: function () {
      return svg(
        '<path d="M4 8.3 H7.4 L8.8 5.6 H15.2 L16.6 8.3 H20 a1.3 1.3 0 0 1 1.3 1.3 V18 a1.3 1.3 0 0 1 -1.3 1.3 H4 A1.3 1.3 0 0 1 2.7 18 V9.6 A1.3 1.3 0 0 1 4 8.3 Z" ' + S + ' stroke-linejoin="round"/>' +
        '<circle cx="12" cy="13.4" r="3.8" ' + S + '/>'
      );
    },
    trash: function () {
      return svg(
        '<path d="M4.5 6.5 H19.5 M9 6.5 V4.2 H15 V6.5 M6.3 6.5 L7.2 20 a1.5 1.5 0 0 0 1.5 1.4 H15.3 a1.5 1.5 0 0 0 1.5 -1.4 L17.7 6.5" ' + S + '/>' +
        '<path d="M10.2 10.5 V17 M13.8 10.5 V17" ' + S + '/>'
      );
    },

    /* ---- Emergency / nearest point ---- */
    emergency: function () {
      return svg(
        '<path d="M12 2.6 L22 20 H2 Z" ' + S + ' stroke-linejoin="round"/>' +
        '<path d="M12 9.4 V14" ' + S + '/><circle cx="12" cy="17" r="0.3" fill="currentColor" ' + S + '/>'
      );
    },
    exit: function () {
      return svg(
        '<rect x="3.3" y="3.3" width="17.4" height="17.4" rx="3" ' + S + '/>' +
        '<path d="M8.5 8 L14.5 12 L8.5 16" ' + S + '/><path d="M14.5 12 H20" ' + S + '/>'
      );
    },

    /* ---- Verified owner claim ---- */
    shieldCheck: function () {
      return svg(
        '<path d="M12 2.8 L19.5 5.6 V11.4 c0 5-3.2 8.4-7.5 9.8 c-4.3-1.4-7.5-4.8-7.5-9.8 V5.6 Z" ' + S + ' stroke-linejoin="round"/>' +
        '<path d="M8.6 12.2 L11 14.6 L15.6 9.6" ' + S + '/>'
      );
    },
    qrCode: function () {
      return svg(
        '<rect x="3.2" y="3.2" width="6.6" height="6.6" rx="1" ' + S + '/>' +
        '<rect x="14.2" y="3.2" width="6.6" height="6.6" rx="1" ' + S + '/>' +
        '<rect x="3.2" y="14.2" width="6.6" height="6.6" rx="1" ' + S + '/>' +
        '<path d="M14.2 14.6 H17.6 M14.2 18 H17.6 M20.8 14.6 V20.8 H14.2" ' + S + '/>'
      );
    },
    printer: function () {
      return svg(
        '<path d="M6.5 8.6 V3.6 H17.5 V8.6" ' + S + ' stroke-linejoin="round"/>' +
        '<rect x="3.3" y="8.6" width="17.4" height="8" rx="1.6" ' + S + '/>' +
        '<path d="M6.5 15.4 H17.5 V20.4 H6.5 Z" ' + S + ' stroke-linejoin="round"/>'
      );
    },

    /* ---- Path-quality attributes ---- */
    pathSurface: function () {
      return svg(
        '<path d="M3 18.5 H21 M3 13 H21" ' + S + '/>' +
        '<path d="M6.5 8 H8.5 M11 8 H13 M15.5 8 H17.5 M4.8 15.8 H6 M9.4 15.8 H10.6 M14 15.8 H15.2 M18.4 15.8 H19.4" ' + S + '/>'
      );
    },
    pathShade: function () {
      return svg(
        '<path d="M12 3 a6.3 6.3 0 0 1 6.3 6.3 c0 1.2-.3 2.2-.9 3.1 H6.6 a6.3 6.3 0 0 1 -.9 -3.1 A6.3 6.3 0 0 1 12 3 Z" ' + S + ' stroke-linejoin="round"/>' +
        '<path d="M12 12.4 V21 M12 16.5 L8.6 19.6 M12 15 L15.4 18" ' + S + '/>'
      );
    },
    pathLight: function () {
      return svg(
        '<path d="M7.5 21 H16.5 M12 21 V9.5" ' + S + '/>' +
        '<path d="M8 3.5 H16 L14.6 9.5 H9.4 Z" ' + S + ' stroke-linejoin="round"/>' +
        '<path d="M5.4 12.2 L7.2 10.8 M18.6 12.2 L16.8 10.8" ' + S + '/>'
      );
    },
    pathWidth: function () {
      return svg(
        '<path d="M4 4.5 V19.5 M20 4.5 V19.5" ' + S + '/>' +
        '<path d="M7 12 H17 M9.6 8.8 L6.6 12 L9.6 15.2 M14.4 8.8 L17.4 12 L14.4 15.2" ' + S + '/>'
      );
    },

    /* ---- View modes ---- */
    modeAccess: function () {
      return svg(
        '<circle cx="11.5" cy="14" r="6.5" ' + S + '/>' +
        '<circle cx="11.5" cy="14" r="1.4" fill="currentColor"/>' +
        '<path d="M11.5 14 V7.5 M11.5 14 L16 17.2 M11.5 14 L7 17.2" ' + S + '/>' +
        '<circle cx="16.8" cy="4.6" r="1.9" fill="currentColor"/>'
      );
    },
    modeWalk: function () {
      return svg(
        '<circle cx="13" cy="4.4" r="2" ' + S + '/>' +
        '<path d="M12.6 7.2 L10 12.2 L12.4 15 L11.2 20.8 M10 12.2 L14.4 12.6 L16.8 10.2" ' + S + '/>' +
        '<path d="M12.4 15 L15.8 17.4 L16.4 20.8 M10.4 11.4 L7.4 13.6 L6.4 17" ' + S + '/>'
      );
    },

    /* ---- More / secondary tools ---- */
    moreDots: function () {
      return svg(
        '<circle cx="5.5" cy="12" r="1.9" fill="currentColor"/>' +
        '<circle cx="12" cy="12" r="1.9" fill="currentColor"/>' +
        '<circle cx="18.5" cy="12" r="1.9" fill="currentColor"/>'
      );
    }
  };

  function icon(name, opts) {
    var fn = ICONS[name];
    if (!fn) return "";
    var markup = fn();
    if (opts && opts.className) {
      markup = markup.replace("<svg ", '<svg class="' + opts.className + '" ');
    }
    return markup;
  }

  global.RR_ICONS = ICONS;
  global.rrIcon = icon;
})(window);
