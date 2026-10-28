document.addEventListener("DOMContentLoaded", async () => {
  const { $, money, waLink, api } = TD;
  const code = new URLSearchParams(location.search).get("c") || "";
  let last = {}; try { last = JSON.parse(sessionStorage.getItem("todotil.last")) || {}; } catch {}
  $("#code").textContent = code || "—";
  if (last.public_code === code && last.total != null) $("#tot").textContent = "Total a pagar al recibir: " + money(last.total) + (Number(last.shipping) > 0 ? "" : " + envío (te lo confirmamos por WhatsApp)") + (last.packages > 1 ? " · llega en " + last.packages + " paquetes" : "");
  $("#trackBtn").href = "seguimiento.html?c=" + encodeURIComponent(code) + (last.public_code === code ? "&t=" + last.last4 : "");
  const s = await api.settings();
  const wa = waLink(s, `Hola Todotil, acabo de hacer mi pedido ${code}`);
  if (wa) { $("#waBtn").href = wa; $("#waBtn").hidden = false; }
});
