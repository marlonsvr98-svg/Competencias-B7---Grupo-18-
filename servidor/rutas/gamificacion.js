/**
 * servidor/rutas/gamificacion.js
 * Rutas especiales para el motor de gamificación: POST /api/intentos y GET /api/logros/:usuarioId.
 */

import { Router } from 'express';
import { exigirRol } from '../auth.js';
import * as almacen from '../almacen.js';
import * as acceso from '../acceso.js';
import { procesarIntento } from '../gamificacion.js';

const router = Router();

// POST /api/intentos (requiere sesión activa)
router.post('/intentos', exigirRol(), async (req, res, next) => {
  try {
    const resultado = await procesarIntento(req.usuario, req.body);
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
});

// GET /api/logros/:usuarioId ("yo" permitido)
router.get('/logros/:usuarioId', exigirRol(), async (req, res, next) => {
  try {
    const usuarioSolicitante = req.usuario;
    const targetId =
      req.params.usuarioId === 'yo' ? usuarioSolicitante.id : req.params.usuarioId;

    let autorizado = false;

    // Propio usuario o admin
    if (usuarioSolicitante.id === targetId || usuarioSolicitante.rol === 'admin') {
      autorizado = true;
    } else if (usuarioSolicitante.rol === 'docente') {
      // Docente de sus grupos
      const misEstudiantes = await acceso.estudiantesDe(usuarioSolicitante.id);
      autorizado = misEstudiantes.some((e) => e && e.id === targetId);
    }

    if (!autorizado) {
      const err = new Error('No tienes permisos para consultar los logros de este usuario');
      err.estado = 403;
      throw err;
    }

    const todosLogros = await almacen.leer('logros');
    const miLogro = todosLogros.find((l) => l && l.usuarioId === targetId);

    if (!miLogro) {
      return res.json({
        usuarioId: targetId,
        puntos: 0,
        insignias: [],
        nivelQuiz: {}
      });
    }

    res.json(miLogro);
  } catch (err) {
    next(err);
  }
});

export default router;
