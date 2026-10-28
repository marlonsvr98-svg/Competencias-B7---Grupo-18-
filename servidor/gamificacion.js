/**
 * servidor/gamificacion.js
 * Motor de gamificación del servidor: procesamiento de intentos, cálculo de puntos,
 * verificación de restricciones, asignación de insignias y actualización de logros.
 */

import * as almacen from './almacen.js';
import * as acceso from './acceso.js';
import { evaluarAlertas } from './alertas.js';

// Memoria para el límite de intentos por hora por usuario (usuarioId -> Array<timestamp>)
const registroIntentosPorHora = new Map();

/**
 * Obtiene el valor de una propiedad en un objeto admitiendo notación de punto (ej. "detalle.simulacionId").
 */
function obtenerValorCampo(obj, ruta) {
  if (!obj || !ruta) return undefined;
  const partes = ruta.split('.');
  let actual = obj;
  for (const parte of partes) {
    if (actual === null || actual === undefined) return undefined;
    actual = actual[parte];
  }
  return actual;
}

/**
 * Calcula la racha de días consecutivos con intentos hasta hoy.
 */
function calcularRachaHastaHoy(intentos) {
  if (!Array.isArray(intentos) || intentos.length === 0) return 0;

  const fechasUnicas = Array.from(
    new Set(intentos.map((i) => i.fecha && String(i.fecha).slice(0, 10)).filter(Boolean))
  ).sort();

  if (fechasUnicas.length === 0) return 0;

  const hoyStr = new Date().toISOString().slice(0, 10);
  const ayerDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const ayerStr = ayerDate.toISOString().slice(0, 10);

  const ultimoDia = fechasUnicas[fechasUnicas.length - 1];
  if (ultimoDia !== hoyStr && ultimoDia !== ayerStr) {
    return 0;
  }

  let racha = 1;
  for (let i = fechasUnicas.length - 1; i > 0; i--) {
    const dActual = new Date(fechasUnicas[i] + 'T00:00:00Z');
    const dPrev = new Date(fechasUnicas[i - 1] + 'T00:00:00Z');
    const diffDias = Math.round((dActual.getTime() - dPrev.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDias === 1) {
      racha++;
    } else {
      break;
    }
  }

  return racha;
}

/**
 * Procesa un intento formativo de un usuario según contrato §B.
 * @param {Object} usuario
 * @param {Object} datos
 * @returns {Promise<{ puntosGanados: number, puntosTotales: number, insigniasNuevas: Array }>}
 */
export async function procesarIntento(usuario, datos) {
  if (!usuario) {
    const err = new Error('Sesión requerida');
    err.estado = 401;
    throw err;
  }

  const reglas = (await almacen.leerConfig('reglas-gamificacion')) || {};
  const puntosReglas = reglas.puntos || {};

  const actividad = datos.actividad;
  if (!actividad || puntosReglas[actividad] === undefined) {
    const err = new Error(`Actividad "${actividad}" no válida en las reglas de gamificación`);
    err.estado = 400;
    throw err;
  }

  const puntaje = Number(datos.puntaje);
  const maximo = Number(datos.maximo);
  const errores = Number(datos.errores || 0);

  if (isNaN(puntaje) || isNaN(maximo) || maximo <= 0 || puntaje < 0 || puntaje > maximo) {
    const err = new Error('Los valores de puntaje y máximo son inválidos');
    err.estado = 400;
    throw err;
  }

  // Validar acceso al tema si se especifica
  if (datos.temaId) {
    const asigId = await acceso.asignaturaDeTema(datos.temaId);
    if (asigId && usuario.rol !== 'admin') {
      const misAsignaturas = await acceso.asignaturasDe(usuario);
      const tieneAcceso = misAsignaturas.some((a) => a && a.id === asigId);
      if (!tieneAcceso) {
        const err = new Error('No tienes acceso al tema especificado');
        err.estado = 403;
        throw err;
      }
    }
  }

  // Control de tasa de intentos por hora en memoria (429)
  const ahora = Date.now();
  const ventanaHora = 60 * 60 * 1000;
  const limiteHora = Number(reglas.limiteIntentosHora) || 60;

  let marcas = registroIntentosPorHora.get(usuario.id) || [];
  marcas = marcas.filter((t) => ahora - t < ventanaHora);

  if (marcas.length >= limiteHora) {
    const err = new Error('Has superado el límite de intentos por hora');
    err.estado = 429;
    throw err;
  }
  marcas.push(ahora);
  registroIntentosPorHora.set(usuario.id, marcas);

  // Cálculo inicial de puntos
  const puntosBase = Math.round((Number(puntosReglas[actividad]) || 0) * (puntaje / maximo));
  const bono = errores === 0 && puntaje === maximo ? Number(reglas.bonoSinErrores || 0) : 0;
  let puntosCalculados = puntosBase + bono;

  // Evaluar condiciones para retención de puntos (el intento se guarda pero con 0 puntos)
  const todosIntentos = await almacen.leer('intentos');
  const misIntentos = (todosIntentos || []).filter((i) => i && i.usuarioId === usuario.id);

  let otorgarPuntos = true;

  // A. Actividades únicas: verificar si ya hay un intento con puntos con la misma clave
  if (reglas.unicas && Array.isArray(reglas.unicas[actividad])) {
    const camposClave = reglas.unicas[actividad];
    const yaExisteConPuntos = misIntentos.some((prev) => {
      if (prev.actividad !== actividad || (Number(prev.puntos) || 0) <= 0) return false;
      return camposClave.every((campo) => {
        const valPrev = obtenerValorCampo(prev, campo);
        const valNuevo = obtenerValorCampo(datos, campo);
        return valPrev !== undefined && valNuevo !== undefined && String(valPrev) === String(valNuevo);
      });
    });

    if (yaExisteConPuntos) {
      otorgarPuntos = false;
    }
  }

  // B. Requiere aprobado: detalle.aprobado !== true
  if (otorgarPuntos && Array.isArray(reglas.requiereAprobado) && reglas.requiereAprobado.includes(actividad)) {
    if (!datos.detalle || datos.detalle.aprobado !== true) {
      otorgarPuntos = false;
    }
  }

  // C. Límite diario de intentos con puntos
  if (otorgarPuntos && reglas.maxDiario && reglas.maxDiario[actividad] !== undefined) {
    const hoyStr = new Date().toISOString().slice(0, 10);
    const intentosHoyConPuntos = misIntentos.filter((prev) => {
      if (prev.actividad !== actividad || (Number(prev.puntos) || 0) <= 0) return false;
      return prev.fecha && String(prev.fecha).slice(0, 10) === hoyStr;
    }).length;

    if (intentosHoyConPuntos >= Number(reglas.maxDiario[actividad])) {
      otorgarPuntos = false;
    }
  }

  if (!otorgarPuntos) {
    puntosCalculados = 0;
  }

  // Guardar el intento
  const nuevoIntento = {
    usuarioId: usuario.id,
    actividad,
    temaId: datos.temaId || null,
    nivel: datos.nivel !== undefined && datos.nivel !== null ? Number(datos.nivel) : null,
    puntaje,
    maximo,
    errores,
    duracionSeg: Number(datos.duracionSeg || 0),
    detalle: datos.detalle || {},
    puntos: puntosCalculados
  };

  const intentoGuardado = await almacen.agregar('intentos', nuevoIntento);

  // Actualizar o crear logros
  const todosLogros = await almacen.leer('logros');
  let miLogro = todosLogros.find((l) => l && l.usuarioId === usuario.id);
  const esNuevoLogro = !miLogro;

  if (!miLogro) {
    miLogro = {
      usuarioId: usuario.id,
      puntos: 0,
      insignias: [],
      nivelQuiz: {}
    };
  } else {
    if (!Array.isArray(miLogro.insignias)) miLogro.insignias = [];
    if (!miLogro.nivelQuiz || typeof miLogro.nivelQuiz !== 'object') miLogro.nivelQuiz = {};
  }

  if (puntosCalculados > 0) {
    miLogro.puntos = (Number(miLogro.puntos) || 0) + puntosCalculados;
  }

  // Actualizar nivelQuiz si corresponde
  if (actividad === 'quiz' && datos.temaId && datos.nivel && datos.detalle?.aprobado === true) {
    const nivelNum = Number(datos.nivel);
    const nivelActual = Number(miLogro.nivelQuiz[datos.temaId] || 0);
    if (nivelNum > nivelActual) {
      miLogro.nivelQuiz[datos.temaId] = nivelNum;
    }
  }

  // Evaluar insignias no obtenidas
  const todasInsignias = await almacen.leer('insignias');
  const insigniasObtenidasIds = new Set(miLogro.insignias.map((i) => i.id));
  const insigniasNuevas = [];

  const todosIntentosUsuario = [...misIntentos, intentoGuardado];

  for (const ins of todasInsignias || []) {
    if (!ins || !ins.id || insigniasObtenidasIds.has(ins.id)) continue;

    const cond = ins.condicion;
    if (!cond || !cond.tipo) continue;

    let ganada = false;

    switch (cond.tipo) {
      case 'conteo': {
        const intentosAct = todosIntentosUsuario.filter((i) => i.actividad === cond.actividad);
        if (reglas.unicas && Array.isArray(reglas.unicas[cond.actividad])) {
          const camposClave = reglas.unicas[cond.actividad];
          const clavesDistintas = new Set();
          for (const it of intentosAct) {
            const clave = camposClave
              .map((c) => String(obtenerValorCampo(it, c) ?? ''))
              .join('|');
            clavesDistintas.add(clave);
          }
          ganada = clavesDistintas.size >= Number(cond.minimo);
        } else {
          ganada = intentosAct.length >= Number(cond.minimo);
        }
        break;
      }

      case 'sinErrores': {
        ganada = todosIntentosUsuario.some(
          (i) =>
            i.actividad === cond.actividad &&
            Number(i.errores) === 0 &&
            Number(i.puntaje) === Number(i.maximo) &&
            Number(i.maximo) > 0
        );
        break;
      }

      case 'puntos': {
        ganada = (Number(miLogro.puntos) || 0) >= Number(cond.minimo);
        break;
      }

      case 'nivelQuiz': {
        const nivelBuscado = Number(cond.nivel);
        const enMapa = Object.values(miLogro.nivelQuiz || {}).some(
          (n) => Number(n) >= nivelBuscado
        );
        const enIntentos = todosIntentosUsuario.some(
          (i) =>
            i.actividad === 'quiz' &&
            Number(i.nivel) >= nivelBuscado &&
            i.detalle &&
            i.detalle.aprobado === true
        );
        ganada = enMapa || enIntentos;
        break;
      }

      case 'racha': {
        const rachaDias = calcularRachaHastaHoy(todosIntentosUsuario);
        ganada = rachaDias >= Number(cond.dias);
        break;
      }

      default:
        break;
    }

    if (ganada) {
      miLogro.insignias.push({
        id: ins.id,
        fecha: new Date().toISOString()
      });
      insigniasObtenidasIds.add(ins.id);
      insigniasNuevas.push({
        id: ins.id,
        nombre: ins.nombre,
        icono: ins.icono
      });
    }
  }

  // Guardar logros
  if (esNuevoLogro) {
    await almacen.agregar('logros', miLogro);
  } else {
    await almacen.actualizar('logros', miLogro.id, miLogro);
  }

  // Evaluar alertas en segundo plano protegido
  try {
    await evaluarAlertas(intentoGuardado, usuario);
  } catch (err) {
    console.error('Error al evaluar alertas tras intento:', err);
  }

  return {
    puntosGanados: puntosCalculados,
    puntosTotales: miLogro.puntos,
    insigniasNuevas
  };
}
