/**
 * servidor/ganchos/asignaturas.js
 * Gancho para filtrar las asignaturas que corresponden a cada usuario.
 */

import * as acceso from '../acceso.js';

export default {
  /**
   * Cada usuario ve solo sus asignaturas; el admin ve todas.
   */
  async filtrarLista(lista, usuario) {
    if (!usuario) return [];
    if (usuario.rol === 'admin') return lista;

    const misAsignaturas = await acceso.asignaturasDe(usuario);
    const misIds = new Set(misAsignaturas.map((a) => a.id));
    return lista.filter((a) => a && misIds.has(a.id));
  }
};
