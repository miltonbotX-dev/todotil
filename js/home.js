document.addEventListener("DOMContentLoaded", async () => {
  const { $, api, cardHTML, esc } = TD;
  try {
    const [prods, cats] = await Promise.all([api.products(), api.categories()]);
    const used = new Set(prods.map((p) => p.category));
    const cl = cats.filter((c) => used.has(c.slug));
    let cur = new URLSearchParams(location.search).get("c") || "";
    const draw = () => {
      $("#cats").innerHTML = [`<button class="chip ${cur ? "" : "on"}" data-c="">Todo</button>`]
        .concat(cl.map((c) => `<button class="chip ${cur === c.slug ? "on" : ""}" data-c="${esc(c.slug)}">${esc(c.name)}</button>`)).join("");
      const list = cur ? prods.filter((p) => p.category === cur) : prods;
      $("#allTitle").textContent = cur ? (cl.find((c) => c.slug === cur) || {}).name || "Productos" : "Todos los productos";
      $("#all").innerHTML = list.map(cardHTML).join("") || '<div class="empty" style="grid-column:1/-1">Pronto tendremos productos aquí. 🙌</div>';
    };
    const feat = prods.filter((p) => p.featured);
    $("#featSec").hidden = !feat.length;
    $("#feat").innerHTML = feat.map(cardHTML).join("");
    $("#cats").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; cur = b.dataset.c; draw(); });
    draw();
  } catch (e) { $("#feat").innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(e.message)}</div>`; }
});
