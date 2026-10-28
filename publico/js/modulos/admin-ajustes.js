/**
 * publico/js/modulos/admin-ajustes.js
 * Configuración general y de Inteligencia Artificial para el Administrador.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';

await montarPlantilla({ titulo: 'Configuración del Sistema e IA', roles: ['admin'] });

const MODELOS_ESTABLES = [
  {
    id: 'gemini-1.5-flash',
    nombre: 'gemini-1.5-flash (⭐ Recomendado - Máxima disponibilidad y sin saturación)',
    descripcion: 'Modelo de producción con la mayor cuota y disponibilidad continua.'
  },
  {
    id: 'gemini-1.5-flash-8b',
    nombre: 'gemini-1.5-flash-8b (Ultra rápido y máxima capacidad de solicitudes)',
    descripcion: 'Diseñado para respuestas rápidas y alta concurrencia.'
  },
  {
    id: 'gemini-1.5-pro',
    nombre: 'gemini-1.5-pro (Razonamiento complejo y profundo)',
    descripcion: 'Modelo avanzado para análisis exhaustivo.'
  },
  {
    id: 'gemini-2.0-flash',
    nombre: 'gemini-2.0-flash (Nueva generación rápida)',
    descripcion: 'Velocidad de última generación (puede tener picos de demanda).'
  },
  {
    id: 'gemini-2.0-flash-lite',
    nombre: 'gemini-2.0-flash-lite (Nueva generación ligera)',
    descripcion: 'Optimizado para alto volumen de peticiones.'
  },
  {
    id: 'gemini-3.8-flash',
    nombre: 'gemini-3.8-flash (Modelo específico)',
    descripcion: 'Modelo experimental o específico.'
  },
  {
    id: 'gemini-4-argon',
    nombre: 'gemini-4-argon (Modelo específico)',
    descripcion: 'Modelo experimental o específico.'
  }
];

const contenedor = document.getElementById('contenido');
if (contenedor) {
  contenedor.innerHTML = `
    <div class="pila" style="gap: var(--espacio-l); max-width: 800px; margin: 0 auto;">
      <div class="fila" style="justify-content: space-between; align-items: center;">
        <div>
          <h1 style="font-size: var(--texto-2xl); margin: 0; color: var(--color-primario);">
            Configuración y Modelos de IA
          </h1>
          <p style="margin: var(--espacio-xs) 0 0 0; color: var(--color-texto-suave); font-size: var(--texto-s);">
            Configura las credenciales de Google Gemini y selecciona modelos de alta disponibilidad.
          </p>
        </div>
      </div>

      <!-- Sección de Inteligencia Artificial -->
      <section class="ajustes-seccion">
        <div class="ajustes-cabecera-seccion">
          <h2>🤖 Parámetros de Inteligencia Artificial (Gemini)</h2>
          <span class="insignia insignia--primario">Google AI</span>
        </div>

        <form id="formAjustesIA" class="pila" style="gap: var(--espacio-m);">
          <div class="campo" style="margin-bottom: 0;">
            <label for="iaClave">Clave de API (API Key) <span style="color: var(--color-error);">*</span></label>
            <div class="fila" style="gap: var(--espacio-s); align-items: center;">
              <input type="password" id="iaClave" placeholder="Pega tu clave (ej. AQ.Ab8RN... o AIzaSy...)" style="flex: 1;" autocomplete="off">
              <button type="button" class="btn btn--secundario" id="btnToggleClave" title="Mostrar/Ocultar clave">
                👁️ Ver
              </button>
            </div>
            <small style="color: var(--color-texto-suave);">
              La clave se almacena de forma segura en <code>datos/config/ajustes.json</code>.
            </small>
          </div>

          <div class="ajustes-rejilla">
            <div class="campo" style="margin-bottom: 0;">
              <label for="iaProveedor">Proveedor de IA</label>
              <select id="iaProveedor" required>
                <option value="gemini" selected>Google Gemini API</option>
              </select>
            </div>

            <div class="campo" style="margin-bottom: 0;">
              <div class="fila" style="justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label for="selectModelo" style="margin: 0;">Modelo de IA disponible <span style="color: var(--color-error);">*</span></label>
                <button type="button" class="btn btn--pequeno btn--texto" id="btnCargarModelosApi" title="Consultar modelos activos para tu clave">
                  🔄 Actualizar lista
                </button>
              </div>
              <select id="selectModelo" required>
                <!-- Generado dinámicamente -->
              </select>
              <small id="descModelo" style="color: var(--color-texto-suave); font-size: var(--texto-xs);"></small>
            </div>
          </div>

          <!-- Campo personalizado si eligen "Otro" -->
          <div class="campo" id="campoModeloPersonalizado" style="display: none; margin-bottom: 0;">
            <label for="iaModeloPersonalizado">Nombre del modelo personalizado</label>
            <input type="text" id="iaModeloPersonalizado" placeholder="Ej. gemini-1.5-flash">
          </div>

          <!-- Banner de prueba de conexión -->
          <div id="resultadoPrueba" class="resultado-prueba-ia"></div>

          <div class="fila" style="justify-content: flex-end; gap: var(--espacio-s); margin-top: var(--espacio-s);">
            <button type="button" class="btn btn--secundario" id="btnProbarIA">
              🧪 Probar conexión con este modelo
            </button>
          </div>
        </form>
      </section>

      <!-- Ajustes generales de plataforma -->
      <section class="ajustes-seccion">
        <div class="ajustes-cabecera-seccion">
          <h2>⚙️ Ajustes Generales de la Plataforma</h2>
        </div>

        <form id="formAjustesGenerales" class="pila" style="gap: var(--espacio-m);">
          <div class="campo" style="margin-bottom: 0;">
            <label for="nombrePlataforma">Nombre de la Institución / Plataforma</label>
            <input type="text" id="nombrePlataforma" placeholder="Ecosistema Educativo">
          </div>

          <div class="ajustes-rejilla">
            <div class="campo" style="margin-bottom: 0;">
              <label for="limiteIADiario">Límite diario de solicitudes de IA (por docente)</label>
              <input type="number" id="limiteIADiario" min="5" max="500" value="30">
            </div>

            <div class="campo" style="margin-bottom: 0;">
              <label for="maxSubidaMB">Tamaño máximo de archivos subidos (MB)</label>
              <input type="number" id="maxSubidaMB" min="1" max="100" value="10">
            </div>
          </div>
        </form>
      </section>

      <div class="fila" style="justify-content: flex-end; gap: var(--espacio-m);">
        <button type="button" class="btn btn--primario" id="btnGuardarTodo" style="padding: var(--espacio-m) var(--espacio-xl);">
          💾 Guardar Configuración
        </button>
      </div>
    </div>
  `;

  const inputClave = document.getElementById('iaClave');
  const btnToggleClave = document.getElementById('btnToggleClave');
  const inputProveedor = document.getElementById('iaProveedor');
  const selectModelo = document.getElementById('selectModelo');
  const descModelo = document.getElementById('descModelo');
  const campoModeloPersonalizado = document.getElementById('campoModeloPersonalizado');
  const inputModeloPersonalizado = document.getElementById('iaModeloPersonalizado');
  const btnCargarModelosApi = document.getElementById('btnCargarModelosApi');
  const btnProbarIA = document.getElementById('btnProbarIA');
  const resultadoPrueba = document.getElementById('resultadoPrueba');

  const inputNombrePlataforma = document.getElementById('nombrePlataforma');
  const inputLimiteIA = document.getElementById('limiteIADiario');
  const inputMaxSubida = document.getElementById('maxSubidaMB');
  const btnGuardarTodo = document.getElementById('btnGuardarTodo');

  let claveVisible = false;
  let modelosLista = [...MODELOS_ESTABLES];

  btnToggleClave.addEventListener('click', () => {
    claveVisible = !claveVisible;
    inputClave.type = claveVisible ? 'text' : 'password';
    btnToggleClave.textContent = claveVisible ? '🙈 Ocultar' : '👁️ Ver';
  });

  function poblarSelectModelos(modeloSeleccionado = 'gemini-1.5-flash') {
    let html = '';
    const existeEnLista = modelosLista.some((m) => m.id === modeloSeleccionado);

    for (const m of modelosLista) {
      const selected = m.id === modeloSeleccionado ? 'selected' : '';
      html += `<option value="${ui.escapar(m.id)}" ${selected}>${ui.escapar(m.nombre)}</option>`;
    }

    if (!existeEnLista && modeloSeleccionado && modeloSeleccionado !== 'otro') {
      html += `<option value="${ui.escapar(modeloSeleccionado)}" selected>${ui.escapar(modeloSeleccionado)} (Configurado actualmente)</option>`;
    }

    html += `<option value="otro">Otro modelo (escribir personalizado)...</option>`;
    selectModelo.innerHTML = html;

    actualizarDescripcionModelo();
  }

  function actualizarDescripcionModelo() {
    const val = selectModelo.value;
    if (val === 'otro') {
      campoModeloPersonalizado.style.display = 'block';
      descModelo.textContent = 'Escribe el identificador exacto del modelo proporcionado por Google.';
    } else {
      campoModeloPersonalizado.style.display = 'none';
      const m = modelosLista.find((item) => item.id === val);
      descModelo.textContent = m?.descripcion || '';
    }
  }

  selectModelo.addEventListener('change', actualizarDescripcionModelo);

  function obtenerModeloActual() {
    if (selectModelo.value === 'otro') {
      return inputModeloPersonalizado.value.trim();
    }
    return selectModelo.value;
  }

  btnCargarModelosApi.addEventListener('click', async () => {
    const clave = inputClave.value.trim();
    if (!clave) {
      ui.aviso('Ingresa primero tu clave de API para consultar tus modelos activos', 'advertencia');
      inputClave.focus();
      return;
    }

    btnCargarModelosApi.disabled = true;
    btnCargarModelosApi.textContent = 'Consultando...';

    try {
      const resp = await api.llamar('POST', '/api/admin/ia-modelos', { iaClave: clave });
      if (resp && Array.isArray(resp.modelos) && resp.modelos.length > 0) {
        modelosLista = resp.modelos;
        const actual = obtenerModeloActual();
        poblarSelectModelos(actual);
        ui.aviso(`Se cargaron ${resp.modelos.length} modelos disponibles para tu clave`, 'exito');
      } else {
        ui.aviso('No se pudieron obtener modelos en línea, usando lista recomendada', 'info');
      }
    } catch (err) {
      ui.aviso(`No se pudo conectar: ${err.message}`, 'error');
    } finally {
      btnCargarModelosApi.disabled = false;
      btnCargarModelosApi.textContent = '🔄 Actualizar lista';
    }
  });

  async function cargarAjustes() {
    try {
      ui.cargando(true);
      const ajustes = await api.llamar('GET', '/api/admin/ajustes');
      ui.cargando(false);

      if (ajustes) {
        inputProveedor.value = ajustes.iaProveedor || 'gemini';
        inputClave.value = ajustes.iaClave || '';

        const modGuardado = ajustes.iaModelo || 'gemini-1.5-flash';
        poblarSelectModelos(modGuardado);

        inputNombrePlataforma.value = ajustes.nombrePlataforma || 'Ecosistema Educativo';
        inputLimiteIA.value = ajustes.limiteIADiario || 30;
        inputMaxSubida.value = ajustes.maxSubidaMB || 10;
      } else {
        poblarSelectModelos('gemini-1.5-flash');
      }
    } catch (err) {
      ui.cargando(false);
      ui.aviso(`Error al cargar los ajustes: ${err.message}`, 'error');
      poblarSelectModelos('gemini-1.5-flash');
    }
  }

  btnProbarIA.addEventListener('click', async () => {
    const clave = inputClave.value.trim();
    const modelo = obtenerModeloActual();
    const proveedor = inputProveedor.value.trim();

    if (!clave) {
      ui.aviso('Por favor ingresa primero la clave de API (API Key)', 'advertencia');
      inputClave.focus();
      return;
    }

    if (!modelo) {
      ui.aviso('Selecciona o escribe el nombre del modelo', 'advertencia');
      return;
    }

    resultadoPrueba.style.display = 'block';
    resultadoPrueba.className = 'resultado-prueba-ia alerta alerta--info';
    resultadoPrueba.innerHTML = `<strong>Conectando...</strong> Enviando solicitud de prueba a <em>${ui.escapar(modelo)}</em>...`;

    try {
      const resp = await api.llamar('POST', '/api/admin/ia-probar', {
        iaProveedor: proveedor,
        iaModelo: modelo,
        iaClave: clave
      });

      if (resp && resp.ok) {
        resultadoPrueba.className = 'resultado-prueba-ia alerta alerta--exito';
        resultadoPrueba.innerHTML = `
          <strong>✓ Conexión exitosa:</strong> El modelo <strong>${ui.escapar(modelo)}</strong> respondió correctamente.
          <br><small style="color: var(--color-texto-suave);">Respuesta del servidor de Google: "${ui.escapar(resp.respuesta)}"</small>
        `;
        ui.aviso('¡Conexión con Gemini verificada con éxito!', 'exito');
      }
    } catch (err) {
      resultadoPrueba.className = 'resultado-prueba-ia alerta alerta--advertencia';
      const esSaturacion = err.message.includes('alta demanda') || err.message.includes('high demand') || err.message.includes('503');

      resultadoPrueba.innerHTML = `
        <strong>✕ Respuesta de Google Gemini:</strong>
        <p style="margin: var(--espacio-xs) 0 0 0;">${ui.escapar(err.message)}</p>
        ${
          esSaturacion
            ? `
          <div style="margin-top: var(--espacio-s);">
            <button type="button" class="btn btn--pequeno btn--primario" id="btnCambiarAFlash">
              👉 Cambiar al modelo estable "gemini-1.5-flash"
            </button>
          </div>
        `
            : ''
        }
      `;

      if (esSaturacion) {
        const btnCambiar = resultadoPrueba.querySelector('#btnCambiarAFlash');
        if (btnCambiar) {
          btnCambiar.addEventListener('click', () => {
            selectModelo.value = 'gemini-1.5-flash';
            actualizarDescripcionModelo();
            btnProbarIA.click();
          });
        }
      }

      ui.aviso(`Resultado: ${err.message}`, 'error');
    }
  });

  btnGuardarTodo.addEventListener('click', async () => {
    const modelo = obtenerModeloActual();
    const clave = inputClave.value.trim();
    const proveedor = inputProveedor.value.trim();

    if (!modelo) {
      ui.aviso('El modelo de IA es obligatorio', 'error');
      return;
    }

    const payload = {
      iaProveedor: proveedor,
      iaModelo: modelo,
      iaClave: clave,
      nombrePlataforma: inputNombrePlataforma.value.trim() || 'Ecosistema Educativo',
      limiteIADiario: Number(inputLimiteIA.value) || 30,
      maxSubidaMB: Number(inputMaxSubida.value) || 10
    };

    try {
      ui.cargando(true);
      await api.llamar('PUT', '/api/admin/ajustes', payload);
      ui.cargando(false);
      ui.aviso(`Configuración guardada. Modelo activo: ${modelo}`, 'exito');
    } catch (err) {
      ui.cargando(false);
      ui.aviso(`Error al guardar: ${err.message}`, 'error');
    }
  });

  await cargarAjustes();
}
