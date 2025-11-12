# 🎨 Guía Completa de Personalización del Widget StickyWork

Esta guía detalla todas las opciones de personalización disponibles para adaptar el widget completamente al diseño de tu sitio web.

## 📚 Índice

- [Configuración Básica](#configuración-básica)
- [Colores](#colores)
- [Tipografía](#tipografía)
- [Bordes y Formas](#bordes-y-formas)
- [Espaciados](#espaciados)
- [Sombras](#sombras)
- [Inputs](#inputs)
- [Botones](#botones)
- [Efectos y Animaciones](#efectos-y-animaciones)
- [Modal (Modo Modal)](#modal-modo-modal)
- [Ejemplos Completos](#ejemplos-completos)

---

## Configuración Básica

### `businessId`
- **Tipo**: `Number`
- **Requerido**: Sí
- **Descripción**: Tu ID único de negocio en StickyWork
- **Ejemplo**: `businessId: 1`

### `apiUrl`
- **Tipo**: `String`
- **Requerido**: Sí
- **Descripción**: URL base de tu API backend
- **Ejemplo**: `apiUrl: 'https://tu-api.com'`

### `language`
- **Tipo**: `String`
- **Predeterminado**: `'es'`
- **Descripción**: Idioma del widget (es, en, fr, de)
- **Ejemplo**: `language: 'es'`

### `mode`
- **Tipo**: `String`
- **Predeterminado**: `'embedded'`
- **Opciones**: `'embedded'` | `'modal'`
- **Descripción**: Modo de visualización del widget
- **Ejemplo**: `mode: 'modal'`

### `trigger`
- **Tipo**: `String` (selector CSS)
- **Requerido**: Solo para modo modal
- **Descripción**: Selector del botón que abrirá el modal
- **Ejemplo**: `trigger: '#mi-boton'`

### `containerId`
- **Tipo**: `String`
- **Predeterminado**: `'stickywork-widget'`
- **Descripción**: ID del contenedor del widget (modo embedded)
- **Ejemplo**: `containerId: 'mi-widget'`

---

## Colores

### `primaryColor`
- **Tipo**: `String` (color CSS)
- **Predeterminado**: `'#3b82f6'`
- **Descripción**: Color principal (títulos, botones, focus)
- **Ejemplo**: `primaryColor: '#ff6b6b'`

### `secondaryColor`
- **Tipo**: `String` (color CSS)
- **Predeterminado**: `'#10b981'`
- **Descripción**: Color secundario (botón cerrar modal, success)
- **Ejemplo**: `secondaryColor: '#4ecdc4'`

### `backgroundColor`
- **Tipo**: `String` (color CSS)
- **Predeterminado**: `'#ffffff'`
- **Descripción**: Color de fondo del widget
- **Ejemplo**: `backgroundColor: '#f8f9fa'`

### `textColor`
- **Tipo**: `String` (color CSS)
- **Predeterminado**: `'#1f2937'`
- **Descripción**: Color del texto principal
- **Ejemplo**: `textColor: '#212529'`

### `textSecondaryColor`
- **Tipo**: `String` (color CSS)
- **Predeterminado**: `'#6b7280'`
- **Descripción**: Color del texto secundario (subtítulos, hints)
- **Ejemplo**: `textSecondaryColor: '#6c757d'`

### `errorColor`
- **Tipo**: `String` (color CSS)
- **Predeterminado**: `'#ef4444'`
- **Descripción**: Color para mensajes de error
- **Ejemplo**: `errorColor: '#dc3545'`

### `successColor`
- **Tipo**: `String` (color CSS)
- **Predeterminado**: `'#10b981'`
- **Descripción**: Color para mensajes de éxito
- **Ejemplo**: `successColor: '#28a745'`

---

## Tipografía

### `fontFamily`
- **Tipo**: `String` (font family CSS)
- **Predeterminado**: `'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'`
- **Descripción**: Familia tipográfica del widget
- **Ejemplo**: `fontFamily: 'Inter, system-ui, sans-serif'`

### `fontSize`
- **Tipo**: `String` (tamaño CSS)
- **Predeterminado**: `'1rem'`
- **Descripción**: Tamaño de fuente base
- **Ejemplo**: `fontSize: '16px'`

### `fontSizeTitle`
- **Tipo**: `String` (tamaño CSS)
- **Predeterminado**: `'1.8rem'`
- **Descripción**: Tamaño del título principal
- **Ejemplo**: `fontSizeTitle: '2rem'`

### `fontSizeLabel`
- **Tipo**: `String` (tamaño CSS)
- **Predeterminado**: `'1rem'`
- **Descripción**: Tamaño de las etiquetas de campos
- **Ejemplo**: `fontSizeLabel: '0.875rem'`

### `fontWeight`
- **Tipo**: `String` | `Number`
- **Predeterminado**: `'400'`
- **Descripción**: Peso de fuente normal
- **Ejemplo**: `fontWeight: '300'`

### `fontWeightBold`
- **Tipo**: `String` | `Number`
- **Predeterminado**: `'600'`
- **Descripción**: Peso de fuente para negritas
- **Ejemplo**: `fontWeightBold: '700'`

---

## Bordes y Formas

### `borderRadius`
- **Tipo**: `String` (tamaño CSS)
- **Predeterminado**: `'15px'`
- **Descripción**: Radio de borde del contenedor principal
- **Ejemplo**: `borderRadius: '20px'`

### `borderRadiusInput`
- **Tipo**: `String` (tamaño CSS)
- **Predeterminado**: `'8px'`
- **Descripción**: Radio de borde de inputs y selects
- **Ejemplo**: `borderRadiusInput: '12px'`

### `borderRadiusButton`
- **Tipo**: `String` (tamaño CSS)
- **Predeterminado**: `'8px'`
- **Descripción**: Radio de borde de botones
- **Ejemplo**: `borderRadiusButton: '25px'`

### `borderWidth`
- **Tipo**: `String` (tamaño CSS)
- **Predeterminado**: `'2px'`
- **Descripción**: Grosor de los bordes
- **Ejemplo**: `borderWidth: '1px'`

### `borderColor`
- **Tipo**: `String` (color CSS)
- **Predeterminado**: `'#e5e7eb'`
- **Descripción**: Color de borde predeterminado
- **Ejemplo**: `borderColor: '#dee2e6'`

### `borderColorFocus`
- **Tipo**: `String` (color CSS) | `null`
- **Predeterminado**: `null`
- **Descripción**: Color de borde al hacer focus (null = usa primaryColor)
- **Ejemplo**: `borderColorFocus: '#007bff'`

---

## Espaciados

### `padding`
- **Tipo**: `String` (espaciado CSS)
- **Predeterminado**: `'2rem'`
- **Descripción**: Padding interno del contenedor principal
- **Ejemplo**: `padding: '3rem'`

### `paddingInput`
- **Tipo**: `String` (espaciado CSS)
- **Predeterminado**: `'0.75rem'`
- **Descripción**: Padding de inputs y selects
- **Ejemplo**: `paddingInput: '1rem'`

### `paddingButton`
- **Tipo**: `String` (espaciado CSS)
- **Predeterminado**: `'1rem'`
- **Descripción**: Padding de botones
- **Ejemplo**: `paddingButton: '1.25rem 2rem'`

### `spacing`
- **Tipo**: `String` (espaciado CSS)
- **Predeterminado**: `'1.5rem'`
- **Descripción**: Espacio entre campos del formulario
- **Ejemplo**: `spacing: '2rem'`

---

## Sombras

### `boxShadow`
- **Tipo**: `String` (box-shadow CSS)
- **Predeterminado**: `'0 10px 30px rgba(0,0,0,0.1)'`
- **Descripción**: Sombra del contenedor principal
- **Ejemplo**: `boxShadow: '0 5px 15px rgba(0,0,0,0.2)'`

### `boxShadowModal`
- **Tipo**: `String` (box-shadow CSS)
- **Predeterminado**: `'0 20px 60px rgba(0, 0, 0, 0.5)'`
- **Descripción**: Sombra del modal
- **Ejemplo**: `boxShadowModal: '0 25px 80px rgba(0,0,0,0.6)'`

### `boxShadowInput`
- **Tipo**: `String` (box-shadow CSS)
- **Predeterminado**: `'none'`
- **Descripción**: Sombra de inputs
- **Ejemplo**: `boxShadowInput: '0 2px 4px rgba(0,0,0,0.05)'`

### `boxShadowButton`
- **Tipo**: `String` (box-shadow CSS)
- **Predeterminado**: `'0 10px 25px rgba(0,0,0,0.15)'`
- **Descripción**: Sombra del botón al hacer hover
- **Ejemplo**: `boxShadowButton: '0 8px 20px rgba(0,0,0,0.2)'`

---

## Inputs

### `inputBackgroundColor`
- **Tipo**: `String` (color CSS) | `null`
- **Predeterminado**: `null`
- **Descripción**: Color de fondo de inputs (null = usa backgroundColor)
- **Ejemplo**: `inputBackgroundColor: '#f8f9fa'`

### `inputTextColor`
- **Tipo**: `String` (color CSS) | `null`
- **Predeterminado**: `null`
- **Descripción**: Color del texto en inputs (null = usa textColor)
- **Ejemplo**: `inputTextColor: '#212529'`

### `inputBorderColor`
- **Tipo**: `String` (color CSS) | `null`
- **Predeterminado**: `null`
- **Descripción**: Color de borde de inputs (null = usa borderColor)
- **Ejemplo**: `inputBorderColor: '#ced4da'`

### `inputPlaceholderColor`
- **Tipo**: `String` (color CSS)
- **Predeterminado**: `'#9ca3af'`
- **Descripción**: Color del placeholder de inputs
- **Ejemplo**: `inputPlaceholderColor: '#6c757d'`

---

## Botones

### `buttonBackgroundColor`
- **Tipo**: `String` (color/gradiente CSS) | `null`
- **Predeterminado**: `null`
- **Descripción**: Color o gradiente del botón (null = usa primaryColor)
- **Ejemplo**: `buttonBackgroundColor: 'linear-gradient(135deg, #667eea, #764ba2)'`

### `buttonTextColor`
- **Tipo**: `String` (color CSS)
- **Predeterminado**: `'#ffffff'`
- **Descripción**: Color del texto del botón
- **Ejemplo**: `buttonTextColor: '#ffffff'`

### `buttonHoverTransform`
- **Tipo**: `String` (transform CSS)
- **Predeterminado**: `'translateY(-2px)'`
- **Descripción**: Transformación del botón al hacer hover
- **Ejemplo**: `buttonHoverTransform: 'scale(1.05)'`

### `buttonDisabledColor`
- **Tipo**: `String` (color CSS)
- **Predeterminado**: `'#9ca3af'`
- **Descripción**: Color del botón deshabilitado
- **Ejemplo**: `buttonDisabledColor: '#6c757d'`

---

## Efectos y Animaciones

### `transitionSpeed`
- **Tipo**: `String` (tiempo CSS)
- **Predeterminado**: `'0.3s'`
- **Descripción**: Velocidad de las transiciones
- **Ejemplo**: `transitionSpeed: '0.2s'`

### `animationDuration`
- **Tipo**: `String` (tiempo CSS)
- **Predeterminado**: `'0.3s'`
- **Descripción**: Duración de las animaciones
- **Ejemplo**: `animationDuration: '0.4s'`

---

## Modal (Modo Modal)

### `modalOverlayColor`
- **Tipo**: `String` (color CSS)
- **Predeterminado**: `'rgba(0, 0, 0, 0.7)'`
- **Descripción**: Color del overlay del modal
- **Ejemplo**: `modalOverlayColor: 'rgba(0, 0, 0, 0.8)'`

### `modalMaxWidth`
- **Tipo**: `String` (tamaño CSS)
- **Predeterminado**: `'650px'`
- **Descripción**: Ancho máximo del modal
- **Ejemplo**: `modalMaxWidth: '800px'`

### `modalMaxHeight`
- **Tipo**: `String` (tamaño CSS)
- **Predeterminado**: `'90vh'`
- **Descripción**: Altura máxima del modal
- **Ejemplo**: `modalMaxHeight: '95vh'`

### `modalCloseButtonColor`
- **Tipo**: `String` (color CSS) | `null`
- **Predeterminado**: `null`
- **Descripción**: Color del botón cerrar (null = usa secondaryColor)
- **Ejemplo**: `modalCloseButtonColor: '#ef4444'`

### `modalCloseButtonHoverColor`
- **Tipo**: `String` (color CSS)
- **Predeterminado**: `'#ef4444'`
- **Descripción**: Color del botón cerrar al hacer hover
- **Ejemplo**: `modalCloseButtonHoverColor: '#dc2626'`

---

## Ejemplos Completos

### Ejemplo 1: Tema Oscuro

```javascript
StickyWork.init({
  businessId: 1,
  apiUrl: 'https://tu-api.com',

  // Colores oscuros
  primaryColor: '#a78bfa',
  backgroundColor: '#1e293b',
  textColor: '#f1f5f9',

  // Inputs oscuros
  inputBackgroundColor: '#0f172a',
  inputTextColor: '#f1f5f9',
  inputBorderColor: '#334155',

  // Bordes suaves
  borderRadius: '12px',

  // Sombra dramática
  boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
});
```

### Ejemplo 2: Tema Minimalista

```javascript
StickyWork.init({
  businessId: 1,
  apiUrl: 'https://tu-api.com',

  // Monocromático
  primaryColor: '#000000',
  backgroundColor: '#ffffff',
  textColor: '#000000',

  // Bordes finos
  borderWidth: '1px',
  borderRadius: '4px',

  // Sin sombras
  boxShadow: 'none',
  boxShadowButton: 'none',

  // Tipografía ligera
  fontWeight: '300',
  fontWeightBold: '500'
});
```

### Ejemplo 3: Tema Colorido

```javascript
StickyWork.init({
  businessId: 1,
  apiUrl: 'https://tu-api.com',

  // Colores vibrantes
  primaryColor: '#f472b6',
  secondaryColor: '#facc15',
  backgroundColor: '#fef3c7',

  // Bordes redondeados
  borderRadius: '25px',
  borderRadiusInput: '15px',
  borderRadiusButton: '20px',

  // Gradiente en botón
  buttonBackgroundColor: 'linear-gradient(135deg, #f472b6, #fb923c, #facc15)',

  // Animación divertida
  buttonHoverTransform: 'translateY(-5px) scale(1.02)'
});
```

---

## 💡 Tips y Mejores Prácticas

1. **Consistencia**: Usa los mismos valores de `borderRadius` y `spacing` que tu sitio principal

2. **Contraste**: Asegúrate de que haya suficiente contraste entre `textColor` y `backgroundColor`

3. **Tipografía**: Usa la misma `fontFamily` de tu sitio para una integración perfecta

4. **Performance**: Usa `transitionSpeed` más rápidas (0.2s) para mejor UX

5. **Accesibilidad**:
   - Contraste mínimo de 4.5:1 para texto normal
   - Contraste mínimo de 3:1 para texto grande
   - Usa colores de error distinguibles para usuarios daltónicos

6. **Responsive**: El widget es 100% responsive por defecto, pero puedes ajustar `modalMaxWidth` según tu diseño

7. **Modo Oscuro**: Si tu sitio tiene modo oscuro, crea dos configuraciones y cambia entre ellas

8. **Testing**: Prueba el widget en diferentes navegadores y dispositivos antes de publicar

---

## 🔗 Recursos Adicionales

- [Generador de Paletas de Colores](https://coolors.co/)
- [Fuentes Google](https://fonts.google.com/)
- [Calculadora de Contraste](https://webaim.org/resources/contrastchecker/)
- [CSS Box Shadow Generator](https://cssgenerator.org/box-shadow-css-generator.html)

---

## 📞 Soporte

¿Necesitas ayuda con la personalización?
- Email: soporte@stickywork.com
- Documentación: https://docs.stickywork.com

---

**Última actualización**: 2025-11-12
**Versión del Widget**: 1.0.0
