/**
 * publico/js/modulos/ingreso.js
 * Módulo de inicio de sesión con validación en vivo.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as sesion from '../nucleo/sesion.js';
import * as ui from '../nucleo/ui.js';

await montarPlantilla({ titulo: 'Iniciar Sesión', roles: ['publico'] });

const contenedor = document.getElementById('contenido');
if (contenedor) {
  contenedor.innerHTML = `
    <section class="tarjeta tarjeta-auth">
      <h1 style="font-size: var(--texto-2xl); margin-bottom: var(--espacio-xs);">Iniciar Sesión</h1>
      <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin-bottom: var(--espacio-l);">
        Ingresa a tu cuenta para continuar aprendiendo en la plataforma.
      </p>

      <form id="formularioIngreso" class="pila" style="gap: var(--espacio-m);" novalidate>
        <div class="campo" id="campoCorreo">
          <label for="correo">Correo electrónico</label>
          <input type="email" id="correo" name="correo" placeholder="ejemplo@educa.ec" autocomplete="email" autofocus>
          <span class="campo__error" id="errorCorreo" style="display: none;"></span>
        </div>

        <div class="campo" id="campoClave">
          <label for="clave">Contraseña</label>
          <input type="password" id="clave" name="clave" placeholder="••••••••" autocomplete="current-password">
          <span class="campo__error" id="errorClave" style="display: none;"></span>
        </div>

        <button type="submit" class="btn btn--primario" id="btnIngresar" style="width: 100%;">
          Entrar a la plataforma
        </button>
      </form>

      <div class="tarjeta-auth__pie">
        ¿Aún no tienes una cuenta? <a href="/paginas/registro.html">Regístrate como estudiante aquí</a>
      </div>
    </section>
  `;

  const form = document.getElementById('formularioIngreso');
  const inputCorreo = document.getElementById('correo');
  const inputClave = document.getElementById('clave');
  const errorCorreo = document.getElementById('errorCorreo');
  const errorClave = document.getElementById('errorClave');
  const btnIngresar = document.getElementById('btnIngresar');

  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function mostrarError(input, spanError, mensaje) {
    if (mensaje) {
      spanError.textContent = mensaje;
      spanError.style.display = 'block';
      input.setAttribute('aria-invalid', 'true');
      return false;
    } else {
      spanError.textContent = '';
      spanError.style.display = 'none';
      input.removeAttribute('aria-invalid');
      return true;
    }
  }

  function validarCorreo() {
    const valor = inputCorreo.value.trim();
    if (!valor) {
      return mostrarError(inputCorreo, errorCorreo, 'El correo electrónico es obligatorio');
    }
    if (!regexCorreo.test(valor)) {
      return mostrarError(inputCorreo, errorCorreo, 'Ingresa un correo electrónico válido');
    }
    return mostrarError(inputCorreo, errorCorreo, '');
  }

  function validarClave() {
    const valor = inputClave.value;
    if (!valor) {
      return mostrarError(inputClave, errorClave, 'La contraseña es obligatoria');
    }
    return mostrarError(inputClave, errorClave, '');
  }

  // Validación en vivo
  inputCorreo.addEventListener('input', validarCorreo);
  inputCorreo.addEventListener('blur', validarCorreo);

  inputClave.addEventListener('input', validarClave);
  inputClave.addEventListener('blur', validarClave);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const okCorreo = validarCorreo();
    const okClave = validarClave();

    if (!okCorreo || !okClave) {
      ui.aviso('Por favor corrige los campos señalados', 'error');
      return;
    }

    try {
      btnIngresar.disabled = true;
      btnIngresar.textContent = 'Iniciando sesión...';

      const res = await sesion.iniciar(inputCorreo.value.trim(), inputClave.value);
      ui.aviso(`¡Bienvenido/a, ${res.usuario.nombre}!`, 'exito');

      window.location.href = '/index.html';
    } catch (err) {
      ui.aviso(err.message || 'Error al iniciar sesión', 'error');
    } finally {
      btnIngresar.disabled = false;
      btnIngresar.textContent = 'Entrar a la plataforma';
    }
  });
}
