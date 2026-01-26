/**
 * Error Logger Utility
 * Captura y almacena errores de Supabase para diagnóstico y reporte.
 */

const ERROR_LOG_KEY = 'gym_error_log';
const MAX_ERRORS = 20; // Mantener máximo 20 errores

/**
 * Estructura de un error:
 * {
 *   id: string,
 *   timestamp: string (ISO),
 *   context: string (ej: 'saveWorkoutSession'),
 *   message: string,
 *   code: string | null,
 *   metadata: object | null,
 *   stack: string | null
 * }
 */

/**
 * Guarda un error en localStorage
 * @param {string} context - Función/operación donde ocurrió el error
 * @param {Error|object} error - El error capturado
 * @param {object} metadata - Datos adicionales para diagnóstico
 */
export function logError(context, error, metadata = null) {
    try {
        const errors = getErrors();

        const errorEntry = {
            id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            context,
            message: error?.message || String(error),
            code: error?.code || null,
            metadata,
            stack: error?.stack || null
        };

        // Añadir al inicio, mantener máximo MAX_ERRORS
        errors.unshift(errorEntry);
        if (errors.length > MAX_ERRORS) {
            errors.length = MAX_ERRORS;
        }

        localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(errors));

        // Disparar evento para que ErrorNotification se actualice
        window.dispatchEvent(new CustomEvent('gym-error-logged', { detail: errorEntry }));

        console.error(`[ERROR LOGGED] ${context}:`, error);

        return errorEntry;
    } catch (e) {
        console.error('Failed to log error:', e);
        return null;
    }
}

/**
 * Obtiene todos los errores guardados
 * @returns {Array} Lista de errores
 */
export function getErrors() {
    try {
        const raw = localStorage.getItem(ERROR_LOG_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Failed to get errors:', e);
        return [];
    }
}

/**
 * Obtiene el número de errores pendientes
 * @returns {number}
 */
export function getErrorCount() {
    return getErrors().length;
}

/**
 * Limpia todos los errores guardados
 */
export function clearErrors() {
    try {
        localStorage.removeItem(ERROR_LOG_KEY);
        window.dispatchEvent(new CustomEvent('gym-errors-cleared'));
    } catch (e) {
        console.error('Failed to clear errors:', e);
    }
}

/**
 * Exporta los errores en formato texto para compartir/reportar
 * @returns {string} Texto formateado con los errores
 */
export function exportErrors() {
    const errors = getErrors();

    if (errors.length === 0) {
        return 'No hay errores registrados.';
    }

    const lines = [
        '=== REPORTE DE ERRORES GYM APP ===',
        `Generado: ${new Date().toLocaleString()}`,
        `Total errores: ${errors.length}`,
        '',
        '---',
        ''
    ];

    errors.forEach((err, index) => {
        lines.push(`[${index + 1}] ${err.context}`);
        lines.push(`    Fecha: ${new Date(err.timestamp).toLocaleString()}`);
        lines.push(`    Mensaje: ${err.message}`);
        if (err.code) {
            lines.push(`    Código: ${err.code}`);
        }
        if (err.metadata) {
            lines.push(`    Metadata: ${JSON.stringify(err.metadata)}`);
        }
        lines.push('');
    });

    return lines.join('\n');
}
