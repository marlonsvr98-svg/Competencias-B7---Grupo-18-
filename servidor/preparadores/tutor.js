/**
 * servidor/preparadores/tutor.js
 * Preparador de contexto curricular y pedagógico para el Tutor Virtual Socrático.
 */

import * as almacen from '../almacen.js';
import * as acceso from '../acceso.js';

export default async function (cuerpo, usuario) {
  const asignaturaId = cuerpo.asignaturaId;
  if (!asignaturaId) {
    const err = new Error('El campo asignaturaId es obligatorio para la tutoría');
    err.estado = 400;
    throw err;
  }

  const consulta = String(cuerpo.consulta || '').trim();
  if (!consulta) {
    const err = new Error('La consulta del estudiante no puede estar vacía');
    err.estado = 400;
    throw err;
  }

  // Verificar que el estudiante tenga acceso a la asignatura
  if (usuario && usuario.rol === 'estudiante') {
    const misAsignaturas = await acceso.asignaturasDe(usuario);
    const tieneAcceso = misAsignaturas.some((a) => a && a.id === asignaturaId);
    if (!tieneAcceso) {
      const err = new Error('No tienes acceso a los contenidos de esta asignatura');
      err.estado = 403;
      throw err;
    }
  }

  // Validar límite diario de consultas al tutor (ajustes.limiteTutorDiario)
  const ajustes = (await almacen.leerConfig('ajustes')) || {};
  const maxDiario = Number(ajustes.limiteTutorDiario) || 40;
  const hoyStr = new Date().toISOString().slice(0, 10);

  const consultas = await almacen.leer('consultas-tutor');
  const consultasHoy = (consultas || []).filter(
    (c) =>
      c &&
      c.usuarioId === usuario?.id &&
      String(c.dia || c.fecha || '').startsWith(hoyStr)
  );

  if (consultasHoy.length >= maxDiario) {
    const err = new Error(
      `Has alcanzado el límite diario de ${maxDiario} consultas con el tutor virtual. Podrás continuar aprendiendo mañana.`
    );
    err.estado = 429;
    throw err;
  }

  // Cargar datos curriculares para el contexto
  const [asignaturas, todasUnidades, todosTemas, todosGlosario] = await Promise.all([
    almacen.leer('asignaturas'),
    almacen.leer('unidades'),
    almacen.leer('temas'),
    almacen.leer('glosario')
  ]);

  const asignatura = (asignaturas || []).find((a) => a && a.id === asignaturaId);
  if (!asignatura) {
    const err = new Error('Asignatura no encontrada');
    err.estado = 404;
    throw err;
  }

  // Unidades visibles de la asignatura
  const unidades = (todasUnidades || [])
    .filter((u) => u && u.asignaturaId === asignaturaId && u.visible !== false)
    .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));

  const unidadIds = new Set(unidades.map((u) => u.id));

  // Temas publicados de dichas unidades
  const temas = (todosTemas || [])
    .filter((t) => t && unidadIds.has(t.unidadId) && t.estado !== 'borrador')
    .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));

  // Construir mapa de glosario por tema
  const glosarioPorTema = new Map();
  for (const g of todosGlosario || []) {
    if (g && g.temaId) {
      if (!glosarioPorTema.has(g.temaId)) glosarioPorTema.set(g.temaId, []);
      glosarioPorTema.get(g.temaId).push(`${g.termino}: ${g.definicion}`);
    }
  }

  // Formatear el contexto curricular estructurado
  let contextoCurricular = `ASIGNATURA: ${asignatura.nombre}\nNIVEL EDUCATIVO: ${asignatura.nivel || 'General'}\nDESCRIPCIÓN: ${asignatura.descripcion || 'Sin descripción'}\n\nUNIDADES Y CONTENIDOS:\n`;

  for (let i = 0; i < unidades.length; i++) {
    const u = unidades[i];
    contextoCurricular += `\nUNIDAD ${i + 1}: ${u.titulo}\n`;
    const temasDeUnidad = temas.filter((t) => t.unidadId === u.id);

    if (temasDeUnidad.length === 0) {
      contextoCurricular += `  (Sin temas publicados aún)\n`;
    } else {
      for (const t of temasDeUnidad) {
        contextoCurricular += `  • TEMA: ${t.titulo}\n`;
        if (t.resumen) contextoCurricular += `    Resumen: ${t.resumen}\n`;
        if (Array.isArray(t.objetivos) && t.objetivos.length > 0) {
          contextoCurricular += `    Objetivos: ${t.objetivos.join('; ')}\n`;
        }
        if (Array.isArray(t.erroresFrecuentes) && t.erroresFrecuentes.length > 0) {
          contextoCurricular += `    Errores conceptuales frecuentes: ${t.erroresFrecuentes.join('; ')}\n`;
        }
        const terminos = glosarioPorTema.get(t.id);
        if (terminos && terminos.length > 0) {
          contextoCurricular += `    Glosario clave: ${terminos.join(' | ')}\n`;
        }
      }
    }
  }

  // Formatear historial conversacional previo (hasta los últimos 8 mensajes)
  const historialArr = Array.isArray(cuerpo.historial) ? cuerpo.historial.slice(-8) : [];
  let historialTexto = '';
  if (historialArr.length === 0) {
    historialTexto = '(Inicio de la sesión. Es el primer mensaje del estudiante)';
  } else {
    historialTexto = historialArr
      .map((m) => {
        const remitente = m.rol === 'asistente' || m.rol === 'tutor' ? 'Sócrates (Tutor)' : 'Estudiante';
        return `${remitente}: ${m.texto || ''}`;
      })
      .join('\n');
  }

  const nombreEstudiante = usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Estudiante' : 'Estudiante';

  return {
    asignatura: asignatura.nombre,
    nivel: asignatura.nivel || 'Educación General Básica',
    estudiante: nombreEstudiante,
    contextoCurricular,
    historial: historialTexto,
    consulta
  };
}
