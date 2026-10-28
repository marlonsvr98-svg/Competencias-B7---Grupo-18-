/**
 * publico/js/modulos/actividades.js
 * Pestaña central de Actividades Educativas del Ecosistema.
 * Permite al estudiante explorar y resolver juegos, retos de escape room, quizzes y canciones.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import { usuarioActual } from '../nucleo/sesion.js';
import { logrosDe } from '../nucleo/gamificacion.js';

await montarPlantilla({ titulo: 'Actividades Educativas' });

const contenedor = document.getElementById('contenido');

async function renderizarActividades() {
  if (!contenedor) return;

  ui.cargando(true);
  try {
    const usuario = usuarioActual();
    let logros = null;

    if (usuario) {
      try {
        logros = await logrosDe('yo');
      } catch (errLogros) {
        console.warn('No se pudieron cargar logros del usuario:', errLogros);
      }
    }

    // Cargar temas para selector de quiz si se requiere
    let temas = [];
    try {
      temas = await api.listar('temas');
    } catch {
      temas = [];
    }

    const temaCuerpo = (temas || []).find((t) => t.id === 'tem_000006' || t.titulo.toLowerCase().includes('cuerpo') || t.titulo.toLowerCase().includes('humano')) || temas[0];
    const temaIdQuiz = temaCuerpo ? temaCuerpo.id : 'tem_000006';

    contenedor.innerHTML = `
      <div class="actividades-contenedor">
        <!-- Hero Cabecera -->
        <header class="actividades-hero">
          <span class="insignia insignia--advertencia" style="font-size: var(--texto-xs); background-color: rgba(255, 255, 255, 0.2); color: var(--color-texto-inverso);">
            🎯 Zona de Aprendizaje Activo
          </span>
          <h1 class="actividades-hero__titulo">Centro de Actividades y Retos Interactivos</h1>
          <p class="actividades-hero__desc">
            Pon a prueba tus competencias mediante juegos interactivos de escape room, evaluaciones formativas por niveles de Bloom y canciones didácticas.
          </p>
        </header>

        <!-- Banner de Logros para Usuario Autenticado -->
        ${
          usuario && logros
            ? `
          <section class="actividades-logros-banner">
            <div class="fila" style="align-items: center; gap: var(--espacio-m);">
              <div style="font-size: var(--texto-3xl);">⭐</div>
              <div class="pila" style="gap: 2px;">
                <strong style="color: var(--color-primario); font-size: var(--texto-m);">
                  ¡Tu Progreso, ${ui.escapar(usuario.nombre)}!
                </strong>
                <span style="font-size: var(--texto-xs); color: var(--color-texto-suave);">
                  Puntos totales acumulados: <strong>${logros.puntos || 0} pts</strong> · Insignias obtenidas: <strong>${(logros.insignias || []).length}</strong>
                </span>
              </div>
            </div>
            <a href="/paginas/perfil.html" class="btn btn--pequeno btn--texto">
              Ver todas mis insignias y diplomas →
            </a>
          </section>
        `
            : ''
        }

        <!-- Grid de Actividades -->
        <section class="actividades-grid">
          <!-- 1. Escape del cuerpo humano (DESTACADO) -->
          <article class="actividad-card actividad-card--destacada">
            <div>
              <div class="fila" style="justify-content: space-between; align-items: flex-start;">
                <span class="actividad-card__icono">🔬</span>
                <span class="insignia insignia--advertencia">¡Recomendado!</span>
              </div>
              <h2 class="actividad-card__titulo">Escape del cuerpo humano</h2>
              <p class="actividad-card__desc">
                Conviértete en un explorador microscópico dentro del organismo. Atraviesa las salas de los sistemas nervioso, respiratorio y digestivo, supera desafíos científicos y descifra el código integrador final.
              </p>
              <div class="actividad-card__caracteristicas">
                <span class="insignia insignia--info">Nivel: 9.º / 10.º EGB</span>
                <span class="insignia insignia--info">4 Salas</span>
                <span class="insignia insignia--info">100 Puntos Máx.</span>
                <span class="insignia insignia--exito">Ayudante IA</span>
              </div>
            </div>

            <div class="actividad-card__pie">
              <span style="font-size: var(--texto-xs); color: var(--color-texto-suave); font-weight: var(--peso-seminegrita);">
                Meta de escape: ≥ 70 pts
              </span>
              <a href="/paginas/escape-cuerpo.html" class="btn btn--primario" style="background-color: var(--color-acento); border-color: var(--color-acento);">
                🎮 Jugar Escape Room →
              </a>
            </div>
          </article>

          <!-- 2. Quiz por Niveles de Bloom -->
          <article class="actividad-card">
            <div>
              <div class="fila" style="justify-content: space-between; align-items: flex-start;">
                <span class="actividad-card__icono">🎯</span>
                <span class="insignia insignia--info">Formativo</span>
              </div>
              <h2 class="actividad-card__titulo">Quiz por niveles de Bloom</h2>
              <p class="actividad-card__desc">
                Demuestra tu dominio conceptual avanzando progresivamente desde el Nivel 1 (Recordar) hasta el Nivel 5 (Evaluar). Cada nivel aprobado te otorga un diploma oficial descargable en PDF.
              </p>
              <div class="actividad-card__caracteristicas">
                <span class="insignia insignia--info">5 Niveles Bloom</span>
                <span class="insignia insignia--info">Opción / VF / Completar</span>
                <span class="insignia insignia--exito">Diploma en PDF</span>
              </div>
            </div>

            <div class="actividad-card__pie">
              <span style="font-size: var(--texto-xs); color: var(--color-texto-suave);">
                Retroalimentación inmediata
              </span>
              <a href="/paginas/quiz.html?temaId=${encodeURIComponent(temaIdQuiz)}" class="btn btn--primario">
                📝 Iniciar Quiz →
              </a>
            </div>
          </article>

          <!-- 3. Canciones Educativas -->
          <article class="actividad-card">
            <div>
              <div class="fila" style="justify-content: space-between; align-items: flex-start;">
                <span class="actividad-card__icono">🎵</span>
                <span class="insignia insignia--info">Música</span>
              </div>
              <h2 class="actividad-card__titulo">Canciones educativas sincronizadas</h2>
              <p class="actividad-card__desc">
                Afianza conceptos científicos de forma divertida y memorable con canciones originales, reproductor interactivo y letras sincronizadas línea a línea tipo karaoke.
              </p>
              <div class="actividad-card__caracteristicas">
                <span class="insignia insignia--info">Audio MP3</span>
                <span class="insignia insignia--info">Letra LRC interactiva</span>
                <span class="insignia insignia--info">Accesible</span>
              </div>
            </div>

            <div class="actividad-card__pie">
              <span style="font-size: var(--texto-xs); color: var(--color-texto-suave);">
                Catálogo con reproductor
              </span>
              <a href="/paginas/canciones.html" class="btn btn--secundario">
                🎧 Escuchar canciones →
              </a>
            </div>
          </article>
        </section>
      </div>
    `;
  } catch (err) {
    console.error('Error al cargar actividades:', err);
    contenedor.innerHTML = `
      <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Error al cargar actividades</h2>
        <p style="color: var(--color-texto-suave);">${ui.escapar(err.message)}</p>
        <div>
          <a href="/index.html" class="btn btn--primario">Volver al Inicio</a>
        </div>
      </div>
    `;
  } finally {
    ui.cargando(false);
  }
}

renderizarActividades();
