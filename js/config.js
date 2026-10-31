// Configuración pública (la llave publishable es pública por diseño; la seguridad está en RLS).
window.TD_CONFIG = {
  SUPABASE_URL: "https://gywaofxlixdzcexvdafo.supabase.co",
  SUPABASE_KEY: "sb_publishable_Z80-v-NaOSUB65o_0TAljA_3_--aPrI",
  // Meta Pixel: pega aquí el ID (solo números) cuando crees el píxel en Business Manager. Vacío = desactivado.
  PIXEL_ID: "2961095417616750",
  // Cloudflare Turnstile (captcha): pega aquí la "Site Key" (pública) del widget. Vacío = desactivado.
  // ANTES de llenarla: despliega la función create-order con su secreto (ver README · Turnstile), si no, el checkout fallará.
  TURNSTILE_SITE_KEY: "",
  // Libro de Reclamaciones (Indecopi): false = oculto (sin enlaces, la página redirige al inicio, sin pestaña en el panel).
  // Ponlo en true cuando tengas RUC/razón social y domicilio (ver README · Libro de Reclamaciones). El código y la tabla se conservan.
  LIBRO_RECLAMACIONES_ON: false,
};
