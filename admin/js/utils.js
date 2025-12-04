/**
 * Utils Module
 * Funciones de utilidad reutilizables para todo el admin
 */

const utils = {
    /**
     * Formatea una fecha en formato largo español
     * @param {string|Date} date - Fecha a formatear
     * @returns {string} - Fecha formateada (ej: "15 de enero de 2025")
     */
    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Formatea una fecha con hora en formato largo español
     * @param {string|Date} date - Fecha a formatear
     * @returns {string} - Fecha y hora formateada (ej: "15 de enero de 2025, 14:30")
     */
    formatDateTime(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Formatea una fecha en formato corto
     * @param {string|Date} date - Fecha a formatear
     * @returns {string} - Fecha formateada (ej: "15/01/2025")
     */
    formatDateShort(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-ES');
    },

    /**
     * Formatea una hora
     * @param {string} time - Hora a formatear (formato HH:MM:SS o HH:MM)
     * @returns {string} - Hora formateada (ej: "14:30")
     */
    formatTime(time) {
        if (!time) return '-';
        // Si viene como HH:MM:SS, tomar solo HH:MM
        return time.substring(0, 5);
    },

    /**
     * Formatea un número como moneda europea
     * @param {number} amount - Cantidad a formatear
     * @returns {string} - Cantidad formateada (ej: "25,50 €")
     */
    formatCurrency(amount) {
        if (amount === null || amount === undefined) return '-';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    },

    /**
     * Formatea una duración en minutos a formato legible
     * @param {number} minutes - Minutos
     * @returns {string} - Duración formateada (ej: "1h 30min" o "45min")
     */
    formatDuration(minutes) {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours === 0) return `${mins}min`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}min`;
    },

    /**
     * Trunca un texto a un número máximo de caracteres
     * @param {string} text - Texto a truncar
     * @param {number} maxLength - Longitud máxima
     * @returns {string} - Texto truncado con "..." si es necesario
     */
    truncate(text, maxLength = 50) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Capitaliza la primera letra de un string
     * @param {string} str - String a capitalizar
     * @returns {string} - String capitalizado
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Valida un email
     * @param {string} email - Email a validar
     * @returns {boolean} - true si es válido
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Valida un teléfono español
     * @param {string} phone - Teléfono a validar
     * @returns {boolean} - true si es válido
     */
    isValidPhone(phone) {
        const phoneRegex = /^(\+34|0034|34)?[6789]\d{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    /**
     * Genera un color aleatorio en formato hexadecimal
     * @returns {string} - Color hex (ej: "#3b82f6")
     */
    randomColor() {
        const colors = [
            '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
            '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    /**
     * Calcula cuánto tiempo ha pasado desde una fecha (formato relativo)
     * @param {string|Date} date - Fecha
     * @returns {string} - Tiempo relativo (ej: "hace 2 horas", "hace 3 días")
     */
    timeAgo(date) {
        if (!date) return '-';

        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        const intervals = {
            año: 31536000,
            mes: 2592000,
            semana: 604800,
            día: 86400,
            hora: 3600,
            minuto: 60
        };

        for (const [name, secondsInInterval] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInInterval);

            if (interval >= 1) {
                if (interval === 1) {
                    return `hace 1 ${name}`;
                } else {
                    const plural = name === 'mes' ? 'meses' : `${name}s`;
                    return `hace ${interval} ${plural}`;
                }
            }
        }

        return 'hace un momento';
    },

    /**
     * Copia texto al portapapeles
     * @param {string} text - Texto a copiar
     * @returns {Promise<boolean>} - true si se copió exitosamente
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Error copiando al portapapeles:', error);
            return false;
        }
    },

    /**
     * Descarga un archivo JSON
     * @param {object} data - Datos a descargar
     * @param {string} filename - Nombre del archivo
     */
    downloadJSON(data, filename = 'data.json') {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Debounce function - retrasa la ejecución de una función
     * @param {Function} func - Función a ejecutar
     * @param {number} wait - Milisegundos de espera
     * @returns {Function} - Función con debounce
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Exportar
window.utils = utils;
