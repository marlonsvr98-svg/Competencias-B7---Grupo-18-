/**
 * publico/js/modulos/editor-contenidos.js
 * Editor de unidades y temas para docentes y administradores.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';

await montarPlantilla({ titulo: 'Editor de Contenidos', roles: ['docente', 'admin'] });

const contenedor = document.getElementById('contenido');
if (contenedor) {
  contenedor.innerHTML = `
    <div class="pila" style="gap: var(--espacio-l);">
      <!-- Selector de Asignatura -->
      <section class="editor-asig-banner">
        <div class="pila" style="gap: var(--espacio-xs);">
          <label for="selectAsignatura" style="font-size: var(--texto-s); font-weight: var(--peso-seminegrita);">
            Asignatura activa:
          </label>
          <div class="fila" style="align-items: center; gap: var(--espacio-s);">
            <select id="selectAsignatura" class="campo" style="margin-bottom: 0; min-width: 260px;">
              <option value="">Cargando asignaturas...</option>
            </select>
            <span class="insignia insignia--info" id="nivelAsignatura"></span>
          </div>
        </div>
        <p style="color: var(--color-texto-suave); font-size: var(--texto-xs); max-width: 360px; margin: 0;">
          Selecciona una asignatura para organizar sus unidades de aprendizaje y temas formativos.
        </p>
      </section>

      <!-- Paneles principales: Unidades y Temas -->
      <div class="editor-paneles">
        <!-- Panel Izquierdo: Unidades -->
        <section class="tarjeta editor-panel" id="panelUnidades">
          <div class="fila" style="justify-content: space-between; align-items: center;">
            <div>
              <h2 style="font-size: var(--texto-l); margin: 0;">Unidades</h2>
              <small style="color: var(--color-texto-suave);" id="contadorUnidades">0 unidades</small>
            </div>
            <button type="button" class="btn btn--pequeno btn--primario" id="btnNuevaUnidad" disabled>
              + Nueva Unidad
            </button>
          </div>

          <div class="editor-lista" id="listaUnidades">
            <span style="color: var(--color-texto-suave); font-size: var(--texto-s); text-align: center; padding: var(--espacio-l);">
              Selecciona una asignatura arriba para ver sus unidades.
            </span>
          </div>
        </section>

        <!-- Panel Derecho: Temas -->
        <section class="tarjeta editor-panel" id="panelTemas">
          <div class="fila" style="justify-content: space-between; align-items: center;">
            <div>
              <h2 style="font-size: var(--texto-l); margin: 0;">Temas</h2>
              <small style="color: var(--color-texto-suave);" id="contadorTemas">Selecciona una unidad</small>
            </div>
            <button type="button" class="btn btn--pequeno btn--primario" id="btnNuevoTema" disabled>
              + Nuevo Tema
            </button>
          </div>

          <div class="editor-lista" id="listaTemas">
            <span style="color: var(--color-texto-suave); font-size: var(--texto-s); text-align: center; padding: var(--espacio-l);">
              Haz clic sobre una unidad para gestionar sus temas.
            </span>
          </div>
        </section>
      </div>
    </div>
  `;

  const selectAsignatura = document.getElementById('selectAsignatura');
  const nivelAsignatura = document.getElementById('nivelAsignatura');
  const btnNuevaUnidad = document.getElementById('btnNuevaUnidad');
  const btnNuevoTema = document.getElementById('btnNuevoTema');
  const listaUnidadesEl = document.getElementById('listaUnidades');
  const listaTemasEl = document.getElementById('listaTemas');
  const contadorUnidades = document.getElementById('contadorUnidades');
  const contadorTemas = document.getElementById('contadorTemas');

  let asignaturas = [];
  let unidades = [];
  let temas = [];
  let asignaturaActualId = null;
  let unidadSeleccionadaId = null;

  async function inicializar() {
    try {
      asignaturas = await api.listar('asignaturas');

      if (!asignaturas || asignaturas.length === 0) {
        selectAsignatura.innerHTML = `<option value="">Sin asignaturas disponibles</option>`;
        selectAsignatura.disabled = true;
        listaUnidadesEl.innerHTML = `<span style="color: var(--color-texto-suave); padding: var(--espacio-m);">No tienes asignaturas asignadas.</span>`;
        return;
      }

      selectAsignatura.innerHTML = asignaturas
        .map((a) => `<option value="${ui.escapar(a.id)}">${ui.escapar(a.nombre)}</option>`)
        .join('');

      asignaturaActualId = asignaturas[0].id;
      actualizarBannerAsignatura();
      btnNuevaUnidad.disabled = false;

      await cargarContenidos();
    } catch (err) {
      console.error('Error al inicializar editor de contenidos:', err);
      ui.aviso(`Error al cargar datos: ${err.message}`, 'error');
    }
  }

  function actualizarBannerAsignatura() {
    const asig = asignaturas.find((a) => a.id === asignaturaActualId);
    if (asig) {
      nivelAsignatura.textContent = asig.nivel || 'General';
      nivelAsignatura.style.display = 'inline-block';
    } else {
      nivelAsignatura.style.display = 'none';
    }
  }

  async function cargarContenidos() {
    try {
      const [todasUnidades, todosTemas] = await Promise.all([
        api.listar('unidades'),
        api.listar('temas')
      ]);
      unidades = todasUnidades || [];
      temas = todosTemas || [];

      renderizarUnidades();
    } catch (err) {
      console.error('Error al cargar unidades y temas:', err);
      ui.aviso(`Error al cargar contenidos: ${err.message}`, 'error');
    }
  }

  function renderizarUnidades() {
    const unidadesAsig = unidades
      .filter((u) => u && u.asignaturaId === asignaturaActualId)
      .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));

    contadorUnidades.textContent = `${unidadesAsig.length} ${unidadesAsig.length === 1 ? 'unidad' : 'unidades'}`;

    if (unidadesAsig.length === 0) {
      listaUnidadesEl.innerHTML = `
        <span style="color: var(--color-texto-suave); font-size: var(--texto-s); text-align: center; padding: var(--espacio-l);">
          Esta asignatura aún no tiene unidades. Pulsa "+ Nueva Unidad" para crear la primera.
        </span>
      `;
      unidadSeleccionadaId = null;
      renderizarTemas();
      return;
    }

    // Si la unidad seleccionada ya no existe en la asignatura actual, seleccionar la primera
    if (!unidadesAsig.some((u) => u.id === unidadSeleccionadaId)) {
      unidadSeleccionadaId = unidadesAsig[0].id;
    }

    listaUnidadesEl.innerHTML = unidadesAsig
      .map((u, index) => {
        const idEscapado = ui.escapar(u.id);
        const tituloEscapado = ui.escapar(u.titulo || 'Sin título');
        const esActiva = u.id === unidadSeleccionadaId;
        const claseActiva = esActiva ? ' editor-item--activo' : '';
        const esVisible = u.visible !== false;

        const esPrimero = index === 0;
        const esUltimo = index === unidadesAsig.length - 1;

        return `
          <div class="editor-item${claseActiva}" data-id="${idEscapado}">
            <div class="editor-item__info">
              <span class="editor-item__titulo">
                ${index + 1}. ${tituloEscapado}
              </span>
              <div class="fila" style="gap: var(--espacio-xs); align-items: center;">
                <span class="insignia ${esVisible ? 'insignia--exito' : 'insignia--advertencia'}" style="font-size: var(--texto-xs);">
                  ${esVisible ? 'Visible' : 'Oculta'}
                </span>
                <small style="color: var(--color-texto-suave);">Orden: ${u.orden ?? (index + 1)}</small>
              </div>
            </div>

            <div class="editor-item__acciones">
              <button type="button" class="btn-icono btn-subir-unidad" data-index="${index}" title="Subir orden" ${esPrimero ? 'disabled' : ''}>
                ▲
              </button>
              <button type="button" class="btn-icono btn-bajar-unidad" data-index="${index}" title="Bajar orden" ${esUltimo ? 'disabled' : ''}>
                ▼
              </button>
              <button type="button" class="btn-icono btn-visibilidad-unidad" data-id="${idEscapado}" title="${esVisible ? 'Ocultar a estudiantes' : 'Mostrar a estudiantes'}">
                ${esVisible ? '👁️' : '🙈'}
              </button>
              <button type="button" class="btn-icono btn-renombrar-unidad" data-id="${idEscapado}" title="Renombrar unidad">
                ✏️
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    // Evento de selección de unidad al hacer clic en el item
    listaUnidadesEl.querySelectorAll('.editor-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('button')) return; // No cambiar si pulsó botón de acción
        unidadSeleccionadaId = item.getAttribute('data-id');
        renderizarUnidades();
      });
    });

    // Eventos: Subir orden
    listaUnidadesEl.querySelectorAll('.btn-subir-unidad').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const index = Number(btn.getAttribute('data-index'));
        if (index <= 0) return;
        await intercambiarOrdenUnidades(unidadesAsig, index, index - 1);
      });
    });

    // Eventos: Bajar orden
    listaUnidadesEl.querySelectorAll('.btn-bajar-unidad').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const index = Number(btn.getAttribute('data-index'));
        if (index >= unidadesAsig.length - 1) return;
        await intercambiarOrdenUnidades(unidadesAsig, index, index + 1);
      });
    });

    // Evento: Alternar visibilidad
    listaUnidadesEl.querySelectorAll('.btn-visibilidad-unidad').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const unidad = unidades.find((u) => u.id === id);
        if (!unidad) return;
        try {
          const nuevoVisible = unidad.visible === false ? true : false;
          await api.actualizar('unidades', id, { visible: nuevoVisible });
          unidad.visible = nuevoVisible;
          ui.aviso(`Unidad ahora ${nuevoVisible ? 'visible' : 'oculta'}`, 'info');
          renderizarUnidades();
        } catch (err) {
          ui.aviso(err.message || 'Error al cambiar visibilidad', 'error');
        }
      });
    });

    // Evento: Renombrar unidad
    listaUnidadesEl.querySelectorAll('.btn-renombrar-unidad').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const unidad = unidades.find((u) => u.id === id);
        if (!unidad) return;
        await modalRenombrarUnidad(unidad);
      });
    });

    renderizarTemas();
  }

  async function intercambiarOrdenUnidades(lista, idx1, idx2) {
    const u1 = lista[idx1];
    const u2 = lista[idx2];
    const orden1 = Number(u1.orden) || (idx1 + 1);
    const orden2 = Number(u2.orden) || (idx2 + 1);

    // Si tienen el mismo orden, diferenciarlos
    const nuevoOrden1 = orden1 === orden2 ? orden2 + 1 : orden2;
    const nuevoOrden2 = orden1;

    try {
      await Promise.all([
        api.actualizar('unidades', u1.id, { orden: nuevoOrden1 }),
        api.actualizar('unidades', u2.id, { orden: nuevoOrden2 })
      ]);
      u1.orden = nuevoOrden1;
      u2.orden = nuevoOrden2;
      renderizarUnidades();
    } catch (err) {
      ui.aviso(err.message || 'Error al actualizar orden', 'error');
    }
  }

  function renderizarTemas() {
    if (!unidadSeleccionadaId) {
      btnNuevoTema.disabled = true;
      contadorTemas.textContent = 'Ninguna unidad seleccionada';
      listaTemasEl.innerHTML = `
        <span style="color: var(--color-texto-suave); font-size: var(--texto-s); text-align: center; padding: var(--espacio-l);">
          Selecciona una unidad a la izquierda para ver sus temas.
        </span>
      `;
      return;
    }

    btnNuevoTema.disabled = false;
    const unidadActual = unidades.find((u) => u.id === unidadSeleccionadaId);
    const temasUnidad = temas
      .filter((t) => t && t.unidadId === unidadSeleccionadaId)
      .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));

    contadorTemas.textContent = `${temasUnidad.length} ${temasUnidad.length === 1 ? 'tema' : 'temas'} en "${unidadActual?.titulo || ''}"`;

    if (temasUnidad.length === 0) {
      listaTemasEl.innerHTML = `
        <span style="color: var(--color-texto-suave); font-size: var(--texto-s); text-align: center; padding: var(--espacio-l);">
          Esta unidad no tiene temas aún. Pulsa "+ Nuevo Tema" para agregar uno.
        </span>
      `;
      return;
    }

    listaTemasEl.innerHTML = temasUnidad
      .map((t, index) => {
        const idEscapado = ui.escapar(t.id);
        const tituloEscapado = ui.escapar(t.titulo || 'Sin título');
        const esPublicado = t.estado === 'publicado';

        const esPrimero = index === 0;
        const esUltimo = index === temasUnidad.length - 1;

        return `
          <div class="editor-item" data-id="${idEscapado}">
            <div class="editor-item__info">
              <span class="editor-item__titulo">
                ${index + 1}. ${tituloEscapado}
              </span>
              <div class="fila" style="gap: var(--espacio-xs); align-items: center;">
                <span class="insignia ${esPublicado ? 'insignia--exito' : 'insignia--advertencia'}" style="font-size: var(--texto-xs);">
                  ${esPublicado ? 'Publicado' : 'Borrador'}
                </span>
                <small style="color: var(--color-texto-suave);">Orden: ${t.orden ?? (index + 1)}</small>
              </div>
            </div>

            <div class="editor-item__acciones">
              <button type="button" class="btn-icono btn-subir-tema" data-index="${index}" title="Subir orden" ${esPrimero ? 'disabled' : ''}>
                ▲
              </button>
              <button type="button" class="btn-icono btn-bajar-tema" data-index="${index}" title="Bajar orden" ${esUltimo ? 'disabled' : ''}>
                ▼
              </button>
              <button type="button" class="btn-icono btn-estado-tema" data-id="${idEscapado}" title="${esPublicado ? 'Pasar a borrador' : 'Publicar tema'}">
                ${esPublicado ? '📄 Despublicar' : '🚀 Publicar'}
              </button>
              <a href="/paginas/editor-tema.html?id=${idEscapado}" class="btn btn--pequeno btn--secundario" style="text-decoration: none;">
                Editar ficha
              </a>
            </div>
          </div>
        `;
      })
      .join('');

    // Eventos: Subir orden de tema
    listaTemasEl.querySelectorAll('.btn-subir-tema').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const index = Number(btn.getAttribute('data-index'));
        if (index <= 0) return;
        await intercambiarOrdenTemas(temasUnidad, index, index - 1);
      });
    });

    // Eventos: Bajar orden de tema
    listaTemasEl.querySelectorAll('.btn-bajar-tema').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const index = Number(btn.getAttribute('data-index'));
        if (index >= temasUnidad.length - 1) return;
        await intercambiarOrdenTemas(temasUnidad, index, index + 1);
      });
    });

    // Evento: Cambiar estado (borrador o publicado)
    listaTemasEl.querySelectorAll('.btn-estado-tema').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const tema = temas.find((t) => t.id === id);
        if (!tema) return;
        try {
          const nuevoEstado = tema.estado === 'publicado' ? 'borrador' : 'publicado';
          await api.actualizar('temas', id, { estado: nuevoEstado });
          tema.estado = nuevoEstado;
          ui.aviso(`Tema marcado como ${nuevoEstado}`, 'info');
          renderizarTemas();
        } catch (err) {
          ui.aviso(err.message || 'Error al cambiar estado', 'error');
        }
      });
    });
  }

  async function intercambiarOrdenTemas(lista, idx1, idx2) {
    const t1 = lista[idx1];
    const t2 = lista[idx2];
    const orden1 = Number(t1.orden) || (idx1 + 1);
    const orden2 = Number(t2.orden) || (idx2 + 1);

    const nuevoOrden1 = orden1 === orden2 ? orden2 + 1 : orden2;
    const nuevoOrden2 = orden1;

    try {
      await Promise.all([
        api.actualizar('temas', t1.id, { orden: nuevoOrden1 }),
        api.actualizar('temas', t2.id, { orden: nuevoOrden2 })
      ]);
      t1.orden = nuevoOrden1;
      t2.orden = nuevoOrden2;
      renderizarTemas();
    } catch (err) {
      ui.aviso(err.message || 'Error al actualizar orden del tema', 'error');
    }
  }

  // Modal para crear nueva unidad
  btnNuevaUnidad.addEventListener('click', async () => {
    if (!asignaturaActualId) return;

    const formDiv = document.createElement('div');
    formDiv.className = 'pila';
    formDiv.style.gap = 'var(--espacio-m)';
    formDiv.innerHTML = `
      <div class="campo">
        <label for="tituloUnidad">Título de la unidad</label>
        <input type="text" id="tituloUnidad" placeholder="Ej. Unidad 1: La Célula y la Vida" required autofocus>
      </div>
    `;

    const accion = await ui.modal({
      titulo: 'Nueva Unidad de Aprendizaje',
      contenido: formDiv,
      acciones: [
        { texto: 'Cancelar', valor: 'cancelar', clase: 'btn--secundario' },
        { texto: 'Crear Unidad', valor: 'guardar', primario: true }
      ]
    });

    if (accion !== 'guardar') return;

    const titulo = formDiv.querySelector('#tituloUnidad').value.trim();
    if (!titulo) {
      ui.aviso('El título de la unidad es obligatorio', 'error');
      return;
    }

    try {
      const unidadesAsig = unidades.filter((u) => u.asignaturaId === asignaturaActualId);
      const maxOrden = unidadesAsig.reduce((max, u) => Math.max(max, Number(u.orden) || 0), 0);

      const nueva = await api.crear('unidades', {
        asignaturaId: asignaturaActualId,
        titulo,
        orden: maxOrden + 1,
        visible: true
      });

      unidades.push(nueva);
      unidadSeleccionadaId = nueva.id;
      ui.aviso('Unidad creada con éxito', 'exito');
      renderizarUnidades();
    } catch (err) {
      ui.aviso(err.message || 'Error al crear la unidad', 'error');
    }
  });

  // Modal para renombrar unidad
  async function modalRenombrarUnidad(unidad) {
    const formDiv = document.createElement('div');
    formDiv.className = 'pila';
    formDiv.style.gap = 'var(--espacio-m)';
    formDiv.innerHTML = `
      <div class="campo">
        <label for="nuevoTituloUnidad">Título de la unidad</label>
        <input type="text" id="nuevoTituloUnidad" value="${ui.escapar(unidad.titulo || '')}" required autofocus>
      </div>
    `;

    const accion = await ui.modal({
      titulo: 'Renombrar Unidad',
      contenido: formDiv,
      acciones: [
        { texto: 'Cancelar', valor: 'cancelar', clase: 'btn--secundario' },
        { texto: 'Guardar', valor: 'guardar', primario: true }
      ]
    });

    if (accion !== 'guardar') return;

    const nuevoTitulo = formDiv.querySelector('#nuevoTituloUnidad').value.trim();
    if (!nuevoTitulo) {
      ui.aviso('El título no puede estar vacío', 'error');
      return;
    }

    try {
      await api.actualizar('unidades', unidad.id, { titulo: nuevoTitulo });
      unidad.titulo = nuevoTitulo;
      ui.aviso('Unidad renombrada con éxito', 'exito');
      renderizarUnidades();
    } catch (err) {
      ui.aviso(err.message || 'Error al renombrar la unidad', 'error');
    }
  }

  // Modal para crear nuevo tema
  btnNuevoTema.addEventListener('click', async () => {
    if (!unidadSeleccionadaId) return;

    const formDiv = document.createElement('div');
    formDiv.className = 'pila';
    formDiv.style.gap = 'var(--espacio-m)';
    formDiv.innerHTML = `
      <div class="campo">
        <label for="tituloTema">Título del tema</label>
        <input type="text" id="tituloTema" placeholder="Ej. Estructura celular" required autofocus>
      </div>
    `;

    const accion = await ui.modal({
      titulo: 'Nuevo Tema',
      contenido: formDiv,
      acciones: [
        { texto: 'Cancelar', valor: 'cancelar', clase: 'btn--secundario' },
        { texto: 'Crear Tema', valor: 'guardar', primario: true }
      ]
    });

    if (accion !== 'guardar') return;

    const titulo = formDiv.querySelector('#tituloTema').value.trim();
    if (!titulo) {
      ui.aviso('El título del tema es obligatorio', 'error');
      return;
    }

    try {
      const temasUnidad = temas.filter((t) => t.unidadId === unidadSeleccionadaId);
      const maxOrden = temasUnidad.reduce((max, t) => Math.max(max, Number(t.orden) || 0), 0);

      const nuevo = await api.crear('temas', {
        unidadId: unidadSeleccionadaId,
        titulo,
        orden: maxOrden + 1,
        estado: 'borrador'
      });

      temas.push(nuevo);
      ui.aviso('Tema creado con éxito en estado borrador', 'exito');
      renderizarTemas();
    } catch (err) {
      ui.aviso(err.message || 'Error al crear el tema', 'error');
    }
  });

  // Evento cambio de asignatura
  selectAsignatura.addEventListener('change', () => {
    asignaturaActualId = selectAsignatura.value;
    actualizarBannerAsignatura();
    unidadSeleccionadaId = null;
    renderizarUnidades();
  });

  inicializar();
}
