/**
 * publico/js/modulos/quiz.js
 * Módulo de evaluación formativa mediante Quiz por Niveles de Bloom para estudiantes.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import { obtenerTemaActividad } from '../nucleo/selector-tema.js';
import { mostrarRetro, mostrarResumen } from '../nucleo/retroalimentacion.js';
import { mostrarLogros } from '../nucleo/gamificacion.js';
import { generarDiploma } from '../nucleo/pdf.js';

await montarPlantilla({ titulo: 'Quiz por niveles', roles: ['estudiante'] });

const ICONOS_BLOOM = {
  1: '🧠',
  2: '💡',
  3: '⚙️',
  4: '🔍',
  5: '🏆'
};

const contenedor = document.getElementById('contenido');

async function inicializar() {
  if (!contenedor) return;

  try {
    ui.cargando(true);
    const tema = await obtenerTemaActividad();
    ui.cargando(false);

    if (!tema) {
      contenedor.innerHTML = `
        <div class="vacio" style="margin-top: var(--espacio-xl);">
          <span class="vacio__icono">📚</span>
          <h2 class="vacio__titulo">No se seleccionó ningún tema</h2>
          <p class="vacio__descripcion">
            Por favor selecciona un tema formativo de tus asignaturas para iniciar el quiz por niveles.
          </p>
          <button type="button" class="btn btn--primario" onclick="window.location.reload()">
            Seleccionar tema
          </button>
        </div>
      `;
      return;
    }

    await renderizarVistaNiveles(tema);
  } catch (err) {
    ui.cargando(false);
    console.error('Error al inicializar quiz:', err);
    ui.aviso(`Error al cargar el quiz: ${err.message}`, 'error');
  }
}

/**
 * Vista 1: Selector de niveles de Bloom para el tema actual.
 */
