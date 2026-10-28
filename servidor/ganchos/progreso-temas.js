/**
 * servidor/ganchos/progreso-temas.js
 * Gancho para progreso-temas: filtrado de estudiantes para docentes y control de duplicados.
 */

import * as almacen from '../almacen.js';
import * as acceso from '../acceso.js';

export default {
  /**
   * Filtrado: admin ve todo; docente ve solo a sus estudiantes; estudiante ve lo propio.
   */
  async filtrarLista(lista, usuario) {
    if (!usuario) return [];
    if (usuario.rol === 'admin') return lista;

    if (usuario.rol === 'docente') {
      const misEstudiantes = await acceso.estudiantesDe(usuario.id);
      const estIds = new Set(misEstudiantes.map((e) => e.id));
      return lista.filter((p) => p && (estIds.has(p.usuarioId) || p.usuarioId === usuario.id));
    }

    if (usuario.rol === 'estudiante') {
      return lista.filter((p) => p && p.usuarioId === usuario.id);
    }

    return [];
  },

  /**
   * Fija usuarioId = usuario.id y rechaza duplicados (usuarioId + temaId).
   */
  async antesDeGuardar(datos, usuario, anterior) {
    if (!usuario) {
      const err = new Error('Sesión requerida');
      err.estado = 401;
      throw err;
    }

    const copia = { ...datos };
    copia.usuarioId = usuario.id;

    if (!copia.temaId) {
      const err = new Error('temaId es requerido');
      err.estado = 400;
      throw err;
    }

    const existentes = await almacen.leer('progreso-temas');
    const yaExiste = existentes.some(
      (p) =>
        p &&
        p.id !== anterior?.id &&
        p.usuarioId === copia.usuarioId &&
        p.temaId === copia.temaId
    );

    if (yaExiste) {
      const err = new Error('El progreso para este tema ya se encuentra registrado');
      err.estado = 400;
      throw err;
    }

    return copia;
  }
};
