/**
 * publico/js/modulos/distributivo.js
 * Módulo para la administración de distributivo y grupos académicos.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import * as util from '../nucleo/util.js';

await montarPlantilla({ titulo: 'Distributivo', roles: ['admin'] });

const contenedor = document.getElementById('contenido');
if (contenedor) {
  contenedor.innerHTML = `
    <div class="pila" style="gap: var(--espacio-l);">
      <header class="fila" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--espacio-m);">
        <div>
          <h1 style="font-size: var(--texto-2xl); margin-bottom: var(--espacio-xs);">Distributivo Académico</h1>
          <p style="color: var(--color-texto-suave); font-size: var(--texto-s);">
            Asignación de asignaturas, paralelos, docentes y estudiantes por período.
          </p>
        </div>
        <button type="button" class="btn btn--primario" id="btnNuevoGrupo">
          + Nuevo Grupo
        </button>
      </header>

      <!-- Tabla de grupos -->
      <section class="tarjeta" style="padding: 0; overflow: hidden;">
        <div class="tabla-contenedor" style="margin-bottom: 0; border: none;">
          <table class="tabla" id="tablaDistributivo">
            <thead>
              <tr>
                <th>Asignatura</th>
                <th>Paralelo</th>
                <th>Período</th>
                <th>Docente</th>
                <th style="text-align: center;">Estudiantes</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody id="cuerpoTablaDist">
              <tr>
                <td colspan="6" style="text-align: center; padding: var(--espacio-xl);">
                  <span class="cargando" role="status" aria-label="Cargando distributivo"></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  const cuerpoTabla = document.getElementById('cuerpoTablaDist');
  const btnNuevo = document.getElementById('btnNuevoGrupo');

  let distributivo = [];
  let asignaturas = [];
  let usuarios = [];

  async function cargarDatos() {
    try {
      const [dist, asigs, usus] = await Promise.all([
        api.listar('distributivo'),
        api.listar('asignaturas'),
        api.listar('usuarios')
      ]);
      distributivo = dist || [];
      asignaturas = asigs || [];
      usuarios = usus || [];
      renderizarTabla();
    } catch (err) {
      console.error('Error al cargar datos de distributivo:', err);
      ui.aviso(`Error al cargar datos: ${err.message}`, 'error');
      cuerpoTabla.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: var(--espacio-l); color: var(--color-error);">
            No se pudo cargar el distributivo.
          </td>
        </tr>
      `;
    }
  }

  function renderizarTabla() {
    if (distributivo.length === 0) {
      cuerpoTabla.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: var(--espacio-xl); color: var(--color-texto-suave);">
            No hay grupos registrados en el distributivo.
          </td>
        </tr>
      `;
      return;
    }

    const mapaAsignaturas = new Map(asignaturas.map((a) => [a.id, a.nombre]));
    const mapaDocentes = new Map(
      usuarios
        .filter((u) => u.rol === 'docente')
        .map((u) => [u.id, `${u.nombre} ${u.apellido}`])
    );

    cuerpoTabla.innerHTML = distributivo
      .map((g) => {
        const idEscapado = ui.escapar(g.id);
        const asigNombre = ui.escapar(mapaAsignaturas.get(g.asignaturaId) || g.asignaturaId || 'Desconocida');
        const paralelo = ui.escapar(g.paralelo || 'A');
        const periodo = ui.escapar(g.periodo || '2026-2027');
        const docenteNombre = ui.escapar(mapaDocentes.get(g.docenteId) || g.docenteId || 'Sin asignar');
        const numEstudiantes = Array.isArray(g.estudiantes) ? g.estudiantes.length : 0;

        return `
          <tr data-id="${idEscapado}">
            <td>
              <div class="pila" style="gap: 2px;">
                <strong>${asigNombre}</strong>
                <small style="color: var(--color-texto-suave);">ID: <code>${idEscapado}</code></small>
              </div>
            </td>
            <td><span class="insignia insignia--info">${paralelo}</span></td>
            <td>${periodo}</td>
            <td>👤 ${docenteNombre}</td>
            <td style="text-align: center;">
              <span class="insignia insignia--exito" title="${numEstudiantes} estudiantes matriculados">
                ${numEstudiantes} ${numEstudiantes === 1 ? 'estudiante' : 'estudiantes'}
              </span>
            </td>
            <td style="text-align: right;">
              <div class="fila" style="justify-content: flex-end; gap: var(--espacio-xs);">
                <button type="button" class="btn btn--pequeno btn--secundario btn-editar" data-id="${idEscapado}" aria-label="Editar grupo">
                  Editar
                </button>
                <button type="button" class="btn btn--pequeno btn--peligro btn-eliminar" data-id="${idEscapado}" aria-label="Eliminar grupo">
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    // Eventos Editar
    cuerpoTabla.querySelectorAll('.btn-editar').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const grupo = distributivo.find((g) => g.id === id);
        if (grupo) abrirModalGrupo(grupo);
      });
    });

    // Eventos Eliminar
    cuerpoTabla.querySelectorAll('.btn-eliminar').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const confirmado = await ui.confirmar('¿Estás seguro de que deseas eliminar este grupo del distributivo?');
        if (!confirmado) return;

        try {
          await api.eliminar('distributivo', id);
          ui.aviso('Grupo eliminado con éxito', 'exito');
          await cargarDatos();
        } catch (err) {
          ui.aviso(err.message || 'Error al eliminar el grupo', 'error');
        }
      });
    });
  }

  async function abrirModalGrupo(grupo = null) {
    const esEdicion = Boolean(grupo && grupo.id);
    const tituloModal = esEdicion ? 'Editar Grupo' : 'Nuevo Grupo';

    const docentes = usuarios.filter((u) => u.rol === 'docente');
    const todosEstudiantes = usuarios.filter((u) => u.rol === 'estudiante');
    const seleccionadosSet = new Set(Array.isArray(grupo?.estudiantes) ? grupo.estudiantes : []);

    const opcionesAsig = asignaturas
      .map(
        (a) =>
          `<option value="${ui.escapar(a.id)}" ${grupo?.asignaturaId === a.id ? 'selected' : ''}>${ui.escapar(a.nombre)}</option>`
      )
      .join('');

    const opcionesDocentes = docentes
      .map(
        (d) =>
          `<option value="${ui.escapar(d.id)}" ${grupo?.docenteId === d.id ? 'selected' : ''}>${ui.escapar(d.nombre)} ${ui.escapar(d.apellido)} (${ui.escapar(d.correo)})</option>`
      )
      .join('');

    const formDiv = document.createElement('div');
    formDiv.className = 'pila';
    formDiv.style.gap = 'var(--espacio-m)';
    formDiv.innerHTML = `
      <div class="campo">
        <label for="grupoAsignatura">Asignatura</label>
        <select id="grupoAsignatura" required autofocus>
          <option value="">-- Selecciona una asignatura --</option>
          ${opcionesAsig}
        </select>
      </div>

      <div class="fila" style="gap: var(--espacio-m);">
        <div class="campo" style="flex: 1;">
          <label for="grupoParalelo">Paralelo</label>
          <input type="text" id="grupoParalelo" value="${ui.escapar(grupo?.paralelo || 'A')}" placeholder="Ej. A" required>
        </div>
        <div class="campo" style="flex: 1;">
          <label for="grupoPeriodo">Período lectivo</label>
          <input type="text" id="grupoPeriodo" value="${ui.escapar(grupo?.periodo || '2026-2027')}" placeholder="Ej. 2026-2027" required>
        </div>
      </div>

      <div class="campo">
        <label for="grupoDocente">Docente a cargo</label>
        <select id="grupoDocente" required>
          <option value="">-- Selecciona un docente --</option>
          ${opcionesDocentes}
        </select>
      </div>

      <div class="campo" style="margin-bottom: 0;">
        <div class="fila" style="justify-content: space-between; align-items: center; margin-bottom: var(--espacio-xs);">
          <label style="margin-bottom: 0;">Estudiantes asignados</label>
          <span class="insignia insignia--info" id="contadorSeleccionados" style="font-size: var(--texto-xs);">
            ${seleccionadosSet.size} de ${todosEstudiantes.length} seleccionados
          </span>
        </div>

        <input type="search" id="buscarEstudiantes" placeholder="Filtrar estudiantes..." style="font-size: var(--texto-xs); padding: var(--espacio-xs) var(--espacio-s); margin-bottom: var(--espacio-xs);">

        <div class="dist-estudiantes-lista" id="contenedorEstudiantes"></div>
      </div>
    `;

    const contenedorEst = formDiv.querySelector('#contenedorEstudiantes');
    const inputBuscarEst = formDiv.querySelector('#buscarEstudiantes');
    const contadorSel = formDiv.querySelector('#contadorSeleccionados');

    function actualizarContador() {
      contadorSel.textContent = `${seleccionadosSet.size} de ${todosEstudiantes.length} seleccionados`;
    }

    function renderizarEstudiantesModal() {
      const filtro = util.normalizar(inputBuscarEst.value.trim());

      const filtrados = todosEstudiantes.filter((e) => {
        if (!filtro) return true;
        const nombre = util.normalizar(`${e.nombre || ''} ${e.apellido || ''}`);
        const correo = util.normalizar(e.correo || '');
        return nombre.includes(filtro) || correo.includes(filtro);
      });

      if (filtrados.length === 0) {
        contenedorEst.innerHTML = `<span style="font-size: var(--texto-xs); color: var(--color-texto-suave); padding: var(--espacio-xs);">No se encontraron estudiantes.</span>`;
        return;
      }

      contenedorEst.innerHTML = filtrados
        .map((est) => {
          const checked = seleccionadosSet.has(est.id) ? 'checked' : '';
          const nombreEscapado = ui.escapar(`${est.nombre} ${est.apellido}`);
          const correoEscapado = ui.escapar(est.correo);

          return `
            <label class="dist-estudiante-item">
              <input type="checkbox" value="${ui.escapar(est.id)}" ${checked} class="check-est">
              <span style="font-size: var(--texto-xs);">
                <strong>${nombreEscapado}</strong> (${correoEscapado})
              </span>
            </label>
          `;
        })
        .join('');

      contenedorEst.querySelectorAll('.check-est').forEach((chk) => {
        chk.addEventListener('change', () => {
          if (chk.checked) {
            seleccionadosSet.add(chk.value);
          } else {
            seleccionadosSet.delete(chk.value);
          }
          actualizarContador();
        });
      });
    }

    inputBuscarEst.addEventListener('input', renderizarEstudiantesModal);
    renderizarEstudiantesModal();

    const accion = await ui.modal({
      titulo: tituloModal,
      contenido: formDiv,
      acciones: [
        { texto: 'Cancelar', valor: 'cancelar', clase: 'btn--secundario' },
        { texto: esEdicion ? 'Guardar Cambios' : 'Crear Grupo', valor: 'guardar', primario: true }
      ]
    });

    if (accion !== 'guardar') return;

    const selectAsig = formDiv.querySelector('#grupoAsignatura').value;
    const inputParalelo = formDiv.querySelector('#grupoParalelo').value.trim();
    const inputPeriodo = formDiv.querySelector('#grupoPeriodo').value.trim();
    const selectDocente = formDiv.querySelector('#grupoDocente').value;

    if (!selectAsig || !inputParalelo || !inputPeriodo || !selectDocente) {
      ui.aviso('Asignatura, paralelo, período y docente son obligatorios', 'error');
      return;
    }

    const payload = {
      asignaturaId: selectAsig,
      paralelo: inputParalelo,
      periodo: inputPeriodo,
      docenteId: selectDocente,
      estudiantes: Array.from(seleccionadosSet)
    };

    try {
      if (esEdicion) {
        await api.actualizar('distributivo', grupo.id, payload);
        ui.aviso('Grupo de distributivo actualizado con éxito', 'exito');
      } else {
        await api.crear('distributivo', payload);
        ui.aviso('Grupo de distributivo creado con éxito', 'exito');
      }
      await cargarDatos();
    } catch (err) {
      ui.aviso(err.message || 'Error al guardar el grupo', 'error');
    }
  }

  btnNuevo.addEventListener('click', () => abrirModalGrupo(null));

  cargarDatos();
}
