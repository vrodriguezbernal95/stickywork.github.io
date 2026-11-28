# StickyWork

Plataforma de reservas online para pymes con cita previa (peluquerías, estética, fisios, psicólogos, nutricionistas…). Un solo dueño que alterna Mac y Windows (hacer `git pull` al empezar). **Respuestas siempre en castellano y soluciones simples.**

> El repositorio es **público**: nada de estrategia, datos de clientes ni claves aquí. Lo privado va en `docs/` y `captacion/` (fuera de Git).

## Arquitectura y despliegue
- **API**: Express (`server.js`) en Railway → `https://api.stickywork.com`. Base de datos MySQL en Railway.
- **Web y paneles**: HTML/CSS/JS estático en GitHub Pages → `https://stickywork.com` (workflow `.github/workflows/pages.yml`, rsync que excluye `backend/`, `config/`, `docs/`, `captacion/`, `*.md`…).
- **Push a `master` = despliegue** de las dos cosas. Si el job `deploy-pages` falla (pasa a veces), relanzar con un commit vacío. Estado: `curl https://api.github.com/repos/vrodriguezbernal95/stickywork.github.io/actions/runs?per_page=1`.
- Sin framework de frontend ni bundler: cada página carga sus scripts; los estilos de cada módulo del panel van dentro de su JS.

## Mapa del código
| Qué | Dónde |
|---|---|
| Arranque, migraciones (`runMigrations`) y crons (recordatorios 10:00, completar citas y feedback cada hora) | `server.js` |
| Rutas principales (reservas, negocios, servicios, clientes, widget, fidelización `/api/loyalty/*`…) — archivo grande, buscar con grep | `backend/routes.js` |
| Rutas por tema: auth, Stripe, super admin, equipo, talleres, reportes IA, soporte, feedback, consultoría | `backend/routes/*.js` |
| Planes y límites (free, founders, professional, premium) | `backend/plans.js` |
| Precio fundador (25 €, 50 plazas; contador público `/api/public/plazas-fundador`) | `backend/founders.js`, `js/plazas-fundador.js` |
| Pagos: el servidor decide el precio (nunca aceptar `priceId` del navegador) | `backend/routes/stripe.js` |
| Emails (Brevo) y registro de envíos | `backend/email-service.js`, `backend/email-health.js` |
| Auth del negocio, entitlements, rate limits | `backend/middleware/` |
| Negocios demo y filtro de negocios reales (`realBusinessSql`) | `backend/demo-businesses.js` |
| Suspensión de negocios | `backend/suspension.js` |
| Captación (super admin → Captación) | `backend/prospects.js`, `admin/js/super-captacion.js`, `admin/js/call-scripts.js`, `backend/tools/captacion/*.py` |
| Tablero IA del super admin | `backend/ia-board.js`, `backend/tools/tablero-ia.js` |
| Panel del negocio | `admin-dashboard.html` + `admin/js/*.js` (navegación en `app.js`, plan en `billing.js`) |
| Ayuda del panel (botón ?) — **mantener al día** cuando cambie una función visible | `admin/js/help-content.js` |
| Super admin | `super-admin*.html` + `admin/js/super-*.js` (helpers en `super-ui.js`) |
| Página pública de reservas / widget / tarjeta de fidelización | `reservar.html`, `widget/`, `fidelidad.html` |
| Páginas SEO (sectores, blog, herramientas, comparativas): **se generan**, no editar el HTML a mano | `backend/tools/generar-paginas-seo.py` → `python3 backend/tools/generar-paginas-seo.py .` |
| Sitemap (a mano) | `sitemap.xml` |

## Reglas del proyecto
- **Fechas**: nunca `toISOString()` para fechas locales; construir con `getFullYear()/getMonth()/getDate()`. En SQL, `DATE_FORMAT`.
- **Seguridad**: escapar todo lo que venga de usuarios (`utils.escapeHtml`, `superUI.esc`…). Valores libres en `data-*`, nunca dentro de un `onclick`. Modales en `document.body`.
- **Migraciones**: funciones `ensure…` idempotentes llamadas desde `runMigrations` (comprobar columnas en `information_schema`).
- **No prometer funciones que no existen** en web, emails, guiones o ayuda. Existen: email de confirmación y recordatorio el día antes (con botón para cancelar o cambiar), confirmación manual, reservas repetidas, mover citas avisando, botón de WhatsApp con mensaje escrito (lo envía el negocio), encuestas, tarjeta de fidelización por visitas, exportar la lista de clientes a CSV, usuarios de equipo. **No existen**: WhatsApp/SMS automático, cobros o señales, app nativa, Google Calendar, elegir profesional al reservar, cerrar festivos, exportar reservas o facturas. Ante la duda, comprobarlo en el código.
- **Precio fundador**: la portada, planes y panel vuelven solos a 39 € al agotarse las plazas, pero los textos fijos (help-content, call-scripts, FAQ del generador, `terminos.html`) dicen 25 €: actualizarlos entonces.
- No hacer `git add` de `.claude/settings.local.json`.
- Sin APIs de pago nuevas.

## Probar en local
- MySQL local (Mac) y `.env` con credenciales locales. Arrancar: `npm start` (puerto 3000). Para no enviar emails reales, arrancar con las credenciales de email vacías.
- Pruebas: llamadas con `curl` a la API y capturas con Chrome headless de las páginas tocadas (escritorio y 390 px de ancho).
- Antes de subir cambios grandes o de seguridad/pagos: agente `revisor`. Tras cambiar textos visibles: agente `guardian-textos`.

## Agentes (`.claude/agents/`)
`captador` (tandas de captación), `revisor` (revisa antes de subir), `guardian-textos` (promesas falsas y ayuda), `redactor-seo` (blog y páginas SEO con el generador).
