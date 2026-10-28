/**
 * servidor/auth.js
 * Middleware de autenticación, control de roles y limpieza de sesiones.
 */

import * as almacen from './almacen.js';

export async function limpiarSesionesVencidas() {
  try {
    const ahora = new Date();
    const sesiones = await almacen.leer('sesiones');
    const vigentes = sesiones.filter((s) => s && s.expira && new Date(s.expira) > ahora);
    if (vigentes.length !== sesiones.length) {
      await almacen.escribir('sesiones', vigentes);
    }
  } catch (err) {
    console.error('Error al limpiar sesiones vencidas:', err);
  }
}

// Al cargarse borra las sesiones vencidas
await limpiarSesionesVencidas();

export async function cargarUsuario(req, res, next) {
  req.usuario = null;
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next();
  }

  try {
    const ahora = new Date();
    const sesiones = await almacen.leer('sesiones');
    const sesion = sesiones.find((s) => s && s.token === token && new Date(s.expira) > ahora);

    if (!sesion) {
      return next();
    }

    const usuarios = await almacen.leer('usuarios');
    const usuario = usuarios.find((u) => u && u.id === sesion.usuarioId && u.activo !== false);

    if (usuario) {
      req.usuario = {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol
      };
    }
  } catch (err) {
    console.error('Error en middleware cargarUsuario:', err);
  }

  next();
}

export function exigirRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Sesión requerida' });
    }

    if (roles.length > 0 && !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Acceso no permitido' });
    }

    next();
  };
}
