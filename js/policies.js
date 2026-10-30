document.addEventListener("DOMContentLoaded", async () => {
  const { $, esc, api, ic, waLink } = TD;
  const s = await api.settings();
  $("#pol").innerHTML = `
    <div><h2 style="font-size:18px;margin:0 0 4px">${ic("packageCheck")} Cambios</h2><div class="desc">${esc(s.warranty_text || "Revisa tu pedido al recibirlo. Si llega dañado, incompleto o no es lo que pediste, escríbenos por WhatsApp dentro de las 48 horas con fotos y te lo cambiamos.")}</div></div>
    <div><h2 style="font-size:18px;margin:0 0 4px">${ic("refresh")} Cómo pedir un cambio</h2><div class="desc">${esc(s.policies_text || "Conserva el producto con su empaque y accesorios. Te pediremos fotos para coordinar el cambio.")}</div></div>
    <div><h2 style="font-size:18px;margin:0 0 4px">${ic("truck")} Envíos y pago</h2><div class="desc">${esc(s.shipping_text || "El costo de envío se calcula según tu distrito.")}${s.payment_text ? "\n" + esc(s.payment_text) : ""}</div></div>
    <div><h2 style="font-size:18px;margin:0 0 4px">${ic("message")} Reclamos</h2><div class="desc">¿Tuviste un problema con tu pedido? ${waLink(s, "Hola Todotil, tengo un reclamo sobre mi pedido") ? `<a href="${waLink(s, "Hola Todotil, tengo un reclamo sobre mi pedido")}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>` : "Escríbenos"} con tu código de pedido y te respondemos.</div></div>`;
});
