// Páginas informativas: completa datos del proveedor, contacto y tiempos de entrega desde app_settings.
document.addEventListener("DOMContentLoaded", async () => {
  const { esc, api, waLink, waIcon, ETA, etaTxt } = TD;
  const s = await api.settings();
  const pend = ""; // sin datos: no se muestra nada (antes "por completar")
  if (!TD_CONFIG.LIBRO_RECLAMACIONES_ON) document.querySelectorAll("[data-lr]").forEach((el) => el.remove());
  const val = { legal_name: s.legal_name, ruc: s.ruc, legal_address: s.legal_address, business_hours: s.business_hours };
  document.querySelectorAll("[data-s]").forEach((el) => { const v = val[el.dataset.s]; el.innerHTML = v ? esc(v) : esc(el.dataset.fb || ""); });
  document.querySelectorAll("[data-row]").forEach((el) => { if (!val[el.dataset.row]) el.hidden = true; });
  const wa = waLink(s, "Hola Todotil, tengo una consulta");
  const pretty = String(s.whatsapp || "").replace(/^51/, "").replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
  const contact = [wa ? `<a href="${wa}" target="_blank" rel="noopener">por WhatsApp al ${esc(pretty)}</a>` : "", s.contact_email ? `al correo <a href="mailto:${esc(s.contact_email)}">${esc(s.contact_email)}</a>` : ""].filter(Boolean).join(" o ") || "por WhatsApp";
  document.querySelectorAll("[data-contact]").forEach((el) => (el.innerHTML = contact));
  document.querySelectorAll("[data-wa]").forEach((el) => { const l = waLink(s, el.dataset.wa); if (l) { el.href = l; el.target = "_blank"; el.rel = "noopener"; } });
  document.querySelectorAll("[data-eta]").forEach((el) => (el.textContent = etaTxt(ETA[el.dataset.eta])));
});
