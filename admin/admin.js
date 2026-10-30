// Todotil · panel de administración (Supabase Auth + RLS + Realtime)
(function () {
  const C = window.TD_CONFIG;
  // Enlace de invitación / recuperación: llega con #access_token=...&type=invite|recovery
  const hp = new URLSearchParams(location.hash.slice(1));
  if (["invite", "recovery"].includes(hp.get("type"))) sessionStorage.setItem("todotil.needpw", "1");
  const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY, { auth: { persistSession: true, storageKey: "todotil.admin.auth" } });
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "S/ " + Number(n || 0).toFixed(2);
  const fmt = (d) => new Date(d).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const ST = { pendiente: "Pendiente", aprobado: "Aprobado", enviado_a_dropi: "Enviado a Dropi", en_camino: "En camino", entregado: "Entregado", cancelado: "Cancelado", devuelto: "Devuelto" };
  let orders = [], products = [], cats = [], suppliers = [], rates = [], filter = "pendiente", channel = null;
  const ic = (n, z) => UI.icon(n, z);
  const fail = (e) => UI.alert(e && e.message ? e.message : String(e), { title: "No se pudo completar", tone: "error" });

  const show = (id) => ["login", "setpw", "noadmin", "app"].forEach((x) => ($("#" + x).hidden = x !== id));

  async function boot() {
    const { data: { session } } = await sb.auth.getSession();
    $("#outBtn").hidden = !session;
    if (!session) { if (!lts) lts = UI.turnstile($("#lts")); return show("login"); }
    if (location.hash.includes("access_token")) history.replaceState(null, "", location.pathname);
    if (sessionStorage.getItem("todotil.needpw")) { $("#pwEmail").textContent = session.user.email || ""; return show("setpw"); }
    const { data: isAdmin } = await sb.rpc("is_admin");
    if (!isAdmin) {
      $("#noadmin").innerHTML = `<h2 style="margin-top:0">Tu usuario aún no es administrador</h2>
        <p>Envía este ID a Grok Bot para darte acceso:</p><div class="note" style="word-break:break-all">${esc(session.user.id)}</div>`;
      return show("noadmin");
    }
    show("app");
    if ("Notification" in window && Notification.permission === "default") $("#notifBtn").hidden = false;
    await Promise.all([loadOrders(), loadSuppliers(), loadProducts(), loadComplaints()]);
    listen();
  }

  // ---------- Auth ----------
  // Captcha (Turnstile) en el login: solo si TURNSTILE_SITE_KEY tiene valor. Requiere activar CAPTCHA en Supabase Auth con el Secret Key.
  let lts = null;
  const needTs = () => { if (lts && !lts.token()) { $("#lerr").textContent = "Marca la casilla de verificación"; $("#lerr").hidden = false; return true; } return false; };
  const tsOpt = () => (lts ? { captchaToken: lts.token() } : {});
  $("#lf").addEventListener("submit", async (e) => {
    e.preventDefault(); $("#lerr").hidden = true; UI.clearErrors($("#lf"));
    const okE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("#le").value.trim()), okP = !!$("#lp").value;
    if (!okE) UI.fieldError("le", "Escribe tu correo"); if (!okP) UI.fieldError("lp", "Escribe tu contraseña");
    if (!okE || !okP) return (okE ? $("#lp") : $("#le")).focus();
    if (needTs()) return;
    $("#lbtn").disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: $("#le").value.trim(), password: $("#lp").value, options: tsOpt() });
    $("#lbtn").disabled = false; if (lts) lts.reset();
    if (error) { $("#lerr").textContent = "Correo o contraseña incorrectos"; $("#lerr").hidden = false; return; }
    $("#lp").value = ""; boot();
  });
  $("#pf").addEventListener("submit", async (e) => {
    e.preventDefault(); const err = $("#perr2"); err.hidden = true;
    const a = $("#pw1").value, b = $("#pw2").value;
    if (a.length < 8) { err.textContent = "Mínimo 8 caracteres"; err.hidden = false; return; }
    if (a !== b) { err.textContent = "Las contraseñas no coinciden"; err.hidden = false; return; }
    $("#pbtn").disabled = true;
    const { error } = await sb.auth.updateUser({ password: a });
    $("#pbtn").disabled = false;
    if (error) { err.textContent = error.message; err.hidden = false; return; }
    $("#pw1").value = $("#pw2").value = ""; sessionStorage.removeItem("todotil.needpw"); UI.toast("Contraseña creada"); boot();
  });
  $("#forgot").onclick = async (e) => {
    e.preventDefault(); const email = $("#le").value.trim();
    if (!email) { $("#lerr").textContent = "Escribe tu correo primero"; $("#lerr").hidden = false; return; }
    if (needTs()) return;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname, ...tsOpt() }); if (lts) lts.reset();
    $("#lerr").textContent = error ? error.message : "Te enviamos un correo para crear una nueva contraseña"; $("#lerr").hidden = false;
  };
  $("#outBtn").onclick = async () => { await sb.auth.signOut(); if (channel) sb.removeChannel(channel); location.reload(); };
  $("#notifBtn").onclick = async () => { await Notification.requestPermission(); $("#notifBtn").hidden = Notification.permission !== "default"; beep(); };

  // ---------- Tabs ----------
  const TABS = ["orders", "products", "suppliers", "shipping", "complaints", "settings"];
  document.querySelector(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest(".tab"); if (!b) return;
    document.querySelectorAll(".tabs .tab").forEach((x) => x.classList.toggle("on", x === b));
    TABS.forEach((t) => ($("#t-" + t).hidden = t !== b.dataset.t));
    if (b.dataset.t === "settings") drawSettings();
    if (b.dataset.t === "shipping") loadRates();
    if (b.dataset.t === "suppliers") loadSuppliers();
    if (b.dataset.t === "complaints") loadComplaints();
  });
  const dlg = $("#dlg");
  const openDlg = (html) => { $("#dlgBody").innerHTML = html; if (!dlg.open) dlg.showModal(); };
  const supName = (id) => (suppliers.find((s) => s.id === id) || {}).name;
  const vBadge = (s) => s ? (s.verified ? `<span class="vb yes">${ic("badgeCheck", 13)} Verificado</span>` : `<span class="vb no">${ic("help", 13)} Sin verificar</span>`) : `<span class="vb no">Sin proveedor</span>`;

  // ---------- Pedidos ----------
  async function loadOrders() {
    const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false }).limit(300);
    if (error) return fail(error);
    orders = data; drawOrders();
  }
  function drawStats() {
    const today = new Date().toDateString(), m = new Date().getMonth(), y = new Date().getFullYear();
    const live = orders.filter((o) => !["cancelado", "devuelto"].includes(o.status));
    const pend = orders.filter((o) => o.status === "pendiente").length;
    const hoy = orders.filter((o) => new Date(o.created_at).toDateString() === today).length;
    const mes = live.filter((o) => { const d = new Date(o.created_at); return d.getMonth() === m && d.getFullYear() === y; }).reduce((a, o) => a + Number(o.total), 0);
    const ent = orders.filter((o) => o.status === "entregado").length;
    $("#stats").innerHTML = [["o", "clock", "Por atender", pend], ["", "clipboard", "Pedidos hoy", hoy], ["", "chart", "Ventas del mes", money(mes)], ["g", "checkCircle", "Entregados", ent]]
      .map(([c, i, l, v]) => `<div class="stat ${c}"><div class="si">${ic(i, 20)}</div><small>${l}</small><b>${v}</b></div>`).join("");
  }
  function drawOrders(newId) {
    const counts = {}; orders.forEach((o) => (counts[o.status] = (counts[o.status] || 0) + 1));
    const pend = counts.pendiente || 0;
    $("#pendCount").textContent = pend; $("#pendCount").hidden = !pend;
    document.title = (pend ? `(${pend}) ` : "") + "Panel · Todotil";
    drawStats();
    $("#sf").innerHTML = [["", "Todos", orders.length]].concat(Object.keys(ST).map((k) => [k, ST[k], counts[k] || 0]))
      .map(([k, l, n]) => `<button class="chip ${filter === k ? "on" : ""}" data-f="${k}">${l} ${n ? "· " + n : ""}</button>`).join("");
    const list = filter ? orders.filter((o) => o.status === filter) : orders;
    $("#olist").innerHTML = list.map((o) => { const np = (o.packages || []).length; return `<div class="orow s-${o.status} ${o.id === newId ? "new" : ""}" data-id="${o.id}">
        <b>${esc(o.public_code)} · ${esc(o.customer_name)} ${esc(o.customer_surname)}</b><span class="st st-${o.status}">${ST[o.status]}</span>
        <small>${(o.items || []).map((i) => i.qty + "× " + esc(i.name)).join(", ")}</small><b>${money(o.total)}</b>
        <small>${ic("map", 13)} ${esc(o.district)}, ${esc(o.department)} · ${fmt(o.created_at)}</small>${np > 1 ? `<small>${ic("package", 13)} ${np} paquetes</small>` : "<span></span>"}</div>`; }).join("")
      || `<div class="panel empty">${ic("clipboard", 32)}<br>No hay pedidos aquí.</div>`;
  }
  $("#sf").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { filter = b.dataset.f; drawOrders(); } });
  $("#olist").addEventListener("click", (e) => { const r = e.target.closest(".orow"); if (r) openOrder(r.dataset.id); });

  async function openOrder(id) {
    const o = orders.find((x) => x.id === id); if (!o) return;
    const { data: ev } = await sb.from("order_events").select("*").eq("order_id", id).order("created_at");
    const pk = o.packages || [];
    const wa = "https://wa.me/51" + o.phone + "?text=" + encodeURIComponent(`Hola ${o.customer_name}, te escribimos de Todotil por tu pedido ${o.public_code} (${money(o.total)}, pago contra entrega).${pk.length > 1 ? ` Llega en ${pk.length} paquetes separados.` : ""} ¿Confirmamos la entrega en ${o.address}, ${o.district}?`);
    const next = { pendiente: ["aprobado"], aprobado: ["enviado_a_dropi"], enviado_a_dropi: ["en_camino"], en_camino: ["entregado", "devuelto"] }[o.status] || [];
    const iname = (slug) => ((o.items || []).find((i) => i.slug === slug) || {}).name || slug;
    openDlg(`
      <div class="dh"><h2 style="margin:0">${esc(o.public_code)}</h2><span class="st st-${o.status}">${ST[o.status]}</span></div>
      <div class="kv" style="margin:12px 0">
        <span>Cliente</span><b>${esc(o.customer_name)} ${esc(o.customer_surname)}</b>
        <span>Celular</span><a href="tel:+51${esc(o.phone)}">${esc(o.phone)}</a>
        ${o.dni ? `<span>DNI</span><div>${esc(o.dni)}</div>` : ""}${o.email ? `<span>Correo</span><div>${esc(o.email)}</div>` : ""}
        <span>Dirección</span><div>${esc(o.address)}<br>${esc(o.district)}${o.province ? ", " + esc(o.province) : ""}, ${esc(o.department)}</div>
        ${o.reference ? `<span>Referencia</span><div>${esc(o.reference)}</div>` : ""}${o.notes ? `<span>Notas</span><div>${esc(o.notes)}</div>` : ""}
        <span>Productos</span><div>${(o.items || []).map((i) => `${i.qty}× ${esc(i.name)} · ${money(i.line_total)} <small style="color:var(--muted)">(Dropi ${esc(i.dropi_product_id || "—")})</small>${i.components ? `<br><small style="color:var(--muted)">Combo: ${i.components.map((c) => c.qty + "× " + esc(c.name)).join(", ")}</small>` : ""}`).join("<br>")}</div>
        <span>Envío</span><div>${Number(o.shipping) > 0 ? money(o.shipping) : "Por confirmar (WhatsApp)"}</div><span>Total</span><b>${money(o.total)}${Number(o.shipping) > 0 ? "" : " + envío"} (contra entrega)</b>
        <span>Creado</span><div>${fmt(o.created_at)}</div>
      </div>
      ${pk.length ? `<h3 style="margin:8px 0 4px;display:flex;gap:6px;align-items:center">${ic("package")} ${pk.length > 1 ? pk.length + " paquetes (uno por proveedor)" : "1 paquete"}</h3>
        ${pk.map((p) => `<div class="pk"><b>Paquete ${p.n} · ${esc(p.supplier_name || "Sin proveedor")}</b>${p.warehouse ? ` <small>(${esc(p.warehouse)})</small>` : ""}<br>
          <small>${(p.slugs || []).map((x) => esc(iname(x))).join(", ")} · ${p.units} und · envío ${p.source === "whatsapp" ? "por confirmar (WhatsApp)" : money(p.shipping)}${p.carrier ? " · " + esc(p.carrier) : ""}${p.days ? " · " + esc(p.days) : ""}${p.source === "tabla" ? " · tarifa de la tabla" : p.source === "whatsapp" ? "" : " · tarifa general"}</small></div>`).join("")}` : ""}
      <a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener" style="min-height:44px;font-size:15px;margin-top:12px">${ic("message")} Escribir al cliente</a>
      <label>Nota para el cliente <small>(opcional, se ve en el seguimiento)</small></label><input id="evNote" maxlength="300">
      <div class="acts" style="margin-top:10px">
        ${next.map((s) => `<button class="btn ${s === "devuelto" ? "btn-red" : "btn-blue"}" data-s="${s}">${s === "aprobado" ? ic("check") + " Aprobar" : ic("chevronRight") + " " + ST[s]}</button>`).join("")}
        ${["cancelado", "entregado", "devuelto"].includes(o.status) ? "" : `<button class="btn btn-red" data-s="cancelado">${ic("x")} Cancelar pedido</button>`}
      </div>
      <details style="margin-top:12px"><summary style="font-weight:800;cursor:pointer">Datos de Dropi / guía</summary>
        <label>ID pedido Dropi</label><input id="dId" value="${esc(o.dropi_order_id || "")}">
        <label>Estado en Dropi</label><input id="dSt" value="${esc(o.dropi_status || "")}">
        <label>Código de guía</label><input id="dTr" value="${esc(o.tracking_code || "")}">
        <button class="btn btn-ghost" id="dSave" style="margin-top:10px;min-height:44px">Guardar datos Dropi</button></details>
      <h3 style="margin:16px 0 6px">Historial</h3>
      <ul class="tl">${(ev || []).map((e) => `<li class="done"><b>${ST[e.status]}</b><small>${fmt(e.created_at)}${e.note ? " · " + esc(e.note) : ""}${e.is_public ? "" : " · (interno)"}</small></li>`).join("")}</ul>
      <button class="btn btn-ghost" id="dClose" style="margin-top:6px;min-height:44px">Cerrar</button>`);
    $("#dClose").onclick = () => dlg.close();
    $("#dlgBody").querySelectorAll(".acts .btn").forEach((b) => (b.onclick = async () => {
      if (b.dataset.s === "cancelado" && !(await UI.confirm("El cliente verá el pedido como cancelado.", { title: "¿Cancelar este pedido?", ok: "Sí, cancelar", cancel: "No", danger: true }))) return;
      b.disabled = true;
      const { error } = await sb.rpc("admin_set_order_status", { p_order_id: o.id, p_status: b.dataset.s, p_note: $("#evNote").value || null, p_public: true });
      if (error) { fail(error); b.disabled = false; return; }
      UI.toast("Estado actualizado: " + ST[b.dataset.s]);
      await loadOrders(); openOrder(o.id);
    }));
    $("#dSave").onclick = async () => {
      const { error } = await sb.from("orders").update({ dropi_order_id: $("#dId").value.trim() || null, dropi_status: $("#dSt").value.trim() || null, tracking_code: $("#dTr").value.trim() || null }).eq("id", o.id);
      if (error) return fail(error);
      UI.toast("Datos de Dropi guardados");
      await loadOrders(); openOrder(o.id);
    };
  }

  // ---------- Realtime + avisos ----------
  function listen() {
    channel = sb.channel("orders-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (p) => {
        orders.unshift(p.new); drawOrders(p.new.id); beep();
        if ("Notification" in window && Notification.permission === "granted")
          new Notification("Nuevo pedido " + p.new.public_code, { body: `${p.new.customer_name} · S/ ${p.new.total} · ${p.new.district}`, icon: "../img/icon-192.png" });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (p) => {
        const i = orders.findIndex((o) => o.id === p.new.id); if (i >= 0) orders[i] = p.new; drawOrders();
      }).subscribe();
  }
  let actx;
  function beep() {
    try { actx ||= new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.18, 0.36].forEach((t, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = [880, 1175, 1568][i];
        g.gain.setValueAtTime(0.25, actx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + t + 0.16);
        o.connect(g).connect(actx.destination); o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.17); });
    } catch {}
  }
  document.addEventListener("click", () => { if (actx && actx.state === "suspended") actx.resume(); }, { once: true });

  // ---------- Productos ----------
  async function loadProducts() {
    const [p, c] = await Promise.all([sb.from("products").select("*, combo_items!combo_items_combo_id_fkey(product_id, qty)").order("sort"), sb.from("categories").select("*").order("sort")]);
    if (p.error) return fail(p.error);
    products = p.data || []; cats = c.data || []; drawProducts();
  }
  function drawProducts() {
    $("#plist").innerHTML = products.map((p) => { const s = suppliers.find((x) => x.id === p.supplier_id); return `<div class="prow" data-id="${p.id}"><img src="${esc((p.images || [])[0] || "../img/icon-192.png")}" alt="">
      <div><b>${p.is_combo ? ic("layers", 15) + " " : ""}${esc(p.name)}</b><br><small>${money(p.price)}${p.cost != null ? " · costo " + money(p.cost) : ""} · Dropi ${esc(p.dropi_product_id || "—")}</small>
        <div style="margin-top:3px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><small>${ic("store", 13)} ${esc(s ? s.name : "Sin proveedor")}</small>${s ? vBadge(s) : ""}</div></div>
      <span class="st ${p.active ? "st-entregado" : "draft"}">${p.active ? "Publicado" : "Borrador"}</span></div>`; }).join("") || '<div class="empty">Sin productos</div>';
  }
  $("#plist").addEventListener("click", (e) => { const r = e.target.closest(".prow"); if (r) editProduct(products.find((p) => p.id === r.dataset.id)); });
  $("#newP").onclick = () => editProduct({ active: false, featured: false, is_combo: false, images: [], sort: (products.length + 1) * 10, combo_items: [] });
  const slugify = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

  function editProduct(p) {
    const f = (k, l, t = "text", extra = "") => `<label>${l}</label><input id="f_${k}" type="${t}" value="${esc(p[k] ?? "")}" ${extra}>`;
    let items = (p.combo_items || []).map((x) => ({ ...x }));
    openDlg(`<h2 style="margin:0 0 6px">${p.id ? "Editar producto" : "Nuevo producto"}</h2>
      ${f("name", "Nombre", "text", "maxlength=120")}${f("slug", "Slug (URL)", "text", 'placeholder="se genera solo"')}
      <label>Proveedor</label><select id="f_supplier_id"><option value="">— Sin proveedor —</option>${suppliers.map((s) => `<option value="${s.id}" ${p.supplier_id === s.id ? "selected" : ""}>${esc(s.name)}${s.verified ? " (verificado)" : ""}</option>`).join("")}</select>
      <div id="supInfo" style="margin-top:6px"></div>
      <div class="row2"><div>${f("price", "Precio de venta S/", "number", 'step="0.1" min="1"')}</div><div>${f("cost", "Costo proveedor S/", "number", 'step="0.01" min="0"')}</div></div>
      <div class="marg" id="marg"></div>
      ${f("compare_at_price", "Antes S/ <small>(solo si es real)</small>", "number", 'step="0.1"')}
      <div class="row2"><div>${f("dropi_product_id", "ID producto Dropi", "number")}</div><div>${f("dropi_variation_id", "ID variación Dropi", "number")}</div></div>
      <label>Categoría</label><select id="f_category"><option value="">—</option>${cats.map((c) => `<option value="${c.slug}" ${p.category === c.slug ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
      <label class="chk"><input type="checkbox" id="f_is_combo" ${p.is_combo ? "checked" : ""}> Es un combo / pack</label>
      <div id="comboBox" class="panel" style="box-shadow:none;border:1.5px solid var(--line);margin-top:8px" hidden>
        <b style="display:flex;gap:6px;align-items:center">${ic("layers")} Productos del combo</b>
        <div class="hint" style="margin:4px 0 0">Solo puedes elegir productos del mismo proveedor, así llega en un solo paquete.</div>
        <div id="ciList"></div><button type="button" class="btn btn-ghost sm" id="ciAdd" style="margin-top:8px">${ic("plus")} Agregar producto</button></div>
      <label>Descripción corta</label><input id="f_short_description" value="${esc(p.short_description || "")}" maxlength="200">
      <label>Descripción larga</label><textarea id="f_long_description" rows="5">${esc(p.long_description || "")}</textarea>
      <label>Fotos y videos <small>(la primera foto es la principal)</small></label>
      <div class="media" id="mediaBox"><div class="mgrid" id="mGrid"></div>
        <label class="btn btn-blue sm mup" for="mFile">${ic("upload")} Subir fotos o videos</label>
        <input type="file" id="mFile" accept="image/*,video/*" multiple hidden>
        <div class="mprog" id="mProg" hidden><div class="mbar"><i id="mBar"></i></div><small id="mTxt"></small></div>
        <div class="hint" style="margin:6px 0 0">Desde el celular: cámara o galería. Fotos se reducen a 1600 px. Videos hasta 50 MB.</div>
        <details style="margin-top:6px"><summary class="hint" style="cursor:pointer">Agregar por URL</summary>
          <div class="ci" style="grid-template-columns:1fr auto"><input id="mUrl" type="url" placeholder="https://…/foto.jpg o video.mp4"><button type="button" class="btn btn-ghost sm" id="mUrlAdd">${ic("plus")} Agregar</button></div></details></div>
      ${f("video_url", "Video de YouTube o TikTok <small>(opcional)</small>", "url")}
      <div class="row2"><div>${f("stock_hint", "Stock referencial", "number")}</div><div>${f("sort", "Orden", "number")}</div></div>
      <label class="chk"><input type="checkbox" id="f_active" ${p.active ? "checked" : ""}> Publicado (visible en la tienda)</label>
      <label class="chk"><input type="checkbox" id="f_featured" ${p.featured ? "checked" : ""}> Destacado (“Lo más pedido”)</label>
      <div id="perr" class="err" hidden></div>
      <div class="acts" style="margin-top:14px"><button class="btn btn-main" id="pSave">${ic("check")} Guardar</button><button class="btn btn-ghost" id="pClose">Cerrar</button>
      ${p.id ? `<button class="btn btn-red" id="pDel" style="grid-column:1/-1">${ic("trash")} Eliminar producto</button>` : ""}</div>`);
    const sup = () => $("#f_supplier_id").value || null;
    const supInfo = () => { const s = suppliers.find((x) => x.id === sup()); $("#supInfo").innerHTML = s ? `${vBadge(s)} <small style="color:var(--muted)">${esc([s.warehouse_city, s.dispatch_time && "despacho " + s.dispatch_time].filter(Boolean).join(" · "))}</small>` : ""; };
    const marg = () => { const pr = Number($("#f_price").value), co = Number($("#f_cost").value);
      $("#marg").innerHTML = pr && $("#f_cost").value !== "" ? `Ganancia estimada por unidad (antes de envío): <b>${money(pr - co)}</b> · ${Math.round(((pr - co) / pr) * 100)}%` : ""; };
    const eligible = () => products.filter((x) => x.id !== p.id && !x.is_combo && x.supplier_id && x.supplier_id === sup());
    const drawCI = () => {
      const el = eligible();
      $("#ciList").innerHTML = items.map((it, i) => `<div class="ci"><select data-i="${i}" class="ciP">${el.map((x) => `<option value="${x.id}" ${x.id === it.product_id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}${el.some((x) => x.id === it.product_id) ? "" : `<option value="${it.product_id}" selected>(otro proveedor) ${esc((products.find((x) => x.id === it.product_id) || {}).name || "?")}</option>`}</select>
        <input type="number" min="1" max="10" value="${it.qty}" data-i="${i}" class="ciQ" aria-label="Cantidad"><button type="button" class="iconbtn" data-i="${i}" aria-label="Quitar">${ic("trash", 16)}</button></div>`).join("")
        || `<div class="hint" style="margin-top:8px">${el.length ? "Aún no agregas productos." : "No hay otros productos de este proveedor. Elige primero el proveedor."}</div>`;
      $("#ciAdd").disabled = !el.length;
    };
    const syncCombo = () => { $("#comboBox").hidden = !$("#f_is_combo").checked; drawCI(); };
    $("#f_supplier_id").onchange = () => { supInfo(); const el = eligible().map((x) => x.id); const before = items.length; items = items.filter((x) => el.includes(x.product_id)); if (before !== items.length) UI.toast("Quitamos del combo los productos de otro proveedor", "info"); drawCI(); };
    $("#f_is_combo").onchange = syncCombo;
    $("#f_price").oninput = $("#f_cost").oninput = marg;
    $("#ciAdd").onclick = () => { const el = eligible().filter((x) => !items.some((i) => i.product_id === x.id)); if (!el.length) return UI.toast("Ya agregaste todos los productos de este proveedor", "info"); items.push({ product_id: el[0].id, qty: 1 }); drawCI(); };
    $("#ciList").addEventListener("change", (e) => { const i = Number(e.target.dataset.i); if (e.target.classList.contains("ciP")) items[i].product_id = e.target.value; if (e.target.classList.contains("ciQ")) items[i].qty = Math.max(1, Math.min(10, Number(e.target.value) || 1)); });
    $("#ciList").addEventListener("click", (e) => { const b = e.target.closest(".iconbtn"); if (b) { items.splice(Number(b.dataset.i), 1); drawCI(); } });
    supInfo(); marg(); syncCombo();
    // ---- Fotos y videos ----
    let media = [...(p.images || []).map((u) => ({ type: "img", url: u })), ...(p.videos || []).map(TDMedia.vidDec)], dropped = [], busy = 0;
    const drawMedia = () => {
      $("#mGrid").innerHTML = media.map((m, i) => `<div class="mitem${i === 0 && m.type === "img" ? " main" : ""}" data-i="${i}">
        ${m.type === "img" ? `<img src="${esc(m.url)}" alt="">` : `<video src="${esc(m.url)}#t=0.5" ${m.poster ? `poster="${esc(m.poster)}"` : ""} muted playsinline preload="metadata" disablePictureInPicture disableRemotePlayback tabindex="-1" style="pointer-events:none"></video><span class="mplay">${ic("play", 14)}</span>`}
        ${i === 0 && m.type === "img" ? `<span class="mtag">Principal</span>` : ""}
        <div class="mact">${m.type === "img" && i ? `<button type="button" data-a="main" aria-label="Hacer principal">${ic("star", 15)}</button>` : ""}
          ${i ? `<button type="button" data-a="l" aria-label="Mover antes">${ic("chevronLeft", 15)}</button>` : ""}
          ${i < media.length - 1 ? `<button type="button" data-a="r" aria-label="Mover después">${ic("chevronRight", 15)}</button>` : ""}
          <button type="button" data-a="x" class="del" aria-label="Quitar">${ic("trash", 15)}</button></div></div>`).join("")
        || `<div class="mempty">${ic("image", 26)}<span>Aún no hay fotos</span></div>`;
    };
    $("#mGrid").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-a]"); if (!b) return; const i = Number(b.closest(".mitem").dataset.i), a = b.dataset.a;
      if (a === "main") media.unshift(media.splice(i, 1)[0]);
      if (a === "l") [media[i - 1], media[i]] = [media[i], media[i - 1]];
      if (a === "r") [media[i + 1], media[i]] = [media[i], media[i + 1]];
      if (a === "x") { const [m] = media.splice(i, 1); dropped.push(m.url); if (m.poster) dropped.push(m.poster); }
      drawMedia();
    });
    $("#mUrlAdd").onclick = () => { const u = $("#mUrl").value.trim(); if (!/^https?:\/\//.test(u)) return UI.alert("Pega un enlace que empiece con https://", { title: "URL no válida", tone: "warn" });
      media.push(/\.(mp4|webm|mov)(\?|#|$)/i.test(u) ? { type: "vid", url: u } : { type: "img", url: u }); $("#mUrl").value = ""; drawMedia(); };
    $("#mFile").onchange = async (e) => {
      const files = [...e.target.files]; e.target.value = ""; if (!files.length) return;
      const big = files.filter((x) => /^video\//.test(x.type) && x.size > TDMedia.MAX_VIDEO);
      if (big.length) UI.alert(big.map((x) => `“${x.name}” pesa ${(x.size / 1048576).toFixed(1)} MB.`).join("\n") + "\nEl máximo por video es 50 MB. Recórtalo o grábalo en 720p y vuelve a intentarlo.", { title: "Video demasiado pesado", tone: "error" });
      const ok = files.filter((x) => !big.includes(x)); if (!ok.length) return;
      busy++; $("#pSave").disabled = true; $("#mProg").hidden = false; const errs = [];
      const folder = "products/" + (p.id || "nuevo");
      for (let k = 0; k < ok.length; k++) {
        const set = (f) => { $("#mBar").style.width = Math.round(((k + f) / ok.length) * 100) + "%"; $("#mTxt").textContent = `Subiendo ${k + 1} de ${ok.length}… ${Math.round(f * 100)}%`; };
        set(0);
        try { const m = await TDMedia.upload(sb, ok[k], folder, set); media.push(m); drawMedia(); } catch (ex) { errs.push(ex.message); }
      }
      busy--; $("#mProg").hidden = true; $("#pSave").disabled = false;
      if (errs.length) UI.alert(errs.join("\n"), { title: "Algunos archivos no se subieron", tone: "error" }); else UI.toast(ok.length === 1 ? "Archivo subido" : ok.length + " archivos subidos");
    };
    drawMedia();
    $("#pClose").onclick = () => dlg.close();
    const num = (id) => { const v = $("#" + id).value; return v === "" ? null : Number(v); };
    $("#pSave").onclick = async () => {
      const name = $("#f_name").value.trim();
      const isCombo = $("#f_is_combo").checked;
      const row = {
        name, slug: $("#f_slug").value.trim() || slugify(name), price: num("f_price"), cost: num("f_cost"), compare_at_price: num("f_compare_at_price"),
        supplier_id: sup(), is_combo: isCombo,
        dropi_product_id: num("f_dropi_product_id"), dropi_variation_id: num("f_dropi_variation_id"), category: $("#f_category").value || null,
        short_description: $("#f_short_description").value.trim() || null, long_description: $("#f_long_description").value.trim() || null,
        images: media.filter((m) => m.type === "img").map((m) => m.url), videos: media.filter((m) => m.type === "vid").map(TDMedia.vidEnc), video_url: $("#f_video_url").value.trim() || null,
        stock_hint: num("f_stock_hint"), sort: num("f_sort") ?? 0, active: $("#f_active").checked, featured: $("#f_featured").checked,
      };
      const err = (m) => { $("#perr").textContent = m; $("#perr").hidden = false; };
      if (busy) return err("Espera a que terminen de subir los archivos");
      if (!name || !row.price) return err("Nombre y precio son obligatorios");
      if (row.compare_at_price != null && row.compare_at_price <= row.price) return err("El precio 'Antes' debe ser mayor al precio actual (o déjalo vacío)");
      if (isCombo && !row.supplier_id) return err("Un combo necesita proveedor");
      if (isCombo && items.some((i) => !eligible().some((x) => x.id === i.product_id))) return err("Todos los productos del combo deben ser del mismo proveedor");
      if (isCombo && new Set(items.map((i) => i.product_id)).size !== items.length) return err("Hay un producto repetido en el combo");
      if (isCombo && row.active && !items.length) return err("Agrega los productos del combo antes de publicarlo");
      $("#pSave").disabled = true;
      // Si deja de ser combo, primero vaciar items
      if (p.id && p.is_combo && !isCombo) { const r0 = await sb.rpc("admin_set_combo_items", { p_combo: p.id, p_items: [] }); if (r0.error) { $("#pSave").disabled = false; return err(r0.error.message); } }
      const q = p.id ? sb.from("products").update(row).eq("id", p.id).select("id").single() : sb.from("products").insert(row).select("id").single();
      const { data, error } = await q;
      if (error) { $("#pSave").disabled = false; return err(error.message); }
      if (isCombo) { const r1 = await sb.rpc("admin_set_combo_items", { p_combo: data.id, p_items: items }); if (r1.error) { $("#pSave").disabled = false; return err(r1.error.message); } }
      if (dropped.length) TDMedia.remove(sb, dropped);
      dlg.close(); UI.toast("Producto guardado"); loadProducts();
    };
    if (p.id) $("#pDel").onclick = async () => {
      if (!(await UI.confirm("Se quitará de la tienda y del panel. Los pedidos anteriores no se modifican.", { title: "¿Eliminar este producto?", ok: "Eliminar", danger: true }))) return;
      const { error } = await sb.from("products").delete().eq("id", p.id);
      if (error) return fail(/foreign key|violates/.test(error.message) ? { message: "Este producto está dentro de un combo. Quítalo del combo primero." } : error);
      dlg.close(); UI.toast("Producto eliminado"); loadProducts();
    };
  }

  // ---------- Proveedores ----------
  async function loadSuppliers() {
    const { data, error } = await sb.from("suppliers").select("*").order("verified", { ascending: false }).order("name");
    if (error) return fail(error);
    suppliers = data || []; drawSuppliers(); if (products.length) drawProducts();
  }
  function drawSuppliers() {
    $("#slist").innerHTML = suppliers.map((s) => { const n = products.filter((p) => p.supplier_id === s.id).length; return `<div class="srow" data-id="${s.id}">
      <b style="display:flex;gap:8px;align-items:center">${s.image_url ? `<img class="slogo" src="${esc(s.image_url)}" alt="">` : ""}${esc(s.name)}</b>${vBadge(s)}
      <div class="meta">${s.dropi_supplier_id ? `<span>${ic("tag", 13)} Dropi #${esc(s.dropi_supplier_id)}</span>` : ""}${s.warehouse_city ? `<span>${ic("map", 13)} ${esc(s.warehouse_city)}</span>` : ""}${s.dispatch_time ? `<span>${ic("clock", 13)} ${esc(s.dispatch_time)}</span>` : ""}<span>${ic("box", 13)} ${n} producto${n === 1 ? "" : "s"}</span>${s.active ? "" : "<span>Inactivo</span>"}</div>
      ${s.notes ? `<small style="grid-column:1/-1">${esc(s.notes)}</small>` : ""}</div>`; }).join("") || `<div class="panel empty">${ic("store", 32)}<br>Aún no hay proveedores.</div>`;
  }
  $("#slist").addEventListener("click", (e) => { const r = e.target.closest(".srow"); if (r) editSupplier(suppliers.find((s) => s.id === r.dataset.id)); });
  $("#newS").onclick = () => editSupplier({ verified: false, active: true });
  function editSupplier(s) {
    const f = (k, l, t = "text", extra = "") => `<label>${l}</label><input id="s_${k}" type="${t}" value="${esc(s[k] ?? "")}" ${extra}>`;
    openDlg(`<h2 style="margin:0 0 6px">${s.id ? "Editar proveedor" : "Nuevo proveedor"}</h2>
      ${f("name", "Nombre", "text", "maxlength=80")}
      <label>Foto / logo <small>(opcional)</small></label><div class="sImg"><img id="sImgV" src="${esc(s.image_url || "../img/icon-192.png")}" alt="">
        <label class="btn btn-ghost sm" for="sImgF">${ic("upload")} Subir foto</label><input type="file" id="sImgF" accept="image/*" hidden><small id="sImgT"></small></div>
      <div class="row2"><div>${f("dropi_supplier_id", "ID proveedor Dropi", "number")}</div><div>${f("dropi_name", "Nombre en Dropi")}</div></div>
      <div class="row2"><div>${f("warehouse_city", "Bodega / ciudad")}</div><div>${f("dispatch_time", "Tiempo de despacho", "text", 'placeholder="ej. 9 h"')}</div></div>
      <label class="chk"><input type="checkbox" id="s_verified" ${s.verified ? "checked" : ""}> Verificado en Dropi</label>
      <label class="chk"><input type="checkbox" id="s_active" ${s.active ? "checked" : ""}> Activo</label>
      <label>Notas</label><textarea id="s_notes" rows="3" maxlength="600">${esc(s.notes || "")}</textarea>
      <div id="serr" class="err" hidden></div>
      <div class="acts" style="margin-top:14px"><button class="btn btn-main" id="sSave">${ic("check")} Guardar</button><button class="btn btn-ghost" id="sClose">Cerrar</button>
      ${s.id ? `<button class="btn btn-red" id="sDel" style="grid-column:1/-1">${ic("trash")} Eliminar proveedor</button>` : ""}</div>`);
    let sImg = s.image_url || null;
    $("#sImgF").onchange = async (e) => { const fl = e.target.files[0]; e.target.value = ""; if (!fl) return;
      $("#sSave").disabled = true; $("#sImgT").textContent = "Subiendo…";
      try { const m = await TDMedia.upload(sb, fl, "suppliers", (x) => ($("#sImgT").textContent = "Subiendo… " + Math.round(x * 100) + "%")); sImg = m.url; $("#sImgV").src = m.url; $("#sImgT").textContent = "Lista"; }
      catch (ex) { $("#sImgT").textContent = ""; fail(ex); }
      $("#sSave").disabled = false; };
    $("#sClose").onclick = () => dlg.close();
    $("#sSave").onclick = async () => {
      const v = (k) => $("#s_" + k).value.trim() || null;
      const row = { name: v("name"), dropi_supplier_id: v("dropi_supplier_id") ? Number(v("dropi_supplier_id")) : null, dropi_name: v("dropi_name"),
        warehouse_city: v("warehouse_city"), dispatch_time: v("dispatch_time"), notes: v("notes"), image_url: sImg, verified: $("#s_verified").checked, active: $("#s_active").checked };
      const err = (m) => { $("#serr").textContent = m; $("#serr").hidden = false; };
      if (!row.name || row.name.length < 2) return err("Escribe el nombre del proveedor");
      const { error } = s.id ? await sb.from("suppliers").update(row).eq("id", s.id) : await sb.from("suppliers").insert(row);
      if (error) return err(/duplicate|unique/.test(error.message) ? "Ya existe un proveedor con ese ID de Dropi" : error.message);
      dlg.close(); UI.toast("Proveedor guardado"); loadSuppliers();
    };
    if (s.id) $("#sDel").onclick = async () => {
      if (products.some((p) => p.supplier_id === s.id)) return UI.alert("Este proveedor tiene productos asignados. Cámbialos de proveedor primero.", { title: "No se puede eliminar", tone: "warn" });
      if (!(await UI.confirm("También se borran sus tarifas de envío específicas.", { title: "¿Eliminar " + s.name + "?", ok: "Eliminar", danger: true }))) return;
      const { error } = await sb.from("suppliers").delete().eq("id", s.id);
      if (error) return fail(error);
      dlg.close(); UI.toast("Proveedor eliminado"); loadSuppliers();
    };
  }

  // ---------- Envíos ----------
  async function loadRates() {
    const { data, error } = await sb.from("shipping_rates").select("*").order("department").order("province", { nullsFirst: true }).order("district", { nullsFirst: true }).order("min_units");
    if (error) return fail(error);
    rates = data || []; drawRates();
  }
  function drawRates() {
    $("#rlist").innerHTML = rates.map((r) => `<div class="srow" data-id="${r.id}">
      <b>${esc([r.district, r.province, r.department].filter(Boolean).join(", "))}</b><b style="color:var(--blue)">${money(r.price)}</b>
      <div class="meta">${r.carrier ? `<span>${ic("truck", 13)} ${esc(r.carrier)}</span>` : ""}${r.delivery_days ? `<span>${ic("clock", 13)} ${esc(r.delivery_days)}</span>` : ""}
        <span>${ic("box", 13)} ${r.max_units ? r.min_units + "–" + r.max_units : r.min_units + "+"} und</span>
        <span>${ic("store", 13)} ${esc(r.supplier_id ? supName(r.supplier_id) || "Proveedor" : "Todos los proveedores")}</span>${r.active ? "" : "<span>Inactiva</span>"}</div>
      ${r.notes ? `<small style="grid-column:1/-1">${esc(r.notes)}</small>` : ""}</div>`).join("")
      || `<div class="panel empty">${ic("truck", 32)}<br>Aún no hay tarifas. Mientras tanto se cobra la tarifa general de Ajustes.<br><small>Referencia vista en Dropi (linterna 8824, contra entrega): Urbano S/ 13.67 · Fenix S/ 22.00</small></div>`;
  }
  $("#rlist").addEventListener("click", (e) => { const r = e.target.closest(".srow"); if (r) editRate(rates.find((x) => String(x.id) === r.dataset.id)); });
  $("#newR").onclick = () => editRate({ department: "Lima", province: "Lima", active: true, min_units: 1 });
  function editRate(r) {
    const U = window.UBIGEO || {};
    const opt = (list, cur, all) => `<option value="">${all}</option>` + list.map((x) => `<option ${x === cur ? "selected" : ""}>${esc(x)}</option>`).join("");
    openDlg(`<h2 style="margin:0 0 6px">${r.id ? "Editar tarifa" : "Nueva tarifa"}</h2>
      <label>Departamento</label><select id="r_dep">${Object.keys(U).map((d) => `<option ${d === r.department ? "selected" : ""}>${esc(d)}</option>`).join("")}</select>
      <label>Provincia <small>(vacío = todo el departamento)</small></label><select id="r_prov"></select>
      <label>Distrito <small>(vacío = toda la provincia)</small></label><select id="r_dist"></select>
      <div class="row2"><div><label>Precio S/</label><input id="r_price" type="number" step="0.01" min="0" value="${esc(r.price ?? "")}"></div>
        <div><label>Transportadora</label><input id="r_carrier" list="carriers" value="${esc(r.carrier || "")}" placeholder="Urbano, Fenix…"><datalist id="carriers"><option>Urbano</option><option>Fenix</option><option>99 Minutos</option><option>Olva</option><option>Shalom</option></datalist></div></div>
      <div class="row2"><div><label>Tiempo de entrega</label><input id="r_days" value="${esc(r.delivery_days || "")}" placeholder="ej. 1-2 días"></div>
        <div><label>Proveedor</label><select id="r_sup"><option value="">Todos</option>${suppliers.map((s) => `<option value="${s.id}" ${r.supplier_id === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></div></div>
      <div class="row2"><div><label>Desde (unidades)</label><input id="r_min" type="number" min="1" value="${esc(r.min_units ?? 1)}"></div>
        <div><label>Hasta (unidades) <small>(vacío = sin tope)</small></label><input id="r_max" type="number" min="1" value="${esc(r.max_units ?? "")}"></div></div>
      <label class="chk"><input type="checkbox" id="r_active" ${r.active ? "checked" : ""}> Activa</label>
      <label>Notas</label><input id="r_notes" value="${esc(r.notes || "")}" maxlength="200" placeholder="ej. contra entrega, según Dropi">
      <div id="rerr" class="err" hidden></div>
      <div class="acts" style="margin-top:14px"><button class="btn btn-main" id="rSave">${ic("check")} Guardar</button><button class="btn btn-ghost" id="rClose">Cerrar</button>
      ${r.id ? `<button class="btn btn-red" id="rDel" style="grid-column:1/-1">${ic("trash")} Eliminar tarifa</button>` : ""}</div>`);
    const fillProv = (cur) => { $("#r_prov").innerHTML = opt(Object.keys(U[$("#r_dep").value] || {}), cur, "Todas las provincias"); };
    const fillDist = (cur) => { $("#r_dist").innerHTML = opt(((U[$("#r_dep").value] || {})[$("#r_prov").value]) || [], cur, "Todos los distritos"); $("#r_dist").disabled = !$("#r_prov").value; };
    $("#r_dep").onchange = () => { fillProv(); fillDist(); };
    $("#r_prov").onchange = () => fillDist();
    fillProv(r.province); fillDist(r.district);
    $("#rClose").onclick = () => dlg.close();
    $("#rSave").onclick = async () => {
      const err = (m) => { $("#rerr").textContent = m; $("#rerr").hidden = false; };
      const price = $("#r_price").value, min = Number($("#r_min").value) || 1, max = $("#r_max").value ? Number($("#r_max").value) : null;
      if (price === "" || Number(price) < 0) return err("Escribe el precio del envío");
      if (max != null && max < min) return err("'Hasta' debe ser mayor o igual a 'Desde'");
      const row = { department: $("#r_dep").value, province: $("#r_prov").value || null, district: $("#r_dist").value || null, price: Number(price),
        carrier: $("#r_carrier").value.trim() || null, delivery_days: $("#r_days").value.trim() || null, supplier_id: $("#r_sup").value || null,
        min_units: min, max_units: max, active: $("#r_active").checked, notes: $("#r_notes").value.trim() || null };
      const { error } = r.id ? await sb.from("shipping_rates").update(row).eq("id", r.id) : await sb.from("shipping_rates").insert(row);
      if (error) return err(error.message);
      dlg.close(); UI.toast("Tarifa guardada"); loadRates();
    };
    if (r.id) $("#rDel").onclick = async () => {
      if (!(await UI.confirm("Los nuevos pedidos usarán otra tarifa que calce o la tarifa general.", { title: "¿Eliminar esta tarifa?", ok: "Eliminar", danger: true }))) return;
      const { error } = await sb.from("shipping_rates").delete().eq("id", r.id);
      if (error) return fail(error);
      dlg.close(); UI.toast("Tarifa eliminada"); loadRates();
    };
  }

  // ---------- Libro de Reclamaciones ----------
  let complaints = [];
  // días hábiles (lun–vie) transcurridos desde d; no descuenta feriados
  const bizDays = (d) => { let n = 0; const x = new Date(d), t = new Date(); x.setHours(0, 0, 0, 0); while (x < t) { x.setDate(x.getDate() + 1); const w = x.getDay(); if (w && w !== 6 && x <= t) n++; } return n; };
  async function loadComplaints() {
    const { data, error } = await sb.from("complaints").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) return; complaints = data || [];
    const pend = complaints.filter((c) => c.status === "pendiente").length;
    $("#lrCount").textContent = pend; $("#lrCount").hidden = !pend;
    const box = $("#lrlist");
    box.innerHTML = complaints.length ? complaints.map((c) => { const d = bizDays(c.created_at);
      return `<div class="panel" style="margin-bottom:8px;cursor:pointer" data-lr="${c.id}"><b>${esc(c.code)}</b> · ${c.kind === "queja" ? "Queja" : "Reclamo"} · ${esc(c.consumer_name)}
        <div style="font-size:13px;color:var(--muted)">${fmt(c.created_at)}${c.order_code ? " · " + esc(c.order_code) : ""} · ${c.status === "respondido" ? "Respondido" : `<b style="color:${d >= 12 ? "var(--bad)" : "inherit"}">Pendiente · ${d} de 15 días hábiles</b>`}</div></div>`; }).join("")
      : '<div class="panel" style="color:var(--muted)">Aún no hay hojas de reclamación.</div>';
  }
  $("#lrlist") && $("#lrlist").addEventListener("click", (e) => {
    const el = e.target.closest("[data-lr]"); if (!el) return;
    const c = complaints.find((x) => x.id === el.dataset.lr); if (!c) return;
    const r = (k, v) => v ? `<div><b>${k}:</b> ${esc(v)}</div>` : "";
    openDlg(`<h2 style="margin-top:0">${esc(c.code)} · ${c.kind === "queja" ? "Queja" : "Reclamo"}</h2>
      ${r("Fecha", fmt(c.created_at))}${r("Consumidor", c.consumer_name)}${r(c.doc_type, c.doc_number)}${r("Domicilio", c.address)}${r("Teléfono", c.phone)}${r("Correo", c.email)}
      ${c.is_minor ? r("Representante", [c.guardian_name, c.guardian_doc, c.guardian_phone, c.guardian_email].filter(Boolean).join(" · ")) : ""}
      ${r("Bien", (c.good_type === "servicio" ? "Servicio" : "Producto") + " · " + c.good_description)}${r("Pedido", c.order_code)}${r("Monto", c.amount != null ? money(c.amount) : "")}
      ${r("Detalle", c.detail)}${r("Pedido del consumidor", c.request)}
      <label>Respuesta / acciones adoptadas</label><textarea id="lrResp" rows="4">${esc(c.response || "")}</textarea>
      ${c.response_at ? `<p class="hint">Respondido el ${fmt(c.response_at)}</p>` : ""}
      <div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-main" id="lrSave">${ic("check")} Guardar respuesta</button><button class="btn btn-ghost" id="lrClose">Cerrar</button></div>`);
    $("#lrClose").onclick = () => dlg.close();
    $("#lrSave").onclick = async () => {
      const { error } = await sb.rpc("admin_answer_complaint", { p_id: c.id, p_response: $("#lrResp").value });
      if (error) return fail(error);
      dlg.close(); UI.toast("Respuesta guardada"); loadComplaints();
    };
  });

  // ---------- Ajustes ----------
  async function drawSettings() {
    const { data: s, error } = await sb.from("app_settings").select("*").eq("id", 1).single();
    if (error) return fail(error);
    const box = $("#t-settings");
    box.innerHTML = `<div class="panel" style="margin-top:10px">
      <label>WhatsApp de la tienda <small>(con 51, ej. 51987654321; vacío = se ocultan los botones)</small></label><input id="s_whatsapp" inputmode="numeric" value="${esc(s.whatsapp || "")}">
      <div class="note" style="margin-top:10px">${ic("info", 18)}<span>Envío: <b>se confirma por WhatsApp</b> antes del despacho. El total del pedido solo incluye los productos.</span></div>
      <div hidden><div class="row2"><div><label>Envío general Lima/Callao S/</label><input id="s_fl" type="number" step="0.5" value="${s.shipping_fee_lima}"></div>
      <div><label>Envío general provincias S/</label><input id="s_fp" type="number" step="0.5" value="${s.shipping_fee_provincia}"></div></div>
      <p class="hint" style="margin:6px 0 0">Se usa cuando no hay una tarifa en la pestaña Envíos. Se cobra por paquete (proveedor).</p></div>
      <h3 style="margin:16px 0 0;font-size:16px">Datos del negocio <small style="color:var(--muted)">(Libro de Reclamaciones y Privacidad)</small></h3>
      ${!s.legal_name || !s.ruc || !s.legal_address ? `<div class="warn">${ic("alert", 18)}<span>Faltan datos obligatorios para el Libro de Reclamaciones: ${[!s.legal_name && "nombre o razón social", !s.ruc && "RUC", !s.legal_address && "dirección"].filter(Boolean).join(", ")}.</span></div>` : ""}
      <label>Nombre o razón social</label><input id="s_ln" value="${esc(s.legal_name || "")}">
      <div class="row2"><div><label>RUC</label><input id="s_ruc" inputmode="numeric" maxlength="11" value="${esc(s.ruc || "")}"></div>
      <div><label>Correo de contacto</label><input id="s_ce" type="email" value="${esc(s.contact_email || "")}"></div></div>
      <label>Dirección (domicilio fiscal)</label><input id="s_la" value="${esc(s.legal_address || "")}">
      <label>Horario de atención <small>(ej. Lunes a sábado de 9:00 a 18:00)</small></label><input id="s_bh" value="${esc(s.business_hours || "")}">
      <label>Texto de envío</label><textarea id="s_ship" rows="2">${esc(s.shipping_text || "")}</textarea>
      <label>Medios de pago</label><textarea id="s_pay" rows="2">${esc(s.payment_text || "")}</textarea>
      <label>Cambio si llega dañado (texto principal)</label><textarea id="s_war" rows="5">${esc(s.warranty_text || "")}</textarea>
      <label>Cómo pedir un cambio</label><textarea id="s_pol" rows="4">${esc(s.policies_text || "")}</textarea>
      <div style="margin-top:14px"><button class="btn btn-main" id="sSave">${ic("check")} Guardar ajustes</button></div></div>`;
    $("#sSave").onclick = async () => {
      const w = $("#s_whatsapp").value.replace(/\D/g, "");
      if (w && !/^519\d{8}$/.test(w)) return UI.alert("El WhatsApp debe ser 51 + 9 dígitos (ej. 51987654321).", { title: "Revisa el número", tone: "warn" });
      const ruc = $("#s_ruc").value.replace(/\D/g, "");
      if (ruc && !/^(10|15|17|20)\d{9}$/.test(ruc)) return UI.alert("El RUC tiene 11 dígitos y empieza con 10 o 20.", { title: "Revisa el RUC", tone: "warn" });
      const { error } = await sb.from("app_settings").update({ whatsapp: w || null, shipping_fee_lima: Number($("#s_fl").value) || 0, shipping_fee_provincia: Number($("#s_fp").value) || 0,
        shipping_text: $("#s_ship").value.trim() || null, payment_text: $("#s_pay").value.trim() || null, warranty_text: $("#s_war").value.trim() || null, policies_text: $("#s_pol").value.trim() || null,
        legal_name: $("#s_ln").value.trim() || null, ruc: ruc || null, legal_address: $("#s_la").value.trim() || null, business_hours: $("#s_bh").value.trim() || null, contact_email: $("#s_ce").value.trim() || null }).eq("id", 1);
      if (error) return fail(error);
      UI.toast("Ajustes guardados");
    };
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