async function renderizarVistaNiveles(tema) {
  ui.cargando(true);
  let nivelesData = [];

  try {
    const res = await api.llamar('GET', `/api/quiz/estado?temaId=${encodeURIComponent(tema.id)}`);
    nivelesData = res?.niveles || [];
  } catch (err) {
    console.error('Error al consultar estado del quiz:', err);
    ui.aviso(`Error al obtener niveles: ${err.message}`, 'error');
  } finally {
    ui.cargando(false);
  }

  contenedor.innerHTML = `
    <div class="pila" style="gap: var(--espacio-l);">
      <!-- Banner del tema activo -->
      <section class="quiz-banner-tema">
        <div class="pila" style="gap: var(--espacio-xs);">
          <span class="insignia insignia--primario" style="align-self: flex-start;">
            ${ui.escapar(tema.asignaturaNombre || 'Asignatura')}
          </span>
          <h1 style="font-size: var(--texto-2xl); margin: 0; color: var(--color-primario);">
            ${ui.escapar(tema.titulo)}
          </h1>
          <p style="margin: 0; color: var(--color-texto-suave); font-size: var(--texto-s);">
            Supera cada uno de los 5 niveles de Bloom (mínimo 70%) para avanzar y obtener tus diplomas de acreditación.
          </p>
        </div>

        <div class="fila" style="gap: var(--espacio-s);">
          <a href="/paginas/tema.html?id=${encodeURIComponent(tema.id)}" class="btn btn--secundario btn--pequeno">
            📖 Repasar tema
          </a>
          <button type="button" class="btn btn--texto btn--pequeno" id="btnCambiarTema">
            🔄 Cambiar tema
          </button>
        </div>
      </section>

      <!-- Rejilla con las 5 tarjetas de niveles -->
      <section>
        <h2 style="font-size: var(--texto-l); margin-bottom: var(--espacio-m); color: var(--color-primario);">
          Niveles de Evaluación Cognitiva
        </h2>

        <div class="quiz-niveles-grid">
          ${nivelesData
            .map((n) => {
              const icono = ICONOS_BLOOM[n.nivel] || '🎯';
              const esAprobado = n.estado === 'aprobado';
              const esDisponible = n.estado === 'disponible';
              const esBloqueado = n.estado === 'bloqueado';

              let claseTarjeta = 'quiz-nivel-card';
              let badgeHtml = '';

              if (esAprobado) {
                claseTarjeta += ' quiz-nivel-card--aprobado';
                badgeHtml = '<span class="insignia insignia--exito">Aprobado ✓</span>';
              } else if (esDisponible) {
                claseTarjeta += ' quiz-nivel-card--disponible';
                badgeHtml = '<span class="insignia insignia--primario">Disponible</span>';
              } else {
                claseTarjeta += ' quiz-nivel-card--bloqueado';
                badgeHtml = '<span class="insignia">Bloqueado 🔒</span>';
              }

              return `
                <article class="${claseTarjeta}">
                  <div class="quiz-nivel-cabecera">
                    <span class="quiz-nivel-icono">${icono}</span>
                    ${badgeHtml}
                  </div>

                  <div>
                    <h3 class="quiz-nivel-titulo">Nivel ${n.nivel}: ${ui.escapar(n.nombre)}</h3>
                    <p class="quiz-nivel-subtitulo">
                      ${
                        esBloqueado
                          ? 'Supera el nivel anterior para desbloquear este reto.'
                          : `Mejor calificación obtenida: <strong>${n.mejorPorcentaje || 0}%</strong>`
                      }
                    </p>
                  </div>

                  <div class="quiz-nivel-acciones">
                    ${
                      esDisponible
                        ? `
                      <button type="button" class="btn btn--primario btn-iniciar-quiz" data-nivel="${n.nivel}">
                        Comenzar Nivel ${n.nivel} →
                      </button>
                    `
                        : ''
                    }

                    ${
                      esAprobado
                        ? `
                      <button type="button" class="btn btn--primario btn-diploma" data-nivel="${n.nivel}">
                        🎓 Descargar diploma
                      </button>
                      <button type="button" class="btn btn--secundario btn--pequeno btn-iniciar-quiz" data-nivel="${n.nivel}">
                        Practicar de nuevo
                      </button>
                    `
                        : ''
                    }

                    ${
                      esBloqueado
                        ? `
                      <button type="button" class="btn btn--secundario" disabled>
                        Bloqueado
                      </button>
                    `
                        : ''
                    }
                  </div>
                </article>
              `;
            })
            .join('')}
        </div>
      </section>
    </div>
  `;

  document.getElementById('btnCambiarTema')?.addEventListener('click', async () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('temaId');
    window.history.replaceState({}, '', url.toString());
    await inicializar();
  });

  contenedor.querySelectorAll('.btn-iniciar-quiz').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const nivel = Number(e.currentTarget.dataset.nivel);
      await iniciarQuiz(tema, nivel);
    });
  });

  contenedor.querySelectorAll('.btn-diploma').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const nivel = Number(e.currentTarget.dataset.nivel);
      await generarDiploma({ tipo: 'nivel-quiz', temaId: tema.id, nivel });
    });
  });
}

/**
 * Vista 2: Sesión de quiz activa pregunta a pregunta.
 */
