document.addEventListener("DOMContentLoaded", async () => {
  const { $, esc, api, ic, waLink, ETA, etaTxt } = TD;
  const s = await api.settings();
  const wa = waLink(s, "Hola Todotil, tengo un reclamo sobre mi pedido");
  $("#pol").innerHTML = `
    <div><h2 style="font-size:18px;margin:0 0 4px">${ic("packageCheck")} Cambios</h2><div class="desc">${esc(s.warranty_text || "Revisa tu pedido al recibirlo. Si llega dañado, incompleto o no es lo que pediste, escríbenos por WhatsApp dentro de las 48 horas con fotos y te lo cambiamos.")}</div></div>
    <div><h2 style="font-size:18px;margin:0 0 4px">${ic("refresh")} Cómo pedir un cambio</h2><div class="desc">${esc(s.policies_text || "Conserva el producto con su empaque y accesorios. Te pediremos fotos para coordinar el cambio.")}</div></div>
    <div><h2 style="font-size:18px;margin:0 0 4px">${ic("truck")} Envíos y pago</h2><div class="desc">${esc(s.shipping_text || "El costo de envío se calcula según tu distrito.")}${s.payment_text ? "\n" + esc(s.payment_text) : ""}</div></div>
    <div id="entregas"><h2 style="font-size:18px;margin:0 0 4px">${ic("clock")} Tiempos de entrega (aproximados)</h2>
      <table class="tbl"><thead><tr><th>Destino</th><th>Tiempo aproximado</th></tr></thead><tbody>
        <tr><td>Lima Metropolitana y Callao</td><td><b>${etaTxt(ETA.lima)}</b></td></tr>
        <tr><td>Lima provincias (Barranca, Huaral, Huaura, Cañete, Canta y otras)</td><td><b>${etaTxt(ETA.limaProv)}</b></td></tr>
        <tr><td>Otras regiones: costa, sierra y selva</td><td><b>${etaTxt(ETA.prov)}</b></td></tr>
        <tr><td>Zonas alejadas o rurales</td><td>Puede tardar más; te lo confirmamos por WhatsApp</td></tr>
      </tbody></table>
      <div class="desc" style="margin-top:6px;font-size:14px;color:var(--muted)">Son tiempos estimados, no garantizados: se cuentan desde que confirmamos tu pedido por WhatsApp y dependen de la empresa de transporte y de tu ubicación. Antes del despacho te confirmamos por WhatsApp la fecha estimada de entrega.</div></div>
    <div><h2 style="font-size:18px;margin:0 0 4px">${ic("message")} Reclamos</h2><div class="desc">¿Tuviste un problema con tu pedido? ${wa ? `<a href="${wa}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>` : "Escríbenos"} con tu código de pedido y te respondemos.${TD_CONFIG.LIBRO_RECLAMACIONES_ON ? ' También puedes registrar un reclamo o una queja en nuestro <a href="libro-reclamaciones.html">Libro de Reclamaciones</a>.' : ""}</div></div>`;
  if (location.hash === "#entregas") setTimeout(() => $("#entregas").scrollIntoView({ behavior: "smooth" }), 100);
});
