/**
 * servidor/ganchos/canciones.js
 * Gancho para filtrar y validar permisos de edición en canciones educativas.
 */

import * as almacen from '../almacen.js';
import * as acceso from '../acceso.js';

export default {
  /**
   * Cada usuario ve solo las canciones de sus asignaturas (a través del tema).
   * Los administradores ven todas las canciones.
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

    return (lista || []).filter((c) => c && misIds.has(temaMap.get(c.temaId)));
  },

  /**
   * Valida que el usuario tenga permisos para editar la asignatura asociada al tema de la canción.
   */
  async antesDeGuardar(datos, usuario, anterior) {
    const temaId = datos.temaId || anterior?.temaId;
    if (!temaId) {
      const err = new Error('El tema es obligatorio para registrar la canción');
      err.estado = 400;
      throw err;
    }

    const asignaturaId = await acceso.asignaturaDeTema(temaId);
    const puede = await acceso.puedeEditarAsignatura(usuario, asignaturaId);
    if (!puede) {
      const err = new Error('No tienes permisos para editar canciones en esta asignatura');
      err.estado = 403;
      throw err;
    }

    return datos;
  }
};
