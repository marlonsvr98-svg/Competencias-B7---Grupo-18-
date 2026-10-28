/**
 * publico/js/modulos/editor-cancion.js
 * Editor de canciones educativas para docentes y administradores.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import * as util from '../nucleo/util.js';

await montarPlantilla({ titulo: 'Editor de Canción Educativa', roles: ['docente', 'admin'] });

const contenedor = document.getElementById('contenido');
const cancionId = util.parametro('id');

async function inicializar() {
  if (!contenedor) return;
  try {
    ui.cargando(true);

    const [temas, unidades, asignaturas, cancionExistente] = await Promise.all([
      api.listar('temas'),
      api.listar('unidades'),
      api.listar('asignaturas'),
      cancionId ? api.obtener('canciones', cancionId) : Promise.resolve(null)
    ]);

    const esEdicion = Boolean(cancionExistente);
    const cancion = cancionExistente || {
      titulo: '',
      temaId: '',
      audio: '',
      letra: '',
      lrc: '',
      autoria: '',
      licencia: 'Propia'
    };

    // Resolver nombres de unidades y asignaturas para agrupar temas
    const asigMap = new Map((asignaturas || []).map((a) => [a.id, a.nombre]));
    const unidadMap = new Map((unidades || []).map((u) => [u.id, { titulo: u.titulo, asignaturaId: u.asignaturaId }]));

    const temasOpciones = (temas || []).map((t) => {
      const u = unidadMap.get(t.unidadId);
      const nombreAsig = u ? asigMap.get(u.asignaturaId) : '';
      const etiqueta = nombreAsig ? `[${nombreAsig}] ${t.titulo}` : t.titulo;
      return { id: t.id, titulo: etiqueta };
    });

    // Detectar licencia estándar u "Otra"
    const licenciasEstandar = ['Propia', 'CC BY', 'CC BY-SA'];
    let tipoLicencia = 'Propia';
    let descripcionOtraLicencia = '';

    if (cancion.licencia) {
      if (licenciasEstandar.includes(cancion.licencia)) {
        tipoLicencia = cancion.licencia;
      } else if (cancion.licencia.startsWith('Otra: ')) {
        tipoLicencia = 'Otra';
        descripcionOtraLicencia = cancion.licencia.slice(6).trim();
      } else {
        tipoLicencia = 'Otra';
        descripcionOtraLicencia = cancion.licencia.trim();
      }
    }

    contenedor.innerHTML = `
      <div class="pila" style="gap: var(--espacio-l);">
        <!-- Encabezado de la página -->
        <header class="fila" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--espacio-m);">
          <div class="fila" style="align-items: center; gap: var(--espacio-s);">
            <a href="/paginas/canciones.html" class="btn btn--pequeno btn--texto" style="padding-left: 0;">
              ← Volver a Canciones
            </a>
            <h1 style="font-size: var(--texto-xl); margin: 0;">
              ${esEdicion ? 'Editar Canción Educativa' : 'Nueva Canción Educativa'}
            </h1>
          </div>
          <button type="submit" form="formCancion" class="btn btn--primario" id="btnGuardar">
            💾 Guardar Canción
          </button>
        </header>

        <!-- Formulario en grid de 2 columnas -->
        <form id="formCancion" class="tarjeta editor-cancion-grid">
          <!-- Columna 1: Metadatos y Audio -->
          <div class="pila" style="gap: var(--espacio-m);">
            <div class="campo">
              <label for="inputTitulo">Título de la canción <span style="color: var(--color-error);">*</span></label>
              <input type="text" id="inputTitulo" value="${ui.escapar(cancion.titulo || '')}" placeholder="Ej. El ciclo de Krebs al ritmo del rock" required autofocus>
            </div>

            <div class="campo">
              <label for="selectTema">Tema educativo asociado <span style="color: var(--color-error);">*</span></label>
              <select id="selectTema" required>
                <option value="">Selecciona un tema formativo...</option>
                ${temasOpciones
                  .map((t) => `<option value="${ui.escapar(t.id)}" ${cancion.temaId === t.id ? 'selected' : ''}>${ui.escapar(t.titulo)}</option>`)
                  .join('')}
              </select>
            </div>

            <div class="campo">
              <label for="inputAudio">Archivo de audio MP3 <span style="color: var(--color-error);">*</span></label>
              <div class="fila" style="gap: var(--espacio-xs);">
                <input type="text" id="inputAudio" value="${ui.escapar(cancion.audio || '')}" placeholder="/recursos/subidas/cancion.mp3 o URL" required style="flex: 1;">
                <button type="button" class="btn btn--secundario" id="btnSubirAudio">
                  🎵 Subir MP3
                </button>
              </div>
              <div class="audio-preview-box" id="boxAudioPreview" style="display: ${cancion.audio ? 'flex' : 'none'};">
                <audio id="audioPreviewElement" controls src="${ui.escapar(cancion.audio || '')}" style="width: 100%;"></audio>
              </div>
            </div>

            <div class="campo">
              <label for="inputAutoria">Autoría (compositor, intérprete o docente) <span style="color: var(--color-error);">*</span></label>
              <input type="text" id="inputAutoria" value="${ui.escapar(cancion.autoria || '')}" placeholder="Ej. Profa. Ana Martínez / Coro Estudiantil" required>
            </div>

            <div class="campo">
              <label for="selectLicencia">Licencia de uso <span style="color: var(--color-error);">*</span></label>
              <select id="selectLicencia" required>
                <option value="Propia" ${tipoLicencia === 'Propia' ? 'selected' : ''}>Propia (Creación del docente/institución)</option>
                <option value="CC BY" ${tipoLicencia === 'CC BY' ? 'selected' : ''}>Creative Commons Atribución (CC BY)</option>
                <option value="CC BY-SA" ${tipoLicencia === 'CC BY-SA' ? 'selected' : ''}>Creative Commons CompartirIgual (CC BY-SA)</option>
                <option value="Otra" ${tipoLicencia === 'Otra' ? 'selected' : ''}>Otra licencia (especificar)</option>
              </select>
            </div>

            <div class="campo" id="campoOtraLicencia" style="display: ${tipoLicencia === 'Otra' ? 'flex' : 'none'};">
              <label for="inputOtraLicencia">Descripción de la licencia <span style="color: var(--color-error);">*</span></label>
              <input type="text" id="inputOtraLicencia" value="${ui.escapar(descripcionOtraLicencia)}" placeholder="Especifica los términos o licencia de uso...">
            </div>
          </div>

          <!-- Columna 2: Letra y Sincronización LRC -->
          <div class="pila" style="gap: var(--espacio-m);">
            <div class="campo">
              <label for="textareaLetra">Letra de la canción <span style="color: var(--color-error);">*</span></label>
              <textarea id="textareaLetra" rows="8" placeholder="Escribe aquí la letra completa de la canción..." required>${ui.escapar(cancion.letra || '')}</textarea>
            </div>

            <div class="campo">
              <div class="fila" style="justify-content: space-between; align-items: baseline;">
                <label for="textareaLrc">Letra sincronizada LRC (opcional)</label>
                <small style="color: var(--color-texto-suave);">Formato: [mm:ss.xx] texto</small>
              </div>
              <textarea id="textareaLrc" rows="8" class="textarea-lrc" placeholder="[00:12.50] Primera estrofa musical\n[00:18.20] Segunda estrofa explicativa...">${ui.escapar(cancion.lrc || '')}</textarea>
              <small style="color: var(--color-texto-suave);">
                Permite resaltar la línea de la canción en tiempo real mientras avanza el reproductor.
              </small>
            </div>
          </div>
        </form>
      </div>
    `;

    // DOM Elements
    const formCancion = document.getElementById('formCancion');
    const inputTitulo = document.getElementById('inputTitulo');
    const selectTema = document.getElementById('selectTema');
    const inputAudio = document.getElementById('inputAudio');
    const btnSubirAudio = document.getElementById('btnSubirAudio');
    const boxAudioPreview = document.getElementById('boxAudioPreview');
    const audioPreviewElement = document.getElementById('audioPreviewElement');
    const inputAutoria = document.getElementById('inputAutoria');
    const selectLicencia = document.getElementById('selectLicencia');
    const campoOtraLicencia = document.getElementById('campoOtraLicencia');
    const inputOtraLicencia = document.getElementById('inputOtraLicencia');
    const textareaLetra = document.getElementById('textareaLetra');
    const textareaLrc = document.getElementById('textareaLrc');

    // Licencia "Otra" toggle
    selectLicencia.addEventListener('change', () => {
      const esOtra = selectLicencia.value === 'Otra';
      campoOtraLicencia.style.display = esOtra ? 'flex' : 'none';
      if (esOtra) {
        inputOtraLicencia.setAttribute('required', 'required');
        inputOtraLicencia.focus();
      } else {
        inputOtraLicencia.removeAttribute('required');
      }
    });

    // Vista previa de audio cuando cambia URL
    inputAudio.addEventListener('input', () => {
      const url = inputAudio.value.trim();
      if (url) {
        audioPreviewElement.src = url;
        boxAudioPreview.style.display = 'flex';
      } else {
        boxAudioPreview.style.display = 'none';
      }
    });

    // Subir archivo MP3
    btnSubirAudio.addEventListener('click', () => {
      const inputArchivo = document.createElement('input');
      inputArchivo.type = 'file';
      inputArchivo.accept = '.mp3,audio/mpeg,audio/mp3';

      inputArchivo.onchange = async () => {
        const archivo = inputArchivo.files[0];
        if (!archivo) return;
        try {
          ui.cargando(true);
          const resp = await api.subir(archivo);
          if (resp && resp.url) {
            inputAudio.value = resp.url;
            audioPreviewElement.src = resp.url;
            boxAudioPreview.style.display = 'flex';
            ui.aviso('Audio subido con éxito', 'exito');
          }
        } catch (err) {
          ui.aviso(err.message || 'Error al subir el archivo de audio', 'error');
        } finally {
          ui.cargando(false);
        }
      };
      inputArchivo.click();
    });

    // Guardar canción
    formCancion.addEventListener('submit', async (e) => {
      e.preventDefault();

      const titulo = inputTitulo.value.trim();
      const temaId = selectTema.value;
      const audio = inputAudio.value.trim();
      const autoria = inputAutoria.value.trim();
      const letra = textareaLetra.value.trim();
      const lrc = textareaLrc.value.trim();

      let licencia = selectLicencia.value;
      if (licencia === 'Otra') {
        const descOtra = inputOtraLicencia.value.trim();
        if (!descOtra) {
          ui.aviso('Debes indicar la descripción de la licencia', 'error');
          inputOtraLicencia.focus();
          return;
        }
        licencia = `Otra: ${descOtra}`;
      }

      if (!titulo) {
        ui.aviso('El título de la canción es obligatorio', 'error');
        inputTitulo.focus();
        return;
      }

      if (!temaId) {
        ui.aviso('Debes asociar la canción a un tema educativo', 'error');
        selectTema.focus();
        return;
      }

      if (!audio) {
        ui.aviso('El archivo de audio MP3 es obligatorio', 'error');
        inputAudio.focus();
        return;
      }

      if (!letra) {
        ui.aviso('La letra de la canción es obligatoria', 'error');
        textareaLetra.focus();
        return;
      }

      if (!autoria) {
        ui.aviso('La autoría de la canción es obligatoria', 'error');
        inputAutoria.focus();
        return;
      }

      const datos = {
        titulo,
        temaId,
        audio,
        letra,
        lrc,
        autoria,
        licencia
      };

      try {
        ui.cargando(true);
        if (esEdicion) {
          await api.actualizar('canciones', cancionId, datos);
          ui.aviso('Canción actualizada con éxito', 'exito');
        } else {
          await api.crear('canciones', datos);
          ui.aviso('Canción creada con éxito', 'exito');
        }

        setTimeout(() => {
          window.location.href = `/paginas/canciones.html?temaId=${encodeURIComponent(temaId)}`;
        }, 500);
      } catch (err) {
        console.error('Error al guardar canción:', err);
        ui.aviso(err.message || 'Error al guardar la canción', 'error');
      } finally {
        ui.cargando(false);
      }
    });
  } catch (err) {
    console.error('Error al inicializar editor de canción:', err);
    contenedor.innerHTML = `
      <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Error al cargar editor</h2>
        <p style="color: var(--color-texto-suave);">${ui.escapar(err.message)}</p>
        <div>
          <a href="/paginas/canciones.html" class="btn btn--primario">Volver a Canciones</a>
        </div>
      </div>
    `;
  } finally {
    ui.cargando(false);
  }
}

inicializar();
