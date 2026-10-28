/**
 * publico/js/modulos/prueba-datos.js
 * Módulo para interactuar con la colección de prueba mediante api y ui.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import * as util from '../nucleo/util.js';

await montarPlantilla({ titulo: 'Prueba de datos' });

const contenedor = document.getElementById('contenido');

if (contenedor) {
  contenedor.innerHTML = `
    <div class="pila" style="gap: var(--espacio-xl);">
      <section class="tarjeta">
        <h2>Guardar en colección "prueba"</h2>
        <p>Ingresa un texto para persistirlo de forma segura en el servidor.</p>

        <form id="formularioPrueba" class="pila" style="gap: var(--espacio-m); margin-top: var(--espacio-m);">
          <div class="campo" style="margin-bottom: 0;">
            <label for="inputTexto">Texto a guardar</label>
            <input type="text" id="inputTexto" name="texto" placeholder="Escribe algo aquí..." required autofocus>
          </div>
          <div class="fila">
            <button type="submit" class="btn btn--primario" id="btnGuardar">Guardar registro</button>
            <button type="button" class="btn btn--secundario" id="btnRecargar">Actualizar lista</button>
          </div>
        </form>
      </section>

      <section class="tarjeta">
        <div class="fila" style="justify-content: space-between; margin-bottom: var(--espacio-m);">
          <h2>Registros guardados</h2>
          <span class="insignia insignia--info" id="contadorRegistros">Cargando...</span>
        </div>
        <div id="contenedorLista">
          <div class="fila" style="justify-content: center; padding: var(--espacio-l);">
            <span class="cargando" role="status" aria-label="Cargando registros"></span>
          </div>
        </div>
      </section>
    </div>
  `;

  const form = document.getElementById('formularioPrueba');
  const inputTexto = document.getElementById('inputTexto');
  const btnGuardar = document.getElementById('btnGuardar');
  const btnRecargar = document.getElementById('btnRecargar');
  const contenedorLista = document.getElementById('contenedorLista');
  const contadorRegistros = document.getElementById('contadorRegistros');

  async function cargarRegistros() {
    try {
      const registros = await api.listar('prueba');
      contadorRegistros.textContent = `${registros.length} ${registros.length === 1 ? 'registro' : 'registros'}`;

      if (!registros || registros.length === 0) {
        contenedorLista.innerHTML = `
          <div class="vacio">
            <div class="vacio__icono">📝</div>
            <h3 class="vacio__titulo">Sin registros todavía</h3>
            <p class="vacio__descripcion">Aún no se ha guardado ningún dato en la colección "prueba". Escribe un texto arriba para comenzar.</p>
          </div>
        `;
        return;
      }

      const itemsHtml = registros.map((reg) => {
        const textoEscapado = ui.escapar(reg.texto || reg.nombre || JSON.stringify(reg));
        const fechaFormateada = reg.fecha ? util.fechaRelativa(reg.fecha) : '';
        const idEscapado = ui.escapar(reg.id || '');

        return `
          <li class="item-registro">
            <div class="pila" style="gap: var(--espacio-xs);">
              <span class="item-registro__texto">${textoEscapado}</span>
              <small style="color: var(--color-texto-suave);">ID: <code>${idEscapado}</code></small>
            </div>
            ${fechaFormateada ? `<span class="item-registro__meta">${fechaFormateada}</span>` : ''}
          </li>
        `;
      }).join('');

      contenedorLista.innerHTML = `<ul class="lista-registros">${itemsHtml}</ul>`;
    } catch (err) {
      console.error('Error al cargar registros:', err);
      ui.aviso(`Error al cargar datos: ${err.message}`, 'error');
      contenedorLista.innerHTML = `
        <div class="alerta alerta--error">
          No se pudieron cargar los registros. ${ui.escapar(err.message)}
        </div>
      `;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = inputTexto.value.trim();
    if (!texto) return;

    try {
      btnGuardar.disabled = true;
      btnGuardar.textContent = 'Guardando...';

      const nuevo = await api.crear('prueba', { texto });
      ui.aviso(`Registro "${nuevo.id}" guardado con éxito`, 'exito');
      inputTexto.value = '';
      await cargarRegistros();
      inputTexto.focus();
    } catch (err) {
      console.error('Error al guardar registro:', err);
      ui.aviso(`No se pudo guardar: ${err.message}`, 'error');
    } finally {
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Guardar registro';
    }
  });

  btnRecargar.addEventListener('click', async () => {
    await cargarRegistros();
    ui.aviso('Lista actualizada', 'info');
  });

  // Carga inicial
  cargarRegistros();
}
