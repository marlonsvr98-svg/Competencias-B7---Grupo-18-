/**
 * publico/js/modulos/asignaturas.js
 * Catálogo de mis asignaturas con porcentaje de avance de temas.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';

const esPaginaAsignaturas = typeof window !== 'undefined' && window.location.pathname.includes('asignaturas.html');

if (esPaginaAsignaturas) {
  await montarPlantilla({ titulo: 'Mis Asignaturas', roles: ['estudiante', 'docente', 'admin'] });
}

/**
 * Calcula el porcentaje de avance (% de temas publicados revisados) de una asignatura.
 * @param {string} asignaturaId
 * @param {Object} [datosPreCargados=null]
 * @returns {Promise<number>} Porcentaje entre 0 y 100
 */
export async function calcularAvance(asignaturaId, datosPreCargados = null) {
  try {
    let unidades, temas, progreso;
    if (datosPreCargados) {
      ({ unidades, temas, progreso } = datosPreCargados);
    } else {
      [unidades, temas, progreso] = await Promise.all([
        api.listar('unidades'),
        api.listar('temas'),
        api.listar('progreso-temas')
      ]);
    }

    const unidadesAsig = (unidades || []).filter(
      (u) => u && u.asignaturaId === asignaturaId && u.visible !== false
    );
    const unidadIds = new Set(unidadesAsig.map((u) => u.id));

    const temasPublicados = (temas || []).filter(
      (t) => t && unidadIds.has(t.unidadId) && t.estado === 'publicado'
    );

    const total = temasPublicados.length;
    if (total === 0) return 0;

    const temasRevisadosIds = new Set((progreso || []).map((p) => p.temaId));
    const revisados = temasPublicados.filter((t) => temasRevisadosIds.has(t.id)).length;

    return Math.round((revisados / total) * 100);
  } catch (err) {
    console.error('Error al calcular avance:', err);
    return 0;
  }
}

const contenedor = document.getElementById('contenido');

async function inicializar() {
  if (!contenedor) return;
  try {
    ui.cargando(true);

    const [asignaturas, unidades, temas, progreso] = await Promise.all([
      api.listar('asignaturas'),
      api.listar('unidades'),
      api.listar('temas'),
      api.listar('progreso-temas')
    ]);

    const datosPreCargados = { unidades, temas, progreso };

    if (!asignaturas || asignaturas.length === 0) {
      contenedor.innerHTML = `
        <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
          <h2>No tienes asignaturas registradas</h2>
          <p style="color: var(--color-texto-suave);">
            Aún no estás matriculado ni asignado a ninguna asignatura en este período académico.
          </p>
        </div>
      `;
      return;
    }

    // Calcular avance para cada asignatura
    const listaConAvance = await Promise.all(
      asignaturas.map(async (asig) => {
        const pct = await calcularAvance(asig.id, datosPreCargados);
        return { ...asig, avance: pct };
      })
    );

    contenedor.innerHTML = `
      <div class="pila" style="gap: var(--espacio-l);">
        <header class="fila" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--espacio-m);">
          <div>
            <h1 style="font-size: var(--texto-xl); margin: 0;">Mis Asignaturas</h1>
            <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;">
              Explora tus asignaturas, consulta las unidades temáticas y continúa con tu aprendizaje.
            </p>
          </div>
          <span class="insignia insignia--info" style="font-size: var(--texto-s);">
            ${listaConAvance.length} ${listaConAvance.length === 1 ? 'asignatura' : 'asignaturas'}
          </span>
        </header>

        <section class="asignaturas-grid">
          ${listaConAvance
            .map((asig) => {
              const idEscapado = ui.escapar(asig.id);
              const nombreEscapado = ui.escapar(asig.nombre || 'Asignatura');
              const descEscapada = ui.escapar(asig.descripcion || 'Sin descripción disponible.');
              const nivelEscapado = ui.escapar(asig.nivel || 'General');
              const pct = asig.avance || 0;

              return `
                <a href="/paginas/asignatura.html?id=${idEscapado}" class="tarjeta tarjeta-asignatura">
                  <div class="tarjeta-asignatura__cabecera">
                    <h2 class="tarjeta-asignatura__titulo">${nombreEscapado}</h2>
                    <span class="insignia" style="font-size: var(--texto-xs);">${nivelEscapado}</span>
                  </div>

                  <p class="tarjeta-asignatura__descripcion">${descEscapada}</p>

                  <div class="tarjeta-asignatura__progreso-bloque">
                    <div class="tarjeta-asignatura__progreso-etiqueta">
                      <span style="font-weight: var(--peso-seminegrita); color: var(--color-texto);">Avance de contenidos</span>
                      <strong style="color: var(--color-primario);">${pct}%</strong>
                    </div>
                    <div class="progreso">
                      <div class="progreso__barra" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                </a>
              `;
            })
            .join('')}
        </section>
      </div>
    `;
  } catch (err) {
    console.error('Error al inicializar mis asignaturas:', err);
    contenedor.innerHTML = `
      <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Error al cargar asignaturas</h2>
        <p style="color: var(--color-texto-suave);">${ui.escapar(err.message)}</p>
      </div>
    `;
  } finally {
    ui.cargando(false);
  }
}

if (esPaginaAsignaturas) {
  inicializar();
}
