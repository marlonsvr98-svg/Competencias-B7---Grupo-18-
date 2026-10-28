/**
 * publico/js/modulos/tema.js
 * Vista formativa del tema para estudiantes y docentes con avance y actividades.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import * as util from '../nucleo/util.js';
import { ACTIVIDADES } from '../nucleo/catalogo-actividades.js';

await montarPlantilla({ titulo: 'Tema', roles: ['estudiante', 'docente'] });

const contenedor = document.getElementById('contenido');
const temaId = util.parametro('id');

function renderizarVideoIframe(url, titulo) {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `<iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}" title="${ui.escapar(titulo || 'Video educativo de YouTube')}" class="tema-video-frame" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" title="${ui.escapar(titulo || 'Video educativo de Vimeo')}" class="tema-video-frame" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }
  return null;
}

if (!temaId) {
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Tema no especificado</h2>
        <p style="color: var(--color-texto-suave);">No se ha indicado el identificador del tema a consultar.</p>
        <div>
          <a href="/paginas/asignaturas.html" class="btn btn--primario">Volver a Mis Asignaturas</a>
        </div>
      </div>
    `;
  }
} else {
  cargarTema();
}

async function cargarTema() {
  try {
    ui.cargando(true);

    const [tema, todasUnidades, todasAsignaturas, progreso] = await Promise.all([
      api.obtener('temas', temaId),
      api.listar('unidades'),
      api.listar('asignaturas'),
      api.listar('progreso-temas')
    ]);

    // Guardar en localStorage el último tema consultado
    try {
      localStorage.setItem(
        'ultimoTema',
        JSON.stringify({ id: tema.id, titulo: tema.titulo || 'Tema de estudio' })
      );
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }

    // Resolver unidad y asignatura para las migas de pan
    const unidad = (todasUnidades || []).find((u) => u.id === tema.unidadId);
    const asignatura = unidad ? (todasAsignaturas || []).find((a) => a.id === unidad.asignaturaId) : null;

    // Verificar si ya está marcado como revisado
    const yaRevisado = (progreso || []).some((p) => p && p.temaId === tema.id);

    // Preparar listas
    const objetivos = Array.isArray(tema.objetivos) ? tema.objetivos.filter(Boolean) : [];
    const ejemplos = Array.isArray(tema.ejemplos) ? tema.ejemplos.filter(Boolean) : [];
    const errores = Array.isArray(tema.erroresFrecuentes) ? tema.erroresFrecuentes.filter(Boolean) : [];
    const recursos = Array.isArray(tema.recursos) ? tema.recursos.filter((r) => r && (r.titulo || r.url)) : [];

    const tituloTema = ui.escapar(tema.titulo || 'Tema');
    const tituloUnidad = unidad ? ui.escapar(unidad.titulo) : 'Unidad';
    const nombreAsignatura = asignatura ? ui.escapar(asignatura.nombre) : 'Asignatura';
    const asignaturaHref = asignatura ? `/paginas/asignatura.html?id=${ui.escapar(asignatura.id)}` : '/paginas/asignaturas.html';

    contenedor.innerHTML = `
      <div class="pila" style="gap: var(--espacio-l);">
        <!-- Migas de pan -->
        <nav aria-label="Migas de pan" class="migas-pan">
          <a href="/index.html">Inicio</a>
          <span>/</span>
          <a href="/paginas/asignaturas.html">Mis asignaturas</a>
          <span>/</span>
          <a href="${asignaturaHref}">${nombreAsignatura}</a>
          <span>/</span>
          <span>${tituloUnidad}</span>
          <span>/</span>
          <span aria-current="page" style="color: var(--color-texto); font-weight: var(--peso-seminegrita);">
            ${tituloTema}
          </span>
        </nav>

        <!-- Cabecera del Tema y Botón de Revisión -->
        <header class="tema-cabecera">
          <div class="pila" style="gap: var(--espacio-xs);">
            <div class="fila" style="align-items: center; gap: var(--espacio-s);">
              <span class="insignia insignia--info" style="font-size: var(--texto-xs);">
                Dificultad: ${ui.escapar(tema.dificultad || 'Media')}
              </span>
              ${
                yaRevisado
                  ? `<span class="insignia insignia--exito" id="badgeEstadoRevisado" style="font-size: var(--texto-xs);">Revisado ✓</span>`
                  : `<span class="insignia insignia--advertencia" id="badgeEstadoRevisado" style="font-size: var(--texto-xs);">Pendiente</span>`
              }
            </div>
            <h1 style="font-size: var(--texto-xl); margin: 0; color: var(--color-primario);">
              ${tituloTema}
            </h1>
          </div>

          <div>
            ${
              yaRevisado
                ? `<button type="button" class="btn btn--exito" id="btnRevisar" disabled>Revisado ✓</button>`
                : `<button type="button" class="btn btn--primario" id="btnRevisar">Marcar como revisado</button>`
            }
          </div>
        </header>

        <!-- Objetivos de Aprendizaje -->
        ${
          objetivos.length > 0
            ? `
            <section class="tarjeta pila" style="gap: var(--espacio-s);">
              <h2 style="font-size: var(--texto-l); margin: 0;">🎯 Objetivos de Aprendizaje</h2>
              <ul style="padding-left: var(--espacio-l); margin: 0; display: flex; flex-direction: column; gap: var(--espacio-xs);">
                ${objetivos.map((obj) => `<li>${ui.escapar(obj)}</li>`).join('')}
              </ul>
            </section>
          `
            : ''
        }

        <!-- Resumen Formateado del Tema -->
        <section class="tarjeta pila" style="gap: var(--espacio-m);">
          <h2 style="font-size: var(--texto-l); margin: 0;">📖 Resumen Conceptual</h2>
          <div class="tema-resumen">
            ${util.formatoBasico(tema.resumen) || '<p style="color: var(--color-texto-suave);">Sin resumen disponible.</p>'}
          </div>
        </section>

        <!-- Ejemplos -->
        ${
          ejemplos.length > 0
            ? `
            <section class="tarjeta pila" style="gap: var(--espacio-s);">
              <h2 style="font-size: var(--texto-l); margin: 0;">💡 Ejemplos Ilustrativos</h2>
              <ul style="padding-left: var(--espacio-l); margin: 0; display: flex; flex-direction: column; gap: var(--espacio-xs);">
                ${ejemplos.map((ej) => `<li>${ui.escapar(ej)}</li>`).join('')}
              </ul>
            </section>
          `
            : ''
        }

        <!-- Errores Frecuentes (si existen) -->
        ${
          errores.length > 0
            ? `
            <section class="tarjeta pila" style="gap: var(--espacio-s); border-left: 4px solid var(--color-advertencia);">
              <h2 style="font-size: var(--texto-l); margin: 0; color: var(--color-advertencia);">
                ⚠️ Errores Frecuentes a Evitar
              </h2>
              <ul style="padding-left: var(--espacio-l); margin: 0; display: flex; flex-direction: column; gap: var(--espacio-xs);">
                ${errores.map((errItem) => `<li>${ui.escapar(errItem)}</li>`).join('')}
              </ul>
            </section>
          `
            : ''
        }

        <!-- Recursos Didácticos -->
        ${
          recursos.length > 0
            ? `
            <section class="tarjeta pila" style="gap: var(--espacio-m);">
              <h2 style="font-size: var(--texto-l); margin: 0;">📂 Recursos de Apoyo</h2>
              <div class="recursos-didacticos-lista">
                ${recursos
                  .map((rec) => {
                    const tipo = (rec.tipo || '').toLowerCase();
                    const tituloRec = ui.escapar(rec.titulo || 'Recurso');
                    const urlRec = ui.escapar(rec.url || '');

                    // Video (YouTube o Vimeo)
                    const iframeVideo = renderizarVideoIframe(rec.url, rec.titulo);
                    if (iframeVideo) {
                      return `
                        <div class="recurso-card-display">
                          <strong style="font-size: var(--texto-s);">🎬 ${tituloRec}</strong>
                          ${iframeVideo}
                        </div>
                      `;
                    }

                    // Documento PDF
                    if (tipo === 'pdf' || tipo === 'lectura' || (rec.url && rec.url.endsWith('.pdf'))) {
                      return `
                        <div class="recurso-card-display">
                          <div class="fila" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--espacio-s);">
                            <strong>📄 ${tituloRec}</strong>
                            <a href="${urlRec}" target="_blank" rel="noopener noreferrer" class="btn btn--pequeno btn--secundario">
                              Abrir PDF ↗
                            </a>
                          </div>
                        </div>
                      `;
                    }

                    // Imagen
                    if (tipo === 'imagen' || (rec.url && /\.(jpe?g|png|webp|gif|svg)$/i.test(rec.url))) {
                      return `
                        <div class="recurso-card-display">
                          <strong style="font-size: var(--texto-s);">🖼️ ${tituloRec}</strong>
                          <img src="${urlRec}" alt="${tituloRec}" class="tema-imagen-recurso">
                        </div>
                      `;
                    }

                    // Enlace genérico o video sin iframe
                    return `
                      <div class="recurso-card-display">
                        <div class="fila" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--espacio-s);">
                          <strong>🔗 ${tituloRec}</strong>
                          <a href="${urlRec}" target="_blank" rel="noopener noreferrer" class="btn btn--pequeno btn--secundario">
                            Visitar enlace ↗
                          </a>
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            </section>
          `
            : ''
        }

        <!-- Bloque: Practica este tema -->
        <section class="tarjeta pila" style="gap: var(--espacio-m);">
          <h2 style="font-size: var(--texto-l); margin: 0;">🎮 Practica este tema</h2>
          ${
            !ACTIVIDADES || ACTIVIDADES.length === 0
              ? `
              <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;">
                Aún no hay actividades prácticas disponibles para este tema.
              </p>
            `
              : `
              <div class="actividades-grid">
                ${ACTIVIDADES.map((act) => {
                  const hrefConTema = `${act.href}?temaId=${encodeURIComponent(tema.id)}`;
                  return `
                    <a href="${hrefConTema}" class="actividad-card">
                      <strong style="color: var(--color-primario); font-size: var(--texto-s);">
                        ${ui.escapar(act.texto)}
                      </strong>
                      <p style="color: var(--color-texto-suave); font-size: var(--texto-xs); margin: 0;">
                        ${ui.escapar(act.descripcion || '')}
                      </p>
                    </a>
                  `;
                }).join('')}
              </div>
            `
          }
        </section>
      </div>
    `;

    // Evento para el botón Marcar como revisado
    const btnRevisar = document.getElementById('btnRevisar');
    const badgeEstado = document.getElementById('badgeEstadoRevisado');

    if (btnRevisar && !yaRevisado) {
      btnRevisar.addEventListener('click', async () => {
        try {
          ui.cargando(true);
          await api.crear('progreso-temas', { temaId: tema.id });
          btnRevisar.disabled = true;
          btnRevisar.textContent = 'Revisado ✓';
          btnRevisar.className = 'btn btn--exito';

          if (badgeEstado) {
            badgeEstado.textContent = 'Revisado ✓';
            badgeEstado.className = 'insignia insignia--exito';
          }

          ui.aviso('¡Tema marcado como revisado! Tu avance ha sido registrado.', 'exito');
        } catch (err) {
          console.error('Error al registrar progreso:', err);
          ui.aviso(err.message || 'Error al registrar progreso', 'error');
        } finally {
          ui.cargando(false);
        }
      });
    }
  } catch (err) {
    console.error('Error al cargar datos del tema:', err);
    contenedor.innerHTML = `
      <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Error al cargar tema</h2>
        <p style="color: var(--color-texto-suave);">${ui.escapar(err.message)}</p>
        <div>
          <a href="/paginas/asignaturas.html" class="btn btn--primario">Volver a Mis Asignaturas</a>
        </div>
      </div>
    `;
  } finally {
    ui.cargando(false);
  }
}
