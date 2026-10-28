/**
 * servidor/rutas/ia.js
 * Ruta para ejecución de tareas con IA según contrato §B.
 */

import { Router } from 'express';
import { exigirRol } from '../auth.js';
import { ejecutarTarea } from '../ia.js';
import * as almacen from '../almacen.js';

const router = Router();

router.post('/ia/:tarea', async (req, res, next) => {
  try {
    const { tarea } = req.params;

    // Validación de roles según tarea:
    // La tarea 'tutor' está permitida para estudiantes, docentes y administradores.
    // El resto de tareas de generación curricular requieren rol docente o admin.
    if (tarea === 'tutor') {
      await new Promise((resolve, reject) => {
        exigirRol('estudiante', 'docente', 'admin')(req, res, (err) => (err ? reject(err) : resolve()));
      });

      const resultado = await ejecutarTarea(tarea, req.body, req.usuario, { formato: 'texto' });

      // Registrar consulta en consultas-tutor
      try {
        await almacen.agregar('consultas-tutor', {
          usuarioId: req.usuario?.id || null,
          asignaturaId: req.body?.asignaturaId || null,
          dia: new Date().toISOString().slice(0, 10),
          consulta: req.body?.consulta || '',
          respuesta: resultado
        });
      } catch (errReg) {
        console.warn('Error al registrar en consultas-tutor:', errReg);
      }

      return res.json({ ok: true, respuesta: resultado });
    }

    // Tareas docentes (generar-preguntas, generar-glosario, etc.)
    await new Promise((resolve, reject) => {
      exigirRol('docente', 'admin')(req, res, (err) => (err ? reject(err) : resolve()));
    });

    const resultado = await ejecutarTarea(tarea, req.body, req.usuario, { formato: 'json' });
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

export default router;
