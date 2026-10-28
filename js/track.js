document.addEventListener("DOMContentLoaded", () => {
  const { $, api, esc, money, STATUS } = TD;
  const FLOW = ["pendiente", "aprobado", "enviado_a_dropi", "en_camino", "entregado"];
  const q = new URLSearchParams(location.search);
  if (q.get("c")) $("#tcode").value = q.get("c");
  if (q.get("t")) $("#tlast").value = q.get("t");
  const fmt = (d) => new Date(d).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  async function run(e) {
    e && e.preventDefault();
    const err = $("#terr"); err.hidden = true;
    const code = $("#tcode").value.trim().toUpperCase(), last = $("#tlast").value.replace(/\D/g, "");
    UI.clearErrors($("#tf"));
    const okC = /^TD-[A-Z0-9]{4,6}$/.test(code), okL = last.length === 4;
    if (!okC) UI.fieldError("tcode", "Escribe tu código tal como te llegó (TD-XXXXX)");
    if (!okL) UI.fieldError("tlast", "Escribe los últimos 4 dígitos de tu celular");
    if (!okC || !okL) { (okC ? $("#tlast") : $("#tcode")).focus(); return; }
    $("#tbtn").disabled = true;
    try {
      const o = await api.track(code, last);
      if (!o) { $("#res").innerHTML = '<div class="panel empty">No encontramos ese pedido. Revisa el código y los 4 dígitos.</div>'; return; }
      const bad = ["cancelado", "devuelto"].includes(o.status);
      const idx = FLOW.indexOf(o.status);
      const evAt = {}; (o.events || []).forEach((ev) => { evAt[ev.status] = ev; });
      const steps = bad ? (o.events || []).map((ev) => ({ k: ev.status, ev })) : FLOW.map((k) => ({ k, ev: evAt[k] }));
      $("#res").innerHTML = `<div class="panel stack">
        <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px">${esc(o.public_code)}</b><span class="tag" style="font-size:13px">${esc(STATUS[o.status] || o.status)}</span></div>
        <div style="color:var(--muted);font-size:14px">${(o.items || []).map((i) => `${i.qty}× ${esc(i.name)}`).join("<br>")}</div>
        <div><b>Total a pagar al recibir: ${money(o.total)}${Number(o.shipping) > 0 ? "" : " + envío (se confirma por WhatsApp)"}</b></div>
        ${o.packages > 1 ? `<div class="warn">${TD.ic("package")}<span>Tu pedido llega en ${o.packages} paquetes separados.</span></div>` : ""}
        ${o.tracking_code ? `<div class="note">Código de guía: ${esc(o.tracking_code)}</div>` : ""}
        <ul class="tl">${steps.map((st, i) => {
          const cls = bad ? (st.k === o.status ? "bad" : "done") : (i < idx ? "done" : i === idx ? (o.status === "entregado" ? "done" : "cur") : "");
          return `<li class="${cls}"><b>${esc(STATUS[st.k] || st.k)}</b>${st.ev ? `<small>${fmt(st.ev.at)}${st.ev.note ? " · " + esc(st.ev.note) : ""}</small>` : ""}</li>`; }).join("")}</ul></div>`;
    } catch (ex) { err.textContent = ex.message; err.hidden = false; } finally { $("#tbtn").disabled = false; }
  }
  $("#tf").addEventListener("submit", run);
  if (q.get("c") && q.get("t")) run();
});
