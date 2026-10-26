document.addEventListener("DOMContentLoaded", async () => {
  const { $, api, esc, money, cart } = TD;
  const s = await api.settings();
  const form = $("#form");
  // Refrescar precios/nombres reales del catálogo (el servidor recalcula igual al crear el pedido)
  try {
    const live = await api.products(); const by = Object.fromEntries(live.map((p) => [p.slug, p]));
    const before = cart.get(), after = before.filter((i) => by[i.slug]).map((i) => ({ ...i, name: by[i.slug].name, price: Number(by[i.slug].price), image: (by[i.slug].images || [])[0] || i.image }));
    cart.set(after); if (after.length < before.length) TD.toast("Quitamos un producto que ya no está disponible");
  } catch {}

  function drawCart() {
    const items = cart.get();
    if (!items.length) { $("#cartBox").innerHTML = '<div class="panel empty">Tu carrito está vacío 🛒<br><br><a class="btn btn-main" href="index.html">Ver productos</a></div>'; form.hidden = true; return; }
    const sub = items.reduce((a, i) => a + i.price * i.qty, 0);
    const ship = shipFee();
    $("#cartBox").innerHTML = `<div class="panel">${items.map((i) => `
      <div class="line"><img src="${esc(i.image || "img/icon-192.png")}" alt="">
        <div><h4>${esc(i.name)}</h4><div class="qty"><button type="button" data-a="m" data-s="${esc(i.slug)}">−</button><span>${i.qty}</span><button type="button" data-a="p" data-s="${esc(i.slug)}">+</button></div>
          <div><button class="rm" type="button" data-a="r" data-s="${esc(i.slug)}">Quitar</button></div></div>
        <b>${money(i.price * i.qty)}</b></div>`).join("")}
      <div style="padding-top:8px"><div class="sum"><span>Subtotal</span><b>${money(sub)}</b></div>
      <div class="sum"><span>Envío</span><b>${ship ? money(ship) : "Gratis"}</b></div>
      <div class="sum total"><span>Total a pagar al recibir</span><span>${money(sub + ship)}</span></div></div></div>`;
    form.hidden = false;
  }
  function shipFee() {
    const d = $("#dept").value;
    return Number((d === "Lima" || d === "Callao" || !d) ? s.shipping_fee_lima : s.shipping_fee_provincia) || 0;
  }
  $("#cartBox").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-a]"); if (!b) return;
    const it = cart.get().find((i) => i.slug === b.dataset.s); if (!it) return;
    if (b.dataset.a === "r") cart.remove(it.slug); else cart.qty(it.slug, it.qty + (b.dataset.a === "p" ? 1 : -1));
    drawCart();
  });

  // Departamento / distrito
  $("#dept").innerHTML = PE.departments.map((d) => `<option>${d}</option>`).join("");
  function syncDept() {
    const d = $("#dept").value, list = PE.districts[d];
    $("#provBox").hidden = !!list;
    $("#distSel").hidden = !list; $("#dist").hidden = !!list;
    if (list) $("#distSel").innerHTML = '<option value="">Elige tu distrito</option>' + list.map((x) => `<option>${x}</option>`).join("") + '<option value="__otro">Otro (escribir)</option>';
    drawCart();
  }
  $("#dept").onchange = syncDept;
  $("#distSel").onchange = () => { const o = $("#distSel").value === "__otro"; $("#dist").hidden = !o; if (o) $("#dist").focus(); };
  syncDept();

  // Recordar datos del cliente en este celular
  const SAVE = "todotil.customer.v1";
  const F = ["name", "surname", "phone", "dept", "prov", "addr", "ref", "dni", "email"];
  try { const sv = JSON.parse(localStorage.getItem(SAVE)) || {}; F.forEach((k) => { if (sv[k]) $("#" + k).value = sv[k]; }); syncDept(); if (sv.dist) { if ([...$("#distSel").options].some((o) => o.value === sv.dist)) $("#distSel").value = sv.dist; else { $("#dist").value = sv.dist; } } } catch {}

  if (location.hash === "#datos") setTimeout(() => form.scrollIntoView({ behavior: "smooth" }), 200);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#err"); err.hidden = true;
    const v = (id) => $("#" + id).value.trim();
    const district = !$("#distSel").hidden && $("#distSel").value && $("#distSel").value !== "__otro" ? $("#distSel").value : v("dist");
    const phone = v("phone").replace(/\D/g, "").replace(/^51(?=9\d{8}$)/, "");
    const fail = (m, id) => { err.textContent = m; err.hidden = false; if (id) $("#" + id).focus(); };
    if (v("name").length < 2) return fail("Escribe tu nombre", "name");
    if (v("surname").length < 2) return fail("Escribe tu apellido", "surname");
    if (!/^9\d{8}$/.test(phone)) return fail("Tu celular debe tener 9 dígitos y empezar con 9", "phone");
    if (district.length < 2) return fail("Elige o escribe tu distrito");
    if (v("addr").length < 5) return fail("Escribe tu dirección completa", "addr");
    if (v("dni") && !/^\d{8}$/.test(v("dni"))) return fail("El DNI debe tener 8 dígitos", "dni");
    const btn = $("#send"); btn.disabled = true; btn.textContent = "Enviando…";
    try {
      const res = await api.createOrder({
        customer: { name: v("name"), surname: v("surname"), phone, dni: v("dni"), email: v("email") },
        shipping: { department: v("dept"), province: $("#provBox").hidden ? "" : v("prov"), district, address: v("addr"), reference: v("ref") },
        notes: v("notes"),
        items: cart.get().map((i) => ({ slug: i.slug, qty: i.qty })),
      });
      const keep = {}; F.forEach((k) => (keep[k] = v(k))); keep.dist = district; localStorage.setItem(SAVE, JSON.stringify(keep));
      sessionStorage.setItem("todotil.last", JSON.stringify({ ...res, last4: phone.slice(-4) }));
      cart.clear();
      location.href = "gracias.html?c=" + encodeURIComponent(res.public_code);
    } catch (ex) { fail(ex.message); btn.disabled = false; btn.textContent = "Confirmar pedido · pago contra entrega"; }
  });
  drawCart();
});
