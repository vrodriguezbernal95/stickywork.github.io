# Cómo Iniciar la Próxima Sesión

## Paso 1: Contexto Rápido (2 minutos)

Al iniciar la sesión, dime:

```
"Lee el archivo RESUMEN_PARA_PROXIMA_SESION.md y continúa con la tarea pendiente"
```

Esto me dará contexto de:
- ✅ Qué está funcionando
- ⚠️ Qué falta por hacer (emails de feedback)
- 📋 Configuración actual de Railway

---

## Paso 2: Verificar Estado del Sistema (1 minuto)

Antes de empezar a trabajar, te pediré que verifiques:

### En Railway
1. **Logs actuales**: Railway > stickywork-api > Deployments > (último) > Logs
2. **Estado del cron job**: Busca líneas que digan `⏰ [Cron]`
3. **Errores de email**: Busca líneas con `❌ [Feedback Job]`

### Información que necesitaré:
- ¿Sigue dando el error "Connection timeout"?
- ¿Cuántas reservas intenta enviar?
- ¿Los logs muestran algo nuevo?

---

## Paso 3: Comenzar con la Tarea

Una vez tenga el contexto, empezaré a:

1. **Revisar configuración de email** en `backend/email-service.js`
2. **Probar diferentes configuraciones** de SMTP
3. **Hacer pruebas incrementales** hasta encontrar la solución

---

## Ejemplo de Inicio de Sesión

### Tú dices:
```
Hola, quiero continuar con el sistema de feedback.
Lee RESUMEN_PARA_PROXIMA_SESION.md
```

### Yo respondo:
```
Perfecto, he leído el resumen. Veo que necesitamos arreglar
el envío de emails de feedback (Connection timeout con Brevo).

Antes de empezar, ¿puedes mostrarme los logs actuales de Railway?
Ve a: Railway > stickywork-api > Deployments > (último) > Logs

Busca líneas con:
- ⏰ [Cron]
- ❌ [Feedback Job]

Y cópiame lo que veas.
```

---

## Si Quieres Trabajar en Otra Cosa

Si en la próxima sesión quieres trabajar en otra funcionalidad:

```
"Lee RESUMEN_PARA_PROXIMA_SESION.md para tener contexto,
pero hoy quiero trabajar en [nueva tarea]"
```

Así tendré contexto del estado actual pero sabré que vamos a hacer algo diferente.

---

## Información Siempre Disponible

Estos documentos están en el proyecto para consulta rápida:

📄 **RESUMEN_PARA_PROXIMA_SESION.md**
   → Lectura rápida (5 min) con todo lo esencial

📄 **RAILWAY_CONFIGURACION.md**
   → Referencia completa de Railway (consulta cuando tengas dudas)

📄 **NOTAS_SESION_2025-12-10.md**
   → Detalles completos de lo que hicimos hoy

📄 **RAILWAY_CHECKLIST.md**
   → Checklist de troubleshooting rápido

---

## Comandos Útiles para Ti

### Ver estado del servidor
```bash
curl https://stickywork.com/api/health
```

### Ver logs de Railway
1. Railway Dashboard
2. Clic en "stickywork-api"
3. Clic en "Deployments"
4. Clic en el último deployment
5. Clic en "Logs"

### Conectar a MySQL (si necesitas)
```bash
mysql -h tramway.proxy.rlwy.net -P 49999 -u root -p railway
```
(Password está en Railway > MySQL > Variables > MYSQL_PUBLIC_URL)

---

## Resumen Ultra-Corto

**Para iniciar la próxima sesión, simplemente di:**

```
"Lee RESUMEN_PARA_PROXIMA_SESION.md y continuamos con los emails de feedback"
```

**Y listo.** Yo me encargaré del resto.

---

¡Nos vemos en la próxima sesión! 👋
