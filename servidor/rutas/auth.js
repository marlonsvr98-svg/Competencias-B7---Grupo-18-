/**
 * servidor/rutas/auth.js
 * Rutas de autenticación, perfil, restablecimiento de contraseña y eventos de bitácora.
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import * as almacen from '../almacen.js';
import { exigirRol } from '../auth.js';

const router = Router();

// Control de intentos fallidos de login en memoria: correo -> [timestamps]
const intentosFallidos = new Map();

function generarClaveTemporal(longitud = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let res = '';
  const bytes = crypto.randomBytes(longitud);
  for (let i = 0; i < longitud; i++) {
    res += chars[bytes[i] % chars.length];
  }
  return res;
}

// POST /api/auth/registro
router.post('/auth/registro', async (req, res, next) => {
  try {
    const { nombre, apellido, correo, clave, consentimiento } = req.body || {};

    const nombreLimpio = String(nombre || '').trim();
    const apellidoLimpio = String(apellido || '').trim();
    const correoLimpio = String(correo || '').trim().toLowerCase();
    const claveStr = String(clave || '');

    if (!nombreLimpio || !apellidoLimpio || !correoLimpio || !claveStr) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(correoLimpio)) {
      return res.status(400).json({ error: 'El formato del correo electrónico no es válido' });
    }

    if (claveStr.length < 8 || !/[a-zA-Z]/.test(claveStr) || !/\d/.test(claveStr)) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 8 caracteres y contener letras y números'
      });
    }

    if (consentimiento !== true) {
      return res.status(400).json({ error: 'Debe aceptar el consentimiento' });
    }

    const usuarios = await almacen.leer('usuarios');
    const yaExiste = usuarios.some((u) => u.correo && u.correo.toLowerCase() === correoLimpio);
    if (yaExiste) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const claveHash = await bcrypt.hash(claveStr, 10);
    const nuevoUsuario = await almacen.agregar('usuarios', {
      nombre: nombreLimpio,
      apellido: apellidoLimpio,
      correo: correoLimpio,
      claveHash,
      rol: 'estudiante',
      activo: true,
      foto: '',
      consentimiento: {
        aceptado: true,
        fecha: new Date().toISOString()
      }
    });

    const { claveHash: _, ...usuarioPublico } = nuevoUsuario;
    res.status(201).json(usuarioPublico);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res, next) => {
  try {
    const { correo, clave } = req.body || {};
    const correoLimpio = String(correo || '').trim().toLowerCase();
    const claveStr = String(clave || '');

    if (!correoLimpio || !claveStr) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    // Límite de 5 fallos en 15 minutos en memoria
    const ahora = Date.now();
    const ventanaMs = 15 * 60 * 1000;
    let intentos = (intentosFallidos.get(correoLimpio) || []).filter((t) => ahora - t < ventanaMs);
    intentosFallidos.set(correoLimpio, intentos);

    if (intentos.length >= 5) {
      return res.status(429).json({
        error: 'Demasiados intentos fallidos. Intente nuevamente en 15 minutos.'
      });
    }

    const usuarios = await almacen.leer('usuarios');
    const usuario = usuarios.find((u) => u.correo && u.correo.toLowerCase() === correoLimpio);

    if (!usuario || usuario.activo === false) {
      intentos.push(ahora);
      intentosFallidos.set(correoLimpio, intentos);
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const coincide = await bcrypt.compare(claveStr, usuario.claveHash);
    if (!coincide) {
      intentos.push(ahora);
      intentosFallidos.set(correoLimpio, intentos);
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    // Éxito: limpia intentos fallidos
    intentosFallidos.delete(correoLimpio);

    // Crear sesión válida por 8 horas
    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    await almacen.agregar('sesiones', {
      token,
      usuarioId: usuario.id,
      expira
    });

    // Registro automático en bitácora
    await almacen.anexarLinea('bitacora.jsonl', {
      usuarioId: usuario.id,
      tipo: 'login',
      recurso: 'auth',
      fecha: new Date().toISOString()
    });

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        correo: usuario.correo,
        foto: usuario.foto || ''
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/auth/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (token) {
      const sesiones = await almacen.leer('sesiones');
      const sesion = sesiones.find((s) => s && s.token === token);
      if (sesion) {
        await almacen.eliminar('sesiones', sesion.id);
      }
    }

    if (req.usuario) {
      await almacen.anexarLinea('bitacora.jsonl', {
        usuarioId: req.usuario.id,
        tipo: 'logout',
        recurso: 'auth',
        fecha: new Date().toISOString()
      });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/yo
router.get('/auth/yo', exigirRol(), async (req, res, next) => {
  try {
    const usuarios = await almacen.leer('usuarios');
    const usuario = usuarios.find((u) => u && u.id === req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { claveHash: _, ...usuarioSinClave } = usuario;
    res.json(usuarioSinClave);
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/perfil
router.put('/auth/perfil', exigirRol(), async (req, res, next) => {
  try {
    const { nombre, apellido, foto } = req.body || {};
    const cambios = {};

    if (typeof nombre === 'string') cambios.nombre = nombre.trim();
    if (typeof apellido === 'string') cambios.apellido = apellido.trim();
    if (typeof foto === 'string') cambios.foto = foto.trim();

    const actualizado = await almacen.actualizar('usuarios', req.usuario.id, cambios);
    const { claveHash: _, ...usuarioSinClave } = actualizado;
    res.json(usuarioSinClave);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/clave
router.post('/auth/clave', exigirRol(), async (req, res, next) => {
  try {
    const { actual, nueva } = req.body || {};
    const actualStr = String(actual || '');
    const nuevaStr = String(nueva || '');

    if (!actualStr || !nuevaStr) {
      return res.status(400).json({ error: 'Contraseña actual y nueva requeridas' });
    }

    if (nuevaStr.length < 8 || !/[a-zA-Z]/.test(nuevaStr) || !/\d/.test(nuevaStr)) {
      return res.status(400).json({
        error: 'La nueva contraseña debe tener al menos 8 caracteres y contener letras y números'
      });
    }

    const usuarios = await almacen.leer('usuarios');
    const usuario = usuarios.find((u) => u && u.id === req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const coincide = await bcrypt.compare(actualStr, usuario.claveHash);
    if (!coincide) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    const claveHash = await bcrypt.hash(nuevaStr, 10);
    await almacen.actualizar('usuarios', req.usuario.id, { claveHash });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/usuarios/:id/restablecer (solo rol admin)
router.post('/admin/usuarios/:id/restablecer', exigirRol('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarios = await almacen.leer('usuarios');
    const usuario = usuarios.find((u) => u && u.id === id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const claveTemporal = generarClaveTemporal(10);
    const claveHash = await bcrypt.hash(claveTemporal, 10);
    await almacen.actualizar('usuarios', id, { claveHash });

    res.json({ claveTemporal });
  } catch (err) {
    next(err);
  }
});

// POST /api/eventos
router.post('/eventos', async (req, res, next) => {
  try {
    const { tipo, recurso } = req.body || {};
    if (!tipo || !recurso) {
      return res.status(400).json({ error: 'tipo y recurso son requeridos' });
    }

    const usuarioId = req.usuario ? req.usuario.id : 'anonimo';
    await almacen.anexarLinea('bitacora.jsonl', {
      usuarioId,
      tipo: String(tipo),
      recurso: String(recurso),
      fecha: new Date().toISOString()
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
