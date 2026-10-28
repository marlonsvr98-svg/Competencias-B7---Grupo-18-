/**
 * publico/js/modulos/noticias.js
 * Cartelera de noticias con filtros, paginación de 9 elementos y estado de lectura.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import * as util from '../nucleo/util.js';
import { usuarioActual } from '../nucleo/sesion.js';

await montarPlantilla({ titulo: 'Noticias y Novedades', roles: ['sesion'] });

const contenedor = document.getElementById('contenido');
const ELEMENTOS_POR_PAGINA = 9;

async function inicializar() {
  if (!contenedor) return;
  try {
    ui.cargando(true);

    const usuario = usuarioActual();
    const esDocenteOAdmin = usuario && (usuario.rol === 'docente' || usuario.rol === 'admin');

    const [todasNoticias, lecturas, temas] = await Promise.all([
      api.listar('noticias'),
      api.listar('lecturas-noticias'),
      api.listar('temas')
    ]);

    const leidasSet = new Set((lecturas || []).map((l) => l.noticiaId));
    const temasMap = new Map((temas || []).map((t) => [t.id, t.titulo]));

    let categoriaFiltro = '';
    let temaFiltro = '';
    let paginaActual = 1;

    contenedor.innerHTML = `
      <div class="pila" style="gap: var(--espacio-l);">
        <!-- Encabezado y Barra de Filtros -->
        <header class="noticias-filtros-banner">
          <div class="pila" style="gap: 4px;">
            <h1 style="font-size: var(--texto-xl); margin: 0; color: var(--color-primario);">
              Noticias y Novedades
            </h1>
            <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;">
              Infórmate sobre anuncios institucionales, actividades académicas y eventos de la comunidad.
            </p>
          </div>

          <div class="noticias-filtros-grupo">
            <div class="campo" style="margin-bottom: 0;">
              <select id="filtroCategoria" class="campo" style="margin-bottom: 0; font-size: var(--texto-s);">
                <option value="">Todas las categorías</option>
                <option value="Institucional">Institucional</option>
                <option value="Académica">Académica</option>
                <option value="Eventos">Eventos</option>
                <option value="Logros">Logros</option>
              </select>
            </div>

            <div class="campo" style="margin-bottom: 0;">
              <select id="filtroTema" class="campo" style="margin-bottom: 0; font-size: var(--texto-s); max-width: 220px;">
                <option value="">Todos los temas</option>
                ${(temas || [])
                  .map((t) => `<option value="${ui.escapar(t.id)}">${ui.escapar(t.titulo)}</option>`)
                  .join('')}
              </select>
            </div>

            ${
              esDocenteOAdmin
                ? `
                <a href="/paginas/editor-noticia.html" class="btn btn--primario">
                  + Nueva Noticia
                </a>
              `
                : ''
            }
          </div>
        </header>

        <!-- Contenedor de Tarjetas de Noticias -->
        <section class="noticias-grid" id="gridNoticias"></section>

        <!-- Barra de Paginación -->
        <nav class="paginacion" id="barraPaginacion" aria-label="Paginación de noticias"></nav>
      </div>
    `;

    const gridNoticias = document.getElementById('gridNoticias');
    const barraPaginacion = document.getElementById('barraPaginacion');
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroTema = document.getElementById('filtroTema');

    function renderizar() {
      // 1. Filtrar
      let filtradas = (todasNoticias || []).filter((n) => {
        if (!n) return false;
        if (categoriaFiltro && n.categoria !== categoriaFiltro) return false;
        if (temaFiltro && n.temaId !== temaFiltro) return false;
        return true;
      });

      // 2. Ordenar: Destacadas primero, luego por fecha descendente
      filtradas.sort((a, b) => {
        if (a.destacada && !b.destacada) return -1;
        if (!a.destacada && b.destacada) return 1;

        const fechaA = new Date(a.fechaPublicacion || a.fecha || 0).getTime();
        const fechaB = new Date(b.fechaPublicacion || b.fecha || 0).getTime();
        return fechaB - fechaA;
      });

      // 3. Paginación de 9 elementos
      const totalElementos = filtradas.length;
      const totalPaginas = Math.ceil(totalElementos / ELEMENTOS_POR_PAGINA) || 1;
      if (paginaActual > totalPaginas) paginaActual = totalPaginas;
      if (paginaActual < 1) paginaActual = 1;

      const inicio = (paginaActual - 1) * ELEMENTOS_POR_PAGINA;
      const paginadas = filtradas.slice(inicio, inicio + ELEMENTOS_POR_PAGINA);

      if (paginadas.length === 0) {
        gridNoticias.innerHTML = `
          <div class="tarjeta pila" style="grid-column: 1 / -1; text-align: center; padding: var(--espacio-xl); gap: var(--espacio-m);">
            <p style="color: var(--color-texto-suave);">No se encontraron noticias con los filtros seleccionados.</p>
          </div>
        `;
        barraPaginacion.innerHTML = '';
        return;
      }

      gridNoticias.innerHTML = paginadas
        .map((noticia) => {
          const idEscapado = ui.escapar(noticia.id);
          const tituloEscapado = ui.escapar(noticia.titulo || 'Sin título');
          const resumenEscapado = ui.escapar(noticia.resumen || '');
          const categoriaEscapada = ui.escapar(noticia.categoria || 'General');
          const esLeida = leidasSet.has(noticia.id);
          const esDestacada = Boolean(noticia.destacada);
          const esBorrador = noticia.estado === 'borrador';
          const fechaTexto = noticia.fechaPublicacion
            ? util.fechaRelativa(noticia.fechaPublicacion)
            : noticia.fecha
            ? util.fechaRelativa(noticia.fecha)
            : 'Reciente';

          const nombreTema = noticia.temaId ? temasMap.get(noticia.temaId) : null;

          return `
            <article class="tarjeta-noticia ${esDestacada ? 'tarjeta-noticia--destacada' : ''}">
              ${
                noticia.imagen
                  ? `
                  <div class="tarjeta-noticia__imagen-wrapper">
                    <img src="${ui.escapar(noticia.imagen)}" alt="${tituloEscapado}" class="tarjeta-noticia__imagen" loading="lazy">
                  </div>
                `
                  : ''
              }

              <div class="tarjeta-noticia__cuerpo">
                <div class="fila" style="gap: var(--espacio-xs); align-items: center; flex-wrap: wrap;">
                  <span class="insignia insignia--info" style="font-size: var(--texto-xs);">${categoriaEscapada}</span>
                  ${!esLeida ? `<span class="insignia insignia--acento" style="font-size: var(--texto-xs);">Nuevo</span>` : ''}
                  ${esDestacada ? `<span class="insignia" style="background-color: var(--color-advertencia); color: var(--color-texto-inverso); font-size: var(--texto-xs);">⭐ Destacada</span>` : ''}
                  ${esBorrador ? `<span class="insignia insignia--advertencia" style="font-size: var(--texto-xs);">Borrador</span>` : ''}
                </div>

                <h2 class="tarjeta-noticia__titulo">
                  <a href="/paginas/noticia.html?id=${idEscapado}" style="text-decoration: none; color: inherit;">
                    ${tituloEscapado}
                  </a>
                </h2>

                <p class="tarjeta-noticia__resumen">${resumenEscapado}</p>

                ${
                  nombreTema
                    ? `
                    <small style="color: var(--color-primario); font-size: var(--texto-xs);">
                      📌 Tema: ${ui.escapar(nombreTema)}
                    </small>
                  `
                    : ''
                }
              </div>

              <div class="tarjeta-noticia__pie">
                <span>🕒 ${fechaTexto}</span>
                <div class="fila" style="align-items: center; gap: var(--espacio-xs);">
                  ${
                    esDocenteOAdmin
                      ? `
                      <a href="/paginas/editor-noticia.html?id=${idEscapado}" class="btn btn--pequeno btn--secundario" style="padding: 2px 8px;">
                        Editar
                      </a>
                    `
                      : ''
                  }
                  <a href="/paginas/noticia.html?id=${idEscapado}" class="btn btn--pequeno btn--primario" style="padding: 2px 8px;">
                    Leer más →
                  </a>
                </div>
              </div>
            </article>
          `;
        })
        .join('');

      // Barra de paginación
      if (totalPaginas <= 1) {
        barraPaginacion.innerHTML = '';
      } else {
        barraPaginacion.innerHTML = `
          <button type="button" class="btn btn--pequeno btn--secundario" id="btnPaginaAnt" ${paginaActual === 1 ? 'disabled' : ''}>
            ← Anterior
          </button>
          <span style="font-size: var(--texto-s); font-weight: var(--peso-seminegrita);">
            Página ${paginaActual} de ${totalPaginas}
          </span>
          <button type="button" class="btn btn--pequeno btn--secundario" id="btnPaginaSig" ${paginaActual === totalPaginas ? 'disabled' : ''}>
            Siguiente →
          </button>
        `;

        document.getElementById('btnPaginaAnt')?.addEventListener('click', () => {
          if (paginaActual > 1) {
            paginaActual--;
            renderizar();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });

        document.getElementById('btnPaginaSig')?.addEventListener('click', () => {
          if (paginaActual < totalPaginas) {
            paginaActual++;
            renderizar();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      }
    }

    filtroCategoria.addEventListener('change', () => {
      categoriaFiltro = filtroCategoria.value;
      paginaActual = 1;
      renderizar();
    });

    filtroTema.addEventListener('change', () => {
      temaFiltro = filtroTema.value;
      paginaActual = 1;
      renderizar();
    });

    renderizar();
  } catch (err) {
    console.error('Error al inicializar noticias:', err);
    contenedor.innerHTML = `
      <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Error al cargar noticias</h2>
        <p style="color: var(--color-texto-suave);">${ui.escapar(err.message)}</p>
      </div>
    `;
  } finally {
    ui.cargando(false);
  }
}

inicializar();