async function iniciarQuiz(tema, nivel) {
  ui.cargando(true);
  let sesionData = null;

  try {
    sesionData = await api.llamar('POST', '/api/quiz/iniciar', {
      temaId: tema.id,
      nivel
    });
  } catch (err) {
    ui.cargando(false);
    console.error('Error al iniciar quiz:', err);
    ui.aviso(`No se pudo iniciar el quiz: ${err.message}`, 'error');
    return;
  } finally {
    ui.cargando(false);
  }

  const { sesionId, preguntas } = sesionData;
  if (!Array.isArray(preguntas) || preguntas.length === 0) {
    ui.aviso('No se pudieron obtener preguntas para esta sesión', 'advertencia');
    return;
  }

  let indiceActual = 0;
  let respuestaSeleccionada = null;
  let respondidaActual = false;

  function renderizarPreguntaActual() {
    const p = preguntas[indiceActual];
    const total = preguntas.length;
    const progresoPct = Math.round(((indiceActual + 1) / total) * 100);
    respondidaActual = false;
    respuestaSeleccionada = null;

    let opcionesHtml = '';
    if (p.tipo === 'opcion') {
      opcionesHtml = `
        <div class="quiz-opciones-lista" id="contenedorOpciones">
          ${(p.opciones || [])
            .map((op, idx) => `
              <label class="quiz-opcion-label" for="opcion_${idx}">
                <input type="radio" name="quizOpcion" id="opcion_${idx}" value="${idx}">
                <strong style="width: 22px;">${String.fromCharCode(65 + idx)}.</strong>
                <span style="flex: 1;">${ui.escapar(op)}</span>
              </label>
            `)
            .join('')}
        </div>
      `;
    } else if (p.tipo === 'vf') {
      opcionesHtml = `
        <div class="quiz-vf-grid" id="contenedorOpciones">
          <button type="button" class="quiz-vf-btn" data-valor="true">
            <span style="font-size: var(--texto-xl);">👍</span>
            <span>Verdadero</span>
          </button>
          <button type="button" class="quiz-vf-btn" data-valor="false">
            <span style="font-size: var(--texto-xl);">👎</span>
            <span>Falso</span>
          </button>
        </div>
      `;
    } else if (p.tipo === 'completar') {
      opcionesHtml = `
        <div class="campo" style="margin-bottom: 0;">
          <label for="inputCompletar">Escribe la palabra o frase que completa la oración:</label>
          <input type="text" id="inputCompletar" placeholder="Escribe tu respuesta aquí..." autocomplete="off">
        </div>
      `;
    }

    contenedor.innerHTML = `
      <div class="quiz-sesion-contenedor">
        <!-- Cabecera de progreso -->
        <div class="pila" style="gap: var(--espacio-xs);">
          <div class="fila" style="justify-content: space-between; align-items: center; font-size: var(--texto-s);">
            <span style="color: var(--color-texto-suave);">
              <strong>Nivel ${nivel}</strong> · ${ui.escapar(tema.titulo)}
            </span>
            <span style="font-weight: var(--peso-seminegrita); color: var(--color-primario);">
              Pregunta ${indiceActual + 1} de ${total}
            </span>
          </div>

          <div class="progreso">
            <div class="progreso__barra" style="width: ${progresoPct}%;"></div>
          </div>
        </div>

        <!-- Tarjeta de la pregunta -->
        <article class="quiz-pregunta-card">
          <h2 class="quiz-pregunta-enunciado">${ui.escapar(p.enunciado)}</h2>

          ${opcionesHtml}

          <!-- Contenedor de retroalimentación inmediata -->
          <div id="contenedorRetro"></div>

          <!-- Acciones de pie -->
          <div class="quiz-pregunta-acciones">
            <button type="button" class="btn btn--texto btn--pequeno" id="btnAbandonar">
              ✕ Salir del quiz
            </button>

            <button type="button" class="btn btn--primario" id="btnAccionPrincipal" disabled>
              Responder
            </button>
          </div>
        </article>
      </div>
    `;

    const btnAccionPrincipal = document.getElementById('btnAccionPrincipal');
    const contenedorRetro = document.getElementById('contenedorRetro');
    const btnAbandonar = document.getElementById('btnAbandonar');

    btnAbandonar.addEventListener('click', async () => {
      const confirma = await ui.confirmar('¿Deseas salir del quiz actual? Tu progreso en esta sesión no se guardará.');
      if (confirma) {
        await renderizarVistaNiveles(tema);
      }
    });

    // Control de selección según tipo
    if (p.tipo === 'opcion') {
      const radios = document.querySelectorAll('input[name="quizOpcion"]');
      radios.forEach((r) => {
        r.addEventListener('change', (e) => {
          respuestaSeleccionada = Number(e.target.value);
          document.querySelectorAll('.quiz-opcion-label').forEach((lbl) => {
            lbl.classList.remove('quiz-opcion-label--seleccionada');
          });
          e.target.closest('.quiz-opcion-label')?.classList.add('quiz-opcion-label--seleccionada');
          btnAccionPrincipal.disabled = false;
        });
      });
    } else if (p.tipo === 'vf') {
      const btns = document.querySelectorAll('.quiz-vf-btn');
      btns.forEach((b) => {
        b.addEventListener('click', (e) => {
          btns.forEach((btn) => btn.classList.remove('quiz-vf-btn--seleccionado'));
          const btnActual = e.currentTarget;
          btnActual.classList.add('quiz-vf-btn--seleccionado');
          respuestaSeleccionada = btnActual.dataset.valor === 'true';
          btnAccionPrincipal.disabled = false;
        });
      });
    } else if (p.tipo === 'completar') {
      const input = document.getElementById('inputCompletar');
      input?.focus();
      input?.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        respuestaSeleccionada = val;
        btnAccionPrincipal.disabled = val.length === 0;
      });
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !btnAccionPrincipal.disabled && !respondidaActual) {
          e.preventDefault();
          btnAccionPrincipal.click();
        }
      });
    }

    btnAccionPrincipal.addEventListener('click', async () => {
      if (!respondidaActual) {
        // Enviar respuesta
        btnAccionPrincipal.disabled = true;
        btnAccionPrincipal.textContent = 'Verificando...';

        try {
          const resultado = await api.llamar('POST', '/api/quiz/responder', {
            sesionId,
            preguntaId: p.id,
            respuesta: respuestaSeleccionada
          });

          respondidaActual = true;

          // Mostrar retroalimentación con mostrarRetro
          mostrarRetro({
            correcto: resultado.correcto,
            explicacion: resultado.retroalimentacion || 'Respuesta evaluada por el sistema.',
            sugerencia: !resultado.correcto ? `Respuesta correcta: ${resultado.correcta}` : '',
            enlaceTema: `/paginas/tema.html?id=${encodeURIComponent(tema.id)}`,
            contenedor: contenedorRetro
          });

          // Resaltar visualmente acierto / error
          if (p.tipo === 'opcion') {
            document.querySelectorAll('.quiz-opcion-label').forEach((lbl, idx) => {
              const radio = lbl.querySelector('input');
              radio.disabled = true;
              if (idx === Number(respuestaSeleccionada)) {
                lbl.classList.add(resultado.correcto ? 'quiz-opcion-label--correcta' : 'quiz-opcion-label--incorrecta');
              }
            });
          } else if (p.tipo === 'vf') {
            document.querySelectorAll('.quiz-vf-btn').forEach((btn) => {
              btn.disabled = true;
              const val = btn.dataset.valor === 'true';
              if (val === respuestaSeleccionada) {
                btn.classList.add(resultado.correcto ? 'quiz-vf-btn--correcto' : 'quiz-vf-btn--incorrecto');
              }
            });
          } else if (p.tipo === 'completar') {
            const input = document.getElementById('inputCompletar');
            if (input) input.disabled = true;
          }

          // Cambiar botón a Siguiente o Finalizar
          btnAccionPrincipal.disabled = false;
          const esUltima = indiceActual === total - 1;
          btnAccionPrincipal.textContent = esUltima ? 'Finalizar evaluación 🏆' : 'Siguiente pregunta →';
          btnAccionPrincipal.focus();
        } catch (err) {
          btnAccionPrincipal.disabled = false;
          btnAccionPrincipal.textContent = 'Responder';
          ui.aviso(`Error al responder: ${err.message}`, 'error');
        }
      } else {
        // Avanzar a la siguiente pregunta o finalizar
        if (indiceActual < total - 1) {
          indiceActual++;
          renderizarPreguntaActual();
        } else {
          await finalizarSesionQuiz(tema, nivel, sesionId);
        }
      }
    });
  }

  renderizarPreguntaActual();
}

