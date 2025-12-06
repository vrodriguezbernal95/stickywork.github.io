# Plan para Próxima Sesión - Sistema de Feedback y Sistema de Pagos

**Fecha de creación:** 2025-12-06
**Prioridad:** ALTA
**Objetivos:**
1. Implementar sistema de feedback post-servicio (FASE 1)
2. Implementar sistema de pagos con Stripe (monetización)

---

## 📚 Documentos de Referencia

Este documento es el ÍNDICE principal. Para detalles completos consultar:

- **PLAN_PROXIMA_SESION.md** (este archivo) - Índice y visión general
- **📄 Detalles Sistema Feedback:** Ver secciones completas abajo
- **💳 Detalles Sistema Pagos:** Ver archivo `PLAN_SISTEMA_PAGOS.md`

---

## 🎯 Contexto

El usuario quiere evolucionar StickyWork añadiendo:

1. **Sistema de feedback post-servicio** (Clientes evalúan el servicio recibido)
2. **Reportes inteligentes con IA** (Análisis quincenal automático con recomendaciones)

Esto diferenciará StickyWork de la competencia y permitirá planes premium con mayor valor.

---

## 📋 FASE 1: Sistema de Feedback Post-Servicio (MVP)

### Objetivo de la Fase 1
Implementar sistema básico de feedback que permita a los clientes calificar el servicio recibido y que los dueños vean estos feedbacks en su dashboard.

### Funcionalidades a Implementar

#### 1. Base de Datos
**Nueva tabla: `service_feedback`**
```sql
CREATE TABLE service_feedback (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  business_id INT NOT NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  rating INT NOT NULL, -- 1-5 estrellas
  comment TEXT,
  questions JSON, -- Respuestas a preguntas específicas (limpieza, puntualidad, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_business_rating (business_id, rating),
  INDEX idx_created_at (created_at)
);
```

**Modificación tabla `bookings`:**
```sql
ALTER TABLE bookings ADD COLUMN feedback_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN feedback_sent_at TIMESTAMP NULL;
```

#### 2. Backend - Nuevos Endpoints

**POST /api/feedback**
- Público (accesible vía link en email)
- Recibe: booking_id, rating, comment, questions
- Valida que la reserva exista y no tenga feedback previo
- Guarda feedback en BD
- Retorna confirmación

**GET /api/admin/feedback/:businessId**
- Requiere autenticación
- Retorna lista de feedbacks del negocio
- Filtros: fecha, rating, servicio
- Paginación

**GET /api/admin/feedback/stats/:businessId**
- Requiere autenticación
- Retorna estadísticas:
  - Rating promedio
  - Total feedbacks
  - Distribución por estrellas
  - Tendencia (últimos 30 días)

#### 3. Sistema Automático de Envío

**Cron Job / Scheduled Task:**
```javascript
// Ejecutar cada hora
async function enviarEmailsFeedback() {
  // Buscar reservas completadas hace 24h sin feedback enviado
  const reservas = await db.query(`
    SELECT * FROM bookings
    WHERE status = 'completed'
    AND feedback_sent = FALSE
    AND booking_date < NOW() - INTERVAL 24 HOUR
  `);

  for (const reserva of reservas) {
    await enviarEmailFeedback(reserva);
    await db.query('UPDATE bookings SET feedback_sent = TRUE WHERE id = ?', [reserva.id]);
  }
}
```

**Template de Email:**
```html
Asunto: ¿Qué te pareció tu visita a [Nombre Negocio]?

Hola [Nombre Cliente],

Esperamos que hayas disfrutado de tu [Servicio] del [Fecha] en [Negocio].

Nos encantaría conocer tu opinión para seguir mejorando:

[Botón CTA: Dejar mi opinión]
Link: https://stickywork.com/feedback?token=[token_seguro]

Gracias por tu tiempo,
Equipo de [Nombre Negocio]
```

#### 4. Frontend - Página Pública de Feedback

**Nueva página: `/feedback.html`**
- Accesible públicamente vía link en email
- URL: `https://stickywork.com/feedback?token=ABC123`
- Formulario simple:
  - ⭐⭐⭐⭐⭐ (Selector de estrellas visual)
  - Comentario (textarea opcional)
  - Preguntas adicionales:
    - ¿Cómo calificarías la limpieza? (1-5)
    - ¿El servicio fue puntual? (1-5)
    - ¿Recomendarías este negocio? (Sí/No)
  - Botón: "Enviar opinión"
