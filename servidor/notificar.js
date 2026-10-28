/**
 * servidor/notificar.js
 * Envío de notificaciones internas del sistema según contrato §B.
 */

import * as almacen from './almacen.js';

/**
 * Registra una notificación para un usuario específico.
 * @param {string} usuarioId
 * @param {{ tipo?: string, mensaje: string, enlace?: string }} opciones
 * @returns {Promise<Object>} Notificación creada
 */
export async function notificar(usuarioId, { tipo = 'sistema', mensaje, enlace = '', ...extra } = {}) {
  if (!usuarioId || !mensaje) return null;

  return await almacen.agregar('notificaciones', {
    usuarioId,
    tipo,
    mensaje,
    enlace,
    leida: false,
    ...extra
  });
}
