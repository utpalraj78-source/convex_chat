/**
 * Utility functions for secure logging
 */

/**
 * Mask sensitive data in objects/strings
 * @param {string} str - String to mask
 * @returns {string} - Masked string
 */
const maskString = (str) => {
    if (!str) return str;
    if (str.length <= 6) return '*'.repeat(str.length);
    return str.slice(0, 3) + '*'.repeat(str.length - 6) + str.slice(-3);
};

/**
 * Sanitize an object for logging by masking sensitive fields
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
const sanitizeForLog = (obj) => {
    if (!obj) return obj;
    if (typeof obj !== 'object') return obj;

    const sensitiveFields = [
        'password', 'token', 'authorization', 'secret',
        'email', 'phone', 'address', 'text', 'message',
        'userId', 'id', 'socketId', 'from', 'to'
    ];

    const result = { ...obj };
    for (const key in result) {
        if (typeof result[key] === 'object') {
            result[key] = sanitizeForLog(result[key]);
        } else if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            result[key] = maskString(result[key]);
        }
    }
    return result;
};

/**
 * Safe logging function that masks sensitive data
 * @param {string} prefix - Log prefix/category
 * @param {string} message - Log message
 * @param {Object} [data] - Optional data to log
 */
export const safeLog = (prefix, message, data = null) => {
    const timestamp = new Date().toISOString();
    const logData = data ? sanitizeForLog(data) : '';
    console.log(`[${timestamp}] [${prefix}] ${message}`, logData || '');
};

/**
 * Safe error logging function that masks sensitive data
 * @param {string} prefix - Log prefix/category
 * @param {string} message - Error message
 * @param {Error|Object} [error] - Error object or data
 */
export const safeErrorLog = (prefix, message, error = null) => {
    const timestamp = new Date().toISOString();
    const errorData = error instanceof Error ? 
        { message: error.message, stack: error.stack } : 
        error;
    
    const sanitizedError = errorData ? sanitizeForLog(errorData) : '';
    console.error(`[${timestamp}] [${prefix}] ❌ ${message}`, sanitizedError || '');
};