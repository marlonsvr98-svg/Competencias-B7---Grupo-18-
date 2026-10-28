/**
 * publico/js/nucleo/plantilla.js
 * Plantilla común del ecosistema: encabezado con sesión, menú lateral filtrado, pie y seguimiento.
 */

import { MENU } from './menu.js';
import { exigirRol, usuarioActual, cerrar } from './sesion.js';
import { registrarEvento } from './bitacora.js';
import * as api from './api.js';
import * as ui from './ui.js';

const NOMBRE = 'Ecosistema Educativo';

/**
 * Monta la estructura común de la página en #plantilla.
 * @param {{ titulo?: string, roles?: string[] }} [opciones={}]
 */
export async function montarPlantilla({ titulo = '', roles = [] } = {}) {
  // 1. Mostrar avisos pendientes guardados entre redirecciones
  try {
    const avisoPendiente = sessionStorage.getItem('aviso_pendiente');
    if (avisoPendiente) {
      sessionStorage.removeItem('aviso_pendiente');
      const { texto, tipo } = JSON.parse(avisoPendiente);
      if (texto) ui.aviso(texto, tipo || 'info');
    }
  } catch {}

  // 2. Control de acceso: llama a exigirRol si se indican roles
  if (roles && roles.length > 0) {
    const permitido = exigirRol(roles);
    if (!permitido) return;
  }

  // 3. Título del documento
  document.title = titulo ? `${titulo} · ${NOMBRE}` : NOMBRE;

  const contenedorPlantilla = document.getElementById('plantilla');
  if (!contenedorPlantilla) {
    console.error('No se encontró el elemento #plantilla en el DOM');
    return;
  }

  const usuario = usuarioActual();

  // 4. Con sesión, registra la visita a la página sin esperar respuesta
  if (usuario) {
    void registrarEvento('pagina', window.location.pathname);
  }

  // 5. Ruta actual normalizada
  const rutaActual = window.location.pathname.toLowerCase();

  // 6. Filtrar menú según roles:
  // "publico" = todos, "sesion" = cualquier rol con sesión, o rol específico
  const enlacesHtml = MENU.filter((item) => {
    if (!item.roles || item.roles.includes('publico')) return true;
    if (!usuario) return false;
    if (item.roles.includes('sesion')) return true;
    return item.roles.includes(usuario.rol);
  }).map((item) => {
    const itemHref = item.href.toLowerCase();
    const esPaginaActual =
      rutaActual === itemHref ||
      (itemHref === '/index.html' && (rutaActual === '/' || rutaActual === ''));

    const ariaCurrent = esPaginaActual ? ' aria-current="page"' : '';
    const claseActiva = esPaginaActual ? ' menu__enlace--activo' : '';

    return `<a href="${item.href}" class="menu__enlace${claseActiva}"${ariaCurrent}>${item.texto}</a>`;
  }).join('');

  // 7. Encabezado con estado de usuario
  const accionesUsuarioHtml = usuario
    ? `
      <div class="fila" style="gap: var(--espacio-s); align-items: center;">
        <a href="/paginas/perfil.html" class="encabezado__usuario" style="color: var(--color-texto-inverso); font-size: var(--texto-s); text-decoration: none;" title="Ver perfil">
          👤 ${ui.escapar(usuario.nombre)} <small style="opacity: 0.85;">(${ui.escapar(usuario.rol)})</small>
        </a>
        <button type="button" class="btn btn--pequeno btn--secundario" id="btnSalir">Salir</button>
      </div>
    `
    : `
      <div class="fila" style="gap: var(--espacio-s); align-items: center;">
        <a href="/paginas/ingreso.html" class="btn btn--pequeno btn--texto" style="color: var(--color-texto-inverso);">Ingresar</a>
        <a href="/paginas/registro.html" class="btn btn--pequeno btn--secundario">Registrarse</a>
      </div>
    `;

  contenedorPlantilla.innerHTML = `
    <header class="encabezado">
      <div class="contenedor fila" style="justify-content: space-between;">
        <div class="fila">
          <button type="button" class="menu-boton-movil" id="btnToggleMenu" aria-label="Abrir menú" aria-expanded="false">
            ☰
          </button>
          <a href="/index.html" class="encabezado__nombre" style="color: var(--color-texto-inverso); font-weight: var(--peso-negrita); font-size: var(--texto-l);">
            ${NOMBRE}
          </a>
        </div>
        <div class="fila" style="gap: var(--espacio-m); align-items: center;">
          ${titulo ? `<span class="encabezado__titulo" style="font-size: var(--texto-m); font-weight: var(--peso-medio);">${ui.escapar(titulo)}</span>` : ''}
          ${accionesUsuarioHtml}
        </div>
      </div>
    </header>
    <aside class="menu" id="menuLateral" aria-label="Navegación principal">
      <nav class="pila" style="gap: var(--espacio-xs);">
        ${enlacesHtml}
      </nav>
    </aside>
  `;

  // 8. Evento Salir
  const btnSalir = document.getElementById('btnSalir');
  if (btnSalir) {
    btnSalir.addEventListener('click', () => {
      cerrar();
    });
  }

  // 9. Pie con el año al final de body
  let pieExistente = document.querySelector('footer.pie');
  if (!pieExistente) {
    pieExistente = document.createElement('footer');
    pieExistente.className = 'pie';
    const anio = new Date().getFullYear();
    pieExistente.innerHTML = `
      <div class="contenedor">
        <p>&copy; ${anio} ${NOMBRE} · Plataforma Universitaria</p>
      </div>
    `;
    document.body.appendChild(pieExistente);
  }

  // 10. Menú plegable móvil
  const btnToggle = document.getElementById('btnToggleMenu');
  const menuLateral = document.getElementById('menuLateral');

  if (btnToggle && menuLateral) {
    btnToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const abierto = menuLateral.classList.toggle('menu--abierto');
      btnToggle.setAttribute('aria-expanded', String(abierto));
    });

    document.addEventListener('click', (e) => {
      if (menuLateral.classList.contains('menu--abierto') && !menuLateral.contains(e.target) && e.target !== btnToggle) {
        menuLateral.classList.remove('menu--abierto');
        btnToggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuLateral.classList.contains('menu--abierto')) {
        menuLateral.classList.remove('menu--abierto');
        btnToggle.setAttribute('aria-expanded', 'false');
        btnToggle.focus();
      }
    });
  }

  // 11. Contador de noticias publicadas no leídas
  if (usuario) {
    void actualizarContadorNoticias();
  }
}

async function actualizarContadorNoticias() {
  try {
    const [noticias, lecturas] = await Promise.all([
      api.listar('noticias'),
      api.listar('lecturas-noticias')
    ]);
    const publicadas = (noticias || []).filter((n) => n && n.estado === 'publicado');
    const leidasSet = new Set((lecturas || []).map((l) => l.noticiaId));
    const noLeidas = publicadas.filter((n) => !leidasSet.has(n.id)).length;

    if (noLeidas > 0) {
      const enlaceNoticias = document.querySelector('a.menu__enlace[href*="noticias.html"]');
      if (enlaceNoticias) {
        let badge = enlaceNoticias.querySelector('.menu__contador-noticias');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'insignia insignia--acento menu__contador-noticias';
          badge.style.marginLeft = 'auto';
          badge.style.fontSize = 'var(--texto-xs)';
          badge.style.padding = '2px 6px';
          badge.style.borderRadius = 'var(--radio-completo)';
          enlaceNoticias.style.display = 'flex';
          enlaceNoticias.style.alignItems = 'center';
          enlaceNoticias.appendChild(badge);
        }
        badge.textContent = noLeidas;
      }
    }
  } catch {}
}

