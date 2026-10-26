document.addEventListener("DOMContentLoaded", async () => {
  const { $, esc, api } = TD;
  const s = await api.settings();
  $("#pol").innerHTML = `
    <div><h2 style="font-size:18px;margin:0 0 4px">🛡️ Garantía</h2><div class="desc">${esc(s.warranty_text || "[EDITAR] Texto de garantía")}</div></div>
    <div><h2 style="font-size:18px;margin:0 0 4px">🔁 Cambios y devoluciones</h2><div class="desc">${esc(s.policies_text || "[EDITAR] Texto de cambios")}</div></div>
    <div><h2 style="font-size:18px;margin:0 0 4px">🚚 Envíos y pago</h2><div class="desc">${esc(s.shipping_text || "[EDITAR] Envíos")}</div></div>
    <div style="font-size:13px;color:var(--muted)">Libro de Reclamaciones: [EDITAR AMILTHON — obligatorio en Perú antes de vender]</div>`;
});
