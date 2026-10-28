/**
 * servidor/ganchos/glosario.js
 * Gancho para filtrar y validar permisos de edición en términos de glosario.
 */

import * as almacen from '../almacen.js';
import * as acceso from '../acceso.js';

export default {
  /**
   * Cada usuario ve solo términos de glosario de sus asignaturas;
   * estudiantes solo ven términos con estado = "aprobado".
   */
  async filtrarLista(lista, usuario) {
    if (!usuario) return [];
    if (usuario.rol === 'admin') return lista;

    const misAsignaturas = await acceso.asignaturasDe(usuario);
    const misIds = new Set(misAsignaturas.map((a) => a.id));

    const temas = await almacen.leer('temas');
    const unidades = await almacen.leer('unidades');
    const unidadMap = new Map(unidades.map((u) => [u.id, u.asignaturaId]));
    const temaMap = new Map(temas.map((t) => [t.id, unidadMap.get(t.unidadId)]));

    let resultado = lista.filter((g) => g && misIds.has(temaMap.get(g.temaId)));
    if (usuario.rol === 'estudiante') {
      resultado = resultado.filter((g) => g && g.estado === 'aprobado');
    }
    return resultado;
  },

  /**
   * Valida que el usuario tenga permisos para editar la asignatura asociada al tema del término.
   */
  async antesDeGuardar(datos, usuario, anterior) {
    const temaId = datos.temaId || anterior?.temaId;
    const asignaturaId = await acceso.asignaturaDeTema(temaId);

    const puede = await acceso.puedeEditarAsignatura(usuario, asignaturaId);
    if (!puede) {
      const err = new Error('No tienes permisos para editar glosario en esta asignatura');
      err.estado = 403;
      throw err;
    }
    return datos;
  }
};
