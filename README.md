# Todotil · tienda v2 (contra entrega + Dropi)

Sitio estático (HTML/CSS/JS sin build) + Supabase (proyecto `gywaofxlixdzcexvdafo`, sa-east-1).

## Estructura
- `public/` → la web (raíz para publicar). Tienda: `index.html`, `producto.html?p=slug`, `carrito.html` (carrito + datos de envío), `gracias.html`, `seguimiento.html`, `politicas.html`. Panel: `public/admin/`.
- `public/js/config.js` → URL + llave **publishable** (pública por diseño; la seguridad está en RLS). Nunca poner aquí la service_role / secret.
- `supabase/001_init.sql` esquema + RLS + RPC + realtime (idempotente). `002_seed.sql` categorías y 5 productos en **borrador**. `003_suppliers_combos_shipping.sql` proveedores, combos, tarifas de envío por zona y envío calculado en el servidor por paquete. `004_suppliers_seed_texts.sql` proveedores iniciales y textos de garantía según Dropi.
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
- **Envíos por paquete**: si el carrito mezcla proveedores, la tienda avisa que llega en paquetes separados, cada uno con su envío. El servidor (`quote_cart` / `create_order`) calcula el envío de cada paquete con la tarifa más específica de `shipping_rates` (distrito > provincia > departamento, por unidades y opcionalmente por proveedor); si no hay tarifa usa la general de Ajustes (Lima/Callao o provincias).
- **Checkout**: departamento, provincia y distrito de todo el Perú (ubigeo).
- **Garantía**: 10 días por producto incompleto, mal funcionamiento, roto o diferente (igual que Dropi).
- **Iconos SVG propios** (sin emojis ni CDN) y **ventanas/avisos propios** de la marca en lugar de los del navegador.

## Pendiente
Cargar tarifas reales en Panel → Envíos, confirmar nombre/verificación de los proveedores, Libro de Reclamaciones, dominio + hosting, Cloudinary para fotos/videos, sincronizar estados con Dropi (auto), OG por producto (requiere prerender), push al celular.

## Publicación (GitHub Pages)
- Tienda: https://miltonbotx-dev.github.io/todotil/ · Panel: https://miltonbotx-dev.github.io/todotil/admin/
- Repo público: https://github.com/miltonbotX-dev/todotil (solo el contenido de `public/` + README; sin `supabase/` ni `tests/`).
- Auth: site_url = panel, registros desactivados (solo por invitación). El panel incluye "Crea tu contraseña" para enlaces de invitación/recuperación y "Olvidé mi contraseña".
