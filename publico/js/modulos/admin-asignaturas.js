/**
 * publico/js/modulos/admin-asignaturas.js
 * Módulo para administración de asignaturas por el administrador.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';

await montarPlantilla({ titulo: 'Asignaturas', roles: ['admin'] });

const contenedor = document.getElementById('contenido');
if (contenedor) {
  contenedor.innerHTML = `
    <div class="pila" style="gap: var(--espacio-l);">
      <header class="fila" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--espacio-m);">
        <div>
          <h1 style="font-size: var(--texto-2xl); margin-bottom: var(--espacio-xs);">Asignaturas del Sistema</h1>
          <p style="color: var(--color-texto-suave); font-size: var(--texto-s);">
            Crea, edita y organiza las áreas temáticas de la plataforma.
          </p>
        </div>
        <button type="button" class="btn btn--primario" id="btnNuevaAsignatura">
          + Nueva Asignatura
        </button>
      </header>

      <div id="contenedorTarjetas">
        <div class="fila" style="justify-content: center; padding: var(--espacio-xl);">
          <span class="cargando" role="status" aria-label="Cargando asignaturas"></span>
        </div>
      </div>
    </div>
  `;

  const contenedorTarjetas = document.getElementById('contenedorTarjetas');
  const btnNueva = document.getElementById('btnNuevaAsignatura');

  let asignaturas = [];
  let distributivo = [];

  async function cargarDatos() {
    try {
      const [asigs, dist] = await Promise.all([
        api.listar('asignaturas'),
        api.listar('distributivo')
      ]);
      asignaturas = asigs || [];
      distributivo = dist || [];
      renderizarTarjetas();
    } catch (err) {
      console.error('Error al cargar asignaturas:', err);
      ui.aviso(`Error al cargar datos: ${err.message}`, 'error');
      contenedorTarjetas.innerHTML = `
        <div class="alerta alerta--error">
          No se pudieron cargar las asignaturas.
        </div>
      `;
    }
  }

  function renderizarTarjetas() {
    if (asignaturas.length === 0) {
      contenedorTarjetas.innerHTML = `
        <div class="tarjeta" style="text-align: center; padding: var(--espacio-xl);">
          <p style="color: var(--color-texto-suave);">No hay asignaturas registradas actualmente.</p>
        </div>
      `;
      return;
    }

    const cardsHtml = asignaturas
      .map((asig) => {
        const idEscapado = ui.escapar(asig.id);
        const nombreEscapado = ui.escapar(asig.nombre || '');
        const descEscapada = ui.escapar(asig.descripcion || 'Sin descripción detallada.');
        const nivelEscapado = ui.escapar(asig.nivel || 'General');

        const totalGrupos = distributivo.filter((g) => g && g.asignaturaId === asig.id).length;
        const textoGrupos = `${totalGrupos} ${totalGrupos === 1 ? 'grupo' : 'grupos'}`;

        return `
          <article class="tarjeta admin-asig-tarjeta" data-id="${idEscapado}">
            <div class="admin-asig-cuerpo">
              <div class="fila" style="justify-content: space-between; align-items: flex-start; gap: var(--espacio-s);">
                <h2 style="font-size: var(--texto-l); font-weight: var(--peso-negrita); margin: 0;">${nombreEscapado}</h2>
                <span class="insignia insignia--info" style="font-size: var(--texto-xs); white-space: nowrap;">${nivelEscapado}</span>
              </div>
              <p style="font-size: var(--texto-s); color: var(--color-texto); line-height: var(--interlineado-normal); margin: var(--espacio-xs) 0;">
                ${descEscapada}
              </p>
            </div>
            <div class="admin-asig-pie">
              <span style="font-size: var(--texto-xs); color: var(--color-texto-suave); font-weight: var(--peso-medio);">
                👥 ${textoGrupos}
              </span>
              <div class="fila" style="gap: var(--espacio-xs);">
                <button type="button" class="btn btn--pequeno btn--secundario btn-editar" data-id="${idEscapado}" aria-label="Editar ${nombreEscapado}">
                  Editar
                </button>
                <button type="button" class="btn btn--pequeno btn--peligro btn-eliminar" data-id="${idEscapado}" data-nombre="${nombreEscapado}" aria-label="Eliminar ${nombreEscapado}">
                  Eliminar
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    contenedorTarjetas.innerHTML = `<div class="admin-asig-grid">${cardsHtml}</div>`;

    // Eventos Editar
    contenedorTarjetas.querySelectorAll('.btn-editar').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const asig = asignaturas.find((a) => a.id === id);
        if (asig) abrirModalAsignatura(asig);
      });
    });

    // Eventos Eliminar
    contenedorTarjetas.querySelectorAll('.btn-eliminar').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const nombre = btn.getAttribute('data-nombre');

        const tieneGrupos = distributivo.some((g) => g && g.asignaturaId === id);
        if (tieneGrupos) {
          ui.aviso('No se puede eliminar: la asignatura tiene grupos asignados en distributivo', 'error');
          return;
        }

        const confirmado = await ui.confirmar(`¿Estás seguro de que deseas eliminar la asignatura "${nombre}"?`);
        if (!confirmado) return;

        try {
          await api.eliminar('asignaturas', id);
          ui.aviso('Asignatura eliminada con éxito', 'exito');
          await cargarDatos();
        } catch (err) {
          ui.aviso(err.message || 'Error al eliminar la asignatura', 'error');
        }
      });
    });
  }

  async function abrirModalAsignatura(asig = null) {
    const esEdicion = Boolean(asig && asig.id);
    const tituloModal = esEdicion ? 'Editar Asignatura' : 'Nueva Asignatura';

    const formDiv = document.createElement('div');
    formDiv.className = 'pila';
    formDiv.style.gap = 'var(--espacio-m)';
    formDiv.innerHTML = `
      <div class="campo">
        <label for="asigNombre">Nombre de la asignatura</label>
        <input type="text" id="asigNombre" value="${ui.escapar(asig?.nombre || '')}" placeholder="Ej. CIENCIAS NATURALES" required autofocus>
      </div>

      <div class="campo">
        <label for="asigNivel">Nivel educativo</label>
        <input type="text" id="asigNivel" value="${ui.escapar(asig?.nivel || 'EDUCACION GENERAL BASICA (EGB)')}" placeholder="Ej. EDUCACION GENERAL BASICA (EGB)" required>
      </div>

      <div class="campo">
        <label for="asigDescripcion">Descripción</label>
        <textarea id="asigDescripcion" rows="3" placeholder="Describe los propósitos y alcance de la asignatura...">${ui.escapar(asig?.descripcion || '')}</textarea>
      </div>
    `;

    const accion = await ui.modal({
      titulo: tituloModal,
      contenido: formDiv,
      acciones: [
        { texto: 'Cancelar', valor: 'cancelar', clase: 'btn--secundario' },
        { texto: esEdicion ? 'Guardar Cambios' : 'Crear Asignatura', valor: 'guardar', primario: true }
      ]
    });

    if (accion !== 'guardar') return;

    const inputNombre = formDiv.querySelector('#asigNombre').value.trim();
    const inputNivel = formDiv.querySelector('#asigNivel').value.trim();
    const inputDesc = formDiv.querySelector('#asigDescripcion').value.trim();

    if (!inputNombre || !inputNivel) {
      ui.aviso('El nombre y el nivel son obligatorios', 'error');
      return;
    }

    try {
      if (esEdicion) {
        await api.actualizar('asignaturas', asig.id, {
          nombre: inputNombre,
          nivel: inputNivel,
          descripcion: inputDesc
        });
        ui.aviso('Asignatura actualizada con éxito', 'exito');
      } else {
        await api.crear('asignaturas', {
          nombre: inputNombre,
          nivel: inputNivel,
          descripcion: inputDesc
        });
        ui.aviso('Asignatura creada con éxito', 'exito');
      }
      await cargarDatos();
    } catch (err) {
      ui.aviso(err.message || 'Error al guardar la asignatura', 'error');
    }
  }

  btnNueva.addEventListener('click', () => abrirModalAsignatura(null));

  cargarDatos();
}
