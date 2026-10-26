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
  let orders = [], products = [], cats = [], filter = "pendiente", channel = null;

  const show = (id) => ["login", "setpw", "noadmin", "app"].forEach((x) => ($("#" + x).hidden = x !== id));

  async function boot() {
    const { data: { session } } = await sb.auth.getSession();
    $("#outBtn").hidden = !session;
    if (!session) return show("login");
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
    await Promise.all([loadOrders(), loadProducts()]);
    listen();
  }

  // ---------- Auth ----------
  $("#lf").addEventListener("submit", async (e) => {
    e.preventDefault(); $("#lerr").hidden = true; $("#lbtn").disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: $("#le").value.trim(), password: $("#lp").value });
    $("#lbtn").disabled = false;
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
    $("#pw1").value = $("#pw2").value = ""; sessionStorage.removeItem("todotil.needpw"); alert("Contraseña creada ✅"); boot();
  });
  $("#forgot").onclick = async (e) => {
    e.preventDefault(); const email = $("#le").value.trim();
    if (!email) { $("#lerr").textContent = "Escribe tu correo primero"; $("#lerr").hidden = false; return; }
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    $("#lerr").textContent = error ? error.message : "Te enviamos un correo para crear una nueva contraseña"; $("#lerr").hidden = false;
  };
  $("#outBtn").onclick = async () => { await sb.auth.signOut(); if (channel) sb.removeChannel(channel); location.reload(); };
  $("#notifBtn").onclick = async () => { await Notification.requestPermission(); $("#notifBtn").hidden = Notification.permission !== "default"; beep(); };

  // ---------- Tabs ----------
  document.querySelector(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    document.querySelectorAll(".tabs .chip").forEach((x) => x.classList.toggle("on", x === b));
    ["orders", "products", "settings"].forEach((t) => ($("#t-" + t).hidden = t !== b.dataset.t));
    if (b.dataset.t === "settings") drawSettings();
  });

  // ---------- Pedidos ----------
  async function loadOrders() {
    const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false }).limit(300);
    if (error) return alert(error.message);
    orders = data; drawOrders();
  }
  function drawOrders(newId) {
    const counts = {}; orders.forEach((o) => (counts[o.status] = (counts[o.status] || 0) + 1));
    const pend = counts.pendiente || 0;
    $("#pendCount").textContent = pend; $("#pendCount").hidden = !pend;
    document.title = (pend ? `(${pend}) ` : "") + "Panel · Todotil";
    $("#sf").innerHTML = [["", "Todos", orders.length]].concat(Object.keys(ST).map((k) => [k, ST[k], counts[k] || 0]))
      .map(([k, l, n]) => `<button class="chip ${filter === k ? "on" : ""}" data-f="${k}">${l} ${n ? "· " + n : ""}</button>`).join("");
    const list = filter ? orders.filter((o) => o.status === filter) : orders;
    $("#olist").innerHTML = list.map((o) => `<div class="orow s-${o.status} ${o.id === newId ? "new" : ""}" data-id="${o.id}">
        <b>${esc(o.public_code)} · ${esc(o.customer_name)} ${esc(o.customer_surname)}</b><span class="st st-${o.status}">${ST[o.status]}</span>
        <small>${(o.items || []).map((i) => i.qty + "× " + esc(i.name)).join(", ")}</small><b>${money(o.total)}</b>
        <small>${esc(o.district)}, ${esc(o.department)} · ${fmt(o.created_at)}</small></div>`).join("") || '<div class="empty">No hay pedidos aquí.</div>';
  }
  $("#sf").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { filter = b.dataset.f; drawOrders(); } });
  $("#olist").addEventListener("click", (e) => { const r = e.target.closest(".orow"); if (r) openOrder(r.dataset.id); });

  async function openOrder(id) {
    const o = orders.find((x) => x.id === id); if (!o) return;
    const { data: ev } = await sb.from("order_events").select("*").eq("order_id", id).order("created_at");
    const wa = "https://wa.me/51" + o.phone + "?text=" + encodeURIComponent(`Hola ${o.customer_name} 👋 te escribimos de Todotil por tu pedido ${o.public_code} (${money(o.total)}, pago contra entrega). ¿Confirmamos la entrega en ${o.address}, ${o.district}?`);
    const next = { pendiente: ["aprobado"], aprobado: ["enviado_a_dropi"], enviado_a_dropi: ["en_camino"], en_camino: ["entregado", "devuelto"] }[o.status] || [];
    $("#dlgBody").innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">${esc(o.public_code)}</h2><span class="st st-${o.status}">${ST[o.status]}</span></div>
      <div class="kv" style="margin:12px 0">
        <span>Cliente</span><b>${esc(o.customer_name)} ${esc(o.customer_surname)}</b>
        <span>Celular</span><a href="tel:+51${esc(o.phone)}">${esc(o.phone)}</a>
        ${o.dni ? `<span>DNI</span><div>${esc(o.dni)}</div>` : ""}${o.email ? `<span>Correo</span><div>${esc(o.email)}</div>` : ""}
        <span>Dirección</span><div>${esc(o.address)}<br>${esc(o.district)}${o.province ? ", " + esc(o.province) : ""}, ${esc(o.department)}</div>
        ${o.reference ? `<span>Referencia</span><div>${esc(o.reference)}</div>` : ""}${o.notes ? `<span>Notas</span><div>${esc(o.notes)}</div>` : ""}
        <span>Productos</span><div>${(o.items || []).map((i) => `${i.qty}× ${esc(i.name)} · ${money(i.line_total)} <small style="color:var(--muted)">(Dropi ${esc(i.dropi_product_id)})</small>`).join("<br>")}</div>
        <span>Envío</span><div>${money(o.shipping)}</div><span>Total</span><b>${money(o.total)} (contra entrega)</b>
        <span>Creado</span><div>${fmt(o.created_at)}</div>
      </div>
      <a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener" style="min-height:44px;font-size:15px">💬 Escribir al cliente</a>
      <label>Nota para el cliente <small>(opcional, se ve en el seguimiento)</small></label><input id="evNote" maxlength="300">
      <div class="acts" style="margin-top:10px">
        ${next.map((s) => `<button class="btn ${s === "devuelto" ? "btn-red" : "btn-blue"}" data-s="${s}">${s === "aprobado" ? "✅ Aprobar" : "→ " + ST[s]}</button>`).join("")}
        ${["cancelado", "entregado", "devuelto"].includes(o.status) ? "" : '<button class="btn btn-red" data-s="cancelado">Cancelar pedido</button>'}
      </div>
      <details style="margin-top:12px"><summary style="font-weight:800;cursor:pointer">Datos de Dropi / guía</summary>
        <label>ID pedido Dropi</label><input id="dId" value="${esc(o.dropi_order_id || "")}">
        <label>Estado en Dropi</label><input id="dSt" value="${esc(o.dropi_status || "")}">
        <label>Código de guía</label><input id="dTr" value="${esc(o.tracking_code || "")}">
        <button class="btn btn-ghost" id="dSave" style="margin-top:10px;min-height:44px">Guardar datos Dropi</button></details>
      <h3 style="margin:16px 0 6px">Historial</h3>
      <ul class="tl">${(ev || []).map((e) => `<li class="done"><b>${ST[e.status]}</b><small>${fmt(e.created_at)}${e.note ? " · " + esc(e.note) : ""}${e.is_public ? "" : " · (interno)"}</small></li>`).join("")}</ul>
      <button class="btn btn-ghost" id="dClose" style="margin-top:6px;min-height:44px">Cerrar</button>`;
    const dlg = $("#dlg"); dlg.showModal();
    $("#dClose").onclick = () => dlg.close();
    $("#dlgBody").querySelectorAll(".acts .btn").forEach((b) => (b.onclick = async () => {
      if (b.dataset.s === "cancelado" && !confirm("¿Cancelar este pedido?")) return;
      b.disabled = true;
      const { error } = await sb.rpc("admin_set_order_status", { p_order_id: o.id, p_status: b.dataset.s, p_note: $("#evNote").value || null, p_public: true });
      if (error) { alert(error.message); b.disabled = false; return; }
      await loadOrders(); openOrder(o.id);
    }));
    $("#dSave").onclick = async () => {
      const { error } = await sb.from("orders").update({ dropi_order_id: $("#dId").value.trim() || null, dropi_status: $("#dSt").value.trim() || null, tracking_code: $("#dTr").value.trim() || null }).eq("id", o.id);
      if (error) return alert(error.message);
      await loadOrders(); openOrder(o.id);
    };
  }

  // ---------- Realtime + avisos ----------
  function listen() {
    channel = sb.channel("orders-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (p) => {
        orders.unshift(p.new); drawOrders(p.new.id); beep();
        if ("Notification" in window && Notification.permission === "granted")
          new Notification("🛒 Nuevo pedido " + p.new.public_code, { body: `${p.new.customer_name} · S/ ${p.new.total} · ${p.new.district}`, icon: "../img/icon-192.png" });
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
    const [p, c] = await Promise.all([sb.from("products").select("*").order("sort"), sb.from("categories").select("*").order("sort")]);
    products = p.data || []; cats = c.data || []; drawProducts();
  }
  function drawProducts() {
    $("#plist").innerHTML = products.map((p) => `<div class="prow" data-id="${p.id}"><img src="${esc((p.images || [])[0] || "../img/icon-192.png")}" alt="">
      <div><b>${esc(p.name)}</b><br><small>${money(p.price)}${p.compare_at_price ? " · antes " + money(p.compare_at_price) : ""} · Dropi ${esc(p.dropi_product_id || "—")}</small></div>
      <span class="st ${p.active ? "st-entregado" : "draft"}">${p.active ? "Publicado" : "Borrador"}</span></div>`).join("") || '<div class="empty">Sin productos</div>';
  }
  $("#plist").addEventListener("click", (e) => { const r = e.target.closest(".prow"); if (r) editProduct(products.find((p) => p.id === r.dataset.id)); });
  $("#newP").onclick = () => editProduct({ active: false, featured: false, images: [], sort: (products.length + 1) * 10 });
  const slugify = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

  function editProduct(p) {
    const f = (k, l, t = "text", extra = "") => `<label>${l}</label><input id="f_${k}" type="${t}" value="${esc(p[k] ?? "")}" ${extra}>`;
    $("#dlgBody").innerHTML = `<h2 style="margin:0 0 6px">${p.id ? "Editar producto" : "Nuevo producto"}</h2>
      ${f("name", "Nombre", "text", "maxlength=120")}${f("slug", "Slug (URL)", "text", 'placeholder="se genera solo"')}
      <div class="row2"><div>${f("price", "Precio S/", "number", 'step="0.1" min="1"')}</div><div>${f("compare_at_price", "Antes S/ <small>(solo si es real)</small>", "number", 'step="0.1"')}</div></div>
      <div class="row2"><div>${f("dropi_product_id", "ID producto Dropi", "number")}</div><div>${f("dropi_variation_id", "ID variación Dropi", "number")}</div></div>
      <label>Categoría</label><select id="f_category"><option value="">—</option>${cats.map((c) => `<option value="${c.slug}" ${p.category === c.slug ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
      <label>Descripción corta</label><input id="f_short_description" value="${esc(p.short_description || "")}" maxlength="200">
      <label>Descripción larga</label><textarea id="f_long_description" rows="5">${esc(p.long_description || "")}</textarea>
      <label>Imágenes <small>(una URL por línea)</small></label><textarea id="f_images" rows="3">${esc((p.images || []).join("\n"))}</textarea>
      ${f("video_url", "Video <small>(YouTube, TikTok o .mp4)</small>", "url")}
      <div class="row2"><div>${f("stock_hint", "Stock referencial", "number")}</div><div>${f("sort", "Orden", "number")}</div></div>
      <label class="chk"><input type="checkbox" id="f_active" ${p.active ? "checked" : ""}> Publicado (visible en la tienda)</label>
      <label class="chk"><input type="checkbox" id="f_featured" ${p.featured ? "checked" : ""}> Destacado (“Lo más pedido”)</label>
      <div id="perr" class="err" hidden></div>
      <div class="acts" style="margin-top:14px"><button class="btn btn-main" id="pSave">Guardar</button><button class="btn btn-ghost" id="pClose">Cerrar</button>
      ${p.id ? '<button class="btn btn-red" id="pDel" style="grid-column:1/-1">Eliminar producto</button>' : ""}</div>`;
    const dlg = $("#dlg"); dlg.showModal();
    $("#pClose").onclick = () => dlg.close();
    const num = (id) => { const v = $("#" + id).value; return v === "" ? null : Number(v); };
    $("#pSave").onclick = async () => {
      const name = $("#f_name").value.trim();
      const row = {
        name, slug: $("#f_slug").value.trim() || slugify(name), price: num("f_price"), compare_at_price: num("f_compare_at_price"),
        dropi_product_id: num("f_dropi_product_id"), dropi_variation_id: num("f_dropi_variation_id"), category: $("#f_category").value || null,
        short_description: $("#f_short_description").value.trim() || null, long_description: $("#f_long_description").value.trim() || null,
        images: $("#f_images").value.split("\n").map((s) => s.trim()).filter(Boolean), video_url: $("#f_video_url").value.trim() || null,
        stock_hint: num("f_stock_hint"), sort: num("f_sort") ?? 0, active: $("#f_active").checked, featured: $("#f_featured").checked,
      };
      const err = (m) => { $("#perr").textContent = m; $("#perr").hidden = false; };
      if (!name || !row.price) return err("Nombre y precio son obligatorios");
      if (row.compare_at_price != null && row.compare_at_price <= row.price) return err("El precio 'Antes' debe ser mayor al precio actual (o déjalo vacío)");
      const q = p.id ? sb.from("products").update(row).eq("id", p.id) : sb.from("products").insert(row);
      const { error } = await q;
      if (error) return err(error.message);
      dlg.close(); loadProducts();
    };
    if (p.id) $("#pDel").onclick = async () => { if (!confirm("¿Eliminar este producto?")) return; const { error } = await sb.from("products").delete().eq("id", p.id); if (error) return alert(error.message); dlg.close(); loadProducts(); };
  }

  // ---------- Ajustes ----------
  async function drawSettings() {
    const { data: s } = await sb.from("app_settings").select("*").eq("id", 1).single();
    const box = $("#t-settings");
    box.innerHTML = `<div class="panel" style="margin-top:10px">
      <label>WhatsApp de la tienda <small>(con 51, ej. 51987654321)</small></label><input id="s_whatsapp" inputmode="numeric" value="${esc(s.whatsapp || "")}">
      <div class="row2"><div><label>Envío Lima/Callao S/</label><input id="s_fl" type="number" step="0.5" value="${s.shipping_fee_lima}"></div>
      <div><label>Envío provincias S/</label><input id="s_fp" type="number" step="0.5" value="${s.shipping_fee_provincia}"></div></div>
      <label>Texto de envío</label><textarea id="s_ship" rows="2">${esc(s.shipping_text || "")}</textarea>
      <label>Garantía</label><textarea id="s_war" rows="3">${esc(s.warranty_text || "")}</textarea>
      <label>Cambios y devoluciones</label><textarea id="s_pol" rows="3">${esc(s.policies_text || "")}</textarea>
      <div style="margin-top:14px"><button class="btn btn-main" id="sSave">Guardar ajustes</button></div></div>`;
    $("#sSave").onclick = async () => {
      const w = $("#s_whatsapp").value.replace(/\D/g, "");
      if (w && !/^519\d{8}$/.test(w)) return alert("El WhatsApp debe ser 51 + 9 dígitos");
      const { error } = await sb.from("app_settings").update({ whatsapp: w || null, shipping_fee_lima: Number($("#s_fl").value) || 0, shipping_fee_provincia: Number($("#s_fp").value) || 0,
        shipping_text: $("#s_ship").value.trim() || null, warranty_text: $("#s_war").value.trim() || null, policies_text: $("#s_pol").value.trim() || null }).eq("id", 1);
      alert(error ? error.message : "Guardado ✅");
    };
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