- Confirmación tras envío: "¡Gracias por tu feedback!"

#### 5. Frontend - Dashboard Admin

**Nueva sección en admin: "Opiniones de Clientes"**

**Archivo:** `admin/opiniones.html`

**Vistas:**

1. **Resumen (Cards superiores):**
   ```
   ┌─────────────┬─────────────┬─────────────┐
   │ Rating      │ Total       │ Últimos     │
   │ Promedio    │ Opiniones   │ 7 días      │
   │   4.6 ⭐    │    127      │    +12      │
   └─────────────┴─────────────┴─────────────┘
   ```

2. **Gráfico de tendencia:**
   - Línea temporal con rating promedio por semana

3. **Lista de feedbacks:**
   ```
   ┌──────────────────────────────────────────┐
   │ ⭐⭐⭐⭐⭐ Juan Pérez - hace 2 días      │
   │ Servicio: Corte de pelo                  │
   │ "Excelente atención, muy profesionales"  │
   └──────────────────────────────────────────┘
   ```

4. **Filtros:**
   - Por rating (todas, 5⭐, 4⭐, etc.)
   - Por servicio
   - Por fecha (última semana, mes, año)

#### 6. Navegación

**Añadir en menú lateral del admin:**
```html
<li><a href="opiniones.html">💬 Opiniones</a></li>
```

---

## 🔧 Archivos a Crear/Modificar

### Backend
- [ ] `backend/migrations/011_service_feedback.sql` - Nueva tabla
- [ ] `backend/migrations/012_bookings_feedback_flags.sql` - Modificar bookings
- [ ] `backend/routes/feedback.js` - Endpoints de feedback
- [ ] `backend/jobs/enviar-feedback.js` - Cron job automático
- [ ] `backend/templates/email-feedback.html` - Template email

### Frontend Público
- [ ] `feedback.html` - Página pública de feedback
- [ ] `css/feedback.css` - Estilos del formulario
- [ ] `js/feedback.js` - Lógica del formulario

### Frontend Admin
- [ ] `admin/opiniones.html` - Dashboard de opiniones
- [ ] `admin/js/opiniones.js` - Lógica del dashboard
- [ ] Modificar menú lateral en todas las páginas admin

### Configuración
- [ ] Actualizar `server.js` para importar rutas de feedback
- [ ] Configurar cron job (Railway Cron o node-cron)

---

## 📊 Métricas de Éxito

**Objetivos Fase 1:**
- ✅ Tasa de respuesta > 20% (de clientes que reciben email)
- ✅ Sistema estable sin errores
- ✅ Dueños pueden ver feedbacks en tiempo real
- ✅ Emails se envían automáticamente 24h post-servicio

---

## 🚀 FASE 2 (Futuro) - Reportes con IA

**Para implementar DESPUÉS de Fase 1:**

### Requerimientos previos:
- Mínimo 30 días de datos de feedback
- Mínimo 50 feedbacks acumulados

### Funcionalidad:
1. **Cron quincenal:** Cada 2 semanas, generar reporte
2. **Recopilación de datos:**
   - Métricas de reservas (total, cancelaciones, horarios pico)
   - Feedbacks recibidos (rating promedio, comentarios)
   - Mensajes de soporte (si aplica)
3. **Llamada a IA (OpenAI/Claude):**
   ```javascript
   const prompt = `
   Eres un consultor de negocios especializado en ${business.type}.

   Analiza estos datos y genera un reporte ejecutivo con:
   1. RESUMEN (2-3 frases)
   2. PUNTOS FUERTES
   3. ÁREAS DE MEJORA
   4. RECOMENDACIONES ACCIONABLES (3-5 acciones concretas)

   Datos: ${JSON.stringify(metricas)}
   `;

   const reporte = await openai.chat.completions.create({
     model: "gpt-4",
     messages: [{ role: "user", content: prompt }]
   });
   ```
4. **Envío por email al dueño:**
   - Subject: "📊 Tu Reporte Quincenal - [Negocio]"
   - Body: Reporte generado por IA en HTML bonito

### Modelo de Negocio:
- **Plan Básico:** Sistema de reservas
- **Plan Pro:** + Feedback de clientes (FASE 1)
- **Plan Premium:** + Reportes IA quincenales (FASE 2)

**Costos estimados:**
- OpenAI API: ~$0.002 por reporte
- 1000 negocios × 2 reportes/mes = $4/mes
- Precio sugerido Plan Premium: +€15/mes por negocio

