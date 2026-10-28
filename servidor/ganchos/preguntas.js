/**
 * servidor/ganchos/preguntas.js
 * Gancho para filtrar y validar permisos de edición en preguntas según contrato §B.
 */

import * as almacen from '../almacen.js';
import * as acceso from '../acceso.js';

export default {
  /**
   * Filtrar preguntas:
   * - Los estudiantes nunca pueden leer esta colección (devuelve []).
   * - Los administradores ven todas las preguntas.
   * - Los docentes ven solo las preguntas de sus asignaturas.
   */
  async filtrarLista(lista, usuario) {
    if (!usuario || usuario.rol === 'estudiante') return [];
    if (usuario.rol === 'admin') return lista || [];

    const misAsignaturas = await acceso.asignaturasDe(usuario);
    const misIds = new Set(misAsignaturas.map((a) => a.id));

    const temas = await almacen.leer('temas');
    const unidades = await almacen.leer('unidades');
    const unidadMap = new Map(unidades.map((u) => [u.id, u.asignaturaId]));
    const temaMap = new Map(temas.map((t) => [t.id, unidadMap.get(t.unidadId)]));

    return (lista || []).filter((p) => p && misIds.has(temaMap.get(p.temaId)));
  },

  /**
   * Valida que el usuario tenga permisos para editar la asignatura asociada al tema de la pregunta.
   */
  async antesDeGuardar(datos, usuario, anterior) {
    const temaId = datos.temaId || anterior?.temaId;
    if (!temaId) {
      const err = new Error('El tema es obligatorio para la pregunta');
      err.estado = 400;
      throw err;
    }

    const asignaturaId = await acceso.asignaturaDeTema(temaId);
    const puede = await acceso.puedeEditarAsignatura(usuario, asignaturaId);
    if (!puede) {
      const err = new Error('No tienes permisos para editar preguntas en esta asignatura');
      err.estado = 403;
      throw err;
    }

    return datos;
  }
};
