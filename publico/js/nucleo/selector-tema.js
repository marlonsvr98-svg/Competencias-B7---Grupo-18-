/**
 * publico/js/nucleo/selector-tema.js
 * Selector de tema formativo para actividades según contrato §A.
 */

import * as api from './api.js';
import * as ui from './ui.js';
import * as util from './util.js';

/**
 * Obtiene el tema para la actividad actual:
 * Si viene ?temaId= en la URL y existe, lo devuelve.
 * Si no, muestra un modal interactivo para que el estudiante elija entre sus temas disponibles.
 * @returns {Promise<Object|null>} Objeto tema o null si cancela
 */
export async function obtenerTemaActividad() {
  const temaIdParam = util.parametro('temaId');

  const [asignaturas, unidades, temas] = await Promise.all([
    api.listar('asignaturas'),
    api.listar('unidades'),
    api.listar('temas')
  ]);

  const asigMap = new Map((asignaturas || []).map((a) => [a.id, a]));
  const unidadMap = new Map((unidades || []).map((u) => [u.id, u]));

  // Temas válidos de las asignaturas disponibles
  const temasDisponibles = (temas || [])
    .filter((t) => t && t.estado !== 'borrador')
    .map((t) => {
      const u = unidadMap.get(t.unidadId);
      const a = u ? asigMap.get(u.asignaturaId) : null;
      return {
        ...t,
        asignaturaNombre: a ? a.nombre : 'General',
        unidadTitulo: u ? u.titulo : ''
      };
    })
    .filter((t) => t.asignaturaNombre);

  if (temasDisponibles.length === 0) {
    ui.aviso('No tienes temas formativos asignados actualmente', 'advertencia');
    return null;
  }

  // Si viene en el parámetro y existe, retornarlo directamente
  if (temaIdParam) {
    const temaEncontrado = temasDisponibles.find((t) => t.id === temaIdParam);
    if (temaEncontrado) return temaEncontrado;
  }

  // Si solo hay un tema disponible
  if (temasDisponibles.length === 1) {
    const unico = temasDisponibles[0];
    const nuevaUrl = new URL(window.location.href);
    nuevaUrl.searchParams.set('temaId', unico.id);
    window.history.replaceState({}, '', nuevaUrl.toString());
    return unico;
  }

  // Agrupar por asignatura para el selector en modal
  const agrupados = {};
  for (const t of temasDisponibles) {
    if (!agrupados[t.asignaturaNombre]) agrupados[t.asignaturaNombre] = [];
    agrupados[t.asignaturaNombre].push(t);
  }

  const formDiv = document.createElement('div');
  formDiv.className = 'pila';
  formDiv.style.gap = 'var(--espacio-m)';

  let opcionesHtml = '';
  for (const [asig, listaTemas] of Object.entries(agrupados)) {
    opcionesHtml += `<optgroup label="${ui.escapar(asig)}">`;
    for (const t of listaTemas) {
      opcionesHtml += `<option value="${ui.escapar(t.id)}">${ui.escapar(t.titulo)}</option>`;
    }
    opcionesHtml += `</optgroup>`;
  }

  formDiv.innerHTML = `
    <p style="margin: 0; font-size: var(--texto-s); color: var(--color-texto-suave);">
      Elige la asignatura y el tema en el que deseas realizar esta actividad:
    </p>
    <div class="campo" style="margin-bottom: 0;">
      <label for="selectModalTema">Tema formativo:</label>
      <select id="selectModalTema" required>
        ${opcionesHtml}
      </select>
    </div>
  `;

  const accion = await ui.modal({
    titulo: 'Seleccionar Tema Formativo',
    contenido: formDiv,
    acciones: [
      { texto: 'Cancelar', valor: null, clase: 'btn--secundario' },
      { texto: 'Continuar', valor: 'seleccionar', primario: true }
    ]
  });

  if (accion !== 'seleccionar') return null;

  const select = formDiv.querySelector('#selectModalTema');
  const seleccionadoId = select.value;
  const temaElegido = temasDisponibles.find((t) => t.id === seleccionadoId);

  if (temaElegido) {
    const nuevaUrl = new URL(window.location.href);
    nuevaUrl.searchParams.set('temaId', temaElegido.id);
    window.history.replaceState({}, '', nuevaUrl.toString());
  }

  return temaElegido || null;
}
