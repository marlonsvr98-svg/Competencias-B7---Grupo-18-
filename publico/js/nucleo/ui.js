/**
 * publico/js/nucleo/ui.js
 * Funciones de interfaz de usuario y accesibilidad según contrato §A.
 */

export function escapar(texto) {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function limpiar(html) {
  if (typeof window !== 'undefined' && window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
    return window.DOMPurify.sanitize(html);
  }
  return escapar(html);
}

function obtenerContenedorAvisos() {
  let contenedor = document.getElementById('contenedor-avisos');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'contenedor-avisos';
    contenedor.className = 'contenedor-avisos';
    contenedor.setAttribute('aria-live', 'polite');
    contenedor.setAttribute('aria-atomic', 'true');
    document.body.appendChild(contenedor);
  }
  return contenedor;
}

export function aviso(texto, tipo = 'info') {
  if (typeof document === 'undefined') return;
  const contenedor = obtenerContenedorAvisos();
  const toast = document.createElement('div');
  toast.className = `aviso aviso-${tipo}`;
  toast.setAttribute('role', 'status');

  const contenido = document.createElement('span');
  contenido.textContent = texto;
  toast.appendChild(contenido);

  contenedor.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

export function cargando(activo) {
  if (typeof document === 'undefined') return;
  let indicador = document.querySelector('.cargando');
  if (activo) {
    if (!indicador) {
      indicador = document.createElement('div');
      indicador.className = 'cargando';
      indicador.setAttribute('role', 'status');
      indicador.setAttribute('aria-live', 'polite');
      indicador.setAttribute('aria-label', 'Cargando...');
      document.body.appendChild(indicador);
    }
    indicador.hidden = false;
  } else if (indicador) {
    indicador.remove();
  }
}

export function modal({ titulo, contenido, acciones = [] }) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      return resolve(null);
    }

    const focoPrevio = document.activeElement;

    const overlay = document.createElement('div');
    overlay.className = 'modal-fondo';

    const dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('tabindex', '-1');

    const tituloId = `modal-titulo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    dialog.setAttribute('aria-labelledby', tituloId);

    const cabecera = document.createElement('header');
    cabecera.className = 'modal-cabecera';

    const h2 = document.createElement('h2');
    h2.id = tituloId;
    h2.textContent = titulo || '';
    cabecera.appendChild(h2);

    const cuerpo = document.createElement('section');
    cuerpo.className = 'modal-cuerpo';
    if (typeof contenido === 'string') {
      const contenedorTexto = document.createElement('div');
      contenedorTexto.innerHTML = limpiar(contenido);
      cuerpo.appendChild(contenedorTexto);
    } else if (contenido instanceof Node) {
      cuerpo.appendChild(contenido);
    }

    const pie = document.createElement('footer');
    pie.className = 'modal-pie';

    const listaAcciones = acciones.length > 0
      ? acciones
      : [{ texto: 'Cerrar', valor: null, clase: 'boton-borde' }];

    listaAcciones.forEach((acc) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `boton ${acc.clase || (acc.primario ? 'boton-primario' : 'boton-borde')}`;
      btn.textContent = acc.texto;
      btn.addEventListener('click', () => cerrar(acc.valor !== undefined ? acc.valor : null));
      pie.appendChild(btn);
    });

    dialog.appendChild(cabecera);
    dialog.appendChild(cuerpo);
    dialog.appendChild(pie);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    function obtenerEnfocables() {
      const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(dialog.querySelectorAll(selector));
    }

    function manejarTeclado(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        cerrar(null);
        return;
      }

      if (e.key === 'Tab') {
        const enfocables = obtenerEnfocables();
        if (enfocables.length === 0) {
          e.preventDefault();
          return;
        }

        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === primero || document.activeElement === dialog) {
            e.preventDefault();
            ultimo.focus();
          }
        } else {
          if (document.activeElement === ultimo) {
            e.preventDefault();
            primero.focus();
          }
        }
      }
    }

    function manejarClickFondo(e) {
      if (e.target === overlay) {
        cerrar(null);
      }
    }

    function cerrar(resultado) {
      document.removeEventListener('keydown', manejarTeclado);
      overlay.removeEventListener('click', manejarClickFondo);
      overlay.remove();
      if (focoPrevio && typeof focoPrevio.focus === 'function') {
        focoPrevio.focus();
      }
      resolve(resultado);
    }

    document.addEventListener('keydown', manejarTeclado);
    overlay.addEventListener('click', manejarClickFondo);

    const enfocables = obtenerEnfocables();
    if (enfocables.length > 0) {
      enfocables[0].focus();
    } else {
      dialog.focus();
    }
  });
}

export async function confirmar(texto) {
  const resultado = await modal({
    titulo: 'Confirmación',
    contenido: texto,
    acciones: [
      { texto: 'Cancelar', valor: false, clase: 'boton-borde' },
      { texto: 'Aceptar', valor: true, primario: true, clase: 'boton-primario' }
    ]
  });
  return resultado === true;
}
