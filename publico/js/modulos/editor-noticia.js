/**
 * publico/js/modulos/editor-noticia.js
 * Editor y vista previa de noticias institucionales y académicas.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import * as util from '../nucleo/util.js';

await montarPlantilla({ titulo: 'Editor de Noticia', roles: ['docente', 'admin'] });

const contenedor = document.getElementById('contenido');
const noticiaId = util.parametro('id');

async function inicializar() {
  if (!contenedor) return;
  try {
    ui.cargando(true);

    const [temas, noticiaExistente] = await Promise.all([
      api.listar('temas'),
      noticiaId ? api.obtener('noticias', noticiaId) : Promise.resolve(null)
    ]);

    const esEdicion = Boolean(noticiaExistente);
    const noticia = noticiaExistente || {
      titulo: '',
      resumen: '',
      cuerpo: '',
      imagen: '',
      categoria: 'Institucional',
      temaId: '',
      destacada: false,
      estado: 'borrador'
    };

    contenedor.innerHTML = `
      <div class="pila" style="gap: var(--espacio-l);">
        <!-- Barra superior de navegación y acciones -->
        <header class="fila" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--espacio-m);">
          <div class="fila" style="align-items: center; gap: var(--espacio-s);">
            <a href="/paginas/noticias.html" class="btn btn--pequeno btn--texto" style="padding-left: 0;">
              ← Volver a Noticias
            </a>
            <h1 style="font-size: var(--texto-xl); margin: 0;">
              ${esEdicion ? 'Editar Noticia' : 'Nueva Noticia'}
            </h1>
          </div>
          <button type="submit" form="formNoticia" class="btn btn--primario" id="btnGuardar">
            💾 Guardar Noticia
          </button>
        </header>

        <!-- Layout de edición y vista previa en vivo -->
        <div class="editor-noticia-layout">
          <!-- Columna Izquierda: Formulario de Edición -->
          <form id="formNoticia" class="tarjeta pila" style="gap: var(--espacio-m);">
            <div class="campo">
              <label for="inputTitulo">Título de la noticia <span style="color: var(--color-error);">*</span></label>
              <input type="text" id="inputTitulo" value="${ui.escapar(noticia.titulo || '')}" placeholder="Ej. Feria anual de ciencias y tecnología" required autofocus>
            </div>

            <div class="fila" style="gap: var(--espacio-m); flex-wrap: wrap;">
              <div class="campo" style="flex: 1; min-width: 160px;">
                <label for="selectCategoria">Categoría <span style="color: var(--color-error);">*</span></label>
                <select id="selectCategoria" required>
                  <option value="Institucional" ${noticia.categoria === 'Institucional' ? 'selected' : ''}>Institucional</option>
                  <option value="Académica" ${noticia.categoria === 'Académica' ? 'selected' : ''}>Académica</option>
                  <option value="Eventos" ${noticia.categoria === 'Eventos' ? 'selected' : ''}>Eventos</option>
                  <option value="Logros" ${noticia.categoria === 'Logros' ? 'selected' : ''}>Logros</option>
                </select>
              </div>

              <div class="campo" style="flex: 1; min-width: 160px;">
                <label for="selectTema">Tema relacionado (opcional)</label>
                <select id="selectTema">
                  <option value="">Ninguno / General</option>
                  ${(temas || [])
                    .map((t) => `<option value="${ui.escapar(t.id)}" ${noticia.temaId === t.id ? 'selected' : ''}>${ui.escapar(t.titulo)}</option>`)
                    .join('')}
                </select>
              </div>
            </div>

            <div class="fila" style="gap: var(--espacio-m); flex-wrap: wrap;">
              <div class="campo" style="flex: 1; min-width: 160px;">
                <label for="selectEstado">Estado <span style="color: var(--color-error);">*</span></label>
                <select id="selectEstado" required>
                  <option value="borrador" ${noticia.estado === 'borrador' ? 'selected' : ''}>Borrador</option>
                  <option value="publicado" ${noticia.estado === 'publicado' ? 'selected' : ''}>Publicado</option>
                </select>
              </div>

              <div class="campo" style="flex: 1; min-width: 160px; justify-content: flex-end;">
                <label class="casilla" style="margin-bottom: var(--espacio-xs);">
                  <input type="checkbox" id="checkDestacada" ${noticia.destacada ? 'checked' : ''}>
                  <span>⭐ Marcar como destacada</span>
                </label>
              </div>
            </div>

            <div class="campo">
              <label for="inputImagen">Imagen de portada</label>
              <div class="fila" style="gap: var(--espacio-xs);">
                <input type="text" id="inputImagen" value="${ui.escapar(noticia.imagen || '')}" placeholder="/recursos/subidas/ejemplo.jpg o URL externa" style="flex: 1;">
                <button type="button" class="btn btn--secundario" id="btnSubirImagen">
                  📁 Subir
                </button>
              </div>
              <div class="imagen-previa-contenedor" id="contenedorImagenPrevia">
                ${
                  noticia.imagen
                    ? `<img src="${ui.escapar(noticia.imagen)}" alt="Imagen de portada" class="imagen-previa-img">`
                    : `<span style="color: var(--color-texto-suave); font-size: var(--texto-xs);">Sin imagen seleccionada</span>`
                }
              </div>
            </div>

            <div class="campo">
              <label for="textareaResumen">Resumen (máximo 200 caracteres) <span style="color: var(--color-error);">*</span></label>
              <textarea id="textareaResumen" rows="3" maxlength="200" placeholder="Breve descripción o sinopsis de la noticia..." required>${ui.escapar(noticia.resumen || '')}</textarea>
              <div class="contador-caracteres">
                <span id="contadorResumen">0 / 200</span>
              </div>
            </div>

            <div class="campo">
              <label for="textareaCuerpo">Cuerpo de la noticia <span style="color: var(--color-error);">*</span></label>
              <textarea id="textareaCuerpo" rows="10" placeholder="Redacta el contenido de la noticia. Admite **negrita**, párrafos y listas con '- '..." required>${ui.escapar(noticia.cuerpo || '')}</textarea>
              <small style="color: var(--color-texto-suave); margin-top: 4px;">
                Admite texto con formato básico (**negrita**, saltos de línea para párrafos y listas con "- ").
              </small>
            </div>
          </form>

          <!-- Columna Derecha: Vista Previa en Vivo -->
          <aside class="tarjeta vista-previa-tarjeta">
            <div class="fila" style="justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-borde); padding-bottom: var(--espacio-s);">
              <h2 style="font-size: var(--texto-m); margin: 0; color: var(--color-primario);">
                👁️ Vista Previa en Vivo
              </h2>
              <span class="insignia" id="previewBadgeEstado">Borrador</span>
            </div>

            <div class="imagen-previa-contenedor" id="previewImagenContenedor" style="display: ${noticia.imagen ? 'flex' : 'none'};">
              <img src="${ui.escapar(noticia.imagen || '')}" alt="Vista previa de portada" id="previewImg" class="imagen-previa-img">
            </div>

            <div class="fila" style="gap: var(--espacio-xs); align-items: center; flex-wrap: wrap;">
              <span class="insignia insignia--info" id="previewBadgeCategoria">${ui.escapar(noticia.categoria)}</span>
              <span class="insignia insignia--acento" id="previewBadgeDestacada" style="display: ${noticia.destacada ? 'inline-block' : 'none'};">⭐ Destacada</span>
              <span class="insignia" id="previewBadgeTema" style="display: ${noticia.temaId ? 'inline-block' : 'none'};">Tema vinculado</span>
            </div>

            <h3 style="font-size: var(--texto-l); margin: 0;" id="previewTitulo">
              ${ui.escapar(noticia.titulo || 'Título de la noticia')}
            </h3>

            <p style="font-weight: var(--peso-medio); color: var(--color-texto-suave); margin: 0; font-size: var(--texto-s);" id="previewResumen">
              ${ui.escapar(noticia.resumen || 'Resumen previo...')}
            </p>

            <div class="vista-previa-cuerpo" id="previewCuerpo">
              ${util.formatoBasico(noticia.cuerpo) || '<em style="color: var(--color-texto-suave);">El cuerpo de la noticia aparecerá aquí...</em>'}
            </div>
          </aside>
        </div>
      </div>
    `;

    // DOM Elements
    const formNoticia = document.getElementById('formNoticia');
    const inputTitulo = document.getElementById('inputTitulo');
    const selectCategoria = document.getElementById('selectCategoria');
    const selectTema = document.getElementById('selectTema');
    const selectEstado = document.getElementById('selectEstado');
    const checkDestacada = document.getElementById('checkDestacada');
    const inputImagen = document.getElementById('inputImagen');
    const btnSubirImagen = document.getElementById('btnSubirImagen');
    const contenedorImagenPrevia = document.getElementById('contenedorImagenPrevia');
    const textareaResumen = document.getElementById('textareaResumen');
    const contadorResumen = document.getElementById('contadorResumen');
    const textareaCuerpo = document.getElementById('textareaCuerpo');

    // Preview DOM Elements
    const previewTitulo = document.getElementById('previewTitulo');
    const previewResumen = document.getElementById('previewResumen');
    const previewCuerpo = document.getElementById('previewCuerpo');
    const previewBadgeCategoria = document.getElementById('previewBadgeCategoria');
    const previewBadgeDestacada = document.getElementById('previewBadgeDestacada');
    const previewBadgeEstado = document.getElementById('previewBadgeEstado');
    const previewBadgeTema = document.getElementById('previewBadgeTema');
    const previewImagenContenedor = document.getElementById('previewImagenContenedor');
    const previewImg = document.getElementById('previewImg');

    function actualizarVistaPrevia() {
      previewTitulo.textContent = inputTitulo.value.trim() || 'Título de la noticia';
      previewResumen.textContent = textareaResumen.value.trim() || 'Resumen previo...';
      previewCuerpo.innerHTML = util.formatoBasico(textareaCuerpo.value) || '<em style="color: var(--color-texto-suave);">El cuerpo de la noticia aparecerá aquí...</em>';

      previewBadgeCategoria.textContent = selectCategoria.value;
      previewBadgeDestacada.style.display = checkDestacada.checked ? 'inline-block' : 'none';

      const esPublicado = selectEstado.value === 'publicado';
      previewBadgeEstado.textContent = esPublicado ? 'Publicado' : 'Borrador';
      previewBadgeEstado.className = `insignia ${esPublicado ? 'insignia--exito' : ''}`;

      const tieneTema = Boolean(selectTema.value);
      previewBadgeTema.style.display = tieneTema ? 'inline-block' : 'none';

      const urlImg = inputImagen.value.trim();
      if (urlImg) {
        previewImg.src = urlImg;
        previewImagenContenedor.style.display = 'flex';
      } else {
        previewImagenContenedor.style.display = 'none';
      }

      // Contador de caracteres
      const chars = textareaResumen.value.length;
      contadorResumen.textContent = `${chars} / 200`;
      contadorResumen.className = chars >= 195 ? 'contador-caracteres--limite' : '';
    }

    inputTitulo.addEventListener('input', actualizarVistaPrevia);
    selectCategoria.addEventListener('change', actualizarVistaPrevia);
    selectTema.addEventListener('change', actualizarVistaPrevia);
    selectEstado.addEventListener('change', actualizarVistaPrevia);
    checkDestacada.addEventListener('change', actualizarVistaPrevia);
    textareaResumen.addEventListener('input', actualizarVistaPrevia);
    textareaCuerpo.addEventListener('input', actualizarVistaPrevia);

    inputImagen.addEventListener('input', () => {
      const url = inputImagen.value.trim();
      if (url) {
        contenedorImagenPrevia.innerHTML = `<img src="${ui.escapar(url)}" alt="Portada" class="imagen-previa-img">`;
      } else {
        contenedorImagenPrevia.innerHTML = `<span style="color: var(--color-texto-suave); font-size: var(--texto-xs);">Sin imagen seleccionada</span>`;
      }
      actualizarVistaPrevia();
    });

    // Subir imagen con api.subir
    btnSubirImagen.addEventListener('click', () => {
      const inputArchivo = document.createElement('input');
      inputArchivo.type = 'file';
      inputArchivo.accept = 'image/jpeg,image/png,image/webp';

      inputArchivo.onchange = async () => {
        const archivo = inputArchivo.files[0];
        if (!archivo) return;
        try {
          ui.cargando(true);
          const resp = await api.subir(archivo);
          if (resp && resp.url) {
            inputImagen.value = resp.url;
            contenedorImagenPrevia.innerHTML = `<img src="${ui.escapar(resp.url)}" alt="Portada" class="imagen-previa-img">`;
            actualizarVistaPrevia();
            ui.aviso('Imagen subida con éxito', 'exito');
          }
        } catch (err) {
          ui.aviso(err.message || 'Error al subir imagen', 'error');
        } finally {
          ui.cargando(false);
        }
      };
      inputArchivo.click();
    });

    actualizarVistaPrevia();

    // Guardar Noticia
    formNoticia.addEventListener('submit', async (e) => {
      e.preventDefault();

      const titulo = inputTitulo.value.trim();
      const resumen = textareaResumen.value.trim();
      const cuerpo = textareaCuerpo.value.trim();
      const categoria = selectCategoria.value;
      const temaId = selectTema.value || null;
      const estado = selectEstado.value;
      const destacada = checkDestacada.checked;
      const imagen = inputImagen.value.trim();

      if (!titulo) {
        ui.aviso('El título es obligatorio', 'error');
        inputTitulo.focus();
        return;
      }

      if (!resumen || resumen.length > 200) {
        ui.aviso('El resumen es obligatorio y no debe superar 200 caracteres', 'error');
        textareaResumen.focus();
        return;
      }

      if (!cuerpo) {
        ui.aviso('El cuerpo de la noticia es obligatorio', 'error');
        textareaCuerpo.focus();
        return;
      }

      const datos = {
        titulo,
        resumen,
        cuerpo,
        categoria,
        temaId,
        estado,
        destacada,
        imagen
      };

      try {
        ui.cargando(true);
        if (esEdicion) {
          await api.actualizar('noticias', noticiaId, datos);
          ui.aviso('Noticia actualizada correctamente', 'exito');
        } else {
          await api.crear('noticias', datos);
          ui.aviso('Noticia creada correctamente', 'exito');
        }

        setTimeout(() => {
          window.location.href = '/paginas/noticias.html';
        }, 500);
      } catch (err) {
        console.error('Error al guardar noticia:', err);
        ui.aviso(err.message || 'Error al guardar la noticia', 'error');
      } finally {
        ui.cargando(false);
      }
    });
  } catch (err) {
    console.error('Error al inicializar editor de noticias:', err);
    contenedor.innerHTML = `
      <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Error al cargar editor</h2>
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

inicializar();
