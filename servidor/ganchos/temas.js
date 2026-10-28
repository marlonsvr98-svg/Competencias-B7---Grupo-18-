/**
 * servidor/ganchos/temas.js
 * Gancho para filtrar y validar permisos de edición en temas.
 */

import * as almacen from '../almacen.js';
import * as acceso from '../acceso.js';

export default {
  /**
   * Cada usuario ve solo temas de sus asignaturas;
   * estudiantes solo ven temas con estado = "publicado".
   */
  async filtrarLista(lista, usuario) {
    if (!usuario) return [];
    if (usuario.rol === 'admin') return lista;

    const misAsignaturas = await acceso.asignaturasDe(usuario);
    const misIds = new Set(misAsignaturas.map((a) => a.id));

    const unidades = await almacen.leer('unidades');
    const unidadMap = new Map(unidades.map((u) => [u.id, u.asignaturaId]));

    let resultado = lista.filter((t) => t && misIds.has(unidadMap.get(t.unidadId)));
    if (usuario.rol === 'estudiante') {
      resultado = resultado.filter((t) => t && t.estado === 'publicado');
    }
    return resultado;
  },

  /**
   * Valida que el usuario tenga permisos para editar la asignatura asociada a la unidad del tema.
   */
  async antesDeGuardar(datos, usuario, anterior) {
    const unidadId = datos.unidadId || anterior?.unidadId;
    const unidades = await almacen.leer('unidades');
    const unidad = unidades.find((u) => u && u.id === unidadId);
    const asignaturaId = unidad?.asignaturaId;

    const puede = await acceso.puedeEditarAsignatura(usuario, asignaturaId);
    if (!puede) {
      const err = new Error('No tienes permisos para editar temas en esta asignatura');
      err.estado = 403;
      throw err;
    }
    return datos;
  }
};
