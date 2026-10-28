/**
 * servidor/ganchos/unidades.js
 * Gancho para filtrar y validar permisos de edición en unidades.
 */

import * as acceso from '../acceso.js';

export default {
  /**
   * Cada usuario ve solo unidades de sus asignaturas;
   * estudiantes no ven unidades con visible = false.
   */
  async filtrarLista(lista, usuario) {
    if (!usuario) return [];
    if (usuario.rol === 'admin') return lista;

    const misAsignaturas = await acceso.asignaturasDe(usuario);
    const misIds = new Set(misAsignaturas.map((a) => a.id));

    let resultado = lista.filter((u) => u && misIds.has(u.asignaturaId));
    if (usuario.rol === 'estudiante') {
      resultado = resultado.filter((u) => u && u.visible !== false);
    }
    return resultado;
  },

  /**
   * Valida que el usuario tenga permisos para editar la asignatura de la unidad.
   */
  async antesDeGuardar(datos, usuario, anterior) {
    const asignaturaId = datos.asignaturaId || anterior?.asignaturaId;
    const puede = await acceso.puedeEditarAsignatura(usuario, asignaturaId);
    if (!puede) {
      const err = new Error('No tienes permisos para editar unidades en esta asignatura');
      err.estado = 403;
      throw err;
    }
    return datos;
  }
};
