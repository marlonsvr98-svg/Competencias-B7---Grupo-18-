/**
 * servidor/acceso.js
 * Funciones de acceso y resolución de grupos, asignaturas y relaciones académicas según contrato §B.
 */

import * as almacen from './almacen.js';

/**
 * Devuelve los grupos de distributivo que corresponden al usuario.
 * Admin ve todo; docente ve sus grupos; estudiante ve los grupos donde figura.
 * @param {Object|null} usuario
 * @returns {Promise<Array>}
 */
export async function gruposDe(usuario) {
  if (!usuario) return [];
  const distributivo = await almacen.leer('distributivo');
  if (usuario.rol === 'admin') {
    return distributivo;
  }
  if (usuario.rol === 'docente') {
    return distributivo.filter((g) => g && g.docenteId === usuario.id);
  }
  if (usuario.rol === 'estudiante') {
    return distributivo.filter(
      (g) => g && Array.isArray(g.estudiantes) && g.estudiantes.includes(usuario.id)
    );
  }
  return [];
}

/**
 * Devuelve las asignaturas a las que pertenece el usuario.
 * @param {Object|null} usuario
 * @returns {Promise<Array>}
 */
export async function asignaturasDe(usuario) {
  if (!usuario) return [];
  const asignaturas = await almacen.leer('asignaturas');
  if (usuario.rol === 'admin') {
    return asignaturas;
  }
  const grupos = await gruposDe(usuario);
  const idsAsignaturas = new Set(grupos.map((g) => g.asignaturaId).filter(Boolean));
  return asignaturas.filter((a) => a && idsAsignaturas.has(a.id));
}

/**
 * Resuelve la asignatura asociada a un tema: tema -> unidad -> asignaturaId.
 * @param {string} temaId
 * @returns {Promise<string|null>} ID de la asignatura o null
 */
export async function asignaturaDeTema(temaId) {
  if (!temaId) return null;
  const temas = await almacen.leer('temas');
  const tema = temas.find((t) => t && t.id === temaId);
  if (!tema || !tema.unidadId) return null;

  const unidades = await almacen.leer('unidades');
  const unidad = unidades.find((u) => u && u.id === tema.unidadId);
  if (!unidad || !unidad.asignaturaId) return null;

  return unidad.asignaturaId;
}

/**
 * Determina si un usuario tiene permisos de edición sobre una asignatura.
 * Admin siempre puede; docente puede si imparte la asignatura en algún grupo.
 * @param {Object|null} usuario
 * @param {string} asignaturaId
 * @returns {Promise<boolean>}
 */
export async function puedeEditarAsignatura(usuario, asignaturaId) {
  if (!usuario || !asignaturaId) return false;
  if (usuario.rol === 'admin') return true;
  if (usuario.rol === 'docente') {
    const grupos = await gruposDe(usuario);
    return grupos.some((g) => g && g.asignaturaId === asignaturaId);
  }
  return false;
}

/**
 * Devuelve la lista de usuarios estudiantes a cargo de un docente.
 * @param {string} docenteId
 * @returns {Promise<Array>}
 */
export async function estudiantesDe(docenteId) {
  if (!docenteId) return [];
  const distributivo = await almacen.leer('distributivo');
  const grupos = distributivo.filter((g) => g && g.docenteId === docenteId);
  const estudianteIds = new Set(
    grupos.flatMap((g) => (Array.isArray(g.estudiantes) ? g.estudiantes : []))
  );
  const usuarios = await almacen.leer('usuarios');
  return usuarios.filter((u) => u && estudianteIds.has(u.id));
}

/**
 * Devuelve la lista de usuarios docentes a cargo de un estudiante.
 * @param {string} estudianteId
 * @returns {Promise<Array>}
 */
export async function docentesDe(estudianteId) {
  if (!estudianteId) return [];
  const distributivo = await almacen.leer('distributivo');
  const grupos = distributivo.filter(
    (g) => g && Array.isArray(g.estudiantes) && g.estudiantes.includes(estudianteId)
  );
  const docenteIds = new Set(grupos.map((g) => g.docenteId).filter(Boolean));
  const usuarios = await almacen.leer('usuarios');
  return usuarios.filter((u) => u && docenteIds.has(u.id));
}
