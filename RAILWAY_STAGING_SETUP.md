# 🚂 Workflow de Staging - Guía Simplificada

**Tiempo estimado:** 0 minutos (sin configuración Railway)
**Dificultad:** Muy Fácil

---

## ✅ YA ESTÁ LISTO

- ✅ Rama `staging` creada en Git
- ✅ Push a GitHub
- ✅ Listo para desarrollar

---

## 🎯 CÓMO FUNCIONA (Workflow Manual)

Railway cambió su UI y ya no tiene el toggle simple para Branch Deploys.

**Usamos un workflow manual que es IGUAL de seguro y MÁS SIMPLE:**

```
┌──────────────────────────────────────────────┐
│  1. Desarrollas en rama STAGING              │
│     git checkout staging                     │
│     ... haces cambios ...                    │
│     git commit -m "feat: nueva feature"      │
│                                              │
│  2. Pruebas LOCALMENTE                       │
│     npm run dev                              │
│     ... verificas que todo funciona ...      │
│                                              │
│  3. Cuando TODO esté perfecto                │
│     git checkout master                      │
│     git merge staging                        │
│     git push origin master                   │
│                                              │
│  4. Railway auto-despliega MASTER            │
│     (como siempre ha hecho)                  │
└──────────────────────────────────────────────┘
```

---

## ✨ Ventajas de Este Workflow

- ✅ **Zero configuración** en Railway
- ✅ **Proteges producción** igual (solo subes a master cuando funciona)
- ✅ **Rama staging en GitHub** como backup de tu trabajo
- ✅ **Más control** sobre qué sube a producción
- ✅ **Más simple** que configurar múltiples entornos

---

## 📝 Comandos del Día a Día

### Empezar nueva feature

```bash
git checkout staging
git pull origin staging
```

### Trabajar normalmente

```bash
# Haces cambios en código...
git add .
git commit -m "feat: descripción del cambio"
git push origin staging  # Backup en GitHub
```

### Probar localmente

```bash
npm run dev
# Pruebas en http://localhost:3000
```

### Subir a producción (cuando esté listo)

```bash
# Solo cuando TODO funcione perfectamente
git checkout master
git pull origin master
git merge staging
git push origin master

# Railway despliega automáticamente en ~2 minutos
```

---

## 🧪 Ejemplo Práctico

**Escenario:** Implementar sistema de entitlements

```bash
# 1. Trabajas en staging
git checkout staging

# 2. Implementas la feature
# ... editas backend/middleware/entitlements.js ...
# ... modificas rutas ...
# ... haces pruebas locales ...

git add .
git commit -m "feat: Add entitlements system for plan validation"
git push origin staging

# 3. Pruebas localmente varios días si quieres
npm run dev
# ... pruebas exhaustivas ...

# 4. Cuando estés 100% seguro
git checkout master
git merge staging
git push origin master
# ¡Railway despliega a producción!
```

---

## 📋 Resumen

```
DESARROLLO:
Rama:     staging
Entorno:  localhost:3000
BD:       MySQL Railway (cuidado con data de prueba)

PRODUCCIÓN:
Rama:     master
Entorno:  Railway auto-deploy
Backend:  https://api.stickywork.com
BD:       MySQL Railway (datos reales)
```

---

## ⚠️ IMPORTANTE

### Al probar en localhost con BD de producción:

- ❌ NO borres datos reales
- ❌ NO modifiques reservas de clientes
- ✅ SÍ puedes crear datos de prueba (márcalos claramente)
- ✅ SÍ puedes consultar/leer todo lo que quieras

### Recomendación:
Para pruebas destructivas, crea un business de prueba:
- Nombre: "TEST - No usar"
- ID: Anótalo para tus pruebas
- Úsalo para todas las pruebas destructivas

---

## ⏭️ Próximo Paso

Ya estamos listos para desarrollar el sistema de entitlements en la rama staging.

**Claude está desarrollando ahora:**
1. ✅ Rama staging lista
2. 🔄 Implementando sistema de entitlements
3. ⏳ Pruebas locales
4. ⏳ Deploy a producción cuando esté perfecto

---

**Workflow simple. Código seguro. Producción protegida.** ✨
