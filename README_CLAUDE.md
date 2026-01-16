# 🤖 Onboarding para Claude - StickyWork

**Última actualización:** 2026-01-14

---

## 👋 ¡Hola Claude! Lee esto primero

Este documento es tu **punto de entrada** cada vez que inicies una nueva sesión de trabajo en StickyWork.

---

## 📚 Documentos que DEBES leer (en orden)

### 1️⃣ **QUICK_START.md** (OBLIGATORIO)
**Tiempo de lectura:** 2 minutos

**Contiene:**
- Workflow staging → master
- Comandos esenciales
- Estructura del proyecto
- Sistema de entitlements
- Reglas importantes

**📍 Ubicación:** Raíz del proyecto

---

### 2️⃣ **HISTORICO_SEMANA_02_2026.md** (OBLIGATORIO)
**Tiempo de lectura:** 5 minutos

**Contiene:**
- Qué se ha desarrollado en la semana actual
- Contexto de decisiones tomadas
- Features implementadas recientemente
- Estado actual del proyecto

**📍 Ubicación:** Raíz del proyecto

**⚠️ IMPORTANTE:** Este archivo se actualiza cada semana. Siempre lee el histórico de la semana actual:
- Semana 02 de 2026 (actual): `HISTORICO_SEMANA_02_2026.md`
- Pregunta al usuario si no encuentras el histórico de la semana actual

---

### 3️⃣ **WORKFLOW_DESARROLLO.md** (OPCIONAL - si necesitas detalles)
**Tiempo de lectura:** 10 minutos

**Contiene:**
- Workflow completo paso a paso
- Ejemplos prácticos
- Solución a errores comunes
- Mejores prácticas detalladas

**📍 Ubicación:** Raíz del proyecto

---

## 🎯 Estado Actual del Proyecto (2026-01-14)

### ✅ Últimas Features Implementadas

#### **Sistema de Entitlements** (14-ene-2026)
- **Rama:** staging
- **Estado:** ✅ Completado y probado
- **Descripción:** Sistema de planes de suscripción con validación de límites
- **Planes:** FREE, FOUNDERS (€25/mes)
- **Archivos clave:**
  - `backend/middleware/entitlements.js`
  - `backend/migrations/add-entitlements.sql`
- **Endpoints protegidos:** AI Reports, Services
- **Pendiente:** Merge a master cuando usuario lo apruebe

#### **Sistema AI Reports** (09-ene-2026)
- **Rama:** master (en producción)
- **Estado:** ✅ Desplegado y funcionando
- **Descripción:** Reportes mensuales generados por Claude AI
- **Archivos clave:**
  - `backend/routes/ai-reports.js`
  - `backend/services/claude-service.js`

#### **Sistema WhatsApp Click-to-Chat** (05-ene-2026)
- **Rama:** master (en producción)
- **Estado:** ✅ Desplegado y funcionando
- **Descripción:** Notificaciones por WhatsApp con consentimiento GDPR

---

## 🚀 Qué Estamos Trabajando AHORA

### En Staging (sin desplegar):
1. **Sistema de Entitlements** - Listo para merge a master
2. Documentación del workflow de desarrollo

### Próximos Pasos:
1. ⏳ Merge de entitlements a producción (cuando usuario apruebe)
2. ⏳ Dashboard SuperAdmin para gestionar planes
3. ⏳ Integración con Stripe para pagos
4. ⏳ Página de pricing en frontend

---

## 💾 Información del Entorno

### Ramas:
- **staging** - Desarrollo y pruebas (← trabaja aquí)
- **master** - Producción en Railway (← solo merge cuando funcione)

### Base de Datos:
- **Tipo:** MySQL en Railway
- **Tablas principales:** businesses, admin_users, services, bookings, ai_reports, usage_tracking
- **Conexión:** Compartida entre local y producción
- **⚠️ Cuidado:** En desarrollo local, NO modificar datos reales

### Producción:
- **Backend:** https://api.stickywork.com
- **Frontend:** https://stickywork.com
- **Deploy:** Automático en push a master (Railway)
- **Tiempo deploy:** ~2 minutos

---

## 🗂️ Estructura del Proyecto

