/**
 * publico/js/nucleo/bitacora.js
 * Registro de eventos en la bitácora según contrato §A.
 */

import * as api from './api.js';

/**
 * Registra un evento en la bitácora del servidor.
 * @param {string} tipo - Tipo de evento (ej. "pagina", "clic", "quiz").
 * @param {string} recurso - Recurso o ruta asociada al evento.
 * @returns {Promise<Object>}
 */
export async function registrarEvento(tipo, recurso) {
  try {
    return await api.llamar('POST', '/api/eventos', { tipo, recurso });
  } catch (err) {
    console.error('Error al registrar evento en bitácora:', err);
  }
}
