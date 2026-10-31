// Todotil · utilidades compartidas de la tienda (sin dependencias)
(function () {
  const C = window.TD_CONFIG;
  const H = { apikey: C.SUPABASE_KEY, "Content-Type": "application/json" };
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "S/ " + Number(n || 0).toFixed(2).replace(/\.00$/, "");

  async function rest(path) {
    const r = await fetch(C.SUPABASE_URL + "/rest/v1/" + path, { headers: H });
    if (!r.ok) throw new Error("No se pudo cargar. Revisa tu conexión.");
    return r.json();
  }
  async function rpc(fn, body) {
    const r = await fetch(C.SUPABASE_URL + "/rest/v1/rpc/" + fn, { method: "POST", headers: H, body: JSON.stringify(body) });
    const data = await r.json().catch(() => null);
    if (!r.ok) throw new Error((data && data.message) || "Ocurrió un error. Inténtalo otra vez.");
    return data;
  }

  async function fn(name, body) {
    const r = await fetch(C.SUPABASE_URL + "/functions/v1/" + name, { method: "POST", headers: H, body: JSON.stringify(body) });
    const data = await r.json().catch(() => null);
    if (!r.ok) throw new Error((data && (data.message || data.error)) || "Ocurrió un error. Inténtalo otra vez.");
    return data;
  }

  const PCOLS = "id,slug,name,short_description,long_description,price,compare_at_price,images,videos,video_url,category,featured,stock_hint,sort,supplier_id,is_combo";
  const api = {
    products: () => rest("products?select=" + PCOLS + "&active=eq.true&order=sort.asc,name.asc"),
    product: (slug) => rest("products?select=" + PCOLS + "&active=eq.true&slug=eq." + encodeURIComponent(slug)).then((a) => a[0] || null),
    categories: () => rest("categories?select=slug,name&active=eq.true&order=sort.asc"),
    settings: (() => { let p; return () => (p ||= rest("app_settings?select=*&id=eq.1").then((a) => a[0] || {}).catch(() => ({}))); })(),
    // Con Turnstile activo el pedido pasa por la Edge Function create-order (verifica el captcha en el servidor).
    createOrder: (payload, captcha) => captcha ? fn("create-order", { payload, turnstile_token: captcha }) : rpc("create_order", { payload }),
    quote: (payload) => rpc("quote_cart", { payload }),
    comboItems: (id) => rest("combo_items?select=qty,product_id&combo_id=eq." + encodeURIComponent(id)),
    productsByIds: (ids) => rest("products?select=id,slug,name,images,price&id=in.(" + ids.map(encodeURIComponent).join(",") + ")"),
    track: (code, last4) => rpc("get_order_status", { p_code: code, p_phone_last4: last4 }),
    submitComplaint: (payload) => rpc("submit_complaint", { payload }),
  };

  // Tiempos de entrega APROXIMADOS en días hábiles, contados desde que confirmamos el pedido por WhatsApp.
  // Base: Dropi Perú (24–72 h según transportadora y zona) y tabla oficial de Olva (Lima/Callao 24–48 h; capitales 1–3 días).
  const ETA = {
    lima: { min: 1, max: 3, zone: "Lima Metropolitana y Callao" },
    limaProv: { min: 2, max: 5, zone: "Lima provincias" },
    prov: { min: 3, max: 7, zone: "otras regiones del Perú" },
  };
  // eta("Lima","Lima") -> lima · eta("Lima","Cañete") -> limaProv · eta("Callao") -> lima · resto -> prov
  function eta(dep, prov) {
    const d = String(dep || "").trim(), pv = String(prov || "").trim();
    if (!d) return null;
    if (d === "Callao" || (d === "Lima" && (pv === "Lima" || !pv))) return ETA.lima;
    if (d === "Lima") return ETA.limaProv;
    return ETA.prov;
  }
  const etaTxt = (e) => `${e.min} a ${e.max} días hábiles`;

  // Carrito en localStorage: [{slug, qty, name, price, image}] (precio solo para mostrar; el servidor recalcula)
  const KEY = "todotil.cart.v1";
  const cart = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } },
    set(items) { localStorage.setItem(KEY, JSON.stringify(items)); cart.badge(); },
    add(p, qty = 1) {
      const items = cart.get(); const f = items.find((i) => i.slug === p.slug);
      if (f) f.qty = Math.min(10, f.qty + qty);
      else items.push({ slug: p.slug, qty: Math.min(10, qty), name: p.name, price: Number(p.price), image: (p.images || [])[0] || "" });
      cart.set(items);
    },
    qty(slug, q) { cart.set(cart.get().map((i) => (i.slug === slug ? { ...i, qty: Math.max(1, Math.min(10, q)) } : i))); },
    remove(slug) { cart.set(cart.get().filter((i) => i.slug !== slug)); },
    clear() { cart.set([]); },
    count() { return cart.get().reduce((a, i) => a + i.qty, 0); },
    badge() { const b = $("#cartCount"); if (b) { const n = cart.count(); b.textContent = n; b.hidden = !n; } },
  };

  function waLink(settings, text) {
    const n = String(settings.whatsapp || "").replace(/\D/g, "");
    return n ? "https://wa.me/" + n + "?text=" + encodeURIComponent(text) : null;
  }
  const waIcon = (sz = 22) => `<svg class="wa-ico" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`;
  // "51931246675" -> "931 246 675"
  const waPretty = (s) => { const n = String(s.whatsapp || "").replace(/\D/g, "").replace(/^51(?=9\d{8}$)/, ""); return n.length === 9 ? n.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3") : n; };
  // Botón flotante de WhatsApp (todas las páginas de la tienda). TD.setWaText("...") cambia el mensaje.
  let fabText = "Hola Todotil, quiero información";
  async function waFab() {
    if (document.querySelector(".wa-fab")) return;
    const s = await api.settings(); if (!waLink(s, "")) return;
    const a = document.createElement("a");
    a.className = "wa-fab"; a.target = "_blank"; a.rel = "noopener"; a.setAttribute("aria-label", "Escríbenos por WhatsApp");
    a.innerHTML = waIcon(30); a.href = waLink(s, fabText);
    document.body.appendChild(a); document.body.classList.add("has-wa-fab");
  }
  async function setWaText(t) { fabText = t; const a = document.querySelector(".wa-fab"); if (a) a.href = waLink(await api.settings(), t); }
  const toast = (msg, tone) => UI.toast(msg, tone);
  const ic = (n, s) => UI.icon(n, s);
  function cardHTML(p) {
    const img = (p.images || [])[0] || "img/icon-512.png";
    return `<a class="card" href="producto.html?p=${encodeURIComponent(p.slug)}">
      <div class="ph"><img loading="lazy" decoding="async" width="400" height="400" src="${esc(img)}" alt="${esc(p.name)}" draggable="false"></div>
      <div class="bd">${p.is_combo ? `<span class="tag" style="background:var(--blue-l);color:var(--blue-d)">${ic("layers", 13)} Combo</span>` : ""}${p.featured ? `<span class="tag">${ic("flame", 13)} Destacado</span>` : ""}
        <h3>${esc(p.name)}</h3>
        <div><span class="price">${money(p.price)}</span>${p.compare_at_price ? `<span class="was">Antes ${money(p.compare_at_price)}</span>` : ""}</div>
        ${p.stock_hint != null && p.stock_hint > 0 && p.stock_hint <= 15 ? `<span class="low">¡Últimas ${p.stock_hint} unidades!</span>` : ""}
      </div></a>`;
  }
  function header() {
    const el = $("#top"); if (!el) return;
    el.innerHTML = `<div class="strip">${ic("truck", 15)} Pago contra entrega · Pagas cuando lo recibes</div>
      <div class="wrap"><a class="brand" href="index.html"><img src="img/icon.svg?v=12" alt=""><span>Todo<b>til</b></span></a>
      <nav><a class="icon-btn" href="seguimiento.html" aria-label="Sigue tu pedido">${ic("package", 20)}<span class="hide-s">Mi pedido</span></a>
      <a class="icon-btn" href="carrito.html" aria-label="Carrito">${ic("cart", 20)}<span class="badge" id="cartCount" hidden>0</span></a></nav></div>`;
    cart.badge();
    api.settings().then((s) => {
      const wa = waLink(s, fabText); if (!wa) return;
      el.querySelector(".strip").insertAdjacentHTML("beforeend", `<a class="strip-wa" href="${wa}" target="_blank" rel="noopener">${waIcon(14)} <span class="hide-xs">Atención por WhatsApp </span>${waPretty(s)}</a>`);
    });
  }
  async function footer() {
    const el = $("#foot"); if (!el) return;
    const s = await api.settings();
    const wa = waLink(s, "Hola Todotil, tengo una consulta");
    el.innerHTML = `<div class="wrap cols">
      <div class="brand" style="color:#fff"><img src="img/icon.svg?v=12" alt=""><span>Todo<b>til</b></span></div>
      <div>${esc(s.tagline || "Lo útil, al mejor precio · Pago contra entrega")}</div>
      <div class="foot-links"><a href="como-comprar.html">Cómo comprar</a> · <a href="seguimiento.html">Sigue tu pedido</a> · <a href="politicas.html">Cambios y envíos</a> · <a href="privacidad.html">Privacidad</a>${wa ? ` · <a href="${wa}" target="_blank" rel="noopener">WhatsApp</a>` : ""}</div>
      ${s.business_hours ? `<div>${ic("clock", 15)} Atención: ${esc(s.business_hours)}</div>` : ""}
      ${TD_CONFIG.LIBRO_RECLAMACIONES_ON ? `<a class="foot-lr" href="libro-reclamaciones.html">${ic("book", 22)}<span>Libro de Reclamaciones</span></a>` : ""}
      ${wa ? `<a class="foot-wa" href="${wa}" target="_blank" rel="noopener">${waIcon(20)}<span>¿Dudas? Te atendemos por WhatsApp: <b>${waPretty(s)}</b></span></a>` : ""}
      <div style="opacity:.7">Todotil · Perú</div></div>`;
  }
  const STATUS = {
    pendiente: "Pedido recibido", aprobado: "Pedido confirmado", enviado_a_dropi: "Preparando tu pedido",
    en_camino: "En camino", entregado: "Entregado", cancelado: "Cancelado", devuelto: "Devuelto",
  };

  // Meta Pixel (se activa solo si TD_CONFIG.PIXEL_ID tiene valor)
  if (C.PIXEL_ID && !window.fbq) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    if (!/\/admin\//.test(location.pathname)) { fbq("init", C.PIXEL_ID); fbq("track", "PageView"); }
  }
  function track(ev, p, qty = 1, extra = {}) {
    try {
      if (!window.fbq || !C.PIXEL_ID) return;
      const d = p ? { content_ids: [String(p.slug || p.id)], content_name: p.name, content_type: "product", value: Number(p.price) * qty, currency: "PEN" } : {};
      fbq("track", ev, Object.assign(d, extra));
    } catch (_) {}
  }
  window.TD = { eta, etaTxt, ETA, track, $, esc, money, api, cart, waLink, waIcon, setWaText, toast, ic, cardHTML, header, footer, STATUS };
  document.addEventListener("DOMContentLoaded", () => { header(); footer(); waFab(); });
})();
