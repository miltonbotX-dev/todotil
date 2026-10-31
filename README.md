# Todotil · tienda v2 (contra entrega + Dropi)

Sitio estático (HTML/CSS/JS sin build) + Supabase (proyecto `gywaofxlixdzcexvdafo`, sa-east-1).

## Estructura
- `public/` → la web (raíz para publicar). Tienda: `index.html`, `producto.html?p=slug`, `carrito.html` (carrito + datos de envío), `gracias.html`, `seguimiento.html`, `politicas.html`. Panel: `public/admin/`.
- `public/js/config.js` → URL + llave **publishable** (pública por diseño; la seguridad está en RLS). Nunca poner aquí la service_role / secret.
- `supabase/001_init.sql` esquema + RLS + RPC + realtime (idempotente). `002_seed.sql` categorías y 5 productos en **borrador**. `003_suppliers_combos_shipping.sql` proveedores, combos, tarifas de envío por zona y envío calculado en el servidor por paquete. `004_suppliers_seed_texts.sql` proveedores iniciales y textos de políticas. `005_media_whatsapp_shipping.sql` bucket `product-media`, `products.videos`, logo de proveedor y modo de envío por WhatsApp.
- `supabase/run_sql.sh archivo.sql` → aplica SQL vía Management API (usa `$SUPABASE_ACCESS_TOKEN` del entorno).
- `tests/` → `rls_admin_test.sql` (transacción revertida), `e2e.mjs`/`admin_shot.mjs` (v1) y `e2e_v2.mjs`/`admin_shot_v2.mjs` (v2, sin crear pedidos ni escribir en la BD), `shots/v2/` capturas.

## Probar local
`cd public && python3 -m http.server 8088` → http://localhost:8088 (los productos están en borrador: actívalos desde el panel para verlos).

## Seguridad (resumen)
- Público: solo lee productos/categorías activos y `app_settings`.
- Pedidos: solo vía `create_order(payload)` (SECURITY DEFINER): recalcula precios desde `products`, valida celular 9XXXXXXXX, DNI 8 dígitos, máx 5 pedidos/celular/24 h, cantidad 1–10, máx 20 ítems. Devuelve `public_code` TD-XXXXX.
- Seguimiento: `get_order_status(code, últimos4)` → solo estado, productos, total, guía e historial público. Sin datos personales.
- Admin = usuario en tabla `admins`. Lee/actualiza pedidos, CRUD productos/categorías, ajustes. `admin_set_order_status(...)` registra el historial.

## Dar acceso de admin (pendiente)
1. Amilthon crea su usuario (Supabase Auth → Add user, o registro) con su correo y contraseña propia.
2. `insert into public.admins(user_id) select id from auth.users where email = 'SU_CORREO';`
3. Recomendado luego: desactivar registros públicos (Auth → Sign In / Providers → "Allow new users to sign up" OFF).

## Novedades v2
- **Proveedores** (Panel → Proveedores): nombre, ID de Dropi, insignia *Verificado*, bodega y tiempo de despacho. Cada producto tiene proveedor y costo (el costo no es visible al público).
- **Combos**: un producto marcado como combo solo puede incluir productos del **mismo proveedor** (lo impide la base de datos y el panel). Llega en un solo paquete.
- **Fotos y videos (Panel → Productos)**: subir desde el celular (varios a la vez) al bucket público `product-media` de Supabase Storage; solo un admin (`is_admin()`) puede subir/borrar. Las fotos se reducen en el navegador a 1600 px (webp/jpeg ~85 %); videos hasta 50 MB con portada automática. Barra de progreso, ordenar, marcar principal (la primera) y borrar. Siguen funcionando las fotos por URL. Los videos se guardan en `products.videos` como `url|portada`. Proveedores también aceptan logo.
- **WhatsApp de la tienda**: `app_settings.whatsapp = 51931246675`. Botón flotante verde (abajo a la derecha) en todas las páginas, mensaje "Hola Todotil, quiero información" (en producto incluye el nombre; en móvil el producto usa el botón verde de la barra fija). Línea "Atención por WhatsApp 931 246 675" en el encabezado y el pie.
- **Envío por WhatsApp (modo actual)**: `app_settings.shipping_mode = 'whatsapp'` → el total del pedido es solo productos (`shipping_fee` 0) y el carrito muestra "Se confirma por WhatsApp" con aviso y botón "Consultar envío por WhatsApp" (aparece si `app_settings.whatsapp` tiene número). La pestaña Envíos (tarifas) sigue en el código pero oculta; para volver a tarifas: `update app_settings set shipping_mode='tabla'` y quitar `hidden` del botón en `admin/index.html`.
- **Envíos por paquete** (modo `tabla`): si el carrito mezcla proveedores, la tienda avisa que llega en paquetes separados, cada uno con su envío. El servidor (`quote_cart` / `create_order`) calcula el envío de cada paquete con la tarifa más específica de `shipping_rates` (distrito > provincia > departamento, por unidades y opcionalmente por proveedor); si no hay tarifa usa la general de Ajustes (Lima/Callao o provincias).
- **Checkout**: departamento, provincia y distrito de todo el Perú (ubigeo).
- **Cambios**: cambio si llega dañado, incompleto o equivocado; el cliente avisa por WhatsApp dentro de las 48 horas con fotos.
- **Iconos SVG propios** (sin emojis ni CDN) y **ventanas/avisos propios** de la marca en lugar de los del navegador.