```
stickywork/
├── backend/
│   ├── routes/              # API endpoints
│   │   ├── ai-reports.js   # Sistema AI Reports
│   │   ├── auth.js          # Autenticación
│   │   ├── feedback.js      # Encuestas
│   │   └── super-admin.js   # Panel SuperAdmin
│   ├── middleware/
│   │   ├── auth.js          # JWT + permisos
│   │   ├── entitlements.js  # Sistema de planes
│   │   └── rate-limit.js    # Rate limiting
│   ├── migrations/          # Scripts SQL
│   └── services/
│       └── claude-service.js # Integración Claude API
├── admin/                   # Panel de administración
├── widget/                  # Widget de reservas
├── config/
│   └── database.js          # Configuración MySQL
├── server.js                # Entry point
├── README_CLAUDE.md         # ← Este archivo
├── QUICK_START.md           # Referencia rápida
├── WORKFLOW_DESARROLLO.md   # Workflow detallado
└── HISTORICO_SEMANA_XX_YYYY.md  # Histórico semanal
```

---

## 🔐 Variables de Entorno

Archivo `.env` (NO commitear):
```env
DB_HOST=containers-us-west-xxx.railway.app
DB_USER=root
DB_PASSWORD=xxxxx
DB_NAME=stickywork
JWT_SECRET=xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
FRONTEND_URL=https://stickywork.com
PORT=3000
```

---

## 🎯 Reglas de Oro

1. ✅ **SIEMPRE** leer `QUICK_START.md` al inicio
2. ✅ **SIEMPRE** leer histórico de la semana actual
3. ✅ **SIEMPRE** trabajar en rama `staging`
4. ✅ **PROBAR** todo localmente antes de mergear
5. ❌ **NUNCA** commitear `.env`
6. ❌ **NUNCA** modificar datos reales en pruebas
7. ❌ **NUNCA** mergear a master sin aprobar con usuario

---

## 📞 Información de Contacto

- **GitHub:** https://github.com/vrodriguezbernal95/stickywork.github.io
- **Railway:** https://railway.app (proyecto: stickywork-api)
- **Producción:** https://api.stickywork.com

---

## 🚨 Checklist de Inicio de Sesión

Cada vez que inicies sesión, verifica:

```
☐ Leí QUICK_START.md
☐ Leí HISTORICO_SEMANA_XX_2026.md (semana actual)
☐ Confirmé rama actual con: git branch
☐ Estoy en rama staging (si voy a desarrollar)
☐ Entiendo qué estamos trabajando ahora
☐ Sé qué está en producción vs staging
```

---

## 💡 Preguntas Frecuentes

**P: ¿En qué rama trabajo?**
R: SIEMPRE en `staging` para desarrollo

**P: ¿Cuándo mergeo a master?**
R: SOLO cuando el usuario lo apruebe después de probar en local

**P: ¿Puedo usar la base de datos en local?**
R: SÍ, pero NO modifiques/borres datos reales. Solo crea datos de prueba marcados como "TEST"

**P: ¿Cómo veo qué está en producción?**
R: Lee el histórico de la semana + revisa commits en master: `git log master --oneline -10`

**P: ¿Dónde están las notas de sesiones anteriores?**
R: En archivos `HISTORICO_SEMANA_XX_YYYY.md` y `NOTAS_SESION_YYYY-MM-DD.md`

---

## 🎓 Conocimiento Específico de StickyWork

### Modelo de Negocio:
- **SaaS B2B:** Sistema de reservas multi-sector
- **Sectores:** Restaurantes, peluquerías, gimnasios, clínicas, abogados, etc.
- **Monetización:** Planes de suscripción (implementado en staging)

### Tecnologías:
- **Backend:** Node.js + Express
- **Base de datos:** MySQL (Railway)
- **Autenticación:** JWT + refresh tokens
- **IA:** Claude API (Anthropic) para AI Reports
- **Deploy:** Railway auto-deploy desde master
- **Frontend:** Vanilla JS (admin panel) + Widget embebible

### Conceptos Clave:
- **Business:** Negocio/cliente que usa StickyWork
- **Service:** Servicio que ofrece un negocio (ej: "Corte de pelo")
- **Booking:** Reserva de un cliente
- **Admin User:** Usuario del panel de administración
- **Widget:** Sistema de reservas embebible en web del cliente
- **Entitlements:** Sistema de límites y features por plan de suscripción

---

## 📖 Lectura Adicional (si tienes tiempo)

- `ANALISIS_MERCADO_COMPETENCIA_2026.md` - Análisis de competencia y pricing
- `VALIDACION_PRODUCTO_2026-01-02.md` - Validación de producto con clientes
- `RAILWAY_STAGING_SETUP.md` - Configuración de entorno staging en Railway
- `STAGING_README.md` - Guía de uso del entorno staging

---

**✨ Recuerda: Eres parte del equipo. Pregunta si algo no está claro.**

**🔒 Protege producción. Experimenta en staging. Documenta todo.**
