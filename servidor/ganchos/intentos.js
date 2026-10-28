/**
 * servidor/ganchos/intentos.js
 * Gancho para filtrar intentos: docente ve solo los de sus estudiantes; estudiante solo los propios.
 */

import * as acceso from '../acceso.js';

export default {
  /**
   * Filtrar lista de intentos según el rol del usuario.
   */
  async filtrarLista(lista, usuario) {
    if (!usuario) return [];
    if (usuario.rol === 'admin') return lista;

    if (usuario.rol === 'docente') {
      const misEstudiantes = await acceso.estudiantesDe(usuario.id);
      const estIds = new Set(misEstudiantes.map((e) => e.id));
      return (lista || []).filter((i) => i && estIds.has(i.usuarioId));
    }

    if (usuario.rol === 'estudiante') {
      return (lista || []).filter((i) => i && i.usuarioId === usuario.id);
    }

    return [];
  }
};
