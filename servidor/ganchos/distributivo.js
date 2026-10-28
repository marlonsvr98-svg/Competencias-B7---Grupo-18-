/**
 * servidor/ganchos/distributivo.js
 * Gancho para filtrar los grupos de distributivo que corresponden a cada usuario.
 */

import * as acceso from '../acceso.js';

export default {
  /**
   * Cada usuario ve solo sus grupos; el admin ve todos.
   */
  async filtrarLista(lista, usuario) {
    if (!usuario) return [];
    if (usuario.rol === 'admin') return lista;

    const misGrupos = await acceso.gruposDe(usuario);
    const misIds = new Set(misGrupos.map((g) => g.id));
    return lista.filter((g) => g && misIds.has(g.id));
  }
};
