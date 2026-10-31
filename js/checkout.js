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
  // Meta Pixel: InitiateCheckout al abrir el checkout con productos (valor = total de productos)
  try { const it = cart.get(); if (it.length) TD.track("InitiateCheckout", null, 1, { value: it.reduce((a, i) => a + Number(i.price) * i.qty, 0), currency: "PEN", content_ids: it.map((i) => i.slug), content_type: "product", num_items: it.reduce((a, i) => a + i.qty, 0) }); } catch (_) {}

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
  // ---- Tiempo de entrega aproximado según departamento/provincia ----
  function drawEta() {
    const e = TD.eta(dept.value, prov.value), box = $("#etaBox");
    box.innerHTML = e
      ? `${ic("truck", 20)}<span>Llega en <b>${TD.etaTxt(e)}</b> aprox. a ${esc(dept.value === "Lima" && prov.value && prov.value !== "Lima" ? prov.value : dept.value)} <small>${esc(e.zone[0].toUpperCase() + e.zone.slice(1))}. Contamos desde que confirmamos tu pedido por WhatsApp; zonas alejadas pueden tardar más.</small></span>`
      : `${ic("truck", 20)}<span>Lima y Callao: <b>${TD.etaTxt(TD.ETA.lima)}</b> · Provincias: <b>${TD.ETA.prov.min} a ${TD.ETA.prov.max}</b> <small>Elige tu departamento para ver el tiempo aproximado.</small></span>`;
    const r = $("#etaRow"); if (r) r.textContent = e ? TD.etaTxt(e) + " (aprox.)" : "Elige tu departamento";
  }
  dept.onchange = () => { fillProv(); fillDist(); drawEta(); quote(); };
  prov.onchange = () => { fillDist(); drawEta(); quote(); };
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
      <div class="sum"><span>${ic("truck", 15)} Entrega estimada</span><b id="etaRow"></b></div>
      <div class="sum total"><span>${waShip ? "Total productos" : "Total a pagar al recibir"}</span><span>${money(Q && (haveDest || waShip) ? Q.total : sub)}</span></div>
      ${waShip ? `<div class="note" id="shipNote" style="margin-top:8px">${ic("info", 18)}<span>El costo de envío no está incluido: <b>te lo confirmamos por WhatsApp antes del despacho</b>, según tu distrito.</span></div>${waUrl ? `<a class="btn btn-wa" id="waShip" style="margin-top:8px" target="_blank" rel="noopener" href="${esc(waUrl)}">${TD.waIcon(20)} Consultar envío por WhatsApp</a>` : ""}` : haveDest ? "" : '<div style="font-size:13px;color:var(--muted)">El costo de envío se calcula según tu distrito.</div>'}</div></div>`;
    form.hidden = false; drawEta();
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

  const ts = UI.turnstile($("#tsBox")); // null = captcha desactivado (TURNSTILE_SITE_KEY vacío)
  if (location.hash === "#datos") setTimeout(() => form.scrollIntoView({ behavior: "smooth" }), 200);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#err"); err.hidden = true;
    const v = (id) => $("#" + id).value.trim();
    const phone = v("phone").replace(/\D/g, "").replace(/^51(?=9\d{8}$)/, "");
    const fail = (m) => { err.innerHTML = UI.icon("alert", 18) + `<span>${esc(m)}</span>`; err.hidden = false; };
    UI.clearErrors(form);
    const bad = [];
    const chk = (cond, id, m) => { if (!cond) { UI.fieldError(id, m); bad.push(id); } };
    chk(v("name").length >= 2, "name", "Escribe tu nombre");
    chk(v("surname").length >= 2, "surname", "Escribe tu apellido");
    chk(/^9\d{8}$/.test(phone), "phone", "Tu celular debe tener 9 dígitos y empezar con 9");
    chk(!!dept.value, "dept", "Elige tu departamento");
    chk(!!prov.value || !dept.value, "prov", "Elige tu provincia");
    chk(!!dist.value || !prov.value, "dist", "Elige tu distrito");
    chk(v("addr").length >= 5, "addr", "Escribe tu dirección completa (calle y número)");
    chk(/^\d{8}$/.test(v("dni")), "dni", "Tu DNI debe tener 8 dígitos");
    chk(!v("email") || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email")), "email", "Revisa tu correo (o déjalo vacío)");
    if (bad.length) {
      fail(bad.length === 1 ? "Revisa el campo marcado en rojo" : `Revisa los ${bad.length} campos marcados en rojo`);
      const first = $("#" + bad[0]); const t = (first._tp && first._tp.btn) || first;
      t.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => first.focus({ preventScroll: true }), 250);
      return;
    }
    if (ts && !ts.token()) { fail("Marca la casilla de verificación antes de confirmar"); $("#tsBox").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
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
      }, ts ? ts.token() : null);
      try { const items = cart.get(); TD.track("Purchase", null, 1, { value: items.reduce((a, i) => a + Number(i.price) * i.qty, 0), currency: "PEN", content_ids: items.map((i) => i.slug), content_type: "product", num_items: items.reduce((a, i) => a + i.qty, 0) }); } catch (_) {}
      const keep = {}; F.forEach((k) => (keep[k] = v(k))); Object.assign(keep, { dept: dept.value, prov: prov.value, dist: dist.value });
      localStorage.setItem(SAVE, JSON.stringify(keep));
      sessionStorage.setItem("todotil.last", JSON.stringify({ ...res, last4: phone.slice(-4) }));
      cart.clear();
      if (window.fbq) await new Promise((r) => setTimeout(r, 400)); // deja salir el evento Purchase antes de cambiar de página
      location.href = "gracias.html?c=" + encodeURIComponent(res.public_code);
    } catch (ex) { if (ts) ts.reset(); fail(ex.message); btn.disabled = false; btn.textContent = "Confirmar pedido · pago contra entrega"; }
  });
  drawCart(); quote();
});
