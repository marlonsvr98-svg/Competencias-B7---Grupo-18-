/**
 * publico/js/modulos/asignatura.js
 * Detalle de una asignatura: unidades visibles y sus temas publicados con estado de avance,
 * e integración completa del Tutor Virtual Socrático contextualizado al currículo.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import * as util from '../nucleo/util.js';

await montarPlantilla({ titulo: 'Asignatura', roles: ['estudiante', 'docente', 'admin'] });

const contenedor = document.getElementById('contenido');
const asignaturaId = util.parametro('id');

if (!asignaturaId) {
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Asignatura no especificada</h2>
        <p style="color: var(--color-texto-suave);">No se ha indicado el identificador de la asignatura.</p>
        <div>
          <a href="/paginas/asignaturas.html" class="btn btn--primario">Volver a Mis Asignaturas</a>
        </div>
      </div>
    `;
  }
} else {
  cargarAsignatura();
}

async function cargarAsignatura() {
  try {
    ui.cargando(true);

    const [asignatura, todasUnidades, todosTemas, progreso] = await Promise.all([
      api.obtener('asignaturas', asignaturaId),
      api.listar('unidades'),
      api.listar('temas'),
      api.listar('progreso-temas')
    ]);

    // Filtrar unidades visibles de la asignatura
    const unidades = (todasUnidades || [])
      .filter((u) => u && u.asignaturaId === asignaturaId && u.visible !== false)
      .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));

    const unidadIds = new Set(unidades.map((u) => u.id));

    // Filtrar temas publicados pertenecientes a las unidades visibles
    const temas = (todosTemas || [])
      .filter((t) => t && unidadIds.has(t.unidadId) && t.estado === 'publicado')
      .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));

    const revisadosSet = new Set((progreso || []).map((p) => p.temaId));

    // Calcular estadísticas globales
    const totalTemas = temas.length;
    const temasRevisados = temas.filter((t) => revisadosSet.has(t.id)).length;
    const porcentajeGlobal = totalTemas > 0 ? Math.round((temasRevisados / totalTemas) * 100) : 0;

    contenedor.innerHTML = `
      <div class="pila" style="gap: var(--espacio-l);">
        <!-- Navegación y Cabecera de Asignatura -->
        <header class="asignatura-cabecera">
          <div class="fila" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--espacio-s);">
            <a href="/paginas/asignaturas.html" class="btn btn--pequeno btn--texto" style="padding-left: 0;">
              ← Volver a Mis Asignaturas
            </a>
            <span class="insignia insignia--info" style="font-size: var(--texto-xs);">
              ${ui.escapar(asignatura.nivel || 'Educación General')}
            </span>
          </div>

          <div>
            <h1 style="font-size: var(--texto-xl); margin: 0; color: var(--color-primario);">
              ${ui.escapar(asignatura.nombre || 'Asignatura')}
            </h1>
            <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin-top: var(--espacio-xs);">
              ${ui.escapar(asignatura.descripcion || 'Sin descripción disponible.')}
            </p>
          </div>

          <div class="pila" style="gap: var(--espacio-xs); padding-top: var(--espacio-s); border-top: 1px solid var(--color-borde);">
            <div class="fila" style="justify-content: space-between; align-items: center; font-size: var(--texto-xs);">
              <span style="font-weight: var(--peso-seminegrita);">Progreso general de la materia</span>
              <strong>${porcentajeGlobal}% (${temasRevisados} de ${totalTemas} temas revisados)</strong>
            </div>
            <div class="progreso">
              <div class="progreso__barra" style="width: ${porcentajeGlobal}%;"></div>
            </div>
          </div>
        </header>

        <!-- Banner Hero del Tutor Virtual Socrático -->
        <aside class="tutor-banner-hero fila" style="justify-content: space-between; align-items: center; gap: var(--espacio-m); flex-wrap: wrap;">
          <div class="fila" style="align-items: center; gap: var(--espacio-m);">
            <div class="tutor-banner-icono" aria-hidden="true">🦉</div>
            <div class="pila" style="gap: var(--espacio-xs);">
              <div class="fila" style="align-items: center; gap: var(--espacio-xs);">
                <strong style="color: var(--color-primario); font-size: var(--texto-base);">Tutor Virtual Socrático</strong>
                <span class="insignia insignia--exito" style="font-size: 10px;">Activo · IA</span>
              </div>
              <p style="margin: 0; color: var(--color-texto-suave); font-size: var(--texto-s);">
                Aprende razonando paso a paso mediante preguntas orientadoras y pistas exclusivas de <strong>${ui.escapar(asignatura.nombre || 'esta asignatura')}</strong>.
              </p>
            </div>
          </div>
          <div class="fila" style="gap: var(--espacio-xs); flex-wrap: wrap;">
            <a href="/paginas/escape-cuerpo.html" class="btn btn--secundario btn--pequeno">
              🔬 Escape del cuerpo humano
            </a>
            <button id="btnAbrirTutorHero" class="btn btn--primario btn--pequeno" type="button">
              <span>💬 Conversar con el Tutor</span>
            </button>
          </div>
        </aside>

        <!-- Listado de Unidades Visibles -->
        <section class="asignatura-unidades">
          ${
            unidades.length === 0
              ? `
              <div class="tarjeta pila" style="text-align: center; padding: var(--espacio-xl); gap: var(--espacio-m);">
                <p style="color: var(--color-texto-suave);">No hay unidades de aprendizaje disponibles para esta asignatura en este momento.</p>
              </div>
            `
              : unidades
                  .map((unidad, idxUnidad) => {
                    const idUnidadEscapado = ui.escapar(unidad.id);
                    const tituloUnidadEscapado = ui.escapar(unidad.titulo || 'Unidad');
                    const temasDeUnidad = temas.filter((t) => t.unidadId === unidad.id);

                    const revsUnidad = temasDeUnidad.filter((t) => revisadosSet.has(t.id)).length;
                    const totalUnidad = temasDeUnidad.length;

                    return `
                      <article class="tarjeta-unidad" data-id="${idUnidadEscapado}">
                        <div class="tarjeta-unidad__cabecera">
                          <div>
                            <h2 class="tarjeta-unidad__titulo">
                              Unidad ${idxUnidad + 1}: ${tituloUnidadEscapado}
                            </h2>
                            <small style="color: var(--color-texto-suave);">
                              ${totalUnidad} ${totalUnidad === 1 ? 'tema disponible' : 'temas disponibles'} · ${revsUnidad} revisados
                            </small>
                          </div>
                          ${
                            totalUnidad > 0 && revsUnidad === totalUnidad
                              ? `<span class="insignia insignia--exito" style="font-size: var(--texto-xs);">Completada ✓</span>`
                              : ''
                          }
                        </div>

                        <div class="temas-lista">
                          ${
                            temasDeUnidad.length === 0
                              ? `<span style="color: var(--color-texto-suave); font-size: var(--texto-s); padding: var(--espacio-s);">No hay temas publicados en esta unidad.</span>`
                              : temasDeUnidad
                                  .map((t, idxTema) => {
                                    const idTemaEscapado = ui.escapar(t.id);
                                    const tituloTemaEscapado = ui.escapar(t.titulo || 'Tema');
                                    const revisado = revisadosSet.has(t.id);

                                    return `
                                      <a href="/paginas/tema.html?id=${idTemaEscapado}" class="tema-item">
                                        <div class="tema-item__info">
                                          <span style="color: var(--color-texto-suave); font-size: var(--texto-xs);">
                                            ${idxUnidad + 1}.${idxTema + 1}
                                          </span>
                                          <span class="tema-item__titulo">${tituloTemaEscapado}</span>
                                        </div>
                                        <div class="fila" style="align-items: center; gap: var(--espacio-s); flex-shrink: 0;">
                                          ${
                                            revisado
                                              ? `<span class="insignia insignia--exito" style="font-size: var(--texto-xs);">Revisado ✓</span>`
                                              : `<span class="insignia insignia--advertencia" style="font-size: var(--texto-xs);">Pendiente</span>`
                                          }
                                          <span style="font-size: var(--texto-xs); color: var(--color-primario);">→</span>
                                        </div>
                                      </a>
                                    `;
                                  })
                                  .join('')
                          }
                        </div>
                      </article>
                    `;
                  })
                  .join('')
          }
        </section>
      </div>
    `;

    // Inicializar componente y lógica del Tutor Virtual Socrático
    inicializarTutor(asignatura, unidades, temas);
  } catch (err) {
    console.error('Error al cargar la asignatura:', err);
    contenedor.innerHTML = `
      <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Error al cargar asignatura</h2>
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

/**
 * Inicializa y administra el widget de chat del Tutor Virtual Socrático.
 */
