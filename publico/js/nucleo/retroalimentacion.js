/**
 * publico/js/nucleo/retroalimentacion.js
 * Componentes de retroalimentación didáctica y resumen de actividades según contrato §A.
 */

import * as ui from './ui.js';

/**
 * Muestra la retroalimentación inmediata para una respuesta.
 * Si se pasa un contenedor DOM, inyecta la retroalimentación allí; de lo contrario, muestra un modal accesible.
 * @param {{ correcto: boolean, explicacion: string, sugerencia?: string, enlaceTema?: string, contenedor?: HTMLElement }} opciones
 * @returns {HTMLElement} Elemento generado
 */
export function mostrarRetro({ correcto, explicacion, sugerencia = '', enlaceTema = '', contenedor = null }) {
  const retroDiv = document.createElement('div');
  retroDiv.className = `alerta ${correcto ? 'alerta--exito' : 'alerta--advertencia'}`;
  retroDiv.style.marginTop = 'var(--espacio-m)';

  const icono = correcto ? '✅' : '💡';
  const titulo = correcto ? '¡Respuesta Correcta!' : 'Respuesta Incorrecta';

  retroDiv.innerHTML = `
    <span style="font-size: var(--texto-xl);">${icono}</span>
    <div class="pila" style="gap: var(--espacio-xs); flex: 1;">
      <strong style="color: ${correcto ? 'var(--color-exito)' : 'var(--color-advertencia)'};">
        ${titulo}
      </strong>
      <div style="font-size: var(--texto-s); color: var(--color-texto);">
        ${ui.escapar(explicacion || '')}
      </div>
      ${
        sugerencia
          ? `<small style="color: var(--color-texto-suave); font-style: italic;">Pista formativa: ${ui.escapar(sugerencia)}</small>`
          : ''
      }
      ${
        enlaceTema
          ? `<a href="${ui.escapar(enlaceTema)}" target="_blank" class="btn btn--pequeno btn--texto" style="align-self: flex-start; margin-top: var(--espacio-xs);">
              📖 Repasar concepto en el tema →
            </a>`
          : ''
      }
    </div>
  `;

  if (contenedor) {
    contenedor.innerHTML = '';
    contenedor.appendChild(retroDiv);
  }

  return retroDiv;
}

/**
 * Muestra el resumen global de una actividad completada con recomendaciones de repaso.
 * @param {{ titulo: string, aciertos: number, errores: number, recomendaciones?: Array, enlaceTema?: string }} opciones
 * @returns {Promise<"repetir" | "salir">} Acción elegida por el usuario
 */
export async function mostrarResumen({
  titulo = 'Resumen de la Actividad',
  aciertos = 0,
  errores = 0,
  recomendaciones = [],
  enlaceTema = ''
}) {
  const total = aciertos + errores;
  const pct = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  const aprobado = pct >= 70;

  const contenidoDiv = document.createElement('div');
  contenidoDiv.className = 'pila';
  contenidoDiv.style.gap = 'var(--espacio-m)';

  let recomendHtml = '';
  if (Array.isArray(recomendaciones) && recomendaciones.length > 0) {
    recomendHtml = `
      <div class="pila" style="gap: var(--espacio-s);">
        <strong style="font-size: var(--texto-s); color: var(--color-primario);">
          Temas y conceptos clave a repasar:
        </strong>
        <div class="pila" style="gap: var(--espacio-xs); max-height: 200px; overflow-y: auto; padding-right: 4px;">
          ${recomendaciones
            .map((rec) => {
              const enunciado = typeof rec === 'string' ? rec : rec.enunciado || '';
              const retro = rec.retroalimentacion ? `<br><small style="color: var(--color-texto-suave);">${ui.escapar(rec.retroalimentacion)}</small>` : '';
              const correcta = rec.correcta ? `<br><span style="font-size: var(--texto-xs); color: var(--color-exito);">Respuesta esperada: ${ui.escapar(rec.correcta)}</span>` : '';
              return `
                <div style="background-color: var(--color-fondo); padding: var(--espacio-xs) var(--espacio-s); border-radius: var(--radio-s); border-left: 3px solid var(--color-advertencia); font-size: var(--texto-xs);">
                  <strong>• ${ui.escapar(enunciado)}</strong>
                  ${correcta}
                  ${retro}
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  contenidoDiv.innerHTML = `
    <div style="text-align: center; padding: var(--espacio-s) 0;">
      <div style="font-size: var(--texto-3xl); margin-bottom: var(--espacio-xs);">
        ${aprobado ? '🎉' : '📚'}
      </div>
      <h3 style="margin: 0; font-size: var(--texto-xl); color: var(--color-primario);">
        ${aprobado ? '¡Felicitaciones! Has superado el nivel' : 'Buen intento. Continúa practicando'}
      </h3>
      <p style="margin: var(--espacio-xs) 0; font-size: var(--texto-s); color: var(--color-texto-suave);">
        Obtuviste <strong>${pct}%</strong> de aciertos (${aciertos} de ${total}).
      </p>
    </div>

    <div class="fila" style="justify-content: space-around; background-color: var(--color-fondo); padding: var(--espacio-m); border-radius: var(--radio-m); text-align: center;">
      <div>
        <div style="font-size: var(--texto-l); font-weight: var(--peso-negrita); color: var(--color-exito);">${aciertos}</div>
        <div style="font-size: var(--texto-xs); color: var(--color-texto-suave);">Aciertos</div>
      </div>
      <div style="border-left: 1px solid var(--color-borde);"></div>
      <div>
        <div style="font-size: var(--texto-l); font-weight: var(--peso-negrita); color: var(--color-error);">${errores}</div>
        <div style="font-size: var(--texto-xs); color: var(--color-texto-suave);">Errores</div>
      </div>
      <div style="border-left: 1px solid var(--color-borde);"></div>
      <div>
        <div style="font-size: var(--texto-l); font-weight: var(--peso-negrita); color: var(--color-primario);">${pct}%</div>
        <div style="font-size: var(--texto-xs); color: var(--color-texto-suave);">Rendimiento</div>
      </div>
    </div>

    ${recomendHtml}

    ${
      enlaceTema
        ? `
      <div style="text-align: center; margin-top: var(--espacio-xs);">
        <a href="${ui.escapar(enlaceTema)}" target="_blank" class="btn btn--pequeno btn--secundario" style="width: 100%;">
          📖 Ir al contenido del tema
        </a>
      </div>
    `
        : ''
    }
  `;

  const accion = await ui.modal({
    titulo,
    contenido: contenidoDiv,
    acciones: [
      { texto: 'Salir', valor: 'salir', clase: 'btn--secundario' },
      { texto: 'Reintentar', valor: 'repetir', primario: true }
    ]
  });

  return accion === 'repetir' ? 'repetir' : 'salir';
}
