/**
 * servidor/ganchos/noticias.js
 * Gancho para la colección noticias según contrato §B y tarea P03.1.
 */

export default {
  /**
   * Filtrar lista: los estudiantes solo ven noticias publicadas.
   * Docentes y administradores ven todas (borrador y publicado).
   */
  async filtrarLista(lista, usuario) {
    if (!usuario) return [];
    if (usuario.rol === 'estudiante') {
      return (lista || []).filter((n) => n && n.estado === 'publicado');
    }
    return lista || [];
  },

  /**
   * Antes de guardar:
   * - Fija autorId al crear con el id del usuario en sesión.
   * - Fija fechaPublicacion cuando el estado pasa a "publicado" (o se crea publicado).
   */
  async antesDeGuardar(datos, usuario, anterior) {
    const copia = { ...datos };

    if (!anterior) {
      copia.autorId = usuario ? usuario.id : copia.autorId;
    } else {
      copia.autorId = anterior.autorId || (usuario ? usuario.id : copia.autorId);
    }

    if (copia.estado === 'publicado') {
      const eraPublicado = anterior && anterior.estado === 'publicado' && anterior.fechaPublicacion;
      if (!eraPublicado && !copia.fechaPublicacion) {
        copia.fechaPublicacion = new Date().toISOString();
      }
    }

    return copia;
  }
};
