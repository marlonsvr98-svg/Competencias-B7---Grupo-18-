/**
 * publico/js/modulos/editor-tema.js
 * Ficha pedagógica del tema y gestión de glosario.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import * as util from '../nucleo/util.js';

await montarPlantilla({ titulo: 'Ficha del Tema', roles: ['docente', 'admin'] });

const contenedor = document.getElementById('contenido');
const temaId = util.parametro('id');

function contarPalabras(texto) {
  if (!texto || typeof texto !== 'string') return 0;
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

function esDeSeisLetras(termino) {
  if (!termino) return false;
  const limpio = util.normalizar(termino).replace(/[^A-ZÑ]/g, '');
  return limpio.length === 6;
}

if (!temaId) {
  if (contenedor) {
    contenedor.innerHTML = `
      <section class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Tema no especificado</h2>
        <p style="color: var(--color-texto-suave);">No se ha proporcionado el identificador del tema a editar.</p>
        <div>
          <a href="/paginas/editor-contenidos.html" class="btn btn--primario">Volver al Editor de Contenidos</a>
        </div>
      </section>
    `;
  }
} else {
  iniciarEditor();
}

async function iniciarEditor() {
  try {
    ui.cargando(true);
    const tema = await api.obtener('temas', temaId);
    let terminos = await api.listar('glosario', { temaId });
    terminos = (terminos || []).filter((t) => t.temaId === temaId);

    // Obtener información contextual de la unidad y asignatura
    let unidadTitulo = '';
    let asignaturaTitulo = '';
    try {
      const unidades = await api.listar('unidades');
      const unidad = unidades.find((u) => u.id === tema.unidadId);
      if (unidad) {
        unidadTitulo = unidad.titulo;
        const asignaturas = await api.listar('asignaturas');
        const asig = asignaturas.find((a) => a.id === unidad.asignaturaId);
        if (asig) asignaturaTitulo = asig.nombre;
      }
    } catch {
      // Información contextual opcional
    }

    renderizarInterfaz(tema, terminos, { unidadTitulo, asignaturaTitulo });
  } catch (err) {
    console.error('Error al cargar datos del tema:', err);
    if (contenedor) {
      contenedor.innerHTML = `
        <section class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
          <h2 style="color: var(--color-error);">Error al cargar tema</h2>
          <p style="color: var(--color-texto-suave);">${ui.escapar(err.message)}</p>
          <div>
            <a href="/paginas/editor-contenidos.html" class="btn btn--primario">Volver al Editor de Contenidos</a>
          </div>
        </section>
      `;
    }
  } finally {
    ui.cargando(false);
  }
}

function renderizarInterfaz(temaOriginal, terminosIniciales, contexto) {
  let tema = JSON.parse(JSON.stringify(temaOriginal));
  let terminos = [...terminosIniciales];
  let hayCambios = false;

  // Asegurar estructura de campos tipo lista
  if (!Array.isArray(tema.objetivos)) tema.objetivos = [];
  if (!Array.isArray(tema.ejemplos)) tema.ejemplos = [];
  if (!Array.isArray(tema.erroresFrecuentes)) tema.erroresFrecuentes = [];
  if (!Array.isArray(tema.preguntasGuia)) tema.preguntasGuia = [];
  if (!Array.isArray(tema.recursos)) tema.recursos = [];
  if (!Array.isArray(tema.palabrasClave)) tema.palabrasClave = [];

  contenedor.innerHTML = `
    <div class="pila" style="gap: var(--espacio-l);">
      <!-- Cabecera de navegación y acciones rápidas -->
      <header class="editor-tema__cabecera">
        <div class="pila" style="gap: 4px;">
          <div class="fila" style="align-items: center; gap: var(--espacio-s);">
            <a href="/paginas/editor-contenidos.html" id="enlaceVolver" class="btn btn--pequeno btn--texto" style="padding-left: 0;">
              ← Volver a Contenidos
            </a>
            ${contexto.asignaturaTitulo ? `<span class="insignia insignia--info" style="font-size: var(--texto-xs);">${ui.escapar(contexto.asignaturaTitulo)}</span>` : ''}
            ${contexto.unidadTitulo ? `<span class="insignia" style="font-size: var(--texto-xs);">${ui.escapar(contexto.unidadTitulo)}</span>` : ''}
          </div>
          <h1 style="font-size: var(--texto-xl); margin: 0;" id="cabeceraTituloTema">
            ${ui.escapar(tema.titulo || 'Tema sin título')}
          </h1>
        </div>

        <div class="fila" style="align-items: center; gap: var(--espacio-s);">
          <div class="campo" style="margin-bottom: 0;">
            <select id="selectEstadoCabecera" class="campo" style="margin-bottom: 0;">
              <option value="borrador" ${tema.estado === 'borrador' ? 'selected' : ''}>Borrador</option>
              <option value="publicado" ${tema.estado === 'publicado' ? 'selected' : ''}>Publicado</option>
            </select>
          </div>
          <button type="button" class="btn btn--primario" id="btnGuardarFicha">
            💾 Guardar Ficha
          </button>
        </div>
      </header>

      <!-- Pestañas de secciones: Ficha Pedagógica y Glosario -->
      <nav class="editor-tema__tabs" role="tablist">
        <button type="button" class="editor-tema__tab editor-tema__tab--activa" id="tabFicha" role="tab">
          📝 Ficha del Tema
        </button>
        <button type="button" class="editor-tema__tab" id="tabGlosario" role="tab">
          📖 Glosario (<span id="tabContadorGlosario">${terminos.length}</span>)
        </button>
      </nav>

      <!-- SECCIÓN 1: Ficha del Tema -->
      <section id="seccionFicha" class="editor-seccion editor-seccion--activa">
        <form id="formFicha" class="pila" style="gap: var(--espacio-l);">
          <!-- Título y metadatos básicos -->
          <div class="tarjeta pila" style="gap: var(--espacio-m);">
            <h3 style="font-size: var(--texto-m); margin: 0;">Información General</h3>
            <div class="grid-2-col">
              <div class="campo">
                <label for="inputTitulo">Título del tema <span style="color: var(--color-error);">*</span></label>
                <input type="text" id="inputTitulo" value="${ui.escapar(tema.titulo || '')}" required>
              </div>
              <div class="campo">
                <label for="selectDificultad">Dificultad</label>
                <select id="selectDificultad">
                  <option value="baja" ${tema.dificultad === 'baja' ? 'selected' : ''}>Baja</option>
                  <option value="media" ${tema.dificultad === 'media' || !tema.dificultad ? 'selected' : ''}>Media</option>
                  <option value="alta" ${tema.dificultad === 'alta' ? 'selected' : ''}>Alta</option>
                </select>
              </div>
            </div>

            <div class="grid-2-col">
              <div class="campo">
                <label for="inputPalabrasClave">Palabras clave (separadas por comas)</label>
                <input type="text" id="inputPalabrasClave" value="${ui.escapar(tema.palabrasClave.join(', '))}" placeholder="ej. celula, organelo, membrana">
              </div>
              <div class="campo">
                <label for="inputFuentes">Fuentes bibliográficas o curriculares</label>
                <input type="text" id="inputFuentes" value="${ui.escapar(tema.fuentes || '')}" placeholder="ej. Currículo Nacional de Ciencias Naturales">
              </div>
            </div>
          </div>

          <!-- Resumen con contador de palabras y formato básico -->
          <div class="tarjeta pila" style="gap: var(--espacio-s);">
            <div class="fila" style="justify-content: space-between; align-items: center;">
              <div>
                <h3 style="font-size: var(--texto-m); margin: 0;">Resumen del Tema</h3>
                <small style="color: var(--color-texto-suave);">
                  Admite texto con formato básico (**negrita**, saltos de párrafo y listas con "- ").
                </small>
              </div>
              <button type="button" class="btn btn--pequeno btn--texto" id="btnTogglePreviewResumen">
                👁️ Ver vista previa
              </button>
            </div>

            <div class="campo" style="margin-bottom: 0;">
              <textarea id="textareaResumen" rows="8" placeholder="Escribe el resumen conceptual del tema...">${ui.escapar(tema.resumen || '')}</textarea>
              <div class="contador-palabras" id="resumenContadorWrapper">
                <span id="contadorResumenTexto">0 palabras</span>
                <span style="color: var(--color-texto-suave);">Recomendado: 300 a 800 palabras</span>
              </div>
            </div>

            <div id="previewResumenContenedor" class="vista-previa-resumen" style="display: none;"></div>
          </div>

          <!-- Objetivos de Aprendizaje -->
          <div class="tarjeta pila" style="gap: var(--espacio-s);">
            <div class="fila" style="justify-content: space-between; align-items: center;">
              <h3 style="font-size: var(--texto-m); margin: 0;">Objetivos de Aprendizaje</h3>
              <button type="button" class="btn btn--pequeno btn--secundario" id="btnAgregarObjetivo">
                + Agregar objetivo
              </button>
            </div>
            <div id="listaObjetivos" class="lista-dinamica"></div>
          </div>

          <!-- Ejemplos y Errores Frecuentes (Grid 2 columnas) -->
          <div class="grid-2-col">
            <!-- Ejemplos -->
            <div class="tarjeta pila" style="gap: var(--espacio-s);">
              <div class="fila" style="justify-content: space-between; align-items: center;">
                <h3 style="font-size: var(--texto-m); margin: 0;">Ejemplos</h3>
                <button type="button" class="btn btn--pequeno btn--secundario" id="btnAgregarEjemplo">
                  + Agregar ejemplo
                </button>
              </div>
              <div id="listaEjemplos" class="lista-dinamica"></div>
            </div>

            <!-- Errores Frecuentes -->
            <div class="tarjeta pila" style="gap: var(--espacio-s);">
              <div class="fila" style="justify-content: space-between; align-items: center;">
                <h3 style="font-size: var(--texto-m); margin: 0;">Errores Frecuentes</h3>
                <button type="button" class="btn btn--pequeno btn--secundario" id="btnAgregarError">
                  + Agregar error
                </button>
              </div>
              <div id="listaErrores" class="lista-dinamica"></div>
            </div>
          </div>

          <!-- Preguntas Guía -->
          <div class="tarjeta pila" style="gap: var(--espacio-s);">
            <div class="fila" style="justify-content: space-between; align-items: center;">
              <h3 style="font-size: var(--texto-m); margin: 0;">Preguntas Guía</h3>
              <button type="button" class="btn btn--pequeno btn--secundario" id="btnAgregarPregunta">
                + Agregar pregunta
              </button>
            </div>
            <div id="listaPreguntas" class="lista-dinamica"></div>
          </div>

          <!-- Recursos Educativos -->
          <div class="tarjeta pila" style="gap: var(--espacio-m);">
            <div class="fila" style="justify-content: space-between; align-items: center;">
              <div>
                <h3 style="font-size: var(--texto-m); margin: 0;">Recursos Didácticos</h3>
                <small style="color: var(--color-texto-suave);">Videos, documentos PDF, imágenes o enlaces externos.</small>
              </div>
              <button type="button" class="btn btn--pequeno btn--secundario" id="btnAgregarRecurso">
                + Agregar recurso
              </button>
            </div>
            <div id="listaRecursos" class="recursos-lista"></div>
          </div>
        </form>
      </section>

      <!-- SECCIÓN 2: Glosario -->
      <section id="seccionGlosario" class="editor-seccion">
        <!-- Banner de indicadores y aptitud para juegos -->
        <div class="glosario-banner">
          <div class="glosario-stats">
            <div>
              <span style="font-weight: var(--peso-seminegrita);">Total términos:</span>
              <span id="statTotalTerminos" class="insignia insignia--info" style="font-size: var(--texto-s);">0</span>
            </div>
            <div>
              <span style="font-weight: var(--peso-seminegrita);">Palabras de 6 letras:</span>
              <span id="statSeisLetras" class="insignia" style="font-size: var(--texto-s);">0</span>
            </div>
            <div id="indicadorJuegosWrapper"></div>
          </div>

          <div class="fila" style="gap: var(--espacio-s);">
            <button type="button" class="btn btn--secundario" id="btn-generar-ia" disabled title="Disponible próximamente con IA (Sprint 7)">
              ✨ Generar con IA
            </button>
            <button type="button" class="btn btn--primario" id="btnAgregarTermino">
              + Agregar Término
            </button>
          </div>
        </div>

        <!-- Tabla de Glosario -->
        <div class="tarjeta" style="padding: 0; overflow: hidden;">
          <div class="tabla-contenedor" style="margin: 0;">
            <table class="tabla tabla--borde" style="margin: 0; width: 100%;">
              <thead>
                <tr>
                  <th style="min-width: 140px;">Término</th>
                  <th>Definición (≤ 25 palabras)</th>
                  <th>Pista (≤ 10 palabras)</th>
                  <th>Retroalimentación</th>
                  <th style="width: 110px; text-align: center;">Acciones</th>
                </tr>
              </thead>
              <tbody id="tbodyGlosario">
                <!-- Filas dinámicas -->
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  `;

  // Elementos DOM
  const tabFicha = document.getElementById('tabFicha');
  const tabGlosario = document.getElementById('tabGlosario');
  const seccionFicha = document.getElementById('seccionFicha');
  const seccionGlosario = document.getElementById('seccionGlosario');
  const btnGuardarFicha = document.getElementById('btnGuardarFicha');
  const enlaceVolver = document.getElementById('enlaceVolver');
  const inputTitulo = document.getElementById('inputTitulo');
  const cabeceraTituloTema = document.getElementById('cabeceraTituloTema');
  const selectEstadoCabecera = document.getElementById('selectEstadoCabecera');
  const selectDificultad = document.getElementById('selectDificultad');
  const inputPalabrasClave = document.getElementById('inputPalabrasClave');
  const inputFuentes = document.getElementById('inputFuentes');
  const textareaResumen = document.getElementById('textareaResumen');
  const contadorResumenTexto = document.getElementById('contadorResumenTexto');
  const btnTogglePreviewResumen = document.getElementById('btnTogglePreviewResumen');
  const previewResumenContenedor = document.getElementById('previewResumenContenedor');

  // Contenedores dinámicos
  const listaObjetivosEl = document.getElementById('listaObjetivos');
  const listaEjemplosEl = document.getElementById('listaEjemplos');
  const listaErroresEl = document.getElementById('listaErrores');
  const listaPreguntasEl = document.getElementById('listaPreguntas');
  const listaRecursosEl = document.getElementById('listaRecursos');

  // Glosario DOM
  const tbodyGlosario = document.getElementById('tbodyGlosario');
  const statTotalTerminos = document.getElementById('statTotalTerminos');
  const statSeisLetras = document.getElementById('statSeisLetras');
  const indicadorJuegosWrapper = document.getElementById('indicadorJuegosWrapper');
  const tabContadorGlosario = document.getElementById('tabContadorGlosario');
  const btnAgregarTermino = document.getElementById('btnAgregarTermino');

  // Control de pestañas
  tabFicha.addEventListener('click', () => {
    tabFicha.classList.add('editor-tema__tab--activa');
    tabGlosario.classList.remove('editor-tema__tab--activa');
    seccionFicha.classList.add('editor-seccion--activa');
    seccionGlosario.classList.remove('editor-seccion--activa');
  });

  tabGlosario.addEventListener('click', () => {
    tabGlosario.classList.add('editor-tema__tab--activa');
    tabFicha.classList.remove('editor-tema__tab--activa');
    seccionGlosario.classList.add('editor-seccion--activa');
    seccionFicha.classList.remove('editor-seccion--activa');
  });

  // Avisar si intenta salir con cambios sin guardar
  window.addEventListener('beforeunload', (e) => {
    if (hayCambios) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  enlaceVolver.addEventListener('click', async (e) => {
    if (hayCambios) {
      e.preventDefault();
      const continuar = await ui.confirmar('Tienes modificaciones sin guardar en la ficha. ¿Seguro que deseas salir?');
      if (continuar) {
        hayCambios = false;
        window.location.href = '/paginas/editor-contenidos.html';
      }
    }
  });

  // Marcador de cambios en inputs básicos
  function registrarCambio() {
    hayCambios = true;
  }

  inputTitulo.addEventListener('input', () => {
    registrarCambio();
    cabeceraTituloTema.textContent = inputTitulo.value.trim() || 'Tema sin título';
  });
  selectEstadoCabecera.addEventListener('change', registrarCambio);
  selectDificultad.addEventListener('change', registrarCambio);
  inputPalabrasClave.addEventListener('input', registrarCambio);
  inputFuentes.addEventListener('input', registrarCambio);

  // Contador de palabras del resumen
  function actualizarContadorResumen() {
    const total = contarPalabras(textareaResumen.value);
    contadorResumenTexto.textContent = `${total} ${total === 1 ? 'palabra' : 'palabras'}`;
    if (total >= 300 && total <= 800) {
      contadorResumenTexto.className = 'contador-palabras--optimo';
    } else if (total > 0 && total < 300) {
      contadorResumenTexto.className = 'contador-palabras--alerta';
    } else if (total > 800) {
      contadorResumenTexto.className = 'contador-palabras--fuera';
    } else {
      contadorResumenTexto.className = '';
    }
  }

  textareaResumen.addEventListener('input', () => {
    registrarCambio();
    actualizarContadorResumen();
    if (previewResumenContenedor.style.display !== 'none') {
      previewResumenContenedor.innerHTML = util.formatoBasico(textareaResumen.value) || '<em>Sin contenido</em>';
    }
  });
  actualizarContadorResumen();

  // Toggle vista previa del resumen
  btnTogglePreviewResumen.addEventListener('click', () => {
    const estaVisible = previewResumenContenedor.style.display !== 'none';
    if (estaVisible) {
      previewResumenContenedor.style.display = 'none';
      btnTogglePreviewResumen.textContent = '👁️ Ver vista previa';
    } else {
      previewResumenContenedor.innerHTML = util.formatoBasico(textareaResumen.value) || '<em>Sin contenido</em>';
      previewResumenContenedor.style.display = 'block';
      btnTogglePreviewResumen.textContent = '🙈 Ocultar vista previa';
    }
  });

  // ==========================================
  // Renderizadores de Listas Dinámicas
  // ==========================================
  function renderizarListaSimple(contenedorEl, items, placeholder, alCambiar) {
    contenedorEl.innerHTML = '';
    if (items.length === 0) {
      contenedorEl.innerHTML = `<span style="color: var(--color-texto-suave); font-size: var(--texto-xs);">No hay elementos agregados.</span>`;
      return;
    }

    items.forEach((valor, idx) => {
      const fila = document.createElement('div');
      fila.className = 'lista-dinamica__item';
      fila.innerHTML = `
        <input type="text" value="${ui.escapar(valor || '')}" placeholder="${ui.escapar(placeholder)}">
        <button type="button" class="btn-icono-accion btn-quitar-item" title="Quitar elemento">🗑️</button>
      `;

      const input = fila.querySelector('input');
      input.addEventListener('input', () => {
        items[idx] = input.value;
        registrarCambio();
        if (alCambiar) alCambiar();
      });

      const btnQuitar = fila.querySelector('.btn-quitar-item');
      btnQuitar.addEventListener('click', () => {
        items.splice(idx, 1);
        registrarCambio();
        renderizarListaSimple(contenedorEl, items, placeholder, alCambiar);
      });

      contenedorEl.appendChild(fila);
    });
  }

  // 1. Objetivos
  document.getElementById('btnAgregarObjetivo').addEventListener('click', () => {
    tema.objetivos.push('');
    registrarCambio();
    renderizarListaSimple(listaObjetivosEl, tema.objetivos, 'Ej. Identificar partes de la célula');
  });
  renderizarListaSimple(listaObjetivosEl, tema.objetivos, 'Ej. Identificar partes de la célula');

  // 2. Ejemplos
  document.getElementById('btnAgregarEjemplo').addEventListener('click', () => {
    tema.ejemplos.push('');
    registrarCambio();
    renderizarListaSimple(listaEjemplosEl, tema.ejemplos, 'Ej. Célula vegetal y animal');
  });
  renderizarListaSimple(listaEjemplosEl, tema.ejemplos, 'Ej. Célula vegetal y animal');

  // 3. Errores Frecuentes
  document.getElementById('btnAgregarError').addEventListener('click', () => {
    tema.erroresFrecuentes.push('');
    registrarCambio();
    renderizarListaSimple(listaErroresEl, tema.erroresFrecuentes, 'Ej. Confundir virus con células');
  });
  renderizarListaSimple(listaErroresEl, tema.erroresFrecuentes, 'Ej. Confundir virus con células');

  // 4. Preguntas Guía
  document.getElementById('btnAgregarPregunta').addEventListener('click', () => {
    tema.preguntasGuia.push('');
    registrarCambio();
    renderizarListaSimple(listaPreguntasEl, tema.preguntasGuia, 'Ej. ¿Por qué la célula es la unidad fundamental?');
  });
  renderizarListaSimple(listaPreguntasEl, tema.preguntasGuia, 'Ej. ¿Por qué la célula es la unidad fundamental?');

  // 5. Recursos didácticos
  function renderizarRecursos() {
    listaRecursosEl.innerHTML = '';
    if (tema.recursos.length === 0) {
      listaRecursosEl.innerHTML = `<span style="color: var(--color-texto-suave); font-size: var(--texto-xs);">No hay recursos agregados aún.</span>`;
      return;
    }

    tema.recursos.forEach((rec, idx) => {
      const card = document.createElement('div');
      card.className = 'recurso-card';

      const esArchivoSubible = rec.tipo === 'pdf' || rec.tipo === 'imagen';

      card.innerHTML = `
        <div class="campo-inline" style="max-width: 130px;">
          <select class="campo campo-tipo-recurso">
            <option value="video" ${rec.tipo === 'video' ? 'selected' : ''}>Video</option>
            <option value="pdf" ${rec.tipo === 'pdf' || rec.tipo === 'lectura' ? 'selected' : ''}>PDF</option>
            <option value="imagen" ${rec.tipo === 'imagen' ? 'selected' : ''}>Imagen</option>
            <option value="enlace" ${rec.tipo === 'enlace' ? 'selected' : ''}>Enlace</option>
          </select>
        </div>
        <div class="campo-inline" style="flex: 2;">
          <input type="text" class="campo campo-titulo-recurso" placeholder="Título descriptivo del recurso" value="${ui.escapar(rec.titulo || '')}">
        </div>
        <div class="campo-inline" style="flex: 2;">
          <input type="text" class="campo campo-url-recurso" placeholder="URL o enlace del recurso" value="${ui.escapar(rec.url || '')}">
        </div>
        <div class="fila" style="align-items: center; gap: var(--espacio-xs);">
          <button type="button" class="btn btn--pequeno btn--secundario btn-subir-recurso" ${esArchivoSubible ? '' : 'style="display: none;"'}>
            📁 Subir
          </button>
          <button type="button" class="btn-icono-accion btn-quitar-recurso" title="Quitar recurso">
            🗑️
          </button>
        </div>
      `;

      const selectTipo = card.querySelector('.campo-tipo-recurso');
      const inputTituloRec = card.querySelector('.campo-titulo-recurso');
      const inputUrlRec = card.querySelector('.campo-url-recurso');
      const btnSubir = card.querySelector('.btn-subir-recurso');
      const btnQuitar = card.querySelector('.btn-quitar-recurso');

      selectTipo.addEventListener('change', () => {
        rec.tipo = selectTipo.value;
        const subible = rec.tipo === 'pdf' || rec.tipo === 'imagen';
        btnSubir.style.display = subible ? 'inline-flex' : 'none';
        registrarCambio();
      });

      inputTituloRec.addEventListener('input', () => {
        rec.titulo = inputTituloRec.value;
        registrarCambio();
      });

      inputUrlRec.addEventListener('input', () => {
        rec.url = inputUrlRec.value;
        registrarCambio();
      });

      btnSubir.addEventListener('click', () => {
        const inputArchivo = document.createElement('input');
        inputArchivo.type = 'file';
        inputArchivo.accept = rec.tipo === 'imagen'
          ? 'image/jpeg,image/png,image/webp'
          : 'application/pdf,image/jpeg,image/png,image/webp';

        inputArchivo.onchange = async () => {
          const archivo = inputArchivo.files[0];
          if (!archivo) return;
          try {
            ui.cargando(true);
            const resp = await api.subir(archivo);
            if (resp && resp.url) {
              rec.url = resp.url;
              inputUrlRec.value = resp.url;
              registrarCambio();
              ui.aviso('Archivo subido con éxito', 'exito');
            }
          } catch (err) {
            ui.aviso(err.message || 'Error al subir archivo', 'error');
          } finally {
            ui.cargando(false);
          }
        };
        inputArchivo.click();
      });

      btnQuitar.addEventListener('click', () => {
        tema.recursos.splice(idx, 1);
        registrarCambio();
        renderizarRecursos();
      });

      listaRecursosEl.appendChild(card);
    });
  }

  document.getElementById('btnAgregarRecurso').addEventListener('click', () => {
    tema.recursos.push({ tipo: 'video', titulo: '', url: '' });
    registrarCambio();
    renderizarRecursos();
  });
  renderizarRecursos();

  // Guardar Ficha
  async function guardarFicha() {
    const tituloNuevo = inputTitulo.value.trim();
    if (!tituloNuevo) {
      ui.aviso('El título del tema es obligatorio', 'error');
      inputTitulo.focus();
      return;
    }

    const palabrasClaveArray = inputPalabrasClave.value
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const datosActualizados = {
      titulo: tituloNuevo,
      estado: selectEstadoCabecera.value,
      dificultad: selectDificultad.value,
      palabrasClave: palabrasClaveArray,
      fuentes: inputFuentes.value.trim(),
      resumen: textareaResumen.value.trim(),
      objetivos: tema.objetivos.map((o) => o.trim()).filter(Boolean),
      ejemplos: tema.ejemplos.map((e) => e.trim()).filter(Boolean),
      erroresFrecuentes: tema.erroresFrecuentes.map((ef) => ef.trim()).filter(Boolean),
      preguntasGuia: tema.preguntasGuia.map((pg) => pg.trim()).filter(Boolean),
      recursos: tema.recursos.filter((r) => r.titulo.trim() || r.url.trim())
    };

    try {
      ui.cargando(true);
      await api.actualizar('temas', temaId, datosActualizados);
      hayCambios = false;
      ui.aviso('Ficha del tema guardada con éxito', 'exito');
    } catch (err) {
      console.error('Error al guardar ficha:', err);
      ui.aviso(err.message || 'Error al guardar cambios', 'error');
    } finally {
      ui.cargando(false);
    }
  }

  btnGuardarFicha.addEventListener('click', guardarFicha);

  // ==========================================
  // Sección de Glosario
  // ==========================================
  function actualizarEstadisticasGlosario() {
    const total = terminos.length;
    const seisLetras = terminos.filter((t) => esDeSeisLetras(t.termino)).length;

    statTotalTerminos.textContent = total;
    statSeisLetras.textContent = seisLetras;
    tabContadorGlosario.textContent = total;

    const aptoParaJuegos = total >= 12 && seisLetras >= 3;
    if (aptoParaJuegos) {
      indicadorJuegosWrapper.innerHTML = `
        <span class="insignia insignia--exito" title="Cumple con el mínimo de 12 términos y al menos 3 de 6 letras">
          🎮 Apto para juegos
        </span>
      `;
    } else {
      indicadorJuegosWrapper.innerHTML = `
        <span class="insignia insignia--advertencia" title="Se requieren al menos 12 términos y 3 de 6 letras para habilitar actividades de juego">
          ⚠️ Requiere mín. 12 términos (${total}/12) y 3 de 6 letras (${seisLetras}/3)
        </span>
      `;
    }
  }

  function renderizarTablaGlosario() {
    actualizarEstadisticasGlosario();

    if (terminos.length === 0) {
      tbodyGlosario.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--color-texto-suave); padding: var(--espacio-l);">
            No hay términos en el glosario de este tema. Pulsa "+ Agregar Término" para registrar el primero.
          </td>
        </tr>
      `;
      return;
    }

    tbodyGlosario.innerHTML = terminos
      .map((t) => {
        const idEscapado = ui.escapar(t.id);
        const terminoEscapado = ui.escapar(t.termino || '');
        const definicionEscapada = ui.escapar(t.definicion || '');
        const pistaEscapada = ui.escapar(t.pista || '');
        const retroEscapada = ui.escapar(t.retroalimentacion || '');
        const tieneSeis = esDeSeisLetras(t.termino);

        return `
          <tr data-id="${idEscapado}">
            <td>
              <div class="fila" style="align-items: center; gap: var(--espacio-xs);">
                <strong>${terminoEscapado}</strong>
                ${tieneSeis ? `<span class="insignia insignia--info" style="font-size: 10px;" title="Palabra de 6 letras">6L</span>` : ''}
              </div>
            </td>
            <td><small>${definicionEscapada}</small></td>
            <td><small>${pistaEscapada}</small></td>
            <td><small>${retroEscapada}</small></td>
            <td style="text-align: center;">
              <div class="fila" style="justify-content: center; gap: var(--espacio-xs);">
                <button type="button" class="btn-icono-accion btn-editar-termino" data-id="${idEscapado}" title="Editar término">
                  ✏️
                </button>
                <button type="button" class="btn-icono-accion btn-eliminar-termino" data-id="${idEscapado}" title="Eliminar término">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    // Eventos editar término
    tbodyGlosario.querySelectorAll('.btn-editar-termino').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = terminos.find((t) => t.id === id);
        if (item) modalFormularioTermino(item);
      });
    });

    // Eventos eliminar término
    tbodyGlosario.querySelectorAll('.btn-eliminar-termino').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const item = terminos.find((t) => t.id === id);
        if (!item) return;

        const confirma = await ui.confirmar(`¿Deseas eliminar el término "${item.termino}" del glosario?`);
        if (!confirma) return;

        try {
          ui.cargando(true);
          await api.eliminar('glosario', id);
          terminos = terminos.filter((t) => t.id !== id);
          ui.aviso('Término eliminado del glosario', 'info');
          renderizarTablaGlosario();
        } catch (err) {
          ui.aviso(err.message || 'Error al eliminar término', 'error');
        } finally {
          ui.cargando(false);
        }
      });
    });
  }

  // Modal para agregar o editar término de glosario
  async function modalFormularioTermino(terminoExistente = null) {
    const esEdicion = Boolean(terminoExistente);
    const formDiv = document.createElement('div');
    formDiv.className = 'pila';
    formDiv.style.gap = 'var(--espacio-m)';

    formDiv.innerHTML = `
      <div class="campo">
        <label for="modalTermino">Término <span style="color: var(--color-error);">*</span></label>
        <input type="text" id="modalTermino" value="${ui.escapar(terminoExistente?.termino || '')}" placeholder="Ej. Mitocondria" required autofocus>
      </div>

      <div class="campo">
        <label for="modalDefinicion">Definición (máximo 25 palabras) <span style="color: var(--color-error);">*</span></label>
        <textarea id="modalDefinicion" rows="3" placeholder="Definición precisa y comprensible...">${ui.escapar(terminoExistente?.definicion || '')}</textarea>
        <div class="contador-palabras">
          <span id="contadorDefinicionPalabras">0 / 25 palabras</span>
        </div>
      </div>

      <div class="campo">
        <label for="modalPista">Pista para juegos (máximo 10 palabras) <span style="color: var(--color-error);">*</span></label>
        <input type="text" id="modalPista" value="${ui.escapar(terminoExistente?.pista || '')}" placeholder="Ej. Central energética de la célula">
        <div class="contador-palabras">
          <span id="contadorPistaPalabras">0 / 10 palabras</span>
        </div>
      </div>

      <div class="campo">
        <label for="modalRetro">Retroalimentación didáctica</label>
        <textarea id="modalRetro" rows="2" placeholder="Explicación formativa cuando el estudiante acierta...">${ui.escapar(terminoExistente?.retroalimentacion || '')}</textarea>
      </div>
    `;

    const inputTermino = formDiv.querySelector('#modalTermino');
    const textareaDefinicion = formDiv.querySelector('#modalDefinicion');
    const inputPista = formDiv.querySelector('#modalPista');
    const textareaRetro = formDiv.querySelector('#modalRetro');
    const contadorDef = formDiv.querySelector('#contadorDefinicionPalabras');
    const contadorPis = formDiv.querySelector('#contadorPistaPalabras');

    function actualizarContadoresModal() {
      const cantDef = contarPalabras(textareaDefinicion.value);
      contadorDef.textContent = `${cantDef} / 25 palabras`;
      contadorDef.style.color = cantDef > 25 ? 'var(--color-error)' : 'var(--color-texto-suave)';

      const cantPis = contarPalabras(inputPista.value);
      contadorPis.textContent = `${cantPis} / 10 palabras`;
      contadorPis.style.color = cantPis > 10 ? 'var(--color-error)' : 'var(--color-texto-suave)';
    }

    textareaDefinicion.addEventListener('input', actualizarContadoresModal);
    inputPista.addEventListener('input', actualizarContadoresModal);
    actualizarContadoresModal();

    const accion = await ui.modal({
      titulo: esEdicion ? 'Editar Término del Glosario' : 'Nuevo Término del Glosario',
      contenido: formDiv,
      acciones: [
        { texto: 'Cancelar', valor: 'cancelar', clase: 'btn--secundario' },
        { texto: esEdicion ? 'Actualizar' : 'Agregar', valor: 'guardar', primario: true }
      ]
    });

    if (accion !== 'guardar') return;

    const terminoVal = inputTermino.value.trim();
    const definicionVal = textareaDefinicion.value.trim();
    const pistaVal = inputPista.value.trim();
    const retroVal = textareaRetro.value.trim();

    if (!terminoVal) {
      ui.aviso('El término es obligatorio', 'error');
      return;
    }

    const palabrasDef = contarPalabras(definicionVal);
    if (!definicionVal || palabrasDef > 25) {
      ui.aviso(`La definición es obligatoria y debe tener máximo 25 palabras (actual: ${palabrasDef})`, 'error');
      return;
    }

    const palabrasPis = contarPalabras(pistaVal);
    if (!pistaVal || palabrasPis > 10) {
      ui.aviso(`La pista es obligatoria y debe tener máximo 10 palabras (actual: ${palabrasPis})`, 'error');
      return;
    }

    try {
      ui.cargando(true);
      if (esEdicion) {
        const datosActualizar = {
          termino: terminoVal,
          definicion: definicionVal,
          pista: pistaVal,
          retroalimentacion: retroVal
        };
        const resp = await api.actualizar('glosario', terminoExistente.id, datosActualizar);
        const index = terminos.findIndex((t) => t.id === terminoExistente.id);
        if (index !== -1) {
          terminos[index] = { ...terminos[index], ...resp, ...datosActualizar };
        }
        ui.aviso('Término actualizado con éxito', 'exito');
      } else {
        const datosCrear = {
          temaId,
          termino: terminoVal,
          definicion: definicionVal,
          pista: pistaVal,
          retroalimentacion: retroVal,
          origen: 'docente',
          estado: 'aprobado'
        };
        const nuevo = await api.crear('glosario', datosCrear);
        terminos.push(nuevo);
        ui.aviso('Término agregado al glosario', 'exito');
      }
      renderizarTablaGlosario();
    } catch (err) {
      console.error('Error al guardar término de glosario:', err);
      ui.aviso(err.message || 'Error al guardar término', 'error');
    } finally {
      ui.cargando(false);
    }
  }

  btnAgregarTermino.addEventListener('click', () => modalFormularioTermino());

  // Render inicial de la tabla
  renderizarTablaGlosario();
}
