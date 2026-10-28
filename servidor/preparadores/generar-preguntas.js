/**
 * servidor/preparadores/generar-preguntas.js
 * Preparador de datos para el prompt generar-preguntas según contrato §B.
 */

import * as almacen from '../almacen.js';
import * as acceso from '../acceso.js';

const NIVELES_BLOOM = {
  1: '1 Recordar',
  2: '2 Comprender',
  3: '3 Aplicar',
  4: '4 Analizar',
  5: '5 Evaluar'
};

/**
 * Prepara las variables para la plantilla de generación de preguntas con IA.
 * @param {Object} cuerpo - { temaId, nivel, cantidad }
 * @param {Object} usuario - Usuario en sesión
 * @returns {Promise<Object>} Datos para rellenar la plantilla del prompt
 */
export default async function (cuerpo, usuario) {
  const temaId = cuerpo.temaId;
  if (!temaId) {
    const err = new Error('El campo temaId es obligatorio');
    err.estado = 400;
    throw err;
  }

  const nivelNum = Math.min(5, Math.max(1, Number(cuerpo.nivel) || 1));
  const cantidadNum = Math.min(15, Math.max(5, Number(cuerpo.cantidad) || 5));

  // Verificar que el usuario tenga permisos para editar la asignatura del tema
  const asignaturaId = await acceso.asignaturaDeTema(temaId);
  if (!asignaturaId) {
    const err = new Error('No se pudo resolver la asignatura del tema');
    err.estado = 404;
    throw err;
  }

  const puede = await acceso.puedeEditarAsignatura(usuario, asignaturaId);
  if (!puede) {
    const err = new Error('No tienes permisos para editar preguntas en este tema');
    err.estado = 403;
    throw err;
  }

  // Obtener tema, asignatura y glosario
  const [temas, asignaturas, todosGlosario, todasPreguntas] = await Promise.all([
    almacen.leer('temas'),
    almacen.leer('asignaturas'),
    almacen.leer('glosario'),
    almacen.leer('preguntas')
  ]);

  const tema = temas.find((t) => t && t.id === temaId);
  if (!tema) {
    const err = new Error('Tema formativo no encontrado');
    err.estado = 404;
    throw err;
  }

  const asignatura = asignaturas.find((a) => a && a.id === asignaturaId);

  // Formatear glosario del tema: "término: definición"
  const terminosTema = (todosGlosario || []).filter((g) => g && g.temaId === temaId);
  const glosarioTexto =
    terminosTema.length > 0
      ? terminosTema.map((g) => `${g.termino}: ${g.definicion}`).join('\n')
      : 'Sin términos de glosario registrados.';

  // Preguntas ya existentes de ese nivel
  const preguntasExistentes = (todasPreguntas || []).filter(
    (p) => p && p.temaId === temaId && Number(p.nivel) === nivelNum
  );
  const existentesTexto =
    preguntasExistentes.length > 0
      ? preguntasExistentes.map((p) => `- ${p.enunciado}`).join('\n')
      : 'Ninguna';

  return {
    asignatura: asignatura?.nombre || 'General',
    nivel: asignatura?.nivel || 'General',
    tema: tema.titulo || '',
    contenido: tema.resumen || '',
    glosario: glosarioTexto,
    nivelBloom: NIVELES_BLOOM[nivelNum] || '1 Recordar',
    cantidad: cantidadNum,
    existentes: existentesTexto
  };
}
