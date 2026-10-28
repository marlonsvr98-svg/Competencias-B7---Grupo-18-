/**
 * publico/js/nucleo/gamificacion.js
 * Funciones de gamificación en el cliente según contrato §A.
 */

import * as api from './api.js';
import * as ui from './ui.js';

/**
 * Registra un intento formativo y calcula puntos e insignias en el servidor.
 * @param {Object} datos - { actividad, temaId, nivel, puntaje, maximo, errores, duracionSeg, detalle }
 * @returns {Promise<{ puntosGanados: number, puntosTotales: number, insigniasNuevas: Array }>}
 */
export async function registrarIntento(datos) {
  return await api.llamar('POST', '/api/intentos', datos);
}

/**
 * Consulta los logros de un usuario (o "yo" para el usuario autenticado).
 * @param {string} [usuarioId="yo"]
 * @returns {Promise<{ puntos: number, insignias: Array, nivelQuiz: Object }>}
 */
export async function logrosDe(usuarioId = 'yo') {
  return await api.llamar('GET', `/api/logros/${encodeURIComponent(usuarioId)}`);
}

/**
 * Muestra las recompensas (puntos ganados e insignias nuevas) obtenidas tras completar una actividad.
 * @param {{ puntosGanados?: number, puntosTotales?: number, insigniasNuevas?: Array }} resultado
 */
export function mostrarLogros(resultado) {
  if (!resultado) return;

  const puntos = Number(resultado.puntosGanados || 0);
  const insignias = Array.isArray(resultado.insigniasNuevas) ? resultado.insigniasNuevas : [];

  if (puntos <= 0 && insignias.length === 0) return;

  let mensaje = '';
  if (puntos > 0) {
    mensaje += `⭐ ¡Ganaste +${puntos} puntos! `;
  }

  if (insignias.length > 0) {
    const nombresInsignias = insignias.map((i) => i.nombre || i.id || 'Nueva insignia').join(', ');
    mensaje += `🏆 ¡Nueva insignia desbloqueada: ${nombresInsignias}!`;
  }

  ui.aviso(mensaje.trim(), 'exito');
}