---

## 💡 Notas Importantes

### Privacidad y RGPD
- Los feedbacks contienen datos personales (nombre, email, opiniones)
- **Requerido:**
  - Consentimiento claro en el formulario de feedback
  - Política de privacidad específica
  - Posibilidad de eliminar feedback (derecho al olvido)
  - No compartir feedbacks públicamente sin consentimiento

### Seguridad
- Tokens de feedback deben ser únicos, aleatorios y de un solo uso
- Expiración de tokens (ej: 30 días)
- Validación de que el token corresponde a una reserva real
- Rate limiting en endpoint público

### UX
- Email de feedback debe ser atractivo y simple
- Formulario debe ser MUY rápido de llenar (< 1 minuto)
- Confirmación visual clara tras enviar
- Mobile-first (mayoría abrirá desde móvil)

---

## 🎯 Objetivo de la Próxima Sesión

**IMPLEMENTAR FASE 1 COMPLETA:**
1. ✅ Crear tablas en base de datos
2. ✅ Implementar endpoints backend
3. ✅ Crear página pública de feedback
4. ✅ Crear dashboard de opiniones en admin
5. ✅ Configurar envío automático de emails
6. ✅ Testing completo del flujo

**Tiempo estimado:** 3-4 horas

**Al finalizar, tendrás:**
- Sistema de feedback funcionando end-to-end
- Dueños recibiendo opiniones de clientes reales
- Base sólida para futura implementación de IA (Fase 2)

---

## 📚 Referencias Técnicas

**APIs a usar:**
- Brevo (emails): Ya configurado
- Node-cron o Railway Cron: Para tareas programadas
- Chart.js: Para gráficos en dashboard

**Librerías útiles:**
- `node-cron`: Programar tareas
- `crypto`: Generar tokens seguros
- Brevo SDK: Ya instalado

---

## ✨ Valor Añadido Esperado

**Para los dueños de negocios:**
- 📊 Visibilidad real de satisfacción de clientes
- 💡 Insights para mejorar el servicio
- 🏆 Posibilidad de destacar buenas opiniones
- 📈 Métrica clara de calidad del negocio

**Para StickyWork (tu negocio):**
- 🎯 Diferenciador vs competencia
- 💰 Justificación para Plan Pro/Premium
- 🔒 Mayor fidelización (lock-in effect)
- 📣 Marketing: "El único sistema con feedback inteligente"

---

## 🗓️ Orden de Implementación Sugerido

### **Opción 1: Implementar en paralelo (RECOMENDADO)**

**Sesión 1 (4-5 horas):**
- ✅ Sistema de Feedback completo (FASE 1)
- ✅ Sistema de Pagos completo (Stripe)

**Beneficios:**
- Tienes feature diferenciador (feedback) para justificar el cobro
- Puedes empezar a monetizar inmediatamente
- Los usuarios ven valor desde día 1

**Sesión 2 (2-3 horas):**
- ✅ Reportes IA (FASE 2) - Feature premium

---

### **Opción 2: Implementar secuencialmente**

**Sesión 1 (3-4 horas):**
- ✅ Sistema de Feedback (FASE 1)

**Sesión 2 (2-3 horas):**
- ✅ Sistema de Pagos (Stripe)

**Sesión 3 (2-3 horas):**
- ✅ Reportes IA (FASE 2)

---

## 💡 Recomendación Final

**Implementar OPCIÓN 1** (paralelo) porque:

1. **Feedback sin pagos** = Feature cool pero no generas ingresos
2. **Pagos sin feedback** = Difícil justificar €29/mes con solo reservas
3. **Ambos juntos** = Propuesta de valor completa + monetización inmediata

**Secuencia ideal en la sesión:**
1. Migración BD (feedback + suscripciones) → 10 min
2. Backend feedback → 1h
3. Backend pagos → 1h
4. Frontend feedback → 1h
5. Frontend pagos → 30 min
6. Testing completo → 30 min

**TOTAL: ~4-5 horas** para tener StickyWork monetizable con feature diferenciador.

---

## 📂 Archivos de Planificación

- **PLAN_PROXIMA_SESION.md** (este archivo) - Sistema de Feedback
- **PLAN_SISTEMA_PAGOS.md** - Sistema de Pagos con Stripe

Ambos archivos están listos para consultar cuando arranques la próxima sesión.

---

**¡Listo para la próxima sesión! 🚀**
