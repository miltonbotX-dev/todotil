// Libro de Reclamaciones virtual (D.S. 011-2011-PCM, Anexo I). Guarda vía RPC submit_complaint (solo inserta).
document.addEventListener("DOMContentLoaded", async () => {
  if (!TD_CONFIG.LIBRO_RECLAMACIONES_ON) return; // oculto: la página redirige al inicio
  const { $, esc, api, ic, money } = TD;
  const s = await api.settings();
  const pend = '<span class="pend">por completar</span>';
  const P = { name: s.legal_name, ruc: s.ruc, address: s.legal_address };
  const provHTML = (p) => `<b>Proveedor</b><span>${p.name ? esc(p.name) : "Todotil · " + pend}</span><b>RUC</b><span>${p.ruc ? esc(p.ruc) : pend}</span><b>Domicilio</b><span>${p.address ? esc(p.address) : pend}</span><b>Web</b><span>todotil.com</span>`;
  $("#prov").innerHTML = provHTML(P);
  const now = new Date();
  $("#today").textContent = now.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Lima" });
  const q = new URLSearchParams(location.search).get("pedido"); if (q) $("#oc").value = q.toUpperCase().slice(0, 20);
  $("#mi").onchange = () => ($("#gBox").hidden = !$("#mi").checked);
  $("#dt").onchange = () => { $("#dn").inputMode = $("#dt").value === "DNI" ? "numeric" : "text"; };
  const ts = UI.turnstile($("#tsLR")); // se activa con TURNSTILE_SITE_KEY (aquí solo filtra bots; el RPC valida y limita)

  $("#lrForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = $("#lrForm"), err = $("#err"); err.hidden = true; UI.clearErrors(f);
    const v = (id) => $("#" + id).value.trim();
    const kind = (f.querySelector('input[name="kd"]:checked') || {}).value || "";
    const gt = (f.querySelector('input[name="gt"]:checked') || {}).value || "producto";
    const dt = v("dt"), dn = v("dn").replace(/[^0-9A-Za-z]/g, ""), ph = v("ph").replace(/\D/g, "");
    const bad = [];
    const chk = (c, id, m) => { if (!c) { UI.fieldError(id, m); bad.push(id); } };
    chk(v("cn").length >= 5, "cn", "Escribe tu nombre completo");
    chk(dt === "DNI" ? /^\d{8}$/.test(dn) : dn.length >= 6, "dn", dt === "DNI" ? "El DNI tiene 8 dígitos" : "Revisa tu documento");
    chk(v("ad").length >= 5, "ad", "Escribe tu domicilio");
    chk(/^\d{7,9}$/.test(ph.replace(/^51(?=9\d{8}$)/, "")), "ph", "Revisa tu teléfono");
    chk(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("em")), "em", "Escribe un correo válido");
    if ($("#mi").checked) { chk(v("gn").length >= 5, "gn", "Nombre del padre, madre o representante"); chk(v("gp").replace(/\D/g, "").length >= 7, "gp", "Teléfono del representante"); }
    chk(v("gdsc").length >= 3, "gdsc", "Describe el producto o servicio");
    chk(!v("am") || /^\d+([.,]\d{1,2})?$/.test(v("am")), "am", "Monto en soles, ej. 59.90");
    chk(v("de").length >= 10, "de", "Cuéntanos el detalle (mínimo 10 caracteres)");
    chk(v("rq").length >= 3, "rq", "Indica qué solución esperas");
    const fail = (m) => { err.innerHTML = ic("alert", 18) + `<span>${esc(m)}</span>`; err.hidden = false; };
    if (!kind) bad.push("kd");
    if (bad.length) {
      fail(!kind && bad.length === 1 ? "Elige si es un reclamo o una queja" : "Revisa los campos marcados en rojo" + (!kind ? " y elige reclamo o queja" : ""));
      const first = bad[0] === "kd" ? f.querySelector('input[name="kd"]') : $("#" + bad[0]);
      first.scrollIntoView({ behavior: "smooth", block: "center" }); return;
    }
    if (!$("#ok").checked) return fail("Marca la casilla de conformidad para enviar");
    if (ts && !ts.token()) return fail("Marca la casilla de verificación");
    const payload = { kind, consumer_name: v("cn"), doc_type: dt, doc_number: dn, address: v("ad"), phone: ph, email: v("em"),
      is_minor: $("#mi").checked, guardian_name: v("gn"), guardian_doc: v("gd"), guardian_phone: v("gp"), guardian_email: v("ge"), guardian_address: v("ga"),
      good_type: gt, order_code: v("oc"), good_description: v("gdsc"), amount: v("am").replace(",", "."), detail: v("de"), request: v("rq"), accepted: true };
    const btn = $("#send"); btn.disabled = true; btn.textContent = "Enviando…";
    try {
      const r = await api.submitComplaint(payload);
      const at = new Date(r.created_at).toLocaleString("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
      const row = (k, val) => val ? `<b>${k}</b><span>${esc(val)}</span>` : "";
      $("#lrBox").innerHTML = `<div class="panel stack lr" id="sheet">
        <div class="note no-print">${ic("checkCircle", 20)}<span>Recibimos tu ${kind}. Te responderemos en un plazo no mayor a <b>15 días hábiles</b> al correo o teléfono que indicaste. Guarda o imprime esta constancia.</span></div>
        <h2 style="margin:0;font-size:19px">Hoja de reclamación Nº ${esc(r.code)}</h2>
        <div class="kv">${provHTML(P)}<b>Fecha</b><span>${esc(at)}</span></div>
        <h3 style="margin:6px 0 0;font-size:16px">1. Consumidor</h3>
        <div class="kv">${row("Nombre", payload.consumer_name)}${row(dt, dn)}${row("Domicilio", payload.address)}${row("Teléfono", ph)}${row("Correo", payload.email)}
          ${payload.is_minor ? row("Representante", payload.guardian_name) + row("Doc. repr.", payload.guardian_doc) + row("Tel. repr.", payload.guardian_phone) : ""}</div>
        <h3 style="margin:6px 0 0;font-size:16px">2. Bien contratado</h3>
        <div class="kv">${row("Tipo", gt === "producto" ? "Producto" : "Servicio")}${row("Pedido", payload.order_code)}${row("Monto", payload.amount ? money(payload.amount) : "")}${row("Descripción", payload.good_description)}</div>
        <h3 style="margin:6px 0 0;font-size:16px">3. ${kind === "reclamo" ? "Reclamo" : "Queja"}</h3>
        <div class="kv">${row("Detalle", payload.detail)}${row("Pedido", payload.request)}</div>
        <h3 style="margin:6px 0 0;font-size:16px">4. Observaciones y acciones del proveedor</h3>
        <p style="margin:0;color:var(--muted)">Pendiente de respuesta (plazo máximo: 15 días hábiles).</p>
        <p style="margin:0;font-size:13px;color:var(--muted)">El consumidor declaró su conformidad con el contenido de esta hoja.</p>
        <button type="button" class="btn btn-main no-print" id="print">${ic("printer", 20)} Imprimir o guardar en PDF</button>
      </div>`;
      $("#print").onclick = () => window.print();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (ex) { if (ts) ts.reset(); fail(ex.message); btn.disabled = false; btn.textContent = "Enviar hoja de reclamación"; }
  });
});