/**
 * Vista 3: Finalización del quiz, cálculo de porcentaje, diplomas y gamificación.
 */
async function finalizarSesionQuiz(tema, nivel, sesionId) {
  ui.cargando(true);
  let resFinal = null;

  try {
    resFinal = await api.llamar('POST', '/api/quiz/finalizar', { sesionId });
  } catch (err) {
    ui.cargando(false);
    console.error('Error al finalizar quiz:', err);
    ui.aviso(`Error al finalizar la sesión: ${err.message}`, 'error');
    return;
  } finally {
    ui.cargando(false);
  }

  const { porcentaje, aprobado, aciertos, total, repasar, puntosGanados, insigniasNuevas } = resFinal;

  // 1. Mostrar resumen en modal
  const accionResumen = await mostrarResumen({
    titulo: `Resultados del Nivel ${nivel} - ${ui.escapar(tema.titulo)}`,
    aciertos,
    errores: total - aciertos,
    recomendaciones: repasar,
    enlaceTema: `/paginas/tema.html?id=${encodeURIComponent(tema.id)}`
  });

  // 2. Si aprobó, mostrar recompensas de gamificación
  if (aprobado) {
    mostrarLogros({ puntosGanados, insigniasNuevas });
  }

  // 3. Renderizar pantalla de cierre con opción de diploma o reintento
  contenedor.innerHTML = `
    <div class="quiz-sesion-contenedor" style="text-align: center; margin-top: var(--espacio-xl);">
      <article class="${aprobado ? 'quiz-aprobado-hero' : 'tarjeta pila'}" style="gap: var(--espacio-l);">
        <div style="font-size: var(--texto-3xl);">
          ${aprobado ? '🏆' : '💪'}
        </div>

        <div class="pila" style="gap: var(--espacio-xs);">
          <h1 style="font-size: var(--texto-2xl); color: var(--color-primario); margin: 0;">
            ${aprobado ? `¡Nivel ${nivel} Superado con Éxito!` : `Nivel ${nivel} no superado`}
          </h1>
          <p style="font-size: var(--texto-m); color: var(--color-texto-suave); margin: 0;">
            Obtuviste una calificación de <strong>${porcentaje}%</strong> (${aciertos} aciertos de ${total} preguntas).
          </p>
          ${
            puntosGanados > 0
              ? `<div class="insignia insignia--exito" style="font-size: var(--texto-s); align-self: center; margin-top: var(--espacio-xs);">
                  ⭐ +${puntosGanados} Puntos ganados
                </div>`
              : ''
          }
        </div>

        <div class="fila" style="justify-content: center; flex-wrap: wrap; gap: var(--espacio-m);">
          ${
            aprobado
              ? `
            <button type="button" class="btn btn--primario" id="btnDescargarDiplomaFinal">
              🎓 Descargar diploma en PDF
            </button>
          `
              : `
            <button type="button" class="btn btn--primario" id="btnReintentarQuiz">
              🔄 Reintentar con preguntas nuevas
            </button>
          `
          }

          <button type="button" class="btn btn--secundario" id="btnVolverNiveles">
            Volver a la lista de niveles
          </button>
        </div>
      </article>
    </div>
  `;

  document.getElementById('btnDescargarDiplomaFinal')?.addEventListener('click', async () => {
    await generarDiploma({ tipo: 'nivel-quiz', temaId: tema.id, nivel });
  });

  document.getElementById('btnReintentarQuiz')?.addEventListener('click', async () => {
    await iniciarQuiz(tema, nivel);
  });

  document.getElementById('btnVolverNiveles')?.addEventListener('click', async () => {
    await renderizarVistaNiveles(tema);
  });

  if (accionResumen === 'repetir' && !aprobado) {
    await iniciarQuiz(tema, nivel);
  }
}

await inicializar();
