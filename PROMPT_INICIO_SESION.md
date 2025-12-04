# Prompt de Inicio de Sesión Optimizado

Copia y pega este mensaje al iniciar cada nueva conversación con Claude Code:

---

## Mensaje de Inicio

```
Hola! Vamos a trabajar en StickyWork.

INSTRUCCIONES IMPORTANTES:
1. Lee HISTORICO_RESUMEN.md (NO el histórico completo)
2. Habla siempre en español
3. Optimiza el consumo de tokens:
   - Usa Grep en lugar de Read cuando busques algo específico
   - Solo lee archivos completos cuando sea realmente necesario
   - Usa offset/limit en archivos grandes
   - Sé directo y conciso en las explicaciones

CONTEXTO DEL PROYECTO:
- StickyWork es un SaaS de sistema de reservas online
- Stack: Node.js + Express + MySQL
- Producción: Railway (backend + BD)
- Frontend: Vanilla JS
- Dominio: stickywork.com

Estoy listo para trabajar. ¿Qué necesitas que haga hoy?
```

---

## Comandos Eficientes para Usar Durante la Sesión

### Búsqueda Específica (consume ~50-200 tokens):
```
"Busca [término] en [archivo/directorio]"
"Grep para encontrar donde se define [función]"
```

### Exploración (usa Task tool):
```
"Explora cómo funciona [funcionalidad]"
"Investiga el problema de [descripción]"
```

### Lectura Parcial:
```
"Lee las primeras 50 líneas de [archivo]"
"Lee las líneas 100-150 de [archivo]"
```

### Respuestas Directas:
```
"Sé breve: ¿cómo funciona [X]?"
"Respuesta corta: ¿dónde está [Y]?"
```

---

## Lo Que NO Debes Hacer (consume muchos tokens)

❌ "Lee el histórico del proyecto" (34,000 tokens)
❌ "Lee todos los archivos de admin/js/" (miles de tokens)
❌ "Explícame en detalle toda la arquitectura" (innecesario)
❌ Pedir leer el mismo archivo múltiples veces

---

## Estimación de Consumo de Tokens

| Acción | Tokens Aproximados |
|--------|-------------------|
| Leer HISTORICO_RESUMEN.md | ~3,500 |
| Leer archivo JS de 500 líneas | ~2,000-3,000 |
| Grep en un archivo | ~50-200 |
| Glob (listar archivos) | ~20-50 |
| Respuesta típica de Claude | ~500-1,000 |
| Task tool (exploración) | Variable, pero delegado |

**Límite total por sesión:** 200,000 tokens

---

## Tips Adicionales

1. **Si solo necesitas confirmar algo:** Pregunta directamente sin pedir lecturas
2. **Si el problema es específico:** Dame el error exacto y contexto mínimo
3. **Si necesitas crear algo nuevo:** Dame requisitos claros desde el inicio
4. **Para bugs en producción:** Comparte logs de Railway directamente

---

## Ejemplo de Sesión Eficiente

```
Usuario: Hola! [Prompt de inicio optimizado]

Claude: [Lee HISTORICO_RESUMEN.md - 3,500 tokens]
        ¡Perfecto! Listo para trabajar. ¿Qué necesitas?

Usuario: Hay un error en bookings.js línea 285, no se actualiza el estado
        [Pega el error de consola]

Claude: [Usa Grep para buscar updateStatus - 100 tokens]
        [Lee solo líneas 280-300 - 200 tokens]
        Encontré el problema: [Explica y soluciona]

Total consumido: ~4,000 tokens vs 10,000+ con enfoque ineficiente
```

---

## Notas Finales

- Este prompt está diseñado para consumir ~3,500 tokens al inicio (vs 34,000 antes)
- Ahorro del **90% en tokens iniciales**
- Permite más trabajo útil dentro del límite de 200,000 tokens
- Actualizar este archivo si se agregan nuevas optimizaciones

**Última actualización:** 2025-12-04
