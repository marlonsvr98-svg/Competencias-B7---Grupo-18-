/**
 * servidor/ganchos/lecturas-noticias.js
 * Gancho para lecturas-noticias: fija usuarioId y evita duplicados según contrato §B.
 */

import * as almacen from '../almacen.js';

export default {
  /**
   * Filtrar lista: cada usuario solo ve sus propias lecturas de noticias.
   */
  async filtrarLista(lista, usuario) {
    if (!usuario) return [];
    return (lista || []).filter((l) => l && l.usuarioId === usuario.id);
  },

  /**
   * Antes de guardar:
   * - Fija usuarioId con el usuario en sesión.
   * - Evita registros duplicados (mismo usuarioId y noticiaId).
   */
  async antesDeGuardar(datos, usuario, anterior) {
    if (!usuario) {
      const err = new Error('Sesión requerida');
      err.estado = 401;
      throw err;
    }

    const copia = { ...datos };
    copia.usuarioId = usuario.id;

    if (!copia.noticiaId) {
      const err = new Error('noticiaId es obligatorio');
      err.estado = 400;
      throw err;
    }

    const existentes = await almacen.leer('lecturas-noticias');
    const yaExiste = existentes.some(
      (l) =>
        l &&
        l.id !== anterior?.id &&
        l.usuarioId === copia.usuarioId &&
        l.noticiaId === copia.noticiaId
    );

    if (yaExiste) {
      const err = new Error('La lectura para esta noticia ya está registrada');
      err.estado = 400;
      throw err;
    }

    return copia;
  }
};