function inicializarTutor(asignatura, unidades, temas) {
  // Limpiar instancias previas si existen en el DOM
  const prevFlotante = document.getElementById('btnTutorFlotante');
  if (prevFlotante) prevFlotante.remove();
  const prevWidget = document.getElementById('tutorChatWidget');
  if (prevWidget) prevWidget.remove();

  // Historial conversacional en memoria y en sessionStorage para la sesión actual
  const claveSession = `tutor_historial_${asignatura.id}`;
  let historial = [];
  try {
    const raw = sessionStorage.getItem(claveSession);
    if (raw) historial = JSON.parse(raw);
    if (!Array.isArray(historial)) historial = [];
  } catch {
    historial = [];
  }

  // Generar sugerencias de inicio contextualizadas a los temas de la asignatura
  const nombresTemas = temas.map((t) => t.titulo).filter(Boolean);
  const sugerencias = [];
  if (nombresTemas.length > 0) {
    sugerencias.push(`¿Cómo se relaciona "${nombresTemas[0]}" con nuestra vida cotidiana?`);
  }
  if (nombresTemas.length > 1) {
    sugerencias.push(`Dame una pista para entender "${nombresTemas[1]}"`);
  }
  if (nombresTemas.length > 2) {
    sugerencias.push(`¿Cuál es el concepto clave de "${nombresTemas[2]}"?`);
  } else {
    sugerencias.push(`¿Por dónde me recomiendas empezar a repasar en ${asignatura.nombre}?`);
  }

  // 1. Crear Botón Flotante
  const btnFlotante = document.createElement('button');
  btnFlotante.id = 'btnTutorFlotante';
  btnFlotante.className = 'tutor-flotante-btn';
  btnFlotante.type = 'button';
  btnFlotante.title = 'Abrir Tutor Virtual Socrático';
  btnFlotante.setAttribute('aria-label', 'Abrir Tutor Virtual Socrático');
  btnFlotante.innerHTML = `
    <span class="tutor-flotante-icono" aria-hidden="true">🦉</span>
    <span>Tutor Socrático</span>
    <span class="tutor-flotante-punto" aria-hidden="true"></span>
  `;
  document.body.appendChild(btnFlotante);

  // 2. Crear Ventana / Drawer de Chat
  const chatWidget = document.createElement('aside');
  chatWidget.id = 'tutorChatWidget';
  chatWidget.className = 'tutor-chat-widget tutor-chat-widget--oculto';
  chatWidget.setAttribute('role', 'dialog');
  chatWidget.setAttribute('aria-label', 'Chat con Tutor Socrático');

  chatWidget.innerHTML = `
    <header class="tutor-chat-cabecera">
      <div class="tutor-chat-perfil">
        <div class="tutor-chat-avatar" aria-hidden="true">🦉</div>
        <div class="tutor-chat-titulos">
          <h3>Sócrates · Tutor Virtual</h3>
          <small>${ui.escapar(asignatura.nombre || 'Asignatura')} · Diálogo Socrático</small>
        </div>
      </div>
      <div class="tutor-chat-acciones-top">
        <button id="tutorBtnReiniciar" class="tutor-chat-btn-icono" type="button" title="Reiniciar diálogo" aria-label="Reiniciar diálogo">
          ↺
        </button>
        <button id="tutorBtnCerrar" class="tutor-chat-btn-icono" type="button" title="Minimizar chat" aria-label="Minimizar chat">
          ✕
        </button>
      </div>
    </header>

    <div id="tutorChatCuerpo" class="tutor-chat-cuerpo">
      <div class="tutor-aviso-curricular">
        <span>🔒 Delimitado estrictamente al currículo de ${ui.escapar(asignatura.nombre || 'esta asignatura')}</span>
      </div>

      <div class="tutor-burbuja tutor-burbuja--asistente">
        <div class="tutor-burbuja-avatar" aria-hidden="true">🦉</div>
        <div class="tutor-burbuja-contenido">
          <p>¡Hola! Soy <strong>Sócrates</strong>, tu tutor virtual para <strong>${ui.escapar(asignatura.nombre || 'esta asignatura')}</strong>.</p>
          <p style="margin-top: 6px;">Mi misión no es darte respuestas directas ni hacer tus deberes, sino acompañarte mediante preguntas y pistas para que razones y descubras los conceptos por ti mismo.</p>
          <p style="margin-top: 6px;">¿Sobre qué tema o inquietud te gustaría reflexionar hoy?</p>
        </div>
      </div>

      <!-- Burbujas del historial previo si existían en la sesión -->
      <div id="tutorHistorialContenedor" class="pila" style="gap: var(--espacio-m);"></div>

      <!-- Sugerencias rápidas -->
      <div id="tutorSugerencias" class="pila" style="gap: 4px;">
        <small style="color: var(--color-texto-suave); font-size: 11px;">Preguntas sugeridas:</small>
        <div class="tutor-chips-sugerencias">
          ${sugerencias
            .map(
              (s) => `
            <button type="button" class="tutor-chip" data-pregunta="${ui.escapar(s)}">
              ${ui.escapar(s)}
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Indicador de pensamiento / escritura -->
      <div id="tutorEscribiendo" class="tutor-escribiendo" style="display: none;">
        <span>Sócrates está formulando una pregunta reflexiva</span>
        <div class="tutor-puntos-animados" aria-hidden="true">
          <span>•</span><span>•</span><span>•</span>
        </div>
      </div>
    </div>

    <footer class="tutor-chat-pie">
      <form id="tutorFormChat" class="tutor-form-entrada">
        <textarea
          id="tutorInputTexto"
          class="tutor-textarea-msg"
          placeholder="Escribe tu reflexión o consulta curricular..."
          rows="1"
          maxlength="500"
          aria-label="Mensaje para el tutor socrático"
        ></textarea>
        <button id="tutorBtnEnviar" class="tutor-btn-enviar" type="submit" title="Enviar mensaje">
          <span>Enviar</span>
          <span>➤</span>
        </button>
      </form>
    </footer>
  `;

  document.body.appendChild(chatWidget);

  // Elementos internos
  const chatCuerpo = chatWidget.querySelector('#tutorChatCuerpo');
  const historialContenedor = chatWidget.querySelector('#tutorHistorialContenedor');
  const sugerenciasContenedor = chatWidget.querySelector('#tutorSugerencias');
  const typingElem = chatWidget.querySelector('#tutorEscribiendo');
  const formChat = chatWidget.querySelector('#tutorFormChat');
  const inputTexto = chatWidget.querySelector('#tutorInputTexto');
  const btnEnviar = chatWidget.querySelector('#tutorBtnEnviar');
  const btnCerrar = chatWidget.querySelector('#tutorBtnCerrar');
  const btnReiniciar = chatWidget.querySelector('#tutorBtnReiniciar');
  const btnHero = document.getElementById('btnAbrirTutorHero');

  let procesando = false;

  // Restaurar historial si ya existía en sessionStorage
  if (historial.length > 0) {
    for (const msg of historial) {
      renderizarBurbuja(msg.rol, msg.texto, false);
    }
  }

  function scrollAbajo() {
    chatCuerpo.scrollTop = chatCuerpo.scrollHeight;
  }

  function abrirChat() {
    chatWidget.classList.remove('tutor-chat-widget--oculto');
    scrollAbajo();
    setTimeout(() => inputTexto.focus(), 150);
  }

  function cerrarChat() {
    chatWidget.classList.add('tutor-chat-widget--oculto');
  }

  function toggleChat() {
    if (chatWidget.classList.contains('tutor-chat-widget--oculto')) {
      abrirChat();
    } else {
      cerrarChat();
    }
  }

  function renderizarBurbuja(rol, texto, conEfecto = true) {
    const esUsuario = rol === 'usuario';
    const burbuja = document.createElement('div');
    burbuja.className = `tutor-burbuja ${esUsuario ? 'tutor-burbuja--usuario' : 'tutor-burbuja--asistente'}`;

    const contenidoHtml = esUsuario
      ? `<p>${ui.escapar(texto)}</p>`
      : util.formatoBasico(texto);

    burbuja.innerHTML = `
      <div class="tutor-burbuja-avatar" aria-hidden="true">${esUsuario ? 'Tú' : '🦉'}</div>
      <div class="tutor-burbuja-contenido">${contenidoHtml}</div>
    `;

    historialContenedor.appendChild(burbuja);
    if (conEfecto) {
      scrollAbajo();
    }
  }

  async function enviarConsulta(consultaTexto) {
    const consulta = String(consultaTexto || '').trim();
    if (!consulta || procesando) return;

    procesando = true;
    inputTexto.value = '';
    inputTexto.style.height = 'auto';
    inputTexto.disabled = true;
    btnEnviar.disabled = true;

    // Renderizar mensaje del usuario
    renderizarBurbuja('usuario', consulta);

    // Ocultar chips tras la primera interacción para despejar el espacio
    if (sugerenciasContenedor) {
      sugerenciasContenedor.style.display = 'none';
    }

    // Mostrar animación de tutor pensando
    typingElem.style.display = 'flex';
    scrollAbajo();

    try {
      const resp = await api.ia('tutor', {
        asignaturaId: asignatura.id,
        consulta,
        historial: historial.slice(-8)
      });

      const respuesta = resp?.respuesta || 'No he recibido respuesta del tutor. Por favor intenta reformular tu pregunta.';

      // Actualizar historial local y sesión
      historial.push({ rol: 'usuario', texto: consulta });
      historial.push({ rol: 'asistente', texto: respuesta });
      try {
        sessionStorage.setItem(claveSession, JSON.stringify(historial.slice(-14)));
      } catch {
        // Almacenamiento local lleno o deshabilitado
      }

      // Renderizar respuesta socrática
      renderizarBurbuja('asistente', respuesta);
    } catch (err) {
      console.error('Error al consultar al Tutor Socrático:', err);

      const errBurbuja = document.createElement('div');
      errBurbuja.className = 'tutor-burbuja tutor-burbuja--asistente';
      errBurbuja.innerHTML = `
        <div class="tutor-burbuja-avatar" aria-hidden="true">⚠️</div>
        <div class="tutor-burbuja-contenido" style="border-left-color: var(--color-error); background-color: var(--color-superficie);">
          <strong style="color: var(--color-error);">Aviso del Tutor:</strong>
          <p style="margin-top: 4px;">${ui.escapar(err.message || 'Error de conexión con el servicio de tutoría.')}</p>
        </div>
      `;
      historialContenedor.appendChild(errBurbuja);
      scrollAbajo();
    } finally {
      typingElem.style.display = 'none';
      inputTexto.disabled = false;
      btnEnviar.disabled = false;
      procesando = false;
      inputTexto.focus();
      scrollAbajo();
    }
  }

  // Manejo de eventos
  if (btnHero) {
    btnHero.addEventListener('click', abrirChat);
  }

  btnFlotante.addEventListener('click', toggleChat);
  btnCerrar.addEventListener('click', cerrarChat);

  btnReiniciar.addEventListener('click', () => {
    historial = [];
    try {
      sessionStorage.removeItem(claveSession);
    } catch {}
    historialContenedor.innerHTML = '';
    if (sugerenciasContenedor) {
      sugerenciasContenedor.style.display = 'block';
    }
    inputTexto.value = '';
    inputTexto.focus();
    scrollAbajo();
  });

  // Chips sugeridos
  chatWidget.querySelectorAll('.tutor-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const pregunta = chip.getAttribute('data-pregunta');
      if (pregunta) {
        enviarConsulta(pregunta);
      }
    });
  });

  // Envío del formulario
  formChat.addEventListener('submit', (e) => {
    e.preventDefault();
    enviarConsulta(inputTexto.value);
  });

  // Auto-crecimiento y atajo Enter (sin Shift)
  inputTexto.addEventListener('input', () => {
    inputTexto.style.height = 'auto';
    inputTexto.style.height = Math.min(inputTexto.scrollHeight, 100) + 'px';
  });

  inputTexto.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formChat.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });

  // Cerrar con Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !chatWidget.classList.contains('tutor-chat-widget--oculto')) {
      cerrarChat();
    }
  });
}
