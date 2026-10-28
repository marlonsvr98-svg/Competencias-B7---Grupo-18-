/**
 * servidor/rutas/quiz.js
 * Motor del quiz del servidor según contratos §B, §C, §D y §E.
 */

import { Router } from 'express';
import { exigirRol } from '../auth.js';
import * as almacen from '../almacen.js';
import * as acceso from '../acceso.js';
import { procesarIntento } from '../gamificacion.js';
import { notificar } from '../notificar.js';

const router = Router();

const NIVELES_BLOOM = [
  { nivel: 1, nombre: 'Recordar' },
  { nivel: 2, nombre: 'Comprender' },
  { nivel: 3, nombre: 'Aplicar' },
  { nivel: 4, nombre: 'Analizar' },
  { nivel: 5, nombre: 'Evaluar' }
];

/**
 * Normaliza cadenas de texto para comparar respuestas en preguntas de completar:
 * mayúsculas, sin acentos ni diéresis, preservando la Ñ.
 */
function normalizar(texto) {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .trim()
    .toUpperCase()
    .replace(/Ñ/g, '\uE000')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\uE000/g, 'Ñ');
}

/**
 * Baraja un arreglo aleatoriamente (Fisher-Yates).
 */
function barajar(lista) {
  if (!Array.isArray(lista)) return [];
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Valida que el estudiante tenga acceso a la asignatura del tema formativo.
 */
async function validarAccesoTema(usuario, temaId) {
  if (!temaId) {
    const err = new Error('El campo temaId es obligatorio');
    err.estado = 400;
    throw err;
  }

  const asigId = await acceso.asignaturaDeTema(temaId);
  if (!asigId) {
    const err = new Error('Tema no encontrado o sin asignatura asignada');
    err.estado = 404;
    throw err;
  }

  const misAsignaturas = await acceso.asignaturasDe(usuario);
  const tieneAcceso = misAsignaturas.some((a) => a && a.id === asigId);
  if (!tieneAcceso) {
    const err = new Error('No tienes acceso a los contenidos de este tema');
    err.estado = 403;
    throw err;
  }

  return asigId;
}

// 1. GET /quiz/estado?temaId=
router.get('/quiz/estado', exigirRol('estudiante'), async (req, res, next) => {
  try {
    const { temaId } = req.query;
    await validarAccesoTema(req.usuario, temaId);

    const [logros, intentos] = await Promise.all([
      almacen.leer('logros'),
      almacen.leer('intentos')
    ]);

    const logroUsuario = logros.find((l) => l && l.usuarioId === req.usuario.id);
    const maxNivelAprobado = Number(logroUsuario?.nivelQuiz?.[temaId] || 0);

    const misIntentosTema = intentos.filter(
      (i) =>
        i &&
        i.usuarioId === req.usuario.id &&
        i.actividad === 'quiz' &&
        i.temaId === temaId
    );

    const niveles = NIVELES_BLOOM.map((nb) => {
      let estado = 'bloqueado';
      if (nb.nivel <= maxNivelAprobado) {
        estado = 'aprobado';
      } else if (nb.nivel === 1 || nb.nivel <= maxNivelAprobado + 1) {
        estado = 'disponible';
      }

      const intentosNivel = misIntentosTema.filter((i) => Number(i.nivel) === nb.nivel);
      let mejorPorcentaje = 0;
      if (intentosNivel.length > 0) {
        const porcentajes = intentosNivel.map((i) => {
          const max = Number(i.maximo) || 1;
          const punt = Number(i.puntaje) || 0;
          return Math.round((punt / max) * 100);
        });
        mejorPorcentaje = Math.max(...porcentajes);
      }

      return {
        nivel: nb.nivel,
        nombre: nb.nombre,
        estado,
        mejorPorcentaje
      };
    });

    res.json({ niveles });
  } catch (err) {
    next(err);
  }
});

// 2. POST /quiz/iniciar { temaId, nivel }
router.post('/quiz/iniciar', exigirRol('estudiante'), async (req, res, next) => {
  try {
    const { temaId, nivel: nivelRaw } = req.body || {};
    const nivel = Number(nivelRaw);
    if (!nivel || nivel < 1 || nivel > 5) {
      const err = new Error('El nivel debe ser un número entero entre 1 y 5');
      err.estado = 400;
      throw err;
    }

    const asigId = await validarAccesoTema(req.usuario, temaId);

    // Verificar disponibilidad del nivel según logros del estudiante
    const logros = await almacen.leer('logros');
    const logroUsuario = logros.find((l) => l && l.usuarioId === req.usuario.id);
    const maxNivelAprobado = Number(logroUsuario?.nivelQuiz?.[temaId] || 0);

    if (nivel > 1 && nivel > maxNivelAprobado + 1) {
      const err = new Error(`El nivel ${nivel} no está disponible. Debes aprobar primero el nivel anterior.`);
      err.estado = 400;
      throw err;
    }

    // Reglas de quiz
    const reglas = (await almacen.leerConfig('reglas-gamificacion')) || {};
    const cantidadRequerida = reglas?.quiz?.preguntasPorNivel || 10;

    // Preguntas aprobadas del tema y nivel
    const todasPreguntas = await almacen.leer('preguntas');
    const preguntasAprobadas = todasPreguntas.filter(
      (p) => p && p.temaId === temaId && Number(p.nivel) === nivel && p.estado === 'aprobado'
    );

    if (preguntasAprobadas.length === 0) {
      const err = new Error('No hay preguntas aprobadas disponibles para este tema y nivel');
      err.estado = 400;
      throw err;
    }

    // Historial de preguntas vistas por el estudiante en este tema y nivel
    const todasSesiones = await almacen.leer('quiz-sesiones');
    const misSesionesNivel = todasSesiones.filter(
      (s) => s && s.usuarioId === req.usuario.id && s.temaId === temaId && Number(s.nivel) === nivel
    );

    const vistasMapa = new Map();
    for (const ses of misSesionesNivel) {
      const fechaMs = new Date(ses.inicio || ses.fecha || 0).getTime();
      if (Array.isArray(ses.preguntasIds)) {
        for (const pId of ses.preguntasIds) {
          const previa = vistasMapa.get(pId) || 0;
          if (fechaMs > previa) vistasMapa.set(pId, fechaMs);
        }
      }
    }

    const noVistas = preguntasAprobadas.filter((p) => !vistasMapa.has(p.id));
    const seleccionadas = [];

    // Priorizar preguntas no vistas
    if (noVistas.length > 0) {
      seleccionadas.push(...barajar(noVistas).slice(0, cantidadRequerida));
    }

    // Si no alcanzan, completar con las vistas hace más tiempo
    if (seleccionadas.length < cantidadRequerida) {
      const vistasOrdenadas = preguntasAprobadas
        .filter((p) => vistasMapa.has(p.id))
        .sort((a, b) => (vistasMapa.get(a.id) || 0) - (vistasMapa.get(b.id) || 0));

      const faltantes = cantidadRequerida - seleccionadas.length;
      seleccionadas.push(...vistasOrdenadas.slice(0, faltantes));

      // Notificar al docente del grupo como máximo una vez al día por tema y nivel
      try {
        const grupos = await acceso.gruposDe(req.usuario);
        const grupo = grupos.find((g) => g && g.asignaturaId === asigId);
        if (grupo && grupo.docenteId) {
          const hoyStr = new Date().toISOString().slice(0, 10);
          const notificaciones = await almacen.leer('notificaciones');
          const yaNotificadoHoy = notificaciones.some(
            (n) =>
              n &&
              n.usuarioId === grupo.docenteId &&
              n.tipo === 'alerta-banco' &&
              n.temaId === temaId &&
              Number(n.nivel) === nivel &&
              String(n.fecha || '').startsWith(hoyStr)
          );

          if (!yaNotificadoHoy) {
            const temas = await almacen.leer('temas');
            const temaObj = temas.find((t) => t && t.id === temaId);
            const tituloTema = temaObj ? temaObj.titulo : 'Tema formativo';
            await notificar(grupo.docenteId, {
              tipo: 'alerta-banco',
              mensaje: `El banco de preguntas de "${tituloTema}" (Nivel ${nivel}) tiene pocas preguntas disponibles y los estudiantes están recibiendo preguntas repetidas.`,
              enlace: `/paginas/banco-preguntas.html?temaId=${encodeURIComponent(temaId)}`,
              temaId,
              nivel
            });
          }
        }
      } catch (notifErr) {
        console.warn('Error al verificar o enviar notificación de banco de preguntas:', notifErr);
      }
    }

    // Barajar orden de preguntas seleccionadas
    const preguntasFinales = barajar(seleccionadas);

    // Crear sesión de quiz en quiz-sesiones
    const sesion = await almacen.agregar('quiz-sesiones', {
      usuarioId: req.usuario.id,
      temaId,
      nivel,
      preguntasIds: preguntasFinales.map((p) => p.id),
      respuestas: {},
      inicio: new Date().toISOString(),
      finalizada: false
    });

    // Devolver lista de preguntas sin respuestas ni retroalimentación
    res.json({
      sesionId: sesion.id,
      preguntas: preguntasFinales.map((p) => ({
        id: p.id,
        tipo: p.tipo,
        enunciado: p.enunciado,
        opciones: Array.isArray(p.opciones) ? p.opciones : []
      }))
    });
  } catch (err) {
    next(err);
  }
});

// 3. POST /quiz/responder { sesionId, preguntaId, respuesta }
router.post('/quiz/responder', exigirRol('estudiante'), async (req, res, next) => {
  try {
    const { sesionId, preguntaId, respuesta } = req.body || {};
    if (!sesionId || !preguntaId) {
      const err = new Error('sesionId y preguntaId son obligatorios');
      err.estado = 400;
      throw err;
    }

    const sesiones = await almacen.leer('quiz-sesiones');
    const sesion = sesiones.find((s) => s && s.id === sesionId);

    if (!sesion) {
      const err = new Error('Sesión de quiz no encontrada');
      err.estado = 404;
      throw err;
    }

    if (sesion.usuarioId !== req.usuario.id) {
      const err = new Error('No tienes acceso a esta sesión de quiz');
      err.estado = 403;
      throw err;
    }

    if (sesion.finalizada) {
      const err = new Error('La sesión de quiz ya ha finalizado');
      err.estado = 400;
      throw err;
    }

    if (!Array.isArray(sesion.preguntasIds) || !sesion.preguntasIds.includes(preguntaId)) {
      const err = new Error('La pregunta no pertenece a esta sesión de quiz');
      err.estado = 400;
      throw err;
    }

    // Guarda una sola vez por pregunta
    if (sesion.respuestas && sesion.respuestas[preguntaId] !== undefined) {
      const err = new Error('Esta pregunta ya fue respondida en esta sesión');
      err.estado = 400;
      throw err;
    }

    const preguntas = await almacen.leer('preguntas');
    const pregunta = preguntas.find((p) => p && p.id === preguntaId);
    if (!pregunta) {
      const err = new Error('Pregunta no encontrada');
      err.estado = 404;
      throw err;
    }

    let correcto = false;
    let correctaTexto = '';

    if (pregunta.tipo === 'opcion') {
      correcto = Number(respuesta) === Number(pregunta.correcta);
      const idx = Number(pregunta.correcta);
      const textoOp = Array.isArray(pregunta.opciones) && pregunta.opciones[idx] ? pregunta.opciones[idx] : '';
      correctaTexto = textoOp ? `${String.fromCharCode(65 + idx)}. ${textoOp}` : String(pregunta.correcta);
    } else if (pregunta.tipo === 'vf') {
      const respBool =
        respuesta === true ||
        String(respuesta).toLowerCase() === 'true' ||
        String(respuesta).toLowerCase() === 'verdadero';
      const pregBool =
        pregunta.correcta === true ||
        String(pregunta.correcta).toLowerCase() === 'true' ||
        String(pregunta.correcta).toLowerCase() === 'verdadero';
      correcto = respBool === pregBool;
      correctaTexto = pregBool ? 'Verdadero' : 'Falso';
    } else if (pregunta.tipo === 'completar') {
      correcto = normalizar(respuesta) === normalizar(pregunta.correcta);
      correctaTexto = String(pregunta.correcta || '').trim();
    }

    const respuestasActualizadas = {
      ...(sesion.respuestas || {}),
      [preguntaId]: {
        respuesta,
        correcto,
        fecha: new Date().toISOString()
      }
    };

    await almacen.actualizar('quiz-sesiones', sesion.id, { respuestas: respuestasActualizadas });

    res.json({
      correcto,
      retroalimentacion: pregunta.retroalimentacion || '',
      correcta: correctaTexto
    });
  } catch (err) {
    next(err);
  }
});

// 4. POST /quiz/finalizar { sesionId }
router.post('/quiz/finalizar', exigirRol('estudiante'), async (req, res, next) => {
  try {
    const { sesionId } = req.body || {};
    if (!sesionId) {
      const err = new Error('El campo sesionId es obligatorio');
      err.estado = 400;
      throw err;
    }

    const sesiones = await almacen.leer('quiz-sesiones');
    const sesion = sesiones.find((s) => s && s.id === sesionId);

    if (!sesion) {
      const err = new Error('Sesión de quiz no encontrada');
      err.estado = 404;
      throw err;
    }

    if (sesion.usuarioId !== req.usuario.id) {
      const err = new Error('No tienes acceso a esta sesión de quiz');
      err.estado = 403;
      throw err;
    }

    if (sesion.finalizada) {
      const err = new Error('La sesión de quiz ya ha sido finalizada');
      err.estado = 400;
      throw err;
    }

    const preguntasIds = Array.isArray(sesion.preguntasIds) ? sesion.preguntasIds : [];
    const total = preguntasIds.length;
    const respuestas = sesion.respuestas || {};

    const todasPreguntas = await almacen.leer('preguntas');
    const mapaPreguntas = new Map(todasPreguntas.map((p) => [p.id, p]));

    let aciertos = 0;
    let errores = 0;
    const repasar = [];

    for (const pId of preguntasIds) {
      const respObj = respuestas[pId];
      const preg = mapaPreguntas.get(pId);

      if (respObj && respObj.correcto === true) {
        aciertos++;
      } else {
        errores++;
        if (preg) {
          let correctaTexto = '';
          if (preg.tipo === 'opcion') {
            const idx = Number(preg.correcta);
            const textoOp = Array.isArray(preg.opciones) && preg.opciones[idx] ? preg.opciones[idx] : '';
            correctaTexto = textoOp ? `${String.fromCharCode(65 + idx)}. ${textoOp}` : String(preg.correcta);
          } else if (preg.tipo === 'vf') {
            const pregBool =
              preg.correcta === true ||
              String(preg.correcta).toLowerCase() === 'true' ||
              String(preg.correcta).toLowerCase() === 'verdadero';
            correctaTexto = pregBool ? 'Verdadero' : 'Falso';
          } else {
            correctaTexto = String(preg.correcta || '').trim();
          }

          repasar.push({
            preguntaId: pId,
            enunciado: preg.enunciado,
            retroalimentacion: preg.retroalimentacion || '',
            correcta: correctaTexto
          });
        }
      }
    }

    const porcentaje = total > 0 ? Math.round((aciertos / total) * 100) : 0;
    const reglas = (await almacen.leerConfig('reglas-gamificacion')) || {};
    const porcentajeAprobacion = Number(reglas?.quiz?.porcentajeAprobacion ?? 70);
    const aprobado = porcentaje >= porcentajeAprobacion;

    // Si aprueba, primero actualiza logros.nivelQuiz[temaId] al máximo alcanzado
    if (aprobado) {
      const logros = await almacen.leer('logros');
      let logro = logros.find((l) => l && l.usuarioId === req.usuario.id);
      if (!logro) {
        logro = await almacen.agregar('logros', {
          usuarioId: req.usuario.id,
          puntos: 0,
          insignias: [],
          nivelQuiz: {}
        });
      }

      const nivelActual = Number(logro.nivelQuiz?.[sesion.temaId] || 0);
      if (Number(sesion.nivel) > nivelActual) {
        const nuevoNivelQuiz = {
          ...(logro.nivelQuiz || {}),
          [sesion.temaId]: Number(sesion.nivel)
        };
        await almacen.actualizar('logros', logro.id, { nivelQuiz: nuevoNivelQuiz });
      }
    }

    // Marcar sesión como finalizada y calcular duración
    const inicioMs = new Date(sesion.inicio || sesion.fecha).getTime();
    const duracionSeg = Math.max(1, Math.round((Date.now() - inicioMs) / 1000));

    await almacen.actualizar('quiz-sesiones', sesion.id, {
      finalizada: true,
      fin: new Date().toISOString()
    });

    // En todos los casos llamar a procesarIntento
    const intentoResultado = await procesarIntento(req.usuario, {
      actividad: 'quiz',
      temaId: sesion.temaId,
      nivel: Number(sesion.nivel),
      puntaje: aciertos,
      maximo: total,
      errores,
      duracionSeg,
      detalle: { aprobado }
    });

    res.json({
      porcentaje,
      aprobado,
      aciertos,
      total,
      repasar,
      puntosGanados: intentoResultado?.puntosGanados || 0,
      insigniasNuevas: intentoResultado?.insigniasNuevas || []
    });
  } catch (err) {
    next(err);
  }
});

export default router;
