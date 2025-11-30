const rateLimit = require('express-rate-limit');

// Rate limiter para endpoints de login (muy restrictivo)
// Máximo 5 intentos cada 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: {
    error: 'Demasiados intentos de login desde esta IP. Por favor, intenta de nuevo en 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Rate limiter para super-admin login (más restrictivo aún)
// Máximo 3 intentos cada 15 minutos
const superAdminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // máximo 3 intentos (más restrictivo para super-admin)
  message: {
    error: 'Demasiados intentos de login de super-admin. Por seguridad, espera 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter para registro de negocios
// Máximo 3 registros por hora por IP (prevenir spam)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 registros
  message: {
    error: 'Demasiados registros desde esta IP. Por favor, intenta más tarde.',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter para crear reservas
// Máximo 10 reservas por hora por IP
const createBookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 reservas
  message: {
    error: 'Demasiadas reservas creadas desde esta IP. Por favor, intenta más tarde.',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false // Contar tanto éxitos como fallos
});

// Rate limiter para mensajes de contacto (público)
// Máximo 5 mensajes por hora por IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máximo 5 mensajes
  message: {
    error: 'Demasiados mensajes enviados desde esta IP. Por favor, intenta más tarde.',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter para mensajes de soporte (clientes autenticados)
// Máximo 10 mensajes por día por IP
// Nota: La lógica de negocio ya limita a 1 mensaje activo por cliente
const supportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 10, // máximo 10 mensajes al día por IP
  message: {
    error: 'Has alcanzado el límite de mensajes de soporte por hoy. Por favor, intenta mañana.',
    retryAfter: '24 horas'
  },
  standardHeaders: true,
  legacyHeaders: false
  // Usar el keyGenerator por defecto (basado en IP, soporta IPv4 e IPv6)
});

// Rate limiter general para API (prevenir DDoS)
// Máximo 100 peticiones por minuto por IP
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // máximo 100 peticiones
  message: {
    error: 'Demasiadas peticiones desde esta IP. Por favor, reduce la velocidad.',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  superAdminLoginLimiter,
  registerLimiter,
  createBookingLimiter,
  contactLimiter,
  supportLimiter,
  apiLimiter
};
