/**
 * publico/js/modulos/noticia.js
 * Detalle de noticia y registro automático de lectura.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import * as util from '../nucleo/util.js';

await montarPlantilla({ titulo: 'Noticia', roles: ['sesion'] });

const contenedor = document.getElementById('contenido');
const noticiaId = util.parametro('id');

if (!noticiaId) {
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Noticia no especificada</h2>
        <p style="color: var(--color-texto-suave);">No se ha proporcionado el identificador de la noticia a consultar.</p>
        <div>
          <a href="/paginas/noticias.html" class="btn btn--primario">Volver a Noticias</a>
        </div>
      </div>
    `;
  }
} else {
  cargarNoticia();
}

async function cargarNoticia() {
  try {
    ui.cargando(true);

    const [noticia, lecturas, temas] = await Promise.all([
      api.obtener('noticias', noticiaId),
      api.listar('lecturas-noticias'),
      api.listar('temas')
    ]);

    // Registrar lectura automáticamente si no existe previamente
    const yaLeida = (lecturas || []).some((l) => l && l.noticiaId === noticiaId);
    if (!yaLeida) {
      try {
        await api.crear('lecturas-noticias', { noticiaId });
      } catch (err) {
        console.warn('No se pudo registrar la lectura:', err);
      }
    }

    const temaRelacionado = noticia.temaId
      ? (temas || []).find((t) => t.id === noticia.temaId)
      : null;

    const tituloEscapado = ui.escapar(noticia.titulo || 'Noticia');
    const categoriaEscapada = ui.escapar(noticia.categoria || 'General');
    const fechaTexto = noticia.fechaPublicacion
      ? util.fechaLarga(noticia.fechaPublicacion)
      : noticia.fecha
      ? util.fechaLarga(noticia.fecha)
      : 'Fecha no disponible';

    contenedor.innerHTML = `
      <div class="noticia-detalle-articulo">
        <!-- Navegación y migas de pan -->
        <nav aria-label="Migas de pan" class="fila" style="gap: var(--espacio-xs); font-size: var(--texto-s); color: var(--color-texto-suave); flex-wrap: wrap; align-items: center;">
          <a href="/index.html" style="color: var(--color-primario); text-decoration: none;">Inicio</a>
          <span>/</span>
          <a href="/paginas/noticias.html" style="color: var(--color-primario); text-decoration: none;">Noticias</a>
          <span>/</span>
          <span aria-current="page" style="color: var(--color-texto); font-weight: var(--peso-seminegrita);">
            ${tituloEscapado}
          </span>
        </nav>

        <!-- Cabecera de la noticia -->
        <header class="pila" style="gap: var(--espacio-s);">
          <div class="fila" style="gap: var(--espacio-s); align-items: center; flex-wrap: wrap;">
            <span class="insignia insignia--info" style="font-size: var(--texto-xs);">${categoriaEscapada}</span>
            ${noticia.destacada ? `<span class="insignia" style="background-color: var(--color-advertencia); color: var(--color-texto-inverso); font-size: var(--texto-xs);">⭐ Destacada</span>` : ''}
            ${noticia.estado === 'borrador' ? `<span class="insignia insignia--advertencia" style="font-size: var(--texto-xs);">Borrador</span>` : ''}
            <span style="font-size: var(--texto-xs); color: var(--color-texto-suave);">Publicado el ${fechaTexto}</span>
          </div>

          <h1 style="font-size: var(--texto-xxl); margin: 0; color: var(--color-primario); line-height: var(--interlineado-apretado);">
            ${tituloEscapado}
          </h1>

          ${
            noticia.resumen
              ? `<p class="noticia-detalle-resumen">${ui.escapar(noticia.resumen)}</p>`
              : ''
          }
        </header>

        <!-- Portada si existe -->
        ${
          noticia.imagen
            ? `
            <figure style="margin: 0;">
              <img src="${ui.escapar(noticia.imagen)}" alt="${tituloEscapado}" class="noticia-detalle-portada">
            </figure>
          `
            : ''
        }

        <!-- Cuerpo formateado con util.formatoBasico -->
        <article class="tarjeta noticia-detalle-cuerpo">
          ${util.formatoBasico(noticia.cuerpo) || '<p style="color: var(--color-texto-suave);">Sin contenido.</p>'}
        </article>

        <!-- Tema relacionado si existe -->
        ${
          temaRelacionado
            ? `
            <aside class="tarjeta fila" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--espacio-m); border-left: 4px solid var(--color-acento);">
              <div class="pila" style="gap: 2px;">
                <span style="font-size: var(--texto-xs); color: var(--color-texto-suave);">Tema formativo relacionado:</span>
                <strong style="color: var(--color-primario); font-size: var(--texto-s);">${ui.escapar(temaRelacionado.titulo)}</strong>
              </div>
              <a href="/paginas/tema.html?id=${ui.escapar(temaRelacionado.id)}" class="btn btn--pequeno btn--secundario">
                Ver tema de estudio →
              </a>
            </aside>
          `
            : ''
        }

        <!-- Botón de regreso -->
        <div style="padding-top: var(--espacio-m); border-top: 1px solid var(--color-borde);">
          <a href="/paginas/noticias.html" class="btn btn--secundario">
            ← Volver a Noticias
          </a>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error al cargar la noticia:', err);
    contenedor.innerHTML = `
      <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Error al cargar noticia</h2>
        <p style="color: var(--color-texto-suave);">${ui.escapar(err.message)}</p>
        <div>
          <a href="/paginas/noticias.html" class="btn btn--primario">Volver a Noticias</a>
        </div>
      </div>
    `;
  } finally {
    ui.cargando(false);
  }
}
