/**
 * publico/js/modulos/banco-preguntas.js
 * Módulo de Banco de Preguntas para docentes y administradores.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';

await montarPlantilla({ titulo: 'Banco de preguntas', roles: ['docente', 'admin'] });

const NIVELES_BLOOM = [
  { nivel: 1, nombre: 'Recordar' },
  { nivel: 2, nombre: 'Comprender' },
  { nivel: 3, nombre: 'Aplicar' },
  { nivel: 4, nombre: 'Analizar' },
  { nivel: 5, nombre: 'Evaluar' }
];

const contenedor = document.getElementById('contenido');
if (contenedor) {
  contenedor.innerHTML = `
    <div class="pila" style="gap: var(--espacio-l);">
      <!-- Cabecera y Controles principales -->
      <section class="tarjeta banco-cabecera">
        <div class="banco-controles">
          <div class="banco-selector-tema">
            <label for="selectTema" style="font-size: var(--texto-s); font-weight: var(--peso-seminegrita); display: block; margin-bottom: var(--espacio-xs);">
              Tema formativo:
            </label>
            <select id="selectTema" class="campo" style="margin-bottom: 0;">
              <option value="">Cargando temas formativos...</option>
            </select>
          </div>
          <div class="banco-acciones">
            <button type="button" class="btn btn--secundario" id="btnGenerarIA" disabled>
              ✨ Generar con IA
            </button>
            <button type="button" class="btn btn--primario" id="btnNuevaPregunta" disabled>
              + Nueva pregunta
            </button>
          </div>
        </div>
      </section>

      <!-- Pestañas de niveles de Bloom (1 a 5) -->
      <section>
        <div class="banco-pestanas" id="pestanasNiveles" role="tablist" aria-label="Niveles de Bloom">
          <!-- Generadas dinámicamente -->
        </div>

        <!-- Alerta de advertencia si hay menos de 20 preguntas aprobadas -->
        <div id="alertaMinimo" class="alerta alerta--advertencia" style="display: none; margin-bottom: var(--espacio-m);">
          <span style="font-size: var(--texto-l);">⚠️</span>
          <div id="textoAlertaMinimo"></div>
        </div>

        <!-- Lista de preguntas del nivel activo -->
        <div id="listaPreguntas" class="banco-lista">
          <div class="cargando" style="margin: var(--espacio-xl) auto; display: block;"></div>
        </div>
      </section>
    </div>
  `;

  const selectTema = document.getElementById('selectTema');
  const btnGenerarIA = document.getElementById('btnGenerarIA');
  const btnNuevaPregunta = document.getElementById('btnNuevaPregunta');
  const pestanasNiveles = document.getElementById('pestanasNiveles');
  const alertaMinimo = document.getElementById('alertaMinimo');
  const textoAlertaMinimo = document.getElementById('textoAlertaMinimo');
  const listaPreguntasEl = document.getElementById('listaPreguntas');

  let todosTemas = [];
  let todasPreguntas = [];
  let temaSeleccionadoId = null;
  let nivelActivo = 1;

  async function inicializar() {
    try {
      const [asignaturas, unidades, temas] = await Promise.all([
        api.listar('asignaturas'),
        api.listar('unidades'),
        api.listar('temas')
      ]);

      const asigMap = new Map((asignaturas || []).map((a) => [a.id, a]));
      const unidadMap = new Map((unidades || []).map((u) => [u.id, u]));

      // Filtrar temas que pertenecen a las asignaturas visibles del usuario
      todosTemas = (temas || [])
        .map((t) => {
          const unidad = unidadMap.get(t.unidadId);
          const asig = unidad ? asigMap.get(unidad.asignaturaId) : null;
          return {
            ...t,
            asignaturaNombre: asig ? asig.nombre : 'General',
            unidadTitulo: unidad ? unidad.titulo : ''
          };
        })
        .filter((t) => t.asignaturaNombre);

      if (todosTemas.length === 0) {
        selectTema.innerHTML = '<option value="">No hay temas disponibles</option>';
        selectTema.disabled = true;
        listaPreguntasEl.innerHTML = `
          <div class="vacio">
            <span class="vacio__icono">📚</span>
            <h3 class="vacio__titulo">Sin temas asignados</h3>
            <p class="vacio__descripcion">No tienes temas formativos disponibles para gestionar preguntas.</p>
          </div>
        `;
        return;
      }

      // Agrupar por asignatura en el selector
      const agrupadosPorAsignatura = {};
      for (const t of todosTemas) {
        if (!agrupadosPorAsignatura[t.asignaturaNombre]) {
          agrupadosPorAsignatura[t.asignaturaNombre] = [];
        }
        agrupadosPorAsignatura[t.asignaturaNombre].push(t);
      }

      let opcionesHtml = '';
      for (const [asigNombre, temasAsig] of Object.entries(agrupadosPorAsignatura)) {
        opcionesHtml += `<optgroup label="${ui.escapar(asigNombre)}">`;
        for (const t of temasAsig) {
          opcionesHtml += `<option value="${ui.escapar(t.id)}">${ui.escapar(t.titulo)}</option>`;
        }
        opcionesHtml += `</optgroup>`;
      }
      selectTema.innerHTML = opcionesHtml;

      // Leer parámetro de URL temaId si viene especificado
      const urlParams = new URLSearchParams(window.location.search);
      const paramTemaId = urlParams.get('temaId');
      if (paramTemaId && todosTemas.some((t) => t.id === paramTemaId)) {
        temaSeleccionadoId = paramTemaId;
        selectTema.value = paramTemaId;
      } else {
        temaSeleccionadoId = todosTemas[0].id;
        selectTema.value = temaSeleccionadoId;
      }

      btnGenerarIA.disabled = false;
      btnNuevaPregunta.disabled = false;

      selectTema.addEventListener('change', async () => {
        temaSeleccionadoId = selectTema.value;
        await cargarPreguntas();
      });

      pestanasNiveles.addEventListener('click', (e) => {
        const btn = e.target.closest('.banco-pestana');
        if (btn) {
          const nivel = Number(btn.dataset.nivel);
          if (nivel && nivel !== nivelActivo) {
            nivelActivo = nivel;
            renderizarPestanas();
            renderizarPreguntas();
          }
        }
      });

      btnNuevaPregunta.addEventListener('click', () => abrirModalEdicion());
      btnGenerarIA.addEventListener('click', () => abrirModalGenerarIA());

      await cargarPreguntas();
    } catch (err) {
      console.error('Error al inicializar banco de preguntas:', err);
      ui.aviso(`Error al cargar los datos: ${err.message}`, 'error');
    }
  }

  async function cargarPreguntas() {
    if (!temaSeleccionadoId) return;

    try {
      listaPreguntasEl.innerHTML = '<div class="cargando" style="margin: var(--espacio-xl) auto; display: block;"></div>';
      todasPreguntas = await api.listar('preguntas', { temaId: temaSeleccionadoId });
      todasPreguntas = todasPreguntas || [];

      renderizarPestanas();
      renderizarPreguntas();
    } catch (err) {
      console.error('Error al cargar preguntas:', err);
      ui.aviso(`Error al cargar las preguntas: ${err.message}`, 'error');
    }
  }

  function contarAprobadasPorNivel(nivel) {
    return todasPreguntas.filter((p) => Number(p.nivel) === nivel && p.estado === 'aprobado').length;
  }

  function renderizarPestanas() {
    pestanasNiveles.innerHTML = NIVELES_BLOOM.map((nb) => {
      const cantAprobadas = contarAprobadasPorNivel(nb.nivel);
      const esActiva = nb.nivel === nivelActivo;
      const claseInsignia = cantAprobadas >= 20 ? 'insignia--exito' : 'insignia--advertencia';

      return `
        <button type="button"
          class="banco-pestana ${esActiva ? 'banco-pestana--activa' : ''}"
          data-nivel="${nb.nivel}"
          role="tab"
          aria-selected="${esActiva ? 'true' : 'false'}">
          <span>Nivel ${nb.nivel} (${ui.escapar(nb.nombre)})</span>
          <span class="insignia ${claseInsignia}" title="${cantAprobadas} preguntas aprobadas">
            ${cantAprobadas} aprobadas
          </span>
        </button>
      `;
    }).join('');
  }

  function renderizarPreguntas() {
    const aprobadas = contarAprobadasPorNivel(nivelActivo);
    const nombreNivel = NIVELES_BLOOM.find((n) => n.nivel === nivelActivo)?.nombre || '';

    // Aviso si hay menos de 20 preguntas aprobadas
    if (aprobadas < 20) {
      alertaMinimo.style.display = 'flex';
      textoAlertaMinimo.innerHTML = `
        <strong>Atención:</strong> El Nivel ${nivelActivo} (${ui.escapar(nombreNivel)}) cuenta con <strong>${aprobadas} de 20 preguntas aprobadas recomendadas</strong>.
        Genera más preguntas con IA o agrégalas manualmente para garantizar suficiente variedad en las evaluaciones.
      `;
    } else {
      alertaMinimo.style.display = 'none';
    }

    const preguntasNivel = todasPreguntas.filter((p) => Number(p.nivel) === nivelActivo);

    if (preguntasNivel.length === 0) {
      listaPreguntasEl.innerHTML = `
        <div class="vacio">
          <span class="vacio__icono">❓</span>
          <h3 class="vacio__titulo">Sin preguntas en el Nivel ${nivelActivo}</h3>
          <p class="vacio__descripcion">Aún no hay preguntas para ${ui.escapar(nombreNivel)}. Puedes generarlas con IA o crearlas manualmente.</p>
          <div class="fila" style="gap: var(--espacio-s); margin-top: var(--espacio-s);">
            <button type="button" class="btn btn--secundario" onclick="document.getElementById('btnGenerarIA').click()">
              ✨ Generar con IA
            </button>
            <button type="button" class="btn btn--primario" onclick="document.getElementById('btnNuevaPregunta').click()">
              + Nueva pregunta
            </button>
          </div>
        </div>
      `;
      return;
    }

    listaPreguntasEl.innerHTML = preguntasNivel.map((p) => {
      const tipoEtiqueta = {
        opcion: 'Opción múltiple',
        vf: 'Verdadero / Falso',
        completar: 'Completar espacio'
      }[p.tipo] || p.tipo;

      const estadoEtiqueta = p.estado === 'aprobado' ? 'Aprobada' : 'Borrador';
      const claseEstado = p.estado === 'aprobado' ? 'insignia--exito' : 'insignia--advertencia';
      const origenEtiqueta = p.origen === 'ia' ? 'IA' : 'Manual';

      let opcionesHtml = '';
      if (p.tipo === 'opcion' && Array.isArray(p.opciones)) {
        opcionesHtml = `
          <div class="pregunta-opciones">
            ${p.opciones.map((op, idx) => {
              const esCorrecta = Number(p.correcta) === idx;
              return `
                <div class="pregunta-opcion-item ${esCorrecta ? 'pregunta-opcion-item--correcta' : ''}">
                  <strong>${String.fromCharCode(65 + idx)}.</strong>
                  <span>${ui.escapar(op)}</span>
                  ${esCorrecta ? '<span style="margin-left: auto;">✓</span>' : ''}
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else if (p.tipo === 'vf') {
        const correctaBool = p.correcta === true || p.correcta === 'true';
        opcionesHtml = `
          <div class="pregunta-opciones">
            <div class="pregunta-opcion-item ${correctaBool ? 'pregunta-opcion-item--correcta' : ''}">
              <span>Verdadero</span>
              ${correctaBool ? '<span style="margin-left: auto;">✓</span>' : ''}
            </div>
            <div class="pregunta-opcion-item ${!correctaBool ? 'pregunta-opcion-item--correcta' : ''}">
              <span>Falso</span>
              ${!correctaBool ? '<span style="margin-left: auto;">✓</span>' : ''}
            </div>
          </div>
        `;
      } else if (p.tipo === 'completar') {
        opcionesHtml = `
          <div style="font-size: var(--texto-s); padding: var(--espacio-xs) var(--espacio-s); background-color: rgba(16, 124, 65, 0.12); border-left: 3px solid var(--color-exito); border-radius: var(--radio-s); margin: var(--espacio-xs) 0;">
            <strong>Respuesta correcta:</strong> <span>${ui.escapar(String(p.correcta || ''))}</span>
          </div>
        `;
      }

      return `
        <article class="pregunta-tarjeta" data-id="${ui.escapar(p.id)}">
          <div class="pregunta-cabecera">
            <div class="pregunta-etiquetas">
              <span class="insignia insignia--primario">${ui.escapar(tipoEtiqueta)}</span>
              <span class="insignia ${claseEstado}">${ui.escapar(estadoEtiqueta)}</span>
              <span class="insignia insignia--info">${ui.escapar(origenEtiqueta)}</span>
            </div>
            <div class="pregunta-acciones">
              ${p.estado !== 'aprobado' ? `
                <button type="button" class="btn btn--pequeno btn--secundario btn-aprobar-directo" title="Aprobar pregunta">
                  ✓ Aprobar
                </button>
              ` : ''}
              <button type="button" class="btn btn--pequeno btn--texto btn-editar-pregunta">
                Editar
              </button>
              <button type="button" class="btn btn--pequeno btn--texto btn-eliminar-pregunta" style="color: var(--color-error);">
                Eliminar
              </button>
            </div>
          </div>

          <h4 class="pregunta-enunciado">${ui.escapar(p.enunciado)}</h4>
          ${opcionesHtml}

          ${p.retroalimentacion ? `
            <p class="pregunta-retro">
              <strong>Retroalimentación:</strong> ${ui.escapar(p.retroalimentacion)}
            </p>
          ` : ''}
        </article>
      `;
    }).join('');

    // Asignar eventos de acciones
    listaPreguntasEl.querySelectorAll('.btn-editar-pregunta').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tarjeta = e.target.closest('.pregunta-tarjeta');
        const id = tarjeta.dataset.id;
        const pregunta = todasPreguntas.find((p) => p.id === id);
        if (pregunta) abrirModalEdicion(pregunta);
      });
    });

    listaPreguntasEl.querySelectorAll('.btn-eliminar-pregunta').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const tarjeta = e.target.closest('.pregunta-tarjeta');
        const id = tarjeta.dataset.id;
        const pregunta = todasPreguntas.find((p) => p.id === id);
        if (!pregunta) return;

        const confirmado = await ui.confirmar('¿Estás seguro de que deseas eliminar esta pregunta del banco?');
        if (!confirmado) return;

        try {
          await api.eliminar('preguntas', id);
          ui.aviso('Pregunta eliminada con éxito', 'exito');
          await cargarPreguntas();
        } catch (err) {
          ui.aviso(`Error al eliminar: ${err.message}`, 'error');
        }
      });
    });

    listaPreguntasEl.querySelectorAll('.btn-aprobar-directo').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const tarjeta = e.target.closest('.pregunta-tarjeta');
        const id = tarjeta.dataset.id;
        try {
          await api.actualizar('preguntas', id, { estado: 'aprobado' });
          ui.aviso('Pregunta aprobada con éxito', 'exito');
          await cargarPreguntas();
        } catch (err) {
          ui.aviso(`Error al aprobar: ${err.message}`, 'error');
        }
      });
    });
  }

  // --- Modal de Creación / Edición de Pregunta ---
  async function abrirModalEdicion(preguntaExistente = null) {
    const esEdicion = Boolean(preguntaExistente && preguntaExistente.id);
    const tipoInicial = preguntaExistente?.tipo || 'opcion';
    const nivelInicial = Number(preguntaExistente?.nivel) || nivelActivo;
    const estadoInicial = preguntaExistente?.estado || 'aprobado';
    const origenInicial = preguntaExistente?.origen || 'manual';

    const formDiv = document.createElement('div');
    formDiv.className = 'pila';
    formDiv.style.gap = 'var(--espacio-m)';

    formDiv.innerHTML = `
      <div class="fila" style="gap: var(--espacio-m); flex-wrap: wrap;">
        <div class="campo" style="flex: 1 1 180px; margin-bottom: 0;">
          <label for="modalTipo">Tipo de pregunta <span style="color: var(--color-error);">*</span></label>
          <select id="modalTipo" required>
            <option value="opcion" ${tipoInicial === 'opcion' ? 'selected' : ''}>Opción múltiple</option>
            <option value="vf" ${tipoInicial === 'vf' ? 'selected' : ''}>Verdadero / Falso</option>
            <option value="completar" ${tipoInicial === 'completar' ? 'selected' : ''}>Completar espacio</option>
          </select>
        </div>

        <div class="campo" style="flex: 1 1 140px; margin-bottom: 0;">
          <label for="modalNivel">Nivel cognitivo <span style="color: var(--color-error);">*</span></label>
          <select id="modalNivel" required>
            ${NIVELES_BLOOM.map((n) => `
              <option value="${n.nivel}" ${nivelInicial === n.nivel ? 'selected' : ''}>
                Nivel ${n.nivel} (${n.nombre})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="campo" style="flex: 1 1 140px; margin-bottom: 0;">
          <label for="modalEstado">Estado <span style="color: var(--color-error);">*</span></label>
          <select id="modalEstado" required>
            <option value="aprobado" ${estadoInicial === 'aprobado' ? 'selected' : ''}>Aprobada</option>
            <option value="borrador" ${estadoInicial === 'borrador' ? 'selected' : ''}>Borrador</option>
          </select>
        </div>
      </div>

      <div class="campo" style="margin-bottom: 0;">
        <label for="modalEnunciado">Enunciado de la pregunta <span style="color: var(--color-error);">*</span></label>
        <textarea id="modalEnunciado" rows="3" placeholder="Escribe el enunciado claro y preciso..." required>${ui.escapar(preguntaExistente?.enunciado || '')}</textarea>
        <small id="ayudaCompletar" style="display: none; color: var(--color-info);">
          Tip: En preguntas de completar, incluye "____" donde va la palabra a llenar.
        </small>
      </div>

      <!-- Contenedor dinámico según tipo -->
      <div id="seccionOpcionesDinamica" class="pila" style="gap: var(--espacio-s);">
        <!-- Inyectado dinámicamente -->
      </div>

      <div class="campo" style="margin-bottom: 0;">
        <label for="modalRetro">Retroalimentación formativa <span style="color: var(--color-error);">*</span></label>
        <textarea id="modalRetro" rows="2" placeholder="Explica brevemente por qué es la respuesta correcta..." required>${ui.escapar(preguntaExistente?.retroalimentacion || '')}</textarea>
      </div>
    `;

    const selectTipo = formDiv.querySelector('#modalTipo');
    const ayudaCompletar = formDiv.querySelector('#ayudaCompletar');
    const seccionOpciones = formDiv.querySelector('#seccionOpcionesDinamica');

    function renderizarCamposTipo(tipo, datosExistentes = null) {
      ayudaCompletar.style.display = tipo === 'completar' ? 'block' : 'none';

      if (tipo === 'opcion') {
        const ops = Array.isArray(datosExistentes?.opciones) && datosExistentes.opciones.length === 4
          ? datosExistentes.opciones
          : ['', '', '', ''];
        const correctaIdx = Number(datosExistentes?.correcta) || 0;

        seccionOpciones.innerHTML = `
          <label style="font-size: var(--texto-xs); font-weight: var(--peso-seminegrita);">
            Opciones de respuesta (marca el botón radial de la opción correcta):
          </label>
          <div class="pila" style="gap: var(--espacio-xs);">
            ${[0, 1, 2, 3].map((i) => `
              <div class="fila" style="align-items: center; gap: var(--espacio-s);">
                <input type="radio" name="modalOpcionCorrecta" value="${i}" ${correctaIdx === i ? 'checked' : ''} id="radioOp_${i}">
                <label for="radioOp_${i}" style="font-weight: var(--peso-negrita); width: 24px;">${String.fromCharCode(65 + i)}.</label>
                <input type="text" class="campo-opcion-txt" id="txtOp_${i}" value="${ui.escapar(ops[i] || '')}" placeholder="Texto de opción ${String.fromCharCode(65 + i)}" style="flex: 1;" required>
              </div>
            `).join('')}
          </div>
        `;
      } else if (tipo === 'vf') {
        const esVerdadero = datosExistentes?.correcta === true || datosExistentes?.correcta === 'true';
        seccionOpciones.innerHTML = `
          <label style="font-size: var(--texto-xs); font-weight: var(--peso-seminegrita);">
            Respuesta correcta:
          </label>
          <div class="fila" style="gap: var(--espacio-m);">
            <label class="fila" style="align-items: center; gap: var(--espacio-xs); cursor: pointer;">
              <input type="radio" name="modalVFCorrecta" value="true" ${esVerdadero ? 'checked' : ''}>
              <span>Verdadero</span>
            </label>
            <label class="fila" style="align-items: center; gap: var(--espacio-xs); cursor: pointer;">
              <input type="radio" name="modalVFCorrecta" value="false" ${!esVerdadero ? 'checked' : ''}>
              <span>Falso</span>
            </label>
          </div>
        `;
      } else if (tipo === 'completar') {
        const palabraCorrecta = String(datosExistentes?.correcta || '');
        seccionOpciones.innerHTML = `
          <div class="campo" style="margin-bottom: 0;">
            <label for="modalCompletarCorrecta">Palabra o frase corta correcta <span style="color: var(--color-error);">*</span></label>
            <input type="text" id="modalCompletarCorrecta" value="${ui.escapar(palabraCorrecta)}" placeholder="Ej. fotosíntesis" required>
          </div>
        `;
      }
    }

    renderizarCamposTipo(tipoInicial, preguntaExistente);

    selectTipo.addEventListener('change', () => {
      renderizarCamposTipo(selectTipo.value, null);
    });

    const accion = await ui.modal({
      titulo: esEdicion ? 'Editar Pregunta' : 'Nueva Pregunta',
      contenido: formDiv,
      acciones: [
        { texto: 'Cancelar', valor: 'cancelar', clase: 'btn--secundario' },
        { texto: esEdicion ? 'Guardar Cambios' : 'Crear Pregunta', valor: 'guardar', primario: true }
      ]
    });

    if (accion !== 'guardar') return;

    // Extraer y validar valores
    const tipo = selectTipo.value;
    const nivel = Number(formDiv.querySelector('#modalNivel').value) || nivelActivo;
    const estado = formDiv.querySelector('#modalEstado').value;
    const enunciado = formDiv.querySelector('#modalEnunciado').value.trim();
    const retroalimentacion = formDiv.querySelector('#modalRetro').value.trim();

    if (!enunciado) {
      ui.aviso('El enunciado es obligatorio', 'error');
      return;
    }

    let opciones = [];
    let correcta = null;

    if (tipo === 'opcion') {
      const inputs = formDiv.querySelectorAll('.campo-opcion-txt');
      opciones = Array.from(inputs).map((inp) => inp.value.trim());
      if (opciones.some((op) => !op)) {
        ui.aviso('Debes completar las 4 opciones de respuesta', 'error');
        return;
      }
      const radioChecked = formDiv.querySelector('input[name="modalOpcionCorrecta"]:checked');
      correcta = radioChecked ? Number(radioChecked.value) : 0;
    } else if (tipo === 'vf') {
      opciones = ['Verdadero', 'Falso'];
      const radioChecked = formDiv.querySelector('input[name="modalVFCorrecta"]:checked');
      correcta = radioChecked ? radioChecked.value === 'true' : true;
    } else if (tipo === 'completar') {
      opciones = [];
      const txtCorrecta = formDiv.querySelector('#modalCompletarCorrecta').value.trim();
      if (!txtCorrecta) {
        ui.aviso('Debes indicar la palabra correcta para completar', 'error');
        return;
      }
      correcta = txtCorrecta;
    }

    const payload = {
      temaId: temaSeleccionadoId,
      nivel,
      tipo,
      enunciado,
      opciones,
      correcta,
      retroalimentacion,
      origen: origenInicial,
      estado
    };

    try {
      if (esEdicion) {
        await api.actualizar('preguntas', preguntaExistente.id, payload);
        ui.aviso('Pregunta actualizada con éxito', 'exito');
      } else {
        await api.crear('preguntas', payload);
        ui.aviso('Pregunta creada con éxito', 'exito');
      }

      // Cambiar pestaña activa si se creó en otro nivel
      nivelActivo = nivel;
      await cargarPreguntas();
    } catch (err) {
      console.error('Error al guardar pregunta:', err);
      ui.aviso(`Error al guardar: ${err.message}`, 'error');
    }
  }

  // --- "Generar con IA" ---
  async function abrirModalGenerarIA() {
    const tema = todosTemas.find((t) => t.id === temaSeleccionadoId);
    if (!tema) return;

    const formDiv = document.createElement('div');
    formDiv.className = 'pila';
    formDiv.style.gap = 'var(--espacio-m)';

    formDiv.innerHTML = `
      <p style="margin: 0; font-size: var(--texto-s); color: var(--color-texto-suave);">
        Genera preguntas formativas calibradas por nivel cognitivo de Bloom a partir del resumen y glosario del tema:
        <br><strong style="color: var(--color-texto);">${ui.escapar(tema.titulo)}</strong> (${ui.escapar(tema.asignaturaNombre)}).
      </p>

      <div class="campo" style="margin-bottom: 0;">
        <label for="iaNivel">Nivel cognitivo (taxonomía de Bloom) <span style="color: var(--color-error);">*</span></label>
        <select id="iaNivel" required>
          ${NIVELES_BLOOM.map((n) => `
            <option value="${n.nivel}" ${nivelActivo === n.nivel ? 'selected' : ''}>
              Nivel ${n.nivel} (${n.nombre})
            </option>
          `).join('')}
        </select>
      </div>

      <div class="campo" style="margin-bottom: 0;">
        <label for="iaCantidad">Cantidad de preguntas a generar (5 a 15) <span style="color: var(--color-error);">*</span></label>
        <input type="number" id="iaCantidad" min="5" max="15" value="5" required>
      </div>
    `;

    const accion = await ui.modal({
      titulo: 'Generar Preguntas con IA',
      contenido: formDiv,
      acciones: [
        { texto: 'Cancelar', valor: 'cancelar', clase: 'btn--secundario' },
        { texto: 'Generar Propuestas', valor: 'generar', primario: true }
      ]
    });

    if (accion !== 'generar') return;

    const nivel = Number(formDiv.querySelector('#iaNivel').value) || nivelActivo;
    const cantidad = Math.min(15, Math.max(5, Number(formDiv.querySelector('#iaCantidad').value) || 5));

    try {
      ui.cargando(true);
      const propuestas = await api.ia('generar-preguntas', {
        temaId: temaSeleccionadoId,
        nivel,
        cantidad
      });
      ui.cargando(false);

      if (!Array.isArray(propuestas) || propuestas.length === 0) {
        ui.aviso('No se pudieron generar propuestas para este tema.', 'advertencia');
        return;
      }

      await mostrarPropuestasIA(propuestas, nivel);
    } catch (err) {
      ui.cargando(false);
      console.error('Error al generar con IA:', err);
      ui.aviso(`Error en IA: ${err.message}`, 'error');
    }
  }

  // --- Visualización y Aprobación de Propuestas IA ---
  async function mostrarPropuestasIA(propuestasIniciales, nivel) {
    let propuestas = [...propuestasIniciales];

    const contenedorModal = document.createElement('div');
    contenedorModal.className = 'pila';
    contenedorModal.style.gap = 'var(--espacio-m)';

    contenedorModal.innerHTML = `
      <div class="fila" style="justify-content: space-between; align-items: center;">
        <span style="font-size: var(--texto-s); color: var(--color-texto-suave);" id="contadorPropuestas">
          ${propuestas.length} preguntas generadas para Nivel ${nivel}
        </span>
        <button type="button" class="btn btn--pequeno btn--primario" id="btnAprobarTodas">
          ✓ Aprobar todas
        </button>
      </div>
      <div class="propuestas-ia-contenedor" id="listaPropuestas"></div>
    `;

    const listaProp = contenedorModal.querySelector('#listaPropuestas');
    const contadorProp = contenedorModal.querySelector('#contadorPropuestas');
    const btnAprobarTodas = contenedorModal.querySelector('#btnAprobarTodas');

    function renderizarPropuestas() {
      contadorProp.textContent = `${propuestas.length} preguntas generadas para Nivel ${nivel}`;

      if (propuestas.length === 0) {
        listaProp.innerHTML = `
          <div style="text-align: center; padding: var(--espacio-l); color: var(--color-texto-suave);">
            No quedan preguntas pendientes en esta tanda.
          </div>
        `;
        btnAprobarTodas.disabled = true;
        return;
      }

      listaProp.innerHTML = propuestas.map((p, idx) => {
        const tipoEtiqueta = {
          opcion: 'Opción múltiple',
          vf: 'Verdadero / Falso',
          completar: 'Completar'
        }[p.tipo] || p.tipo;

        let detalleOpciones = '';
        if (p.tipo === 'opcion' && Array.isArray(p.opciones)) {
          detalleOpciones = p.opciones.map((op, i) => `
            <div style="font-size: var(--texto-xs); padding: 2px 6px; ${Number(p.correcta) === i ? 'color: var(--color-exito); font-weight: bold;' : ''}">
              ${String.fromCharCode(65 + i)}. ${ui.escapar(op)} ${Number(p.correcta) === i ? '✓' : ''}
            </div>
          `).join('');
        } else if (p.tipo === 'vf') {
          const val = p.correcta === true || p.correcta === 'true';
          detalleOpciones = `
            <div style="font-size: var(--texto-xs); color: var(--color-exito); font-weight: bold;">
              Respuesta: ${val ? 'Verdadero' : 'Falso'}
            </div>
          `;
        } else {
          detalleOpciones = `
            <div style="font-size: var(--texto-xs); color: var(--color-exito); font-weight: bold;">
              Respuesta: ${ui.escapar(String(p.correcta || ''))}
            </div>
          `;
        }

        return `
          <div class="propuesta-tarjeta" data-index="${idx}">
            <div class="fila" style="justify-content: space-between; align-items: center;">
              <span class="insignia insignia--primario">${ui.escapar(tipoEtiqueta)}</span>
              <div class="propuesta-acciones">
                <button type="button" class="btn btn--pequeno btn--primario btn-aprobar-propuesta" data-idx="${idx}">
                  ✓ Aprobar
                </button>
                <button type="button" class="btn btn--pequeno btn--secundario btn-editar-propuesta" data-idx="${idx}">
                  Editar
                </button>
                <button type="button" class="btn btn--pequeno btn--texto btn-descartar-propuesta" data-idx="${idx}" style="color: var(--color-error);">
                  Descartar
                </button>
              </div>
            </div>

            <p style="margin: 0; font-size: var(--texto-s); font-weight: var(--peso-seminegrita);">
              ${ui.escapar(p.enunciado)}
            </p>

            <div class="pila" style="gap: 2px;">
              ${detalleOpciones}
            </div>

            ${p.retroalimentacion ? `
              <div style="font-size: var(--texto-xs); color: var(--color-texto-suave); font-style: italic;">
                ${ui.escapar(p.retroalimentacion)}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      // Conectar botones
      listaProp.querySelectorAll('.btn-aprobar-propuesta').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          const idx = Number(e.currentTarget.dataset.idx);
          const p = propuestas[idx];
          if (!p) return;

          try {
            await api.crear('preguntas', {
              ...p,
              temaId: temaSeleccionadoId,
              nivel,
              origen: 'ia',
              estado: 'aprobado'
            });
            propuestas.splice(idx, 1);
            ui.aviso('Pregunta aprobada y guardada en el banco', 'exito');
            renderizarPropuestas();
            await cargarPreguntas();
          } catch (err) {
            ui.aviso(`Error al guardar: ${err.message}`, 'error');
          }
        });
      });

      listaProp.querySelectorAll('.btn-descartar-propuesta').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const idx = Number(e.currentTarget.dataset.idx);
          propuestas.splice(idx, 1);
          renderizarPropuestas();
        });
      });

      listaProp.querySelectorAll('.btn-editar-propuesta').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          const idx = Number(e.currentTarget.dataset.idx);
          const p = propuestas[idx];
          if (!p) return;

          // Cerrar modal actual y abrir editor con los datos de esta propuesta
          propuestas.splice(idx, 1);
          renderizarPropuestas();
          await abrirModalEdicion({
            ...p,
            temaId: temaSeleccionadoId,
            nivel,
            origen: 'ia',
            estado: 'aprobado'
          });
        });
      });
    }

    btnAprobarTodas.addEventListener('click', async () => {
      if (propuestas.length === 0) return;

      try {
        ui.cargando(true);
        for (const p of propuestas) {
          await api.crear('preguntas', {
            ...p,
            temaId: temaSeleccionadoId,
            nivel,
            origen: 'ia',
            estado: 'aprobado'
          });
        }
        ui.cargando(false);
        ui.aviso(`Se aprobaron ${propuestas.length} preguntas correctamente`, 'exito');
        propuestas = [];
        renderizarPropuestas();
        await cargarPreguntas();
      } catch (err) {
        ui.cargando(false);
        ui.aviso(`Error al aprobar: ${err.message}`, 'error');
      }
    });

    renderizarPropuestas();

    await ui.modal({
      titulo: 'Propuestas de Preguntas Generadas con IA',
      contenido: contenedorModal,
      acciones: [{ texto: 'Cerrar', valor: 'cerrar', clase: 'btn--secundario' }]
    });
  }

  await inicializar();
}
