/**
 * publico/js/modulos/registro.js
 * Módulo de registro de estudiantes con validación en vivo.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as sesion from '../nucleo/sesion.js';
import * as ui from '../nucleo/ui.js';

await montarPlantilla({ titulo: 'Registro de Estudiante', roles: ['publico'] });

const contenedor = document.getElementById('contenido');
if (contenedor) {
  contenedor.innerHTML = `
    <section class="tarjeta tarjeta-registro">
      <h1 style="font-size: var(--texto-2xl); margin-bottom: var(--espacio-xs);">Crear Cuenta de Estudiante</h1>
      <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin-bottom: var(--espacio-l);">
        Regístrate para acceder a tus contenidos y participar en las actividades.
      </p>

      <form id="formularioRegistro" class="pila" style="gap: var(--espacio-m);" novalidate>
        <div class="fila" style="gap: var(--espacio-m); align-items: flex-start;">
          <div class="campo" style="flex: 1;">
            <label for="nombre">Nombre</label>
            <input type="text" id="nombre" name="nombre" placeholder="Ej. Carlos" autofocus>
            <span class="campo__error" id="errorNombre" style="display: none;"></span>
          </div>
          <div class="campo" style="flex: 1;">
            <label for="apellido">Apellido</label>
            <input type="text" id="apellido" name="apellido" placeholder="Ej. Mendoza">
            <span class="campo__error" id="errorApellido" style="display: none;"></span>
          </div>
        </div>

        <div class="campo">
          <label for="correo">Correo electrónico</label>
          <input type="email" id="correo" name="correo" placeholder="carlos.mendoza@educa.ec" autocomplete="email">
          <span class="campo__error" id="errorCorreo" style="display: none;"></span>
        </div>

        <div class="campo">
          <label for="clave">Contraseña</label>
          <input type="password" id="clave" name="clave" placeholder="••••••••" autocomplete="new-password">
          <small style="color: var(--color-texto-suave); font-size: var(--texto-xs);">
            Debe tener al menos 8 caracteres y contener letras y números.
          </small>
          <span class="campo__error" id="errorClave" style="display: none;"></span>
        </div>

        <div class="campo" style="flex-direction: column; gap: var(--espacio-xs);">
          <div style="display: flex; align-items: flex-start; gap: var(--espacio-xs);">
            <input type="checkbox" id="consentimiento" name="consentimiento" style="margin-top: 4px; width: auto; cursor: pointer;">
            <label for="consentimiento" style="font-weight: normal; font-size: var(--texto-s); cursor: pointer; line-height: var(--interlineado-normal);">
              Acepto el <a href="/paginas/privacidad.html" target="_blank" rel="noopener">aviso de privacidad</a>
            </label>
          </div>
          <span class="campo__error" id="errorConsentimiento" style="display: none;"></span>
        </div>

        <button type="submit" class="btn btn--primario" id="btnRegistrar" style="width: 100%; margin-top: var(--espacio-s);">
          Completar registro
        </button>
      </form>

      <div class="tarjeta-registro__pie">
        ¿Ya tienes una cuenta registrada? <a href="/paginas/ingreso.html">Inicia sesión aquí</a>
      </div>
    </section>
  `;

  const form = document.getElementById('formularioRegistro');
  const inputNombre = document.getElementById('nombre');
  const inputApellido = document.getElementById('apellido');
  const inputCorreo = document.getElementById('correo');
  const inputClave = document.getElementById('clave');
  const inputConsentimiento = document.getElementById('consentimiento');

  const errorNombre = document.getElementById('errorNombre');
  const errorApellido = document.getElementById('errorApellido');
  const errorCorreo = document.getElementById('errorCorreo');
  const errorClave = document.getElementById('errorClave');
  const errorConsentimiento = document.getElementById('errorConsentimiento');
  const btnRegistrar = document.getElementById('btnRegistrar');

  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function mostrarError(input, spanError, mensaje) {
    if (mensaje) {
      spanError.textContent = mensaje;
      spanError.style.display = 'block';
      if (input) input.setAttribute('aria-invalid', 'true');
      return false;
    } else {
      spanError.textContent = '';
      spanError.style.display = 'none';
      if (input) input.removeAttribute('aria-invalid');
      return true;
    }
  }

  function validarNombre() {
    const valor = inputNombre.value.trim();
    if (!valor) return mostrarError(inputNombre, errorNombre, 'El nombre es obligatorio');
    if (valor.length < 2) return mostrarError(inputNombre, errorNombre, 'Debe tener al menos 2 caracteres');
    return mostrarError(inputNombre, errorNombre, '');
  }

  function validarApellido() {
    const valor = inputApellido.value.trim();
    if (!valor) return mostrarError(inputApellido, errorApellido, 'El apellido es obligatorio');
    if (valor.length < 2) return mostrarError(inputApellido, errorApellido, 'Debe tener al menos 2 caracteres');
    return mostrarError(inputApellido, errorApellido, '');
  }

  function validarCorreo() {
    const valor = inputCorreo.value.trim();
    if (!valor) return mostrarError(inputCorreo, errorCorreo, 'El correo electrónico es obligatorio');
    if (!regexCorreo.test(valor)) return mostrarError(inputCorreo, errorCorreo, 'Ingresa un correo electrónico válido');
    return mostrarError(inputCorreo, errorCorreo, '');
  }

  function validarClave() {
    const valor = inputClave.value;
    if (!valor) return mostrarError(inputClave, errorClave, 'La contraseña es obligatoria');
    if (valor.length < 8) return mostrarError(inputClave, errorClave, 'Debe tener al menos 8 caracteres');
    if (!/[a-zA-Z]/.test(valor) || !/\d/.test(valor)) {
      return mostrarError(inputClave, errorClave, 'Debe contener al menos una letra y un número');
    }
    return mostrarError(inputClave, errorClave, '');
  }

  function validarConsentimiento() {
    if (!inputConsentimiento.checked) {
      return mostrarError(inputConsentimiento, errorConsentimiento, 'Debes aceptar el aviso de privacidad para registrarte');
    }
    return mostrarError(inputConsentimiento, errorConsentimiento, '');
  }

  // Validación en vivo
  inputNombre.addEventListener('input', validarNombre);
  inputNombre.addEventListener('blur', validarNombre);

  inputApellido.addEventListener('input', validarApellido);
  inputApellido.addEventListener('blur', validarApellido);

  inputCorreo.addEventListener('input', validarCorreo);
  inputCorreo.addEventListener('blur', validarCorreo);

  inputClave.addEventListener('input', validarClave);
  inputClave.addEventListener('blur', validarClave);

  inputConsentimiento.addEventListener('change', validarConsentimiento);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const okNombre = validarNombre();
    const okApellido = validarApellido();
    const okCorreo = validarCorreo();
    const okClave = validarClave();
    const okConsentimiento = validarConsentimiento();

    if (!okNombre || !okApellido || !okCorreo || !okClave || !okConsentimiento) {
      ui.aviso('Por favor completa y corrige los campos señalados', 'error');
      return;
    }

    try {
      btnRegistrar.disabled = true;
      btnRegistrar.textContent = 'Creando cuenta...';

      const nombre = inputNombre.value.trim();
      const apellido = inputApellido.value.trim();
      const correo = inputCorreo.value.trim().toLowerCase();
      const clave = inputClave.value;

      // 1. Registrar usuario
      await sesion.registrar({
        nombre,
        apellido,
        correo,
        clave,
        consentimiento: true
      });

      // 2. Iniciar sesión automáticamente
      btnRegistrar.textContent = 'Iniciando sesión...';
      const loginRes = await sesion.iniciar(correo, clave);

      ui.aviso(`¡Cuenta creada con éxito! Bienvenido/a, ${loginRes.usuario.nombre}`, 'exito');

      // 3. Tras ingresar → /index.html
      window.location.href = '/index.html';
    } catch (err) {
      ui.aviso(err.message || 'Error al completar el registro', 'error');
    } finally {
      btnRegistrar.disabled = false;
      btnRegistrar.textContent = 'Completar registro';
    }
  });
}
