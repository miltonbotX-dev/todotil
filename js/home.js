document.addEventListener("DOMContentLoaded", async () => {
  const { $, api, cardHTML, esc } = TD;
  const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  try {
    const [prods, cats] = await Promise.all([api.products(), api.categories()]);
    const used = new Set(prods.map((p) => p.category));
    const cl = cats.filter((c) => used.has(c.slug));
    const qs = new URLSearchParams(location.search);
    let cur = qs.get("c") || "", q = qs.get("q") || "", sort = "";
    if (q) $("#q").value = q;
    const draw = () => {
      $("#cats").innerHTML = [`<button class="chip ${cur ? "" : "on"}" data-c="">Todo</button>`]
        .concat(cl.map((c) => `<button class="chip ${cur === c.slug ? "on" : ""}" data-c="${esc(c.slug)}">${esc(c.name)}</button>`)).join("");
      const words = norm(q).split(/\s+/).filter(Boolean);
      let list = prods.filter((p) => (!cur || p.category === cur) && words.every((w) => norm(p.name + " " + (p.short_description || "") + " " + p.category + " " + ((cats.find((c) => c.slug === p.category) || {}).name || "")).includes(w)));
      if (sort === "pa") list = [...list].sort((a, b) => a.price - b.price);
      if (sort === "pd") list = [...list].sort((a, b) => b.price - a.price);
      if (sort === "combo") list = [...list].sort((a, b) => (b.is_combo ? 1 : 0) - (a.is_combo ? 1 : 0));
      $("#allTitle").textContent = q ? `Resultados para “${q}”` : cur ? (cl.find((c) => c.slug === cur) || {}).name || "Productos" : "Todos los productos";
      $("#featSec").hidden = !feat.length || !!q || !!cur;
      $("#all").innerHTML = list.map(cardHTML).join("") || `<div class="empty" style="grid-column:1/-1">${q ? "No encontramos ese producto. Escríbenos por WhatsApp y te ayudamos." : "Pronto tendremos productos aquí."}</div>`;
    };
    const feat = prods.filter((p) => p.featured);
    $("#feat").innerHTML = feat.map(cardHTML).join("");
    $("#cats").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; cur = b.dataset.c; draw(); });
    let t; $("#q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { q = e.target.value.trim(); draw(); }, 150); });
    $("#q").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.target.blur(); document.getElementById("allTitle").scrollIntoView({ behavior: "smooth", block: "start" }); } });
    $("#sort").addEventListener("change", (e) => { sort = e.target.value; draw(); });
    draw();
  } catch (e) { $("#feat").innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(e.message)}</div>`; }
});
