/**
 * publico/js/modulos/canciones.js
 * Catálogo de canciones educativas con reproductor personalizado y sincronización LRC.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import * as util from '../nucleo/util.js';
import { usuarioActual } from '../nucleo/sesion.js';

await montarPlantilla({ titulo: 'Canciones Educativas', roles: ['sesion'] });

const contenedor = document.getElementById('contenido');
const temaParam = util.parametro('temaId');

function formatearTiempo(segundos) {
  if (isNaN(segundos) || segundos < 0) return '00:00';
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}

function parsearLrc(textoLrc) {
  if (!textoLrc) return [];
  const lineas = textoLrc.split(/\r?\n/);
  const items = [];
  const regex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const linea of lineas) {
    let match;
    const tiempos = [];
    while ((match = regex.exec(linea)) !== null) {
      const min = parseInt(match[1], 10);
      const seg = parseInt(match[2], 10);
      const dec = match[3] ? parseFloat('0.' + match[3]) : 0;
      tiempos.push(min * 60 + seg + dec);
    }
    const texto = linea.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim();
    if (texto && tiempos.length > 0) {
      for (const t of tiempos) {
        items.push({ tiempo: t, texto });
      }
    }
  }

  items.sort((a, b) => a.tiempo - b.tiempo);
  return items;
}

async function inicializar() {
  if (!contenedor) return;
  try {
    ui.cargando(true);

    const usuario = usuarioActual();
    const esDocenteOAdmin = usuario && (usuario.rol === 'docente' || usuario.rol === 'admin');

    const [asignaturas, unidades, temas, todasCanciones] = await Promise.all([
      api.listar('asignaturas'),
      api.listar('unidades'),
      api.listar('temas'),
      api.listar('canciones')
    ]);

    // Mapas de relaciones
    const asigMap = new Map((asignaturas || []).map((a) => [a.id, a.nombre]));
    const unidadMap = new Map((unidades || []).map((u) => [u.id, u.asignaturaId]));
    const temaMap = new Map((temas || []).map((t) => {
      const asigId = unidadMap.get(t.unidadId);
      return [t.id, { titulo: t.titulo, asignaturaId: asigId, nombreAsig: asigMap.get(asigId) || '' }];
    }));

    // Determinar asignatura inicial si hay temaParam
    let asignaturaFiltro = '';
    let temaFiltro = temaParam || '';

    if (temaFiltro && temaMap.has(temaFiltro)) {
      asignaturaFiltro = temaMap.get(temaFiltro).asignaturaId || '';
    }

    contenedor.innerHTML = `
      <div class="pila" style="gap: var(--espacio-l);">
        <!-- Encabezado y Barra de Filtros -->
        <header class="fila" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--espacio-m);">
          <div>
            <h1 style="font-size: var(--texto-xl); margin: 0; color: var(--color-primario);">
              🎵 Canciones Educativas
            </h1>
            <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;">
              Aprende conceptos clave a través de la música y letras sincronizadas.
            </p>
          </div>
          ${
            esDocenteOAdmin
              ? `
              <a href="/paginas/editor-cancion.html" class="btn btn--primario">
                + Nueva Canción
              </a>
            `
              : ''
          }
        </header>

        <!-- Filtros superiores -->
        <div class="tarjeta fila" style="gap: var(--espacio-m); flex-wrap: wrap; align-items: center;">
          <div class="campo" style="flex: 1; min-width: 220px; margin-bottom: 0;">
            <label for="filtroAsignatura" style="font-size: var(--texto-xs);">Filtrar por asignatura:</label>
            <select id="filtroAsignatura">
              <option value="">Todas las asignaturas</option>
              ${(asignaturas || [])
                .map((a) => `<option value="${ui.escapar(a.id)}" ${asignaturaFiltro === a.id ? 'selected' : ''}>${ui.escapar(a.nombre)}</option>`)
                .join('')}
            </select>
          </div>

          <div class="campo" style="flex: 1; min-width: 220px; margin-bottom: 0;">
            <label for="filtroTema" style="font-size: var(--texto-xs);">Filtrar por tema:</label>
            <select id="filtroTema">
              <option value="">Todos los temas</option>
              ${(temas || [])
                .map((t) => `<option value="${ui.escapar(t.id)}" ${temaFiltro === t.id ? 'selected' : ''}>${ui.escapar(t.titulo)}</option>`)
                .join('')}
            </select>
          </div>
        </div>

        <!-- Layout principal: Lista y Reproductor + Letra -->
        <div class="canciones-layout">
          <!-- Columna Lateral: Catálogo de canciones -->
          <aside class="canciones-sidebar">
            <div class="fila" style="justify-content: space-between; align-items: center;">
              <h2 style="font-size: var(--texto-m); margin: 0;">Repertorio</h2>
              <small id="contadorCanciones" style="color: var(--color-texto-suave);">0 canciones</small>
            </div>
            <div class="canciones-lista" id="listaCanciones"></div>
          </aside>

          <!-- Columna Principal: Reproductor y Letra -->
          <div class="reproductor-panel" id="panelReproductor">
            <!-- Tarjeta del Reproductor Propio -->
            <section class="reproductor-card" id="reproductorCard" aria-label="Reproductor de audio">
              <div class="reproductor-info">
                <div>
                  <h2 style="font-size: var(--texto-l); margin: 0; color: var(--color-primario);" id="repTitulo">
                    Selecciona una canción
                  </h2>
                  <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;" id="repSubtitulo">
                    Haz clic en una canción del repertorio para iniciar la reproducción.
                  </p>
                </div>
                <div class="fila" style="gap: var(--espacio-xs);" id="repInsignias"></div>
              </div>

              <!-- Barra de Progreso y Tiempo -->
              <div class="reproductor-barra-fila">
                <span id="repTiempoActual" style="font-size: var(--texto-xs); font-family: monospace; min-width: 42px;">00:00</span>
                <input type="range" id="sliderProgreso" class="slider-rango" min="0" max="100" value="0" step="0.1" aria-label="Progreso de reproducción" disabled>
                <span id="repTiempoTotal" style="font-size: var(--texto-xs); font-family: monospace; min-width: 42px;">00:00</span>
              </div>

              <!-- Controles de Reproducción y Volumen -->
              <div class="reproductor-controles">
                <button type="button" class="btn-play-pause" id="btnPlayPause" aria-label="Reproducir" disabled>
                  ▶
                </button>

                <div class="reproductor-volumen">
                  <button type="button" class="btn btn--pequeno btn--texto" id="btnMute" aria-label="Silenciar">
                    🔊
                  </button>
                  <input type="range" id="sliderVolumen" class="slider-rango" min="0" max="1" step="0.05" value="1" aria-label="Control de volumen">
                </div>
              </div>
            </section>

            <!-- Panel de Letra Sincronizada -->
            <section class="panel-letra-card" id="panelLetraCard">
              <div class="fila" style="justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-borde); padding-bottom: var(--espacio-s);">
                <h3 style="font-size: var(--texto-m); margin: 0;">📜 Letra de la Canción</h3>
                <span id="badgeModoLetra" class="insignia insignia--info" style="font-size: var(--texto-xs); display: none;">Sincronizada LRC</span>
              </div>
              <div class="panel-letra-scroll" id="contenedorLetra">
                <span style="color: var(--color-texto-suave); text-align: center; padding: var(--espacio-l);">
                  La letra aparecerá aquí al seleccionar una canción.
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>
    `;

    // DOM Elements
    const filtroAsigEl = document.getElementById('filtroAsignatura');
    const filtroTemaEl = document.getElementById('filtroTema');
    const listaCancionesEl = document.getElementById('listaCanciones');
    const contadorCancionesEl = document.getElementById('contadorCanciones');

    // Reproductor DOM
    const repTitulo = document.getElementById('repTitulo');
    const repSubtitulo = document.getElementById('repSubtitulo');
    const repInsignias = document.getElementById('repInsignias');
    const repTiempoActual = document.getElementById('repTiempoActual');
    const repTiempoTotal = document.getElementById('repTiempoTotal');
    const sliderProgreso = document.getElementById('sliderProgreso');
    const btnPlayPause = document.getElementById('btnPlayPause');
    const btnMute = document.getElementById('btnMute');
    const sliderVolumen = document.getElementById('sliderVolumen');
    const contenedorLetra = document.getElementById('contenedorLetra');
    const badgeModoLetra = document.getElementById('badgeModoLetra');

    // Audio Engine
    const audio = new Audio();
    audio.preload = 'metadata';

    let cancionActual = null;
    let lrcItems = [];
    let lrcIndexActivo = -1;
    let cancionesFiltradas = [];

    function actualizarOpcionesTema() {
      const asigSel = filtroAsigEl.value;
      const temasDisponibles = (temas || []).filter((t) => {
        if (!asigSel) return true;
        const info = temaMap.get(t.id);
        return info && info.asignaturaId === asigSel;
      });

      const valorPrevio = filtroTemaEl.value;
      filtroTemaEl.innerHTML = `
        <option value="">Todos los temas</option>
        ${temasDisponibles.map((t) => `<option value="${ui.escapar(t.id)}">${ui.escapar(t.titulo)}</option>`).join('')}
      `;

      if (temasDisponibles.some((t) => t.id === valorPrevio)) {
        filtroTemaEl.value = valorPrevio;
      } else {
        filtroTemaEl.value = '';
      }
    }

    function filtrarYRenderizarLista() {
      const asigSel = filtroAsigEl.value;
      const temaSel = filtroTemaEl.value;

      cancionesFiltradas = (todasCanciones || []).filter((c) => {
        if (!c) return false;
        if (temaSel && c.temaId !== temaSel) return false;
        if (asigSel) {
          const infoTema = temaMap.get(c.temaId);
          if (!infoTema || infoTema.asignaturaId !== asigSel) return false;
        }
        return true;
      });

      contadorCancionesEl.textContent = `${cancionesFiltradas.length} ${cancionesFiltradas.length === 1 ? 'canción' : 'canciones'}`;

      if (cancionesFiltradas.length === 0) {
        listaCancionesEl.innerHTML = `
          <div class="tarjeta pila" style="text-align: center; padding: var(--espacio-l); gap: var(--espacio-s);">
            <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;">
              No se encontraron canciones educativas para los filtros seleccionados.
            </p>
          </div>
        `;
        return;
      }

      listaCancionesEl.innerHTML = cancionesFiltradas
        .map((cancion) => {
          const idEscapado = ui.escapar(cancion.id);
          const tituloEscapado = ui.escapar(cancion.titulo || 'Canción');
          const autoriaEscapada = ui.escapar(cancion.autoria || 'Autor desconocido');
          const licenciaEscapada = ui.escapar(cancion.licencia || 'Propia');
          const infoTema = temaMap.get(cancion.temaId);
          const nombreTema = infoTema ? infoTema.titulo : 'Tema general';
          const esActiva = cancionActual && cancionActual.id === cancion.id;

          return `
            <div class="cancion-item ${esActiva ? 'cancion-item--activa' : ''}" data-id="${idEscapado}">
              <div class="fila" style="justify-content: space-between; align-items: flex-start; gap: var(--espacio-xs);">
                <strong class="cancion-item__titulo">${tituloEscapado}</strong>
                ${
                  esDocenteOAdmin
                    ? `
                    <a href="/paginas/editor-cancion.html?id=${idEscapado}" class="btn-icono-accion" title="Editar canción" onclick="event.stopPropagation();">
                      ✏️
                    </a>
                  `
                    : ''
                }
              </div>
              <small style="color: var(--color-primario);">${ui.escapar(nombreTema)}</small>
              <div class="fila" style="justify-content: space-between; align-items: center; font-size: var(--texto-xs); color: var(--color-texto-suave); margin-top: 2px;">
                <span>👤 ${autoriaEscapada}</span>
                <span class="insignia" style="font-size: 10px;">${licenciaEscapada}</span>
              </div>
            </div>
          `;
        })
        .join('');

      // Evento de selección de canción
      listaCancionesEl.querySelectorAll('.cancion-item').forEach((item) => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          const seleccionada = todasCanciones.find((c) => c.id === id);
          if (seleccionada) cargarCancion(seleccionada, true);
        });
      });
    }

    function cargarCancion(cancion, reproducirInmediato = false) {
      cancionActual = cancion;
      audio.src = cancion.audio || '';
      audio.currentTime = 0;

      repTitulo.textContent = cancion.titulo || 'Canción sin título';
      const infoTema = temaMap.get(cancion.temaId);
      const temaTexto = infoTema ? `${infoTema.nombreAsig ? infoTema.nombreAsig + ' · ' : ''}${infoTema.titulo}` : '';
      repSubtitulo.textContent = `${cancion.autoria || 'Autor'} ${temaTexto ? '· ' + temaTexto : ''}`;

      repInsignias.innerHTML = `
        <span class="insignia insignia--info" style="font-size: var(--texto-xs);">${ui.escapar(cancion.licencia || 'Propia')}</span>
        ${cancion.lrc ? `<span class="insignia insignia--exito" style="font-size: var(--texto-xs);">LRC</span>` : ''}
      `;

      btnPlayPause.disabled = false;
      sliderProgreso.disabled = false;
      sliderProgreso.value = 0;
      repTiempoActual.textContent = '00:00';
      repTiempoTotal.textContent = '00:00';

      // Parsear LRC
      lrcItems = parsearLrc(cancion.lrc);
      lrcIndexActivo = -1;

      if (lrcItems.length > 0) {
        badgeModoLetra.style.display = 'inline-block';
        badgeModoLetra.textContent = 'Letra sincronizada LRC';
        badgeModoLetra.className = 'insignia insignia--exito';

        contenedorLetra.innerHTML = lrcItems
          .map((item, idx) => `
            <div class="lrc-linea" data-idx="${idx}" data-tiempo="${item.tiempo}">
              ${ui.escapar(item.texto)}
            </div>
          `)
          .join('');

        // Clic en línea LRC para saltar a ese tiempo
        contenedorLetra.querySelectorAll('.lrc-linea').forEach((el) => {
          el.addEventListener('click', () => {
            const tiempo = parseFloat(el.getAttribute('data-tiempo'));
            if (!isNaN(tiempo)) {
              audio.currentTime = tiempo;
              audio.play();
            }
          });
        });
      } else {
        badgeModoLetra.style.display = 'none';
        contenedorLetra.innerHTML = `
          <div class="letra-plana">
            ${ui.escapar(cancion.letra || 'Sin letra registrada.')}
          </div>
        `;
      }

      filtrarYRenderizarLista();

      if (reproducirInmediato) {
        audio.play().catch((e) => console.warn('Autoplay bloqueado:', e));
      }
    }

    // Eventos del Audio
    btnPlayPause.addEventListener('click', () => {
      if (!cancionActual) return;
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', () => {
      btnPlayPause.textContent = '⏸';
      btnPlayPause.setAttribute('aria-label', 'Pausar');
    });

    audio.addEventListener('pause', () => {
      btnPlayPause.textContent = '▶';
      btnPlayPause.setAttribute('aria-label', 'Reproducir');
    });

    audio.addEventListener('ended', () => {
      btnPlayPause.textContent = '▶';
      btnPlayPause.setAttribute('aria-label', 'Reproducir');
      sliderProgreso.value = 0;
      repTiempoActual.textContent = '00:00';
      lrcIndexActivo = -1;
      contenedorLetra.querySelectorAll('.lrc-linea--activa').forEach((el) => el.classList.remove('lrc-linea--activa'));
    });

    audio.addEventListener('loadedmetadata', () => {
      repTiempoTotal.textContent = formatearTiempo(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      const actual = audio.currentTime;
      const total = audio.duration;

      repTiempoActual.textContent = formatearTiempo(actual);
      if (total && !isNaN(total) && total > 0) {
        sliderProgreso.value = (actual / total) * 100;
      }

      // Sincronización de LRC
      if (lrcItems.length > 0) {
        let nuevoIdx = -1;
        for (let i = 0; i < lrcItems.length; i++) {
          if (lrcItems[i].tiempo <= actual) {
            nuevoIdx = i;
          } else {
            break;
          }
        }

        if (nuevoIdx !== lrcIndexActivo) {
          lrcIndexActivo = nuevoIdx;
          contenedorLetra.querySelectorAll('.lrc-linea--activa').forEach((el) => el.classList.remove('lrc-linea--activa'));

          if (nuevoIdx >= 0) {
            const lineaEl = contenedorLetra.querySelector(`.lrc-linea[data-idx="${nuevoIdx}"]`);
            if (lineaEl) {
              lineaEl.classList.add('lrc-linea--activa');
              lineaEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      }
    });

    // Barra de progreso operable con teclado y mouse
    sliderProgreso.addEventListener('input', () => {
      if (audio.duration && !isNaN(audio.duration)) {
        audio.currentTime = (sliderProgreso.value / 100) * audio.duration;
      }
    });

    // Control de volumen
    sliderVolumen.addEventListener('input', () => {
      audio.volume = parseFloat(sliderVolumen.value);
      audio.muted = false;
      btnMute.textContent = audio.volume === 0 ? '🔇' : '🔊';
    });

    btnMute.addEventListener('click', () => {
      audio.muted = !audio.muted;
      btnMute.textContent = audio.muted || audio.volume === 0 ? '🔇' : '🔊';
    });

    // Cambios en filtros
    filtroAsigEl.addEventListener('change', () => {
      actualizarOpcionesTema();
      filtrarYRenderizarLista();
    });

    filtroTemaEl.addEventListener('change', () => {
      filtrarYRenderizarLista();
    });

    actualizarOpcionesTema();
    filtrarYRenderizarLista();

    // Si hay canciones y coincide con temaParam o hay canciones disponibles, precargar la primera
    if (cancionesFiltradas.length > 0) {
      cargarCancion(cancionesFiltradas[0], false);
    }
  } catch (err) {
    console.error('Error al inicializar canciones:', err);
    contenedor.innerHTML = `
      <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Error al cargar canciones</h2>
        <p style="color: var(--color-texto-suave);">${ui.escapar(err.message)}</p>
      </div>
    `;
  } finally {
    ui.cargando(false);
  }
}

inicializar();
