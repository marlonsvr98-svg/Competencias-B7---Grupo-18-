import { leerConfig } from './almacen.js';

/**
 * Evalúa los permisos de acceso para una acción sobre una colección.
 * @param {Object|null} usuario - Usuario de la sesión (o null si es público).
 * @param {'leer'|'escribir'} accion - Acción solicitada.
 * @param {string} col - Nombre de la colección.
 * @param {Object|null} [registro=null] - Registro individual (para evaluar "propio").
 * @returns {Promise<boolean>}
 */
export async function puede(usuario, accion, col, registro = null) {
  const permisos = await leerConfig('permisos');
  if (!permisos || typeof permisos !== 'object') {
    return false;
  }

  // Soporta colecciones anidadas (ej. mensajes/con_000001 -> busca esa o 'mensajes')
  let reglas = permisos[col];
  if (!reglas && col.includes('/')) {
    reglas = permisos[col.split('/')[0]];
  }

  // Colección no listada -> false
  if (!reglas || !Array.isArray(reglas[accion])) {
    return false;
  }

  const permitidos = reglas[accion];

  for (const regla of permitidos) {
    if (regla === 'publico') {
      return true;
    }
    if (regla === 'servidor') {
      // "servidor" nunca se permite desde la API
      continue;
    }
    if (!usuario) {
      continue;
    }
    if (regla === 'sesion') {
      return true;
    }
    if (regla === 'estudiante' && usuario.rol === 'estudiante') {
      return true;
    }
    if (regla === 'docente' && usuario.rol === 'docente') {
      return true;
    }
    if (regla === 'admin' && usuario.rol === 'admin') {
      return true;
    }
    if (regla === 'propio') {
      // "propio" compara registro.usuarioId con usuario.id
      if (registro && usuario.id && registro.usuarioId === usuario.id) {
        return true;
      }
    }
  }

  return false;
}