## Pendiente
confirmar nombre/verificación de los proveedores, Libro de Reclamaciones, dominio + hosting, sincronizar estados con Dropi (auto), OG por producto (requiere prerender), push al celular.

## Publicación (GitHub Pages)
- Tienda: https://todotil.com/ · Panel: https://todotil.com/admin/
- Repo público: https://github.com/miltonbotX-dev/todotil (solo el contenido de `public/` + README; sin `supabase/` ni `tests/`).
- Auth: site_url = panel, registros desactivados (solo por invitación). El panel incluye "Crea tu contraseña" para enlaces de invitación/recuperación y "Olvidé mi contraseña".

## v9 · Tiempos de entrega, Libro de Reclamaciones y Turnstile
- **Tiempos de entrega (aproximados, días hábiles desde la confirmación por WhatsApp):** Lima y Callao 1–3 · Lima provincias 2–5 · otras regiones 3–7 · zonas alejadas: más. Se editan en `public/js/app.js` (`ETA`). Fuentes: Dropi Perú (24–72 h según transportadora y zona) y la tabla oficial de Olva (Lima/Callao 24–48 h; capitales 1–3 días).
- **Libro de Reclamaciones:** `libro-reclamaciones.html` → RPC `submit_complaint` (solo inserta; el público no puede leer la tabla `complaints`). Código correlativo `LR-AAAA-000001`. El panel tiene la pestaña *Reclamos* para responder (plazo máx. 15 días hábiles). Las hojas no se borran.
- **Datos del negocio:** Panel > Ajustes > *Datos del negocio* (razón social, RUC, dirección, horario, correo). Mientras falten, la web muestra "por completar".
- **Páginas nuevas:** `como-comprar.html`, `privacidad.html` (Ley 29733).

### Activar Cloudflare Turnstile (hoy está APAGADO)
1. Cloudflare > Application security > Turnstile > **Add widget**: nombre `Todotil`, hostnames `todotil.com` y `www.todotil.com`, modo **Managed**.
2. **Secret Key** → Supabase > Edge Functions > Secrets > `TURNSTILE_SECRET_KEY` (nunca en el repo ni en el chat). La función `create-order` ya está desplegada (`supabase/functions/create-order`, verify_jwt = false).
3. **Site Key** (pública) → `public/js/config.js` → `TURNSTILE_SITE_KEY`, reconstruir y publicar.
4. Probar un pedido real; luego ejecutar `supabase/010_turnstile_enforce.sql` para que los pedidos solo entren por la función.
5. Login del panel: Supabase > Authentication > Attack Protection > *Enable Captcha protection* → proveedor Turnstile + el mismo Secret Key. (Hacerlo junto con el paso 3; si se activa sin la Site Key en config.js, el login falla.)

## v10 · Libro de Reclamaciones OCULTO (feature flag)
Todavía no hay negocio formal (RUC/razón social), así que el Libro está apagado. **No se borró nada**: la página, `js/reclamos.js`, la tabla `complaints`, las RPC y la pestaña del panel siguen en el código.
- Interruptor: `public/js/config.js` → `LIBRO_RECLAMACIONES_ON: false`.
- Con `false`: sin enlace en el pie, en Cambios y envíos, en Cómo comprar ni menciones en Privacidad (elementos `data-lr`); `libro-reclamaciones.html` redirige al inicio (y lleva `noindex`); el panel no muestra la pestaña *Reclamos*.
- Datos del negocio vacíos (razón social, RUC, domicilio, horario, correo) **no se muestran** en la web (antes decía "por completar"). En Privacidad, si falta la razón social se lee "Todotil, tienda online en Perú".

**Para volver a activarlo** (cuando tengas RUC):
1. Panel > Ajustes > Datos del negocio: llena razón social/nombre, RUC, domicilio fiscal (y horario/correo).
2. En `public/js/config.js` pon `LIBRO_RECLAMACIONES_ON: true`.
3. `rm -rf public/p && python3 tools/build.py <nueva versión>` y publica (conserva `.nojekyll`).
4. Revisa el pie de página, `libro-reclamaciones.html` y la pestaña *Reclamos* del panel. `node tests/v9.mjs` prueba el Libro con el flag encendido.
