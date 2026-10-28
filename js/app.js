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

  const PCOLS = "id,slug,name,short_description,long_description,price,compare_at_price,images,videos,video_url,category,featured,stock_hint,sort,supplier_id,is_combo";
  const api = {
    products: () => rest("products?select=" + PCOLS + "&active=eq.true&order=sort.asc,name.asc"),
    product: (slug) => rest("products?select=" + PCOLS + "&active=eq.true&slug=eq." + encodeURIComponent(slug)).then((a) => a[0] || null),
    categories: () => rest("categories?select=slug,name&active=eq.true&order=sort.asc"),
    settings: (() => { let p; return () => (p ||= rest("app_settings?select=*&id=eq.1").then((a) => a[0] || {}).catch(() => ({}))); })(),
    createOrder: (payload) => rpc("create_order", { payload }),
    quote: (payload) => rpc("quote_cart", { payload }),
    comboItems: (id) => rest("combo_items?select=qty,product_id&combo_id=eq." + encodeURIComponent(id)),
    productsByIds: (ids) => rest("products?select=id,slug,name,images&id=in.(" + ids.map(encodeURIComponent).join(",") + ")"),
    track: (code, last4) => rpc("get_order_status", { p_code: code, p_phone_last4: last4 }),
  };

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
  const toast = (msg, tone) => UI.toast(msg, tone);
  const ic = (n, s) => UI.icon(n, s);
  function cardHTML(p) {
    const img = (p.images || [])[0] || "img/icon-512.png";
    return `<a class="card" href="producto.html?p=${encodeURIComponent(p.slug)}">
      <div class="ph"><img loading="lazy" src="${esc(img)}" alt="${esc(p.name)}"></div>
      <div class="bd">${p.is_combo ? `<span class="tag" style="background:var(--blue-l);color:var(--blue-d)">${ic("layers", 13)} Combo</span>` : ""}${p.featured ? `<span class="tag">${ic("flame", 13)} Más pedido</span>` : ""}
        <h3>${esc(p.name)}</h3>
        <div><span class="price">${money(p.price)}</span>${p.compare_at_price ? `<span class="was">Antes ${money(p.compare_at_price)}</span>` : ""}</div>
      </div></a>`;
  }
  function header() {
    const el = $("#top"); if (!el) return;
    el.innerHTML = `<div class="strip">${ic("truck", 15)} Pago contra entrega · Pagas cuando lo recibes</div>
      <div class="wrap"><a class="brand" href="index.html"><img src="img/icon.svg" alt=""><span>Todo<b>til</b></span></a>
      <nav><a class="icon-btn" href="seguimiento.html" title="Sigue tu pedido">${ic("package", 20)}<span class="hide-s">Mi pedido</span></a>
      <a class="icon-btn" href="carrito.html" aria-label="Carrito">${ic("cart", 20)}<span class="badge" id="cartCount" hidden>0</span></a></nav></div>`;
    cart.badge();
  }
  async function footer() {
    const el = $("#foot"); if (!el) return;
    const s = await api.settings();
    const wa = waLink(s, "Hola Todotil, tengo una consulta");
    el.innerHTML = `<div class="wrap cols">
      <div class="brand" style="color:#fff"><img src="img/icon.svg" alt=""><span>Todo<b>til</b></span></div>
      <div>${esc(s.tagline || "Lo útil, al mejor precio · Pago contra entrega")}</div>
      <div><a href="seguimiento.html">Sigue tu pedido</a> · <a href="politicas.html">Garantía y cambios</a>${wa ? ` · <a href="${wa}" target="_blank" rel="noopener">WhatsApp</a>` : ""}</div>
      <div style="opacity:.7">Todotil · Perú</div></div>`;
  }
  const STATUS = {
    pendiente: "Pedido recibido", aprobado: "Pedido confirmado", enviado_a_dropi: "Preparando tu pedido",
    en_camino: "En camino", entregado: "Entregado", cancelado: "Cancelado", devuelto: "Devuelto",
  };

  window.TD = { $, esc, money, api, cart, waLink, toast, ic, cardHTML, header, footer, STATUS };
  document.addEventListener("DOMContentLoaded", () => { header(); footer(); });
})();
