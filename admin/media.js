// Todotil · subida de fotos y videos al bucket "product-media" (Supabase Storage)
// Imágenes: se reducen en el navegador (máx. 1600 px, WebP/JPEG ~85 %). Videos: máx. 50 MB, con portada automática.
(function () {
  const BUCKET = "product-media";
  const MAX_VIDEO = 50 * 1024 * 1024, MAX_SIDE = 1600, Q = 0.85;
  const C = window.TD_CONFIG;
  const pub = (path) => `${C.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
  const PREFIX = `${C.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
  const pathOf = (url) => (String(url).startsWith(PREFIX) ? decodeURIComponent(String(url).slice(PREFIX.length).split("?")[0]) : null);
  const rid = () => Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

  function canvasBlob(cv, type, q) { return new Promise((r) => cv.toBlob(r, type, q)); }
  async function loadImage(file) {
    if (window.createImageBitmap) { try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch {} }
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("No se pudo leer la imagen")); i.src = URL.createObjectURL(file); });
  }
  async function compressImage(file) {
    const img = await loadImage(file);
    const w0 = img.width || img.naturalWidth, h0 = img.height || img.naturalHeight;
    const k = Math.min(1, MAX_SIDE / Math.max(w0, h0));
    const cv = document.createElement("canvas"); cv.width = Math.round(w0 * k); cv.height = Math.round(h0 * k);
    const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
    let b = await canvasBlob(cv, "image/webp", Q);
    if (!b || b.type !== "image/webp") b = await canvasBlob(cv, "image/jpeg", Q);
    if (!b) throw new Error("No se pudo procesar la imagen");
    return { blob: b, ext: b.type === "image/webp" ? "webp" : "jpg" };
  }
  // Portada del video: primer cuadro (~0.5 s) como JPEG
  function videoPoster(file) {
    return new Promise((res) => {
      const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "metadata";
      const url = URL.createObjectURL(file); let done = false;
      const end = (b) => { if (done) return; done = true; URL.revokeObjectURL(url); res(b); };
      v.onloadeddata = () => { try { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); } catch { end(null); } };
      v.onseeked = async () => {
        try { const k = Math.min(1, 960 / Math.max(v.videoWidth, v.videoHeight)); const cv = document.createElement("canvas");
          cv.width = Math.round(v.videoWidth * k); cv.height = Math.round(v.videoHeight * k); cv.getContext("2d").drawImage(v, 0, 0, cv.width, cv.height);
          end(await canvasBlob(cv, "image/jpeg", 0.8)); } catch { end(null); }
      };
      v.onerror = () => end(null); setTimeout(() => end(null), 8000);
      v.src = url;
    });
  }
  function put(sb, path, blob, onProgress) {
    return sb.auth.getSession().then(({ data: { session } }) => new Promise((res, rej) => {
      if (!session) return rej(new Error("Tu sesión expiró. Vuelve a ingresar."));
      const x = new XMLHttpRequest();
      x.open("POST", `${C.SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`);
      x.setRequestHeader("Authorization", "Bearer " + session.access_token);
      x.setRequestHeader("apikey", C.SUPABASE_KEY);
      x.setRequestHeader("Content-Type", blob.type || "application/octet-stream");
      x.setRequestHeader("x-upsert", "false"); x.setRequestHeader("cache-control", "max-age=31536000");
      x.upload.onprogress = (e) => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
      x.onload = () => (x.status >= 200 && x.status < 300 ? res(pub(path)) : rej(new Error(x.status === 413 ? "El archivo es demasiado grande" : x.status === 403 ? "Solo un administrador puede subir archivos" : "No se pudo subir (" + x.status + ")")));
      x.onerror = () => rej(new Error("Sin conexión. Revisa tu internet e intenta de nuevo."));
      x.send(blob);
    }));
  }
  // Sube un archivo. Devuelve { type: "img"|"vid", url, poster? }
  async function upload(sb, file, folder, onProgress) {
    const isVid = /^video\//.test(file.type), isImg = /^image\//.test(file.type);
    if (!isVid && !isImg) throw new Error(`"${file.name}" no es una foto ni un video`);
    const base = `${folder}/${rid()}`;
    if (isImg) { const { blob, ext } = await compressImage(file); return { type: "img", url: await put(sb, `${base}.${ext}`, blob, onProgress) }; }
    if (file.size > MAX_VIDEO) throw new Error(`El video "${file.name}" pesa ${(file.size / 1048576).toFixed(1)} MB. El máximo es 50 MB: recórtalo o grábalo en menor calidad (720p).`);
    const ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "mp4";
    const pb = await videoPoster(file);
    const url = await put(sb, `${base}.${ext}`, file, (f) => onProgress && onProgress(f * (pb ? 0.95 : 1)));
    let poster = null; if (pb) { try { poster = await put(sb, `${base}.poster.jpg`, pb); } catch {} }
    if (onProgress) onProgress(1);
    return { type: "vid", url, poster };
  }
  async function remove(sb, urls) {
    const paths = urls.map(pathOf).filter(Boolean); if (!paths.length) return;
    try { await sb.storage.from(BUCKET).remove(paths); } catch {}
  }
  // Los videos se guardan como "url|portada"
  const vidEnc = (m) => (m.poster ? m.url + "|" + m.poster : m.url);
  const vidDec = (s) => { const [url, poster] = String(s).split("|"); return { type: "vid", url, poster: poster || null }; };
  window.TDMedia = { upload, remove, pathOf, vidEnc, vidDec, MAX_VIDEO };
})();
