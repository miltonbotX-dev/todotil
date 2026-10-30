// Todotil UI · iconos SVG propios (estilo trazo, sin CDN) + ventanas y avisos personalizados.
(function () {
  const P = {
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    printer: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    fileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    packageCheck: '<path d="m16 16 2 2 4-4"/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    sort: '<path d="m3 16 4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="m7.5 4.27 9 5.15"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    bell: '<path d="M10.27 21a2 2 0 0 0 3.46 0"/><path d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33"/>',
    bellOff: '<path d="M10.27 21a2 2 0 0 0 3.46 0"/><path d="M17 17H4a1 1 0 0 1-.74-1.67C4.59 13.96 6 12.5 6 8a6 6 0 0 1 .26-1.74"/><path d="M8.67 3.24A6 6 0 0 1 18 8c0 1.95.27 3.37.67 4.48"/><path d="m2 2 20 20"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    edit: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/><path d="m15 5 4 4"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
    map: '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    badgeCheck: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    star: '<path d="M11.52 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .3-.9l5.16-.76a2.12 2.12 0 0 0 1.6-1.16z"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    video: '<path d="m16 13 5.22 3.48a.5.5 0 0 0 .78-.42V7.87a.5.5 0 0 0-.75-.43L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    sparkles: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    play: '<path d="m6 3 14 9-14 9V3z"/>',
    arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    volume: '<path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.4 18.4a9 9 0 0 0 0-12.8"/>',
    volumeX: '<path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>',
    maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    minimize: '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  };
  // Cloudflare Turnstile (captcha). Solo se activa si TD_CONFIG.TURNSTILE_SITE_KEY tiene valor; vacío = desactivado.
  // UI.turnstile(el) -> null si está apagado; si no, { token(), reset() }
  let tsLoad;
  function turnstile(el) {
    const key = (window.TD_CONFIG || {}).TURNSTILE_SITE_KEY;
    if (!key || !el) return null;
    el.hidden = false;
    let tok = "", wid = null;
    tsLoad ||= new Promise((ok, ko) => { const sc = document.createElement("script"); sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; sc.async = true; sc.onload = ok; sc.onerror = () => ko(new Error("No se pudo cargar la verificación")); document.head.appendChild(sc); });
    tsLoad.then(() => { wid = window.turnstile.render(el, { sitekey: key, language: "es", theme: "light", size: "flexible",
      callback: (t) => (tok = t), "expired-callback": () => (tok = ""), "error-callback": () => (tok = "") }); }).catch(() => { el.textContent = "No se pudo cargar la verificación. Recarga la página."; });
    return { token: () => tok, reset: () => { tok = ""; try { if (wid !== null) window.turnstile.reset(wid); } catch (_) {} } };
  }
  function icon(name, size = 18, cls = "") {
    return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.info}</svg>`;
  }
  // Reemplaza <i data-ic="name"></i> por su SVG
  function hydrate(root = document) {
    root.querySelectorAll("[data-ic]").forEach((el) => { el.outerHTML = icon(el.dataset.ic, Number(el.dataset.size) || 18, el.className || ""); });
  }

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Ventana modal personalizada (reemplaza alert/confirm/prompt del navegador)
  function modal({ title = "", message = "", tone = "info", ok = "Aceptar", cancel = null, danger = false, input = null } = {}) {
    return new Promise((resolve) => {
      const ic = { info: "info", ok: "checkCircle", warn: "alert", error: "alert", ask: "help" }[tone] || "info";
      // <dialog> + showModal(): queda en la capa superior, incluso sobre otros diálogos abiertos del panel
      const wrap = document.createElement("dialog");
      wrap.className = "ui-modal"; wrap.setAttribute("aria-modal", "true");
      wrap.innerHTML = `<div class="ui-card ui-${tone}">
        <div class="ui-ic">${icon(ic, 24)}</div>
        ${title ? `<h3>${esc(title)}</h3>` : ""}
        ${message ? `<p>${esc(message).replace(/\n/g, "<br>")}</p>` : ""}
        ${input ? `<input class="ui-in" value="${esc(input.value || "")}" placeholder="${esc(input.placeholder || "")}">` : ""}
        <div class="ui-act">${cancel ? `<button type="button" class="ui-b ui-b2" data-r="0">${esc(cancel)}</button>` : ""}
          <button type="button" class="ui-b ${danger ? "ui-bd" : "ui-b1"}" data-r="1">${esc(ok)}</button></div></div>`;
      const prev = document.activeElement;
      let closed = false;
      const done = (v) => { if (closed) return; closed = true; wrap.classList.remove("on"); wrap.removeEventListener("keydown", key); setTimeout(() => { if (wrap.open) wrap.close(); wrap.remove(); }, 160); if (prev && prev.focus) prev.focus(); resolve(v); };
      const val = () => (input ? wrap.querySelector(".ui-in").value : true);
      const key = (e) => { if (e.key === "Escape") { e.preventDefault(); done(cancel ? (input ? null : false) : true); } if (e.key === "Enter" && input) done(val()); };
      wrap.addEventListener("click", (e) => {
        const b = e.target.closest("[data-r]");
        if (b) return done(b.dataset.r === "1" ? val() : (input ? null : false));
        if (e.target === wrap && cancel) done(input ? null : false);
      });
      wrap.addEventListener("keydown", key);
      wrap.addEventListener("cancel", (e) => e.preventDefault());
      document.body.appendChild(wrap);
      if (wrap.showModal) wrap.showModal(); else wrap.setAttribute("open", "");
      requestAnimationFrame(() => { wrap.classList.add("on"); (wrap.querySelector(".ui-in") || wrap.querySelector(".ui-b1,.ui-bd")).focus(); });
    });
  }
  const alertBox = (message, opt = {}) => modal({ message, ...opt });
  const confirmBox = (message, opt = {}) => modal({ message, tone: "ask", cancel: "Cancelar", ok: "Sí, continuar", ...opt });

  function toast(msg, tone = "ok") {
    let host = document.getElementById("ui-toasts");
    if (!host) { host = document.createElement("div"); host.id = "ui-toasts"; host.setAttribute("aria-live", "polite"); }
    // si hay un diálogo abierto, el aviso va dentro de él para quedar visible encima
    const dl = [...document.querySelectorAll("dialog[open]")].pop() || document.body;
    if (host.parentNode !== dl) dl.appendChild(host);
    const t = document.createElement("div");
    t.className = "ui-toast ui-t-" + tone;
    t.innerHTML = icon(tone === "error" ? "alert" : tone === "info" ? "info" : "checkCircle", 18) + `<span>${esc(msg)}</span>`;
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add("on"));
    setTimeout(() => { t.classList.remove("on"); setTimeout(() => t.remove(), 250); }, tone === "error" ? 4200 : 2200);
  }


  // ---------- Selector propio (reemplaza la lista nativa de <select>) ----------
  // El <select> original queda oculto como fuente de verdad: .value, onchange y lo que se envía no cambian.
  const norm = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const NATIVE = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
  const NATIVE_IDX = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "selectedIndex");
  const isSheet = () => matchMedia("(max-width: 640px), (pointer: coarse)").matches;
  let uid = 0;
  function enhanceSelect(sel) {
    if (sel._tp || sel.multiple) return;
    const id = sel.id || "tps" + ++uid;
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "tp-btn";
    btn.setAttribute("role", "combobox"); btn.setAttribute("aria-haspopup", "listbox"); btn.setAttribute("aria-expanded", "false");
    btn.id = id + "__tp";
    const pv = sel.previousElementSibling;
    const lab = (sel.id && document.querySelector(`label[for="${CSS.escape(sel.id)}"]`)) || (pv && pv.tagName === "LABEL" && !pv.htmlFor ? pv : null);
    if (lab) { if (!lab.id) lab.id = id + "__lab"; btn.setAttribute("aria-labelledby", lab.id + " " + btn.id); lab.addEventListener("click", (e) => { e.preventDefault(); btn.focus(); }); }
    else if (sel.getAttribute("aria-label")) btn.setAttribute("aria-label", sel.getAttribute("aria-label"));
    btn.innerHTML = `<span class="tp-txt"></span>${icon("chevronDown", 18, "tp-chev")}`;
    sel.classList.add("tp-native"); sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
    sel.after(btn);
    const sync = () => {
      const o = sel.options[sel.selectedIndex];
      btn.querySelector(".tp-txt").textContent = o ? o.text : "";
      btn.classList.toggle("tp-ph", !o || o.value === "");
      btn.disabled = sel.disabled;
      if (sel.value) clearFieldError(sel);
    };
    Object.defineProperty(sel, "value", { configurable: true, get() { return NATIVE.get.call(this); }, set(v) { NATIVE.set.call(this, v); sync(); } });
    Object.defineProperty(sel, "selectedIndex", { configurable: true, get() { return NATIVE_IDX.get.call(this); }, set(v) { NATIVE_IDX.set.call(this, v); sync(); } });
    sel.focus = () => btn.focus();
    new MutationObserver(sync).observe(sel, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
    sel.addEventListener("change", sync);
    btn.addEventListener("click", () => openPicker(sel, btn));
    btn.addEventListener("keydown", (e) => {
      if (["ArrowDown", "ArrowUp", "Enter", " ", "F4"].includes(e.key) || (e.altKey && e.key === "ArrowDown")) { e.preventDefault(); openPicker(sel, btn); }
    });
    sel._tp = { btn, sync }; sync();
  }
  function openPicker(sel, btn) {
    if (sel.disabled || btn.getAttribute("aria-expanded") === "true") return;
    const all = [...sel.options].map((o, i) => ({ i, text: o.text, value: o.value, n: norm(o.text), ph: o.value === "" && i === 0 && sel.required, dis: o.disabled }));
    const opts = all.filter((o) => !o.ph);
    const sheet = isSheet(), search = opts.length > 8;
    const lab = btn.getAttribute("aria-labelledby") ? document.getElementById(btn.getAttribute("aria-labelledby").split(" ")[0]) : null;
    const title = (lab ? lab.childNodes[0].textContent : "") || btn.getAttribute("aria-label") || "Elige una opción";
    const dl = document.createElement("dialog");
    dl.className = "tp " + (sheet ? "tp-sheet" : "tp-drop");
    const lid = "tpl" + ++uid;
    dl.innerHTML = `<div class="tp-card" role="presentation">
      ${sheet ? `<div class="tp-grab"></div><div class="tp-head"><b>${esc(title.trim())}</b><button type="button" class="tp-x" aria-label="Cerrar">${icon("x", 20)}</button></div>` : ""}
      ${search ? `<div class="tp-search">${icon("search", 18)}<input type="text" inputmode="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Buscar…" aria-label="Buscar" aria-controls="${lid}" aria-autocomplete="list"></div>` : ""}
      <ul class="tp-list" role="listbox" id="${lid}" aria-label="${esc(title.trim())}"></ul></div>`;
    const ul = dl.querySelector(".tp-list"), q = dl.querySelector(".tp-search input");
    let shown = opts, act = Math.max(0, opts.findIndex((o) => o.i === sel.selectedIndex));
    const draw = () => {
      ul.innerHTML = shown.length ? shown.map((o, k) => `<li role="option" id="${lid}-${k}" data-k="${k}" aria-selected="${o.i === sel.selectedIndex}" class="${k === act ? "act" : ""}${o.dis ? " dis" : ""}" ${o.dis ? 'aria-disabled="true"' : ""}><span>${esc(o.text)}</span>${o.i === sel.selectedIndex ? icon("check", 18, "tp-ok") : ""}</li>`).join("")
        : `<li class="tp-empty" role="presentation">${icon("search", 18)} Sin resultados</li>`;
      const a = ul.querySelector("li.act");
      (q || ul).setAttribute("aria-activedescendant", a ? a.id : "");
      if (a) a.scrollIntoView({ block: "nearest" });
    };
    const filter = () => { const t = norm(q.value); shown = t ? opts.filter((o) => o.n.includes(t)) : opts; act = 0; draw(); };
    const place = () => {
      if (sheet) return;
      const r = btn.getBoundingClientRect(), vh = innerHeight, vw = innerWidth, gap = 6, below = vh - r.bottom - gap - 8, above = r.top - gap - 8;
      const up = below < 220 && above > below, h = Math.min(340, Math.max(140, up ? above : below));
      const w = Math.min(Math.max(r.width, 220), vw - 16), left = Math.min(Math.max(8, r.left), vw - w - 8);
      Object.assign(dl.style, { left: left + "px", width: w + "px", maxHeight: h + "px", top: up ? "auto" : r.bottom + gap + "px", bottom: up ? vh - r.top + gap + "px" : "auto" });
    };
    let closed = false;
    const close = (focus = true) => {
      if (closed) return; closed = true; btn.setAttribute("aria-expanded", "false");
      removeEventListener("resize", place); removeEventListener("scroll", onScroll, true);
      dl.classList.remove("on"); setTimeout(() => { if (dl.open) dl.close(); dl.remove(); }, sheet ? 200 : 90);
      if (focus) btn.focus({ preventScroll: true });
    };
    const pick = (o) => {
      if (!o || o.dis) return;
      if (o.i !== sel.selectedIndex) { sel.selectedIndex = o.i; sel.dispatchEvent(new Event("input", { bubbles: true })); sel.dispatchEvent(new Event("change", { bubbles: true })); }
      close();
    };
    const onScroll = (e) => { if (!dl.contains(e.target)) place(); };
    ul.addEventListener("click", (e) => { const li = e.target.closest("li[data-k]"); if (li) pick(shown[+li.dataset.k]); });
    dl.addEventListener("click", (e) => { if (e.target === dl || e.target.closest(".tp-x")) close(); });
    dl.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
    dl.addEventListener("keydown", (e) => {
      const n = shown.length;
      if (e.key === "ArrowDown") { e.preventDefault(); act = Math.min(n - 1, act + 1); draw(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); act = Math.max(0, act - 1); draw(); }
      else if (e.key === "Home" && !q) { e.preventDefault(); act = 0; draw(); }
      else if (e.key === "End" && !q) { e.preventDefault(); act = n - 1; draw(); }
      else if (e.key === "PageDown") { e.preventDefault(); act = Math.min(n - 1, act + 8); draw(); }
      else if (e.key === "PageUp") { e.preventDefault(); act = Math.max(0, act - 8); draw(); }
      else if (e.key === "Enter" || (e.key === " " && !q)) { e.preventDefault(); pick(shown[act]); }
      else if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "Tab") { e.preventDefault(); close(); }
      else if (!q && e.key.length === 1 && !e.ctrlKey && !e.metaKey) { // búsqueda por tecla
        const t = norm(e.key), k = shown.findIndex((o, j) => j > act && o.n.startsWith(t)), k2 = k < 0 ? shown.findIndex((o) => o.n.startsWith(t)) : k;
        if (k2 >= 0) { act = k2; draw(); }
      }
    });
    if (q) q.addEventListener("input", filter);
    const host = sel.closest("dialog[open]") || document.body; host.appendChild(dl);
    btn.setAttribute("aria-expanded", "true"); btn.setAttribute("aria-controls", lid);
    if (dl.showModal) dl.showModal(); else dl.setAttribute("open", "");
    place(); draw();
    addEventListener("resize", place); addEventListener("scroll", onScroll, true);
    requestAnimationFrame(() => { dl.classList.add("on"); if (q && !sheet) q.focus(); else ul.tabIndex = -1, ul.focus({ preventScroll: true }); });
  }
  function enhanceAll(root = document) { root.querySelectorAll("select").forEach(enhanceSelect); }

  // ---------- Errores en línea (sin burbujas del navegador) ----------
  function fieldError(el, msg) {
    if (typeof el === "string") el = document.getElementById(el);
    if (!el) return;
    const tgt = (el._tp && el._tp.btn) || el;
    clearFieldError(el);
    tgt.classList.add("is-bad"); tgt.setAttribute("aria-invalid", "true");
    const m = document.createElement("div"); m.className = "ferr"; m.id = (el.id || "f" + ++uid) + "__err"; m.setAttribute("role", "alert");
    m.innerHTML = icon("alert", 15) + `<span>${esc(msg)}</span>`;
    tgt.after(m); tgt.setAttribute("aria-describedby", m.id);
    const off = () => clearFieldError(el); el.addEventListener("input", off, { once: true }); el.addEventListener("change", off, { once: true });
  }
  function clearFieldError(el) {
    if (typeof el === "string") el = document.getElementById(el);
    if (!el) return;
    const tgt = (el._tp && el._tp.btn) || el;
    tgt.classList.remove("is-bad"); tgt.removeAttribute("aria-invalid");
    const m = document.getElementById((el.id || "") + "__err"); if (m) m.remove();
    if (tgt.getAttribute("aria-describedby") === (el.id || "") + "__err") tgt.removeAttribute("aria-describedby");
  }
  function clearErrors(root = document) { root.querySelectorAll(".ferr").forEach((m) => m.remove()); root.querySelectorAll(".is-bad").forEach((x) => { x.classList.remove("is-bad"); x.removeAttribute("aria-invalid"); }); }

  // ===== Reproductor de video propio (sin controles nativos => sin menú "Descargar") =====
  function player(src, poster = "", cls = "") {
    return `<div class="tdv ${cls}" data-src="${esc(src)}"><video ${poster ? `poster="${esc(poster)}"` : ""} src="${esc(src)}${poster ? "" : "#t=0.5"}" playsinline webkit-playsinline preload="metadata" disablePictureInPicture disableRemotePlayback controlsList="nodownload nofullscreen noplaybackrate noremoteplayback" draggable="false" tabindex="-1"></video>
      <div class="tdv-hit" aria-hidden="true"></div>
      <button type="button" class="tdv-big" aria-label="Reproducir">${icon("play", 30)}</button>
      <div class="tdv-bar">
        <button type="button" class="tdv-pp" aria-label="Reproducir">${icon("play", 18)}</button>
        <div class="tdv-prog" role="slider" aria-label="Progreso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><i></i></div>
        <span class="tdv-t">0:00</span>
        <button type="button" class="tdv-mute" aria-label="Silenciar">${icon("volume", 18)}</button>
        <button type="button" class="tdv-fs" aria-label="Pantalla completa">${icon("maximize", 18)}</button>
      </div></div>`;
  }
  const fmt = (t) => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
  function mountPlayer(el) {
    if (el._tdv) return; el._tdv = true;
    const v = el.querySelector("video"), q = (c) => el.querySelector(c);
    v.controls = false; v.removeAttribute("controls"); v.setAttribute("controlsList", "nodownload nofullscreen noplaybackrate noremoteplayback"); v.disablePictureInPicture = true; v.disableRemotePlayback = true; v.draggable = false;
    new MutationObserver(() => { if (v.controls) v.controls = false; }).observe(v, { attributes: true, attributeFilter: ["controls"] });
    const big = q(".tdv-big"), pp = q(".tdv-pp"), prog = q(".tdv-prog"), bar = prog.querySelector("i"), tt = q(".tdv-t"), mu = q(".tdv-mute"), fs = q(".tdv-fs");
    let hideT;
    const sync = () => {
      const on = !v.paused && !v.ended;
      el.classList.toggle("playing", on);
      pp.innerHTML = icon(on ? "pause" : "play", 18); pp.setAttribute("aria-label", on ? "Pausar" : "Reproducir");
      mu.innerHTML = icon(v.muted ? "volumeX" : "volume", 18); mu.setAttribute("aria-label", v.muted ? "Activar sonido" : "Silenciar");
    };
    const tick = () => { const d = v.duration || 0, p = d ? (v.currentTime / d) * 100 : 0; bar.style.width = p + "%"; prog.setAttribute("aria-valuenow", Math.round(p)); tt.textContent = fmt(v.currentTime) + (d ? " / " + fmt(d) : ""); };
    const wake = () => { el.classList.add("ui"); clearTimeout(hideT); if (!v.paused) hideT = setTimeout(() => el.classList.remove("ui"), 2500); };
    const toggle = () => { if (v.paused || v.ended) { const r = v.play(); if (r && r.catch) r.catch(() => {}); } else v.pause(); wake(); };
    big.onclick = toggle; pp.onclick = toggle;
    q(".tdv-hit").onclick = () => { if (el.classList.contains("playing") && !el.classList.contains("ui")) wake(); else toggle(); };
    mu.onclick = () => { v.muted = !v.muted; sync(); wake(); };
    const seek = (e) => { const r = prog.getBoundingClientRect(), x = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width; if (v.duration) v.currentTime = Math.min(1, Math.max(0, x)) * v.duration; tick(); wake(); };
    prog.addEventListener("pointerdown", (e) => { seek(e); const mv = (ev) => seek(ev), up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); }; addEventListener("pointermove", mv); addEventListener("pointerup", up); });
    prog.addEventListener("keydown", (e) => { if (!v.duration) return; if (e.key === "ArrowRight") v.currentTime = Math.min(v.duration, v.currentTime + 5); if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5); });
    const isFs = () => el.classList.contains("fsx");
    const fsIcon = () => { const f = isFs(); fs.innerHTML = icon(f ? "minimize" : "maximize", 18); fs.setAttribute("aria-label", f ? "Salir de pantalla completa" : "Pantalla completa"); el.classList.toggle("is-fs", f); };
    // Pantalla completa propia: el <video> nunca entra en el modo de video del navegador (que trae sus propios botones,
    // incluido "Descargar"). Se agranda el contenedor .tdv y, si se puede, se pide pantalla completa del documento.
    const enterFs = () => { el.classList.add("fsx"); document.documentElement.classList.add("tdv-lock");
      const d = document.documentElement, rq = d.requestFullscreen || d.webkitRequestFullscreen;
      if (rq) try { const r = rq.call(d, { navigationUI: "hide" }); if (r && r.catch) r.catch(() => {}); } catch (_) {}
      try { screen.orientation && screen.orientation.lock && v.videoWidth > v.videoHeight && screen.orientation.lock("landscape").catch(() => {}); } catch (_) {} };
    const exitFs = () => { el.classList.remove("fsx"); document.documentElement.classList.remove("tdv-lock");
      if (document.fullscreenElement || document.webkitFullscreenElement) { const ex = document.exitFullscreen || document.webkitExitFullscreen; try { const r = ex.call(document); if (r && r.catch) r.catch(() => {}); } catch (_) {} } };
    fs.onclick = () => { if (isFs()) exitFs(); else enterFs(); setTimeout(fsIcon, 0); fsIcon(); wake(); };
    // Si el usuario sale con el botón "atrás"/gesto del sistema, cerramos también la vista propia
    const onDocFs = () => { if (!(document.fullscreenElement || document.webkitFullscreenElement) && el.classList.contains("fsx") && el._wasDocFs) exitFs(); el._wasDocFs = !!(document.fullscreenElement || document.webkitFullscreenElement); fsIcon(); };
    document.addEventListener("fullscreenchange", onDocFs); document.addEventListener("webkitfullscreenchange", onDocFs);
    // Por si algún navegador intenta su propio modo de video a pantalla completa
    v.addEventListener("webkitbeginfullscreen", () => { try { v.webkitExitFullscreen(); } catch (_) {} enterFs(); fsIcon(); });
    document.addEventListener("fullscreenchange", fsIcon); document.addEventListener("webkitfullscreenchange", fsIcon);
    ["play", "pause", "ended", "volumechange"].forEach((n) => v.addEventListener(n, () => { sync(); wake(); }));
    ["timeupdate", "loadedmetadata", "durationchange"].forEach((n) => v.addEventListener(n, tick));
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    el.addEventListener("pointermove", wake);
    sync(); tick(); el.classList.add("ui");
  }
  function mountPlayers(root = document) { root.querySelectorAll(".tdv").forEach(mountPlayer); }
  // Ningún <video> del sitio muestra menú contextual (Guardar/Descargar video)
  document.addEventListener("contextmenu", (e) => { if (e.target.closest && e.target.closest("video, .tdv, .gal-main, .thumbs")) e.preventDefault(); }, true);

  // Ningún <video> del sitio puede mostrar controles nativos (aunque otro script se los ponga)
  const killNative = (r) => r.querySelectorAll && r.querySelectorAll("video").forEach((x) => { if (x.controls) x.controls = false; x.removeAttribute("controls"); x.disablePictureInPicture = true; x.disableRemotePlayback = true; });
  document.addEventListener("dragstart", (e) => { if (e.target.closest && e.target.closest("video, .tdv, .gal-main, .thumbs")) e.preventDefault(); }, true);
  window.UI = { turnstile, player, mountPlayers, icon, hydrate, modal, alert: alertBox, confirm: confirmBox, toast, esc, enhanceSelect, enhanceAll, fieldError, clearFieldError, clearErrors };
  document.addEventListener("DOMContentLoaded", () => {
    hydrate();
    // Ningún formulario usa las burbujas de validación del navegador
    document.querySelectorAll("form").forEach((f) => (f.noValidate = true));
    enhanceAll(); mountPlayers(); killNative(document);
    // Selects que se dibujan después (panel, ventanas)
    new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.tagName === "SELECT") enhanceSelect(n); else if (n.querySelector) { enhanceAll(n); if (n.classList.contains("tdv")) mountPlayer(n); else mountPlayers(n); killNative(n.parentNode || n); } } })
      .observe(document.body, { childList: true, subtree: true });
  });

  // v8: la página se mantiene quieta (sin pellizcar ni doble toque para ampliar)
  (function noZoom() {
    const stop = (e) => e.preventDefault();
    ["gesturestart", "gesturechange", "gestureend"].forEach((t) => document.addEventListener(t, stop, { passive: false }));
    document.addEventListener("touchmove", (e) => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
    let last = 0;
    document.addEventListener("touchend", (e) => {
      const now = Date.now();
      if (now - last < 300 && !e.target.closest("input,textarea,select,button,a,label,summary,[role=button],[contenteditable],.tdv")) e.preventDefault();
      last = now;
    }, { passive: false });
    document.addEventListener("wheel", (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  })();
})();
