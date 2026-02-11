# 📚 Guía de Histórico del Proyecto

## 📁 Estructura de Archivos

### HISTORICO_RESUMEN.md
**Uso:** Lectura principal en cada nueva sesión
**Contenido:**
- Información estática del proyecto (descripción, stack tecnológico, DNS, etc.)
- Resumen ejecutivo de cambios por semana
- Referencias a archivos de semana para más detalles

**Tokens:** ~3,000 (mucho más ligero que el original de 34,330 tokens)

---

### HISTORICO_SEMANA_XX_YYYY.md
**Uso:** Consulta detallada cuando se necesita profundizar
**Formato:** `HISTORICO_SEMANA_[número]_[año].md`

**Archivos actuales:**
- `HISTORICO_SEMANA_04_2025.md` - Enero 24-26 (Sistema de registro, DNS, deploy)
- `HISTORICO_SEMANA_05_2025.md` - Enero 26-28 (Emails, dark mode, demos)
- `HISTORICO_SEMANA_48_2025.md` - Noviembre 24-28 (Mejoras diversas)
- `HISTORICO_SEMANA_49_2025.md` - Diciembre 1 (Seguridad: recuperación password, refresh tokens, 2FA)

---

### HISTORICO_PROYECTO_BACKUP.md
**Uso:** Backup del archivo original (no leer en sesiones)
**Contenido:** Todo el histórico antes de la reorganización

---

## 🚀 Cómo Usar en Nuevas Sesiones

### Escenario 1: Inicio de sesión normal
```
Usuario: "Lee el histórico resumen"
Claude: [Lee HISTORICO_RESUMEN.md]
```

### Escenario 2: Necesitas contexto específico
```
Usuario: "Lee el histórico de la semana 49"
Claude: [Lee HISTORICO_SEMANA_49_2025.md]
```

### Escenario 3: Buscar algo específico
```
Usuario: "Lee el histórico de cuando implementamos el sistema de emails"
Claude: [Busca y lee HISTORICO_SEMANA_04_2025.md]
```

---

## ✍️ Añadir Nuevas Entradas

### Para esta semana (Semana 49 - Diciembre 2025)
Editar directamente: `HISTORICO_SEMANA_49_2025.md`

### Para próximas semanas
Crear nuevo archivo: `HISTORICO_SEMANA_50_2025.md`

**Formato de entrada:**
```markdown
### 2025-12-XX - Título del Cambio

**Contexto/Problema:**
- Descripción del problema o necesidad

**Solución:**
- Pasos realizados
- Archivos modificados

**Resultado:**
- Estado final
- Comandos de verificación

**Archivos Modificados:**
- archivo1.js
- archivo2.html
```

---

## 🔄 Actualizar el Resumen

Cuando acumules varias entradas en una semana nueva:
1. Añade un resumen de la semana en `HISTORICO_RESUMEN.md`
2. Sigue el formato existente:

```markdown
### Semana XX (YYYY)
**Período:** YYYY-MM-DD - YYYY-MM-DD

- **Fecha - Título**
  - Punto clave 1
  - Punto clave 2
  - Punto clave 3

📄 *Detalles completos en: HISTORICO_SEMANA_XX_YYYY.md*
```

---

## 📊 Beneficios de esta Estructura

✅ **Reducción de tokens:** De 34,330 a ~3,000 tokens por lectura
✅ **Mejor organización:** Fácil encontrar información por fecha
✅ **Escalabilidad:** Añadir semanas sin hacer el archivo gigante
✅ **Flexibilidad:** Leer solo lo necesario, no todo el histórico
✅ **Mantiene historia completa:** Nada se pierde, solo se organiza

---

## 🗓️ Convención de Numeración de Semanas

- **Semana 04:** 22-28 Enero
- **Semana 05:** 29 Enero - 4 Febrero
- **Semana 48:** 25 Noviembre - 1 Diciembre
- **Semana 49:** 2-8 Diciembre

Para calcular el número de semana: https://www.epochconverter.com/weeknumbers

---

**Última actualización:** 2025-12-01
