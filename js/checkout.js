document.addEventListener("DOMContentLoaded", async () => {
  const { $, api, esc, money, cart, ic } = TD;
  const s = await api.settings();
  const form = $("#form");
  if (s.payment_text) $("#payTxt").textContent = s.payment_text;
  // Refrescar precios/nombres reales del catálogo (el servidor recalcula igual al crear el pedido)
  try {
    const live = await api.products(); const by = Object.fromEntries(live.map((p) => [p.slug, p]));
    const before = cart.get(), after = before.filter((i) => by[i.slug]).map((i) => ({ ...i, name: by[i.slug].name, price: Number(by[i.slug].price), image: (by[i.slug].images || [])[0] || i.image }));
    cart.set(after); if (after.length < before.length) TD.toast("Quitamos un producto que ya no está disponible", "info");
  } catch {}

  // ---- Ubigeo: departamento → provincia → distrito ----
  const U = window.UBIGEO || {};
  const opts = (list, ph) => `<option value="">${ph}</option>` + list.map((x) => `<option>${esc(x)}</option>`).join("");
  const dept = $("#dept"), prov = $("#prov"), dist = $("#dist");
  dept.innerHTML = opts(Object.keys(U), "Elige tu departamento");
  function fillProv(keep) {
    const P = U[dept.value] || {};
    prov.innerHTML = opts(Object.keys(P), dept.value ? "Elige tu provincia" : "Primero el departamento");
    prov.disabled = !dept.value;
    if (keep && P[keep]) prov.value = keep;
    else if (Object.keys(P).length === 1) prov.value = Object.keys(P)[0];
  }
  function fillDist(keep) {
    const D = (U[dept.value] || {})[prov.value] || [];
    dist.innerHTML = opts(D, prov.value ? "Elige tu distrito" : "Primero la provincia");
    dist.disabled = !prov.value;
    if (keep && D.includes(keep)) dist.value = keep;
  }
  dept.onchange = () => { fillProv(); fillDist(); quote(); };
  prov.onchange = () => { fillDist(); quote(); };
  dist.onchange = () => quote();

  // ---- Cotización en el servidor (envío por paquete/proveedor) ----
  let Q = null, qSeq = 0, qTimer;
  function quote() { clearTimeout(qTimer); qTimer = setTimeout(runQuote, 150); }
  async function runQuote() {
    const items = cart.get(); if (!items.length) { Q = null; return drawCart(); }
    const my = ++qSeq;
    try {
      const r = await api.quote({ items: items.map((i) => ({ slug: i.slug, qty: i.qty })), shipping: { department: dept.value, province: prov.value, district: dist.value } });
      if (my === qSeq) { Q = r; drawCart(); }
    } catch (e) { if (my === qSeq) { Q = null; drawCart(); TD.toast(e.message, "error"); } }
  }

  function drawCart() {
    const items = cart.get();
    if (!items.length) { $("#cartBox").innerHTML = `<div class="panel empty">${ic("cart", 36)}<br>Tu carrito está vacío<br><br><a class="btn btn-main" href="index.html">Ver productos</a></div>`; form.hidden = true; return; }
    const sub = items.reduce((a, i) => a + i.price * i.qty, 0);
    const pk = (Q && Q.packages) || [];
    const name = (slug) => (items.find((i) => i.slug === slug) || {}).name || slug;
    const haveDest = !!dist.value;
    const waShip = !Q || (Q.packages || []).some((x) => x.source === "whatsapp");
    const shipTxt = waShip ? "Se confirma por WhatsApp" : !Q ? "…" : haveDest ? money(Q.shipping) : "Elige tu distrito";
    const waUrl = TD.waLink(s, `Hola Todotil, quiero consultar el envío a ${[dist.value, prov.value, dept.value].filter(Boolean).join(", ") || "mi distrito"} para: ${items.map((i) => i.qty + " × " + i.name).join(", ")}`);
    $("#cartBox").innerHTML = `<div class="panel">${items.map((i) => `
      <div class="line"><img src="${esc(i.image || "img/icon-192.png")}" alt="">
        <div><h4>${esc(i.name)}</h4><div class="qty"><button type="button" data-a="m" data-s="${esc(i.slug)}" aria-label="Menos">${ic("minus", 16)}</button><span>${i.qty}</span><button type="button" data-a="p" data-s="${esc(i.slug)}" aria-label="Más">${ic("plus", 16)}</button></div>
          <div><button class="rm" type="button" data-a="r" data-s="${esc(i.slug)}">${ic("trash", 14)} Quitar</button></div></div>
        <b>${money(i.price * i.qty)}</b></div>`).join("")}
      ${pk.length > 1 ? `<div class="warn" id="multiPkg">${ic("alert", 20)}<span>Tu pedido llegará en <b>${pk.length} paquetes separados</b>, porque los productos salen de almacenes distintos. ${waShip ? "El envío de cada paquete se confirma por WhatsApp." : "Cada paquete tiene su propio costo de envío."}</span></div>
        <div class="pkgs">${pk.map((p) => `<div class="pkg"><b>${ic("package", 16)} Paquete ${p.n}</b>
          <div style="color:var(--muted)">${p.slugs.map((x) => esc(name(x))).join(" · ")}</div>
          <div class="sum"><span>Envío${p.days ? " · " + esc(p.days) : ""}</span><b>${waShip ? "Por WhatsApp" : haveDest ? money(p.shipping) : "—"}</b></div></div>`).join("")}</div>` : ""}
      <div style="padding-top:8px"><div class="sum"><span>Subtotal</span><b>${money(Q ? Q.subtotal : sub)}</b></div>
      <div class="sum"><span>Envío${pk.length > 1 ? ` (${pk.length} paquetes)` : ""}</span><b id="shipAmt">${shipTxt}</b></div>
      <div class="sum total"><span>${waShip ? "Total productos" : "Total a pagar al recibir"}</span><span>${money(Q && (haveDest || waShip) ? Q.total : sub)}</span></div>
      ${waShip ? `<div class="note" id="shipNote" style="margin-top:8px">${ic("info", 18)}<span>El costo de envío no está incluido: <b>te lo confirmamos por WhatsApp antes del despacho</b>, según tu distrito.</span></div>${waUrl ? `<a class="btn btn-wa" id="waShip" style="margin-top:8px" target="_blank" rel="noopener" href="${esc(waUrl)}">${TD.waIcon(20)} Consultar envío por WhatsApp</a>` : ""}` : haveDest ? "" : '<div style="font-size:13px;color:var(--muted)">El costo de envío se calcula según tu distrito.</div>'}</div></div>`;
    form.hidden = false;
  }
  $("#cartBox").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-a]"); if (!b) return;
    const it = cart.get().find((i) => i.slug === b.dataset.s); if (!it) return;
    if (b.dataset.a === "r") cart.remove(it.slug); else cart.qty(it.slug, it.qty + (b.dataset.a === "p" ? 1 : -1));
    drawCart(); quote();
  });

  // Recordar datos del cliente en este celular
  const SAVE = "todotil.customer.v2";
  const F = ["name", "surname", "phone", "addr", "ref", "dni", "email"];
  try {
    const sv = JSON.parse(localStorage.getItem(SAVE)) || {};
    F.forEach((k) => { if (sv[k]) $("#" + k).value = sv[k]; });
    if (sv.dept && U[sv.dept]) dept.value = sv.dept;
    fillProv(sv.prov); fillDist(sv.dist);
  } catch { fillProv(); fillDist(); }

  if (location.hash === "#datos") setTimeout(() => form.scrollIntoView({ behavior: "smooth" }), 200);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#err"); err.hidden = true;
    const v = (id) => $("#" + id).value.trim();
    const phone = v("phone").replace(/\D/g, "").replace(/^51(?=9\d{8}$)/, "");
    const fail = (m, id) => { err.textContent = m; err.hidden = false; if (id) $("#" + id).focus(); };
    if (v("name").length < 2) return fail("Escribe tu nombre", "name");
    if (v("surname").length < 2) return fail("Escribe tu apellido", "surname");
    if (!/^9\d{8}$/.test(phone)) return fail("Tu celular debe tener 9 dígitos y empezar con 9", "phone");
    if (!dept.value) return fail("Elige tu departamento", "dept");
    if (!prov.value) return fail("Elige tu provincia", "prov");
    if (!dist.value) return fail("Elige tu distrito", "dist");
    if (v("addr").length < 5) return fail("Escribe tu dirección completa", "addr");
    if (v("dni") && !/^\d{8}$/.test(v("dni"))) return fail("El DNI debe tener 8 dígitos", "dni");
    const pk = (Q && Q.packages) || [];
    if (pk.length > 1) {
      const ok = await UI.confirm(`Tus productos salen de ${pk.length} almacenes distintos, así que llegarán en ${pk.length} paquetes separados, cada uno con su envío${Number(Q.shipping) > 0 ? ` (total envío ${money(Q.shipping)})` : " (se confirma por WhatsApp)"}.`, { title: "Tu pedido llega por partes", ok: "Entendido, confirmar", cancel: "Revisar" });
      if (!ok) return;
    }
    const btn = $("#send"); btn.disabled = true; btn.textContent = "Enviando…";
    try {
      const res = await api.createOrder({
        customer: { name: v("name"), surname: v("surname"), phone, dni: v("dni"), email: v("email") },
        shipping: { department: dept.value, province: prov.value, district: dist.value, address: v("addr"), reference: v("ref") },
        notes: v("notes"),
        items: cart.get().map((i) => ({ slug: i.slug, qty: i.qty })),
      });
      const keep = {}; F.forEach((k) => (keep[k] = v(k))); Object.assign(keep, { dept: dept.value, prov: prov.value, dist: dist.value });
      localStorage.setItem(SAVE, JSON.stringify(keep));
      sessionStorage.setItem("todotil.last", JSON.stringify({ ...res, last4: phone.slice(-4) }));
      cart.clear();
      location.href = "gracias.html?c=" + encodeURIComponent(res.public_code);
    } catch (ex) { fail(ex.message); btn.disabled = false; btn.textContent = "Confirmar pedido · pago contra entrega"; }
  });
  drawCart(); quote();
});
