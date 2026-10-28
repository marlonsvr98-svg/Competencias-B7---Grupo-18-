/**
 * servidor/ganchos/usuarios.js
 * Ganchos para la colección usuarios.
 */

export default {
  /**
   * Quita claveHash de los registros de usuario antes de enviarlos.
   * @param {Array|Object} lista 
   * @param {Object|null} usuario 
   * @returns {Array|Object}
   */
  filtrarLista(lista, usuario) {
    if (Array.isArray(lista)) {
      return lista.map((u) => {
        if (!u || typeof u !== 'object') return u;
        const { claveHash, ...resto } = u;
        return resto;
      });
    }
    if (lista && typeof lista === 'object') {
      const { claveHash, ...resto } = lista;
      return resto;
    }
    return lista;
  },

  /**
   * Valida y procesa cambios antes de guardar en la colección usuarios.
   * Ignora claveHash y correo, y evita que un admin se quite el rol o se desactive a sí mismo.
   * @param {Object} datos 
   * @param {Object|null} usuario 
   * @param {Object|null} anterior 
   * @returns {Object}
   */
  antesDeGuardar(datos, usuario, anterior) {
    const salida = { ...datos };

    // Evita que un admin se quite el rol o se desactive a sí mismo
    if (usuario && anterior && usuario.id === anterior.id && anterior.rol === 'admin') {
      if (salida.rol !== undefined && salida.rol !== 'admin') {
        const err = new Error('Un administrador no puede quitarse el rol a sí mismo');
        err.estado = 400;
        throw err;
      }
      if (salida.activo !== undefined && salida.activo === false) {
        const err = new Error('Un administrador no puede desactivar su propia cuenta');
        err.estado = 400;
        throw err;
      }
    }

    // Ignora claveHash siempre y correo si ya existe el registro (actualización)
    delete salida.claveHash;
    if (anterior) {
      delete salida.correo;
    }

    return salida;
  }
};
