# 📝 Cómo Iniciar Sesión con Claude

**Para el usuario: Vic**

---

## 🚀 Al Iniciar Cada Sesión de Claude

Simplemente di:

```
Hola Claude, lee README_CLAUDE.md y HISTORICO_SEMANA_02_2026.md
```

Eso es todo. Claude entenderá:
- ✅ El workflow de desarrollo (staging → master)
- ✅ Qué se ha trabajado recientemente
- ✅ Estado actual del proyecto
- ✅ Qué está en producción vs staging
- ✅ Estructura del proyecto
- ✅ Reglas importantes

---

## 📅 Actualizar Histórico Cada Semana

Cada vez que empiece una nueva semana:

1. **Crear nuevo histórico:**
   ```
   Claude, crea HISTORICO_SEMANA_03_2026.md basándote en el anterior
   ```

2. **Actualizar instrucciones:**
   ```
   Claude, actualiza README_CLAUDE.md con la nueva semana
   ```

**Semanas de 2026:**
- Semana 02: 06-ene al 12-ene (actual)
- Semana 03: 13-ene al 19-ene
- Semana 04: 20-ene al 26-ene
- etc.

---

## 💡 Comandos Útiles para Copiar/Pegar

### Inicio de sesión completo:
```
Hola Claude, lee README_CLAUDE.md y HISTORICO_SEMANA_02_2026.md
```

### Si solo necesitas recordatorio rápido:
```
Claude, lee QUICK_START.md
```

### Para entender workflow detallado:
```
Claude, lee WORKFLOW_DESARROLLO.md
```

### Para saber qué hay en staging vs master:
```
Claude, muéstrame las diferencias entre staging y master
```

### Para ver estado actual:
```
Claude, ejecuta: git status
```

---

## 🎯 Archivos de Documentación (Resumen)

| Archivo | Propósito | Cuándo Leerlo |
|---------|-----------|---------------|
| **README_CLAUDE.md** | Onboarding completo | ✅ SIEMPRE al iniciar sesión |
| **HISTORICO_SEMANA_XX_2026.md** | Qué se ha hecho esta semana | ✅ SIEMPRE al iniciar sesión |
| **QUICK_START.md** | Referencia rápida de comandos | Cuando necesites recordatorio |
| **WORKFLOW_DESARROLLO.md** | Workflow detallado paso a paso | Cuando necesites detalles |
| **RAILWAY_STAGING_SETUP.md** | Configuración Railway staging | Solo si cambias configuración |

---

## 🔄 Workflow de Trabajo con Claude

### 1. Inicio de Sesión
```
Vic: Hola Claude, lee README_CLAUDE.md y HISTORICO_SEMANA_02_2026.md

Claude: ✅ He leído la documentación. Entiendo que:
- Estamos trabajando en staging
- Sistema de entitlements está listo para merge
- La próxima tarea es [X]
¿En qué te ayudo hoy?
```

### 2. Trabajar en Nueva Feature
```
Vic: Implementa [nueva feature]

Claude: Voy a trabajar en staging...
[desarrolla la feature]

Claude: ✅ Feature implementada y probada localmente
Commits realizados:
- feat: [descripción]
¿Quieres que haga merge a master?
```

### 3. Subir a Producción
```
Vic: Sí, sube a producción

Claude: Voy a hacer merge a master...
[hace merge y push]

Claude: ✅ Desplegado en Railway
URL: https://api.stickywork.com
```

---

## 📌 Nota Importante

**Claude recordará el contexto dentro de una conversación**, pero al iniciar una **nueva sesión**, debes decirle que lea los archivos de documentación.

Por eso es importante decir al inicio:
```
Hola Claude, lee README_CLAUDE.md y HISTORICO_SEMANA_02_2026.md
```

---

## ✅ Beneficios de Este Sistema

1. ✅ Claude entiende el proyecto inmediatamente
2. ✅ No pierdes tiempo explicando el workflow cada vez
3. ✅ Claude sabe qué está en staging vs master
4. ✅ Claude conoce las reglas y mejores prácticas
5. ✅ Menos errores por falta de contexto
6. ✅ Desarrollo más rápido y fluido

---

**🎯 Copia y pega al inicio de cada sesión:**

```
Hola Claude, lee README_CLAUDE.md y HISTORICO_SEMANA_02_2026.md
```
