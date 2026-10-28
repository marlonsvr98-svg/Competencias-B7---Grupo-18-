/**
 * servidor/ganchos/logros.js
 * Gancho para filtrar logros: docente ve solo los de sus estudiantes; estudiante solo los propios.
 */

import * as acceso from '../acceso.js';

export default {
  /**
   * Filtrar lista de logros según el rol del usuario.
   */
  async filtrarLista(lista, usuario) {
    if (!usuario) return [];
    if (usuario.rol === 'admin') return lista;

    if (usuario.rol === 'docente') {
      const misEstudiantes = await acceso.estudiantesDe(usuario.id);
      const estIds = new Set(misEstudiantes.map((e) => e.id));
      return (lista || []).filter((l) => l && estIds.has(l.usuarioId));
    }

    if (usuario.rol === 'estudiante') {
      return (lista || []).filter((l) => l && l.usuarioId === usuario.id);
    }

    return [];
  }
};
