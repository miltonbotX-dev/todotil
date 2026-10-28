document.addEventListener("DOMContentLoaded", async () => {
  const { $, api, esc, money, cart, waLink, toast, ic, waIcon, setWaText } = TD;
  const slug = new URLSearchParams(location.search).get("p");
  const box = $("#pd");
  const p = slug ? await api.product(slug).catch(() => null) : null;
  if (!p) { box.innerHTML = '<div class="empty" style="grid-column:1/-1">Este producto no está disponible. <a href="index.html">Ver catálogo</a></div>'; return; }
  const s = await api.settings();
  document.title = p.name + " · Todotil";
  const imgs = p.images && p.images.length ? p.images : ["img/icon-512.png"];
  const vids = (p.videos || []).map((v) => { const [url, poster] = String(v).split("|"); return { url, poster: poster || "" }; });
  const gal = [...imgs.map((u) => ({ t: "img", u })), ...vids.map((v) => ({ t: "vid", u: v.url, poster: v.poster }))];
  const mainHTML = (g) => g.t === "vid"
    ? UI.player(g.u, g.poster, "in-gal")
    : `<img id="mainImg" src="${esc(g.u)}" alt="${esc(p.name)}">`;
  let qty = 1;
  box.innerHTML = `
    <div><div class="gal-main" id="galMain">${mainHTML(gal[0])}</div>
      ${gal.length > 1 ? `<div class="thumbs">${gal.map((g, i) => g.t === "img" ? `<img src="${esc(g.u)}" data-i="${i}" class="${i ? "" : "on"}" alt="">`
        : `<button type="button" class="tvid" data-i="${i}" aria-label="Ver video">${g.poster ? `<img src="${esc(g.poster)}" alt="">` : `<video src="${esc(g.u)}#t=0.5" muted playsinline disablePictureInPicture disableRemotePlayback preload="metadata" tabindex="-1"></video>`}<span>${ic("play", 16)}</span></button>`).join("")}</div>` : ""}
    </div>
    <div class="stack">
      <div><h1>${esc(p.name)}</h1>
        <div><span class="price">${money(p.price)}</span>${p.compare_at_price ? `<span class="was">Antes ${money(p.compare_at_price)}</span>` : ""}</div>
        ${p.short_description ? `<p style="margin:8px 0 0;font-weight:700">${esc(p.short_description)}</p>` : ""}</div>
      <div style="display:flex;align-items:center;gap:12px"><b>Cantidad</b>
        <div class="qty"><button type="button" id="qm" aria-label="Menos">−</button><span id="qv">1</span><button type="button" id="qp" aria-label="Más">+</button></div></div>
      <div class="sticky-buy">
        <button class="btn btn-main" id="buy">${ic("truck", 20)} Pedir contra entrega</button>
        <a class="btn btn-wa" id="wa" target="_blank" rel="noopener" aria-label="WhatsApp" hidden>${waIcon(24)}<span class="wa-txt"></span></a>
      </div>
      <button class="btn btn-ghost" id="add">Agregar al carrito</button>
      <div class="perks">
        <div>${ic("wallet")}<span><b>Pagas al recibir</b> · sin adelantos ni tarjetas</span></div>
        <div>${ic("truck")}<span>${esc(s.shipping_text || "Envío a domicilio")}</span></div>
        <div>${ic("shield")}<span><b>Garantía de 10 días</b> · si llega incompleto, roto, no funciona o es diferente. <a href="politicas.html">Ver detalles</a></span></div>
      </div>
      ${p.is_combo ? `<div class="combo" id="comboBox"><b>${ic("layers")} Este combo incluye</b><ul id="comboList"><li>Cargando…</li></ul><small>Todo sale del mismo almacén: llega en un solo paquete.</small></div>` : ""}
      ${p.video_url ? `<div><h2 style="font-size:18px;margin:6px 0 8px">Míralo en acción</h2>${videoHTML(p.video_url)}</div>` : ""}
      ${p.long_description ? `<div><h2 style="font-size:18px;margin:6px 0 6px">Descripción</h2><div class="desc">${esc(p.long_description)}</div></div>` : ""}
    </div>`;
  setWaText(`Hola Todotil, quiero información sobre: ${p.name} (${money(p.price)})`);
  const wa = waLink(s, `Hola Todotil, quiero pedir: ${p.name} (${money(p.price)})`);
  if (wa) { const a = $("#wa"); a.href = wa; a.hidden = false; }
  box.addEventListener("click", (e) => { const t = e.target.closest(".thumbs [data-i]"); if (!t) return;
    $("#galMain").innerHTML = mainHTML(gal[t.dataset.i]); box.querySelectorAll(".thumbs [data-i]").forEach((x) => x.classList.toggle("on", x === t)); });
  $("#qm").onclick = () => { qty = Math.max(1, qty - 1); $("#qv").textContent = qty; };
  $("#qp").onclick = () => { qty = Math.min(10, qty + 1); $("#qv").textContent = qty; };
  $("#add").onclick = () => { cart.add(p, qty); toast("Agregado al carrito"); };
  if (p.is_combo) {
    try {
      const it = await api.comboItems(p.id);
      const ps = it.length ? await api.productsByIds(it.map((x) => x.product_id)) : [];
      const by = Object.fromEntries(ps.map((x) => [x.id, x]));
      $("#comboList").innerHTML = it.map((x) => `<li>${x.qty} × ${esc((by[x.product_id] || {}).name || "Producto")}</li>`).join("") || "<li>Pronto mostraremos el detalle</li>";
    } catch { $("#comboList").innerHTML = "<li>Pronto mostraremos el detalle</li>"; }
  }
  $("#buy").onclick = () => { cart.add(p, qty); location.href = "carrito.html#datos"; };
});
function videoHTML(url) {
  const u = String(url);
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return `<div class="video${/shorts/.test(u) ? "" : " wide"}"><iframe src="https://www.youtube-nocookie.com/embed/${m[1]}" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
  m = u.match(/tiktok\.com\/.*\/video\/(\d+)/);
  if (m) return `<div class="video"><iframe src="https://www.tiktok.com/embed/v2/${m[1]}" loading="lazy" allowfullscreen></iframe></div>`;
  if (/\.(mp4|webm|mov)(\?|$)/i.test(u) || /res\.cloudinary\.com\/.+\/video\//.test(u))
    return `<div class="video">${UI.player(u)}</div>`;
  return `<a href="${TD.esc(u)}" target="_blank" rel="noopener">Ver video</a>`;
}

