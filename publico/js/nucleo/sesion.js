/**
 * publico/js/nucleo/sesion.js
 * Control de sesiones de usuario en el cliente según contrato §A.
 */

import * as api from './api.js';
import * as ui from './ui.js';

/**
 * Registra un nuevo usuario en el servidor.
 * @param {Object} datos - { nombre, apellido, correo, clave, consentimiento }
 * @returns {Promise<Object>}
 */
export async function registrar(datos) {
  return await api.llamar('POST', '/api/auth/registro', datos);
}

/**
 * Inicia sesión con correo y contraseña.
 * Guarda "token" y "usuario" en sessionStorage.
 * @param {string} correo
 * @param {string} clave
 * @returns {Promise<Object>}
 */
export async function iniciar(correo, clave) {
  const res = await api.llamar('POST', '/api/auth/login', { correo, clave });
  if (res && res.token && res.usuario) {
    sessionStorage.setItem('token', res.token);
    sessionStorage.setItem('usuario', JSON.stringify(res.usuario));
  }
  return res;
}

/**
 * Cierra la sesión activa en el servidor y localmente.
 * Redirige a /paginas/ingreso.html.
 */
export async function cerrar() {
  try {
    await api.llamar('POST', '/api/auth/logout');
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
  } finally {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    window.location.href = '/paginas/ingreso.html';
  }
}

/**
 * Devuelve el token almacenado en sessionStorage.
 * @returns {string|null}
 */
export function token() {
  return sessionStorage.getItem('token');
}

/**
 * Devuelve los datos del usuario actual o null si no hay sesión.
 * @returns {{ id: string, nombre: string, apellido: string, rol: string }|null}
 */
export function usuarioActual() {
  const datos = sessionStorage.getItem('usuario');
  if (!datos) return null;
  try {
    return JSON.parse(datos);
  } catch {
    return null;
  }
}

/**
 * Valida que la sesión actual cumpla con los roles requeridos.
 * Sin sesión → redirige a /paginas/ingreso.html.
 * Rol no permitido → redirige a /index.html con un aviso.
 * @param {string[]} [roles=[]]
 * @returns {boolean}
 */
export function exigirRol(roles = []) {
  if (!roles || roles.length === 0) return true;
  if (roles.includes('publico')) return true;

  const usuario = usuarioActual();
  if (!usuario) {
    window.location.href = '/paginas/ingreso.html';
    return false;
  }

  if (roles.includes('sesion')) return true;

  if (!roles.includes(usuario.rol)) {
    try {
      sessionStorage.setItem('aviso_pendiente', JSON.stringify({
        texto: 'No tienes permisos para acceder a esta página.',
        tipo: 'error'
      }));
    } catch {}
    ui.aviso('No tienes permisos para acceder a esta página.', 'error');
    window.location.href = '/index.html';
    return false;
  }

  return true;
}
