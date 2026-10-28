document.addEventListener("DOMContentLoaded", async () => {
  const { $, esc, api, ic, waLink } = TD;
  const s = await api.settings();
  $("#pol").innerHTML = `
    <div><h2 style="font-size:18px;margin:0 0 4px">${ic("shield")} Garantía</h2><div class="desc">${esc(s.warranty_text || "Garantía de 10 días por producto incompleto, mal funcionamiento, roto o diferente.")}</div></div>
    <div><h2 style="font-size:18px;margin:0 0 4px">${ic("refresh")} Cambios y devoluciones</h2><div class="desc">${esc(s.policies_text || "Avísanos dentro de los 10 días de recibido tu pedido.")}</div></div>
    <div><h2 style="font-size:18px;margin:0 0 4px">${ic("truck")} Envíos y pago</h2><div class="desc">${esc(s.shipping_text || "El costo de envío se calcula según tu distrito.")}${s.payment_text ? "\n" + esc(s.payment_text) : ""}</div></div>
    <div><h2 style="font-size:18px;margin:0 0 4px">${ic("message")} Reclamos</h2><div class="desc">¿Tuviste un problema con tu pedido? ${waLink(s, "Hola Todotil, tengo un reclamo sobre mi pedido") ? `<a href="${waLink(s, "Hola Todotil, tengo un reclamo sobre mi pedido")}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>` : "Escríbenos"} con tu código de pedido y te respondemos.</div></div>`;
});
