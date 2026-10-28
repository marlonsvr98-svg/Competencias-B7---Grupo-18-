/**
 * publico/js/modulos/perfil.js
 * Módulo para visualizar y editar el perfil de usuario y cambio de contraseña.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as sesion from '../nucleo/sesion.js';
import * as ui from '../nucleo/ui.js';

await montarPlantilla({ titulo: 'Mi perfil', roles: ['sesion'] });

const contenedor = document.getElementById('contenido');
if (contenedor) {
  let usuario = sesion.usuarioActual() || {};

  contenedor.innerHTML = `
    <div class="perfil-contenedor pila" style="gap: var(--espacio-xl);">
      <!-- Sección 1: Datos personales y fotografía -->
      <section class="tarjeta">
        <h1 style="font-size: var(--texto-2xl); margin-bottom: var(--espacio-s);">Mi Perfil</h1>
        <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin-bottom: var(--espacio-l);">
          Actualiza tu información personal y fotografía de perfil.
        </p>

        <form id="formPerfil" class="pila" style="gap: var(--espacio-m);">
          <div class="perfil-avatar-seccion">
            <div class="perfil-avatar-preview" id="avatarPreview">
              ${
                usuario.foto
                  ? `<img src="${ui.escapar(usuario.foto)}" alt="Foto de perfil">`
                  : `<span>👤</span>`
              }
            </div>
            <div class="pila" style="gap: var(--espacio-xs); flex: 1;">
              <label for="inputFoto" style="font-weight: var(--peso-seminegrita); font-size: var(--texto-s);">
                Cambiar fotografía
              </label>
              <input type="file" id="inputFoto" accept="image/jpeg,image/png,image/webp" style="font-size: var(--texto-xs);">
              <small style="color: var(--color-texto-suave); font-size: var(--texto-xs);">
                Formatos permitidos: JPG, PNG o WEBP (máx. 2 MB).
              </small>
            </div>
          </div>

          <div class="fila" style="gap: var(--espacio-m);">
            <div class="campo" style="flex: 1;">
              <label for="nombre">Nombre</label>
              <input type="text" id="nombre" name="nombre" value="${ui.escapar(usuario.nombre || '')}" required>
            </div>
            <div class="campo" style="flex: 1;">
              <label for="apellido">Apellido</label>
              <input type="text" id="apellido" name="apellido" value="${ui.escapar(usuario.apellido || '')}" required>
            </div>
          </div>

          <div class="campo">
            <label for="correo">Correo electrónico</label>
            <input type="email" id="correo" value="${ui.escapar(usuario.correo || '')}" disabled style="background-color: var(--color-fondo); opacity: 0.85;">
            <small style="color: var(--color-texto-suave); font-size: var(--texto-xs);">El correo electrónico no puede ser modificado.</small>
          </div>

          <div class="campo">
            <label>Rol asignado</label>
            <div>
              <span class="insignia insignia--info" style="text-transform: capitalize;">${ui.escapar(usuario.rol || 'estudiante')}</span>
            </div>
          </div>

          <div class="fila" style="justify-content: flex-end; margin-top: var(--espacio-s);">
            <button type="submit" class="btn btn--primario" id="btnGuardarPerfil">Guardar cambios</button>
          </div>
        </form>
      </section>

      <!-- Sección 2: Cambio de contraseña -->
      <section class="tarjeta">
        <h2 style="font-size: var(--texto-xl); margin-bottom: var(--espacio-s);">Seguridad y Contraseña</h2>
        <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin-bottom: var(--espacio-l);">
          Actualiza tu clave de acceso periódicamente para proteger tu cuenta.
        </p>

        <form id="formClave" class="pila" style="gap: var(--espacio-m);">
          <div class="campo">
            <label for="claveActual">Contraseña actual</label>
            <input type="password" id="claveActual" name="claveActual" required autocomplete="current-password">
          </div>

          <div class="fila" style="gap: var(--espacio-m);">
            <div class="campo" style="flex: 1;">
              <label for="claveNueva">Nueva contraseña</label>
              <input type="password" id="claveNueva" name="claveNueva" placeholder="Mínimo 8 caracteres" required autocomplete="new-password">
              <small style="color: var(--color-texto-suave); font-size: var(--texto-xs);">
                Debe contener al menos 8 caracteres, con letras y números.
              </small>
            </div>
            <div class="campo" style="flex: 1;">
              <label for="claveRepetir">Repetir nueva contraseña</label>
              <input type="password" id="claveRepetir" name="claveRepetir" placeholder="Repite la contraseña" required autocomplete="new-password">
            </div>
          </div>

          <div class="fila" style="justify-content: flex-end; margin-top: var(--espacio-s);">
            <button type="submit" class="btn btn--secundario" id="btnCambiarClave">Cambiar contraseña</button>
          </div>
        </form>
      </section>

      <!-- Sección 3: Logros (se completa en el Sprint 5) -->
      <section id="logros"></section>
    </div>
  `;

  // Cargar datos frescos desde GET /api/auth/yo si es posible
  try {
    const yo = await api.llamar('GET', '/api/auth/yo');
    if (yo) {
      usuario = yo;
      sessionStorage.setItem('usuario', JSON.stringify(usuario));
      document.getElementById('nombre').value = usuario.nombre || '';
      document.getElementById('apellido').value = usuario.apellido || '';
      document.getElementById('correo').value = usuario.correo || '';
      if (usuario.foto) {
        document.getElementById('avatarPreview').innerHTML = `<img src="${ui.escapar(usuario.foto)}" alt="Foto de perfil">`;
      }
    }
  } catch (err) {
    console.error('No se pudo refrescar los datos del perfil:', err);
  }

  // Manejo de cambio de imagen
  const inputFoto = document.getElementById('inputFoto');
  const avatarPreview = document.getElementById('avatarPreview');
  let urlFotoSubida = usuario.foto || '';

  inputFoto.addEventListener('change', async () => {
    const archivo = inputFoto.files?.[0];
    if (!archivo) return;

    if (archivo.size > 2 * 1024 * 1024) {
      ui.aviso('La imagen no debe superar los 2 MB', 'error');
      inputFoto.value = '';
      return;
    }

    try {
      avatarPreview.innerHTML = `<span class="cargando" style="width: 32px; height: 32px;"></span>`;
      const res = await api.subir(archivo);
      urlFotoSubida = res.url;
      avatarPreview.innerHTML = `<img src="${ui.escapar(urlFotoSubida)}" alt="Foto de perfil">`;
      ui.aviso('Imagen subida correctamente. Pulsa "Guardar cambios" para aplicarla a tu perfil.', 'info');
    } catch (err) {
      avatarPreview.innerHTML = urlFotoSubida
        ? `<img src="${ui.escapar(urlFotoSubida)}" alt="Foto de perfil">`
        : `<span>👤</span>`;
      ui.aviso(err.message || 'Error al subir la imagen', 'error');
    }
  });

  // Envío del formulario de perfil
  const formPerfil = document.getElementById('formPerfil');
  const btnGuardarPerfil = document.getElementById('btnGuardarPerfil');

  formPerfil.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();

    if (!nombre || !apellido) {
      ui.aviso('Nombre y apellido son requeridos', 'error');
      return;
    }

    try {
      btnGuardarPerfil.disabled = true;
      btnGuardarPerfil.textContent = 'Guardando...';

      const actualizado = await api.llamar('PUT', '/api/auth/perfil', {
        nombre,
        apellido,
        foto: urlFotoSubida
      });

      // Actualizar usuario en sessionStorage
      const datosGuardados = { ...(sesion.usuarioActual() || {}), ...actualizado };
      sessionStorage.setItem('usuario', JSON.stringify(datosGuardados));

      ui.aviso('Perfil actualizado con éxito', 'exito');

      // Actualizar encabezado si está montado
      const enlaceUsuario = document.querySelector('.encabezado__usuario');
      if (enlaceUsuario) {
        enlaceUsuario.innerHTML = `👤 ${ui.escapar(actualizado.nombre)} <small style="opacity: 0.85;">(${ui.escapar(actualizado.rol)})</small>`;
      }
    } catch (err) {
      ui.aviso(err.message || 'Error al actualizar perfil', 'error');
    } finally {
      btnGuardarPerfil.disabled = false;
      btnGuardarPerfil.textContent = 'Guardar cambios';
    }
  });

  // Envío del formulario de contraseña
  const formClave = document.getElementById('formClave');
  const btnCambiarClave = document.getElementById('btnCambiarClave');

  formClave.addEventListener('submit', async (e) => {
    e.preventDefault();
    const actual = document.getElementById('claveActual').value;
    const nueva = document.getElementById('claveNueva').value;
    const repetir = document.getElementById('claveRepetir').value;

    if (!actual || !nueva || !repetir) {
      ui.aviso('Todos los campos de contraseña son requeridos', 'error');
      return;
    }

    if (nueva !== repetir) {
      ui.aviso('La nueva contraseña y su confirmación no coinciden', 'error');
      return;
    }

    if (nueva.length < 8 || !/[a-zA-Z]/.test(nueva) || !/\d/.test(nueva)) {
      ui.aviso('La nueva contraseña debe tener al menos 8 caracteres y contener letras y números', 'error');
      return;
    }

    try {
      btnCambiarClave.disabled = true;
      btnCambiarClave.textContent = 'Actualizando clave...';

      await api.llamar('POST', '/api/auth/clave', { actual, nueva });
      ui.aviso('Contraseña actualizada con éxito', 'exito');
      formClave.reset();
    } catch (err) {
      ui.aviso(err.message || 'Error al cambiar contraseña', 'error');
    } finally {
      btnCambiarClave.disabled = false;
      btnCambiarClave.textContent = 'Cambiar contraseña';
    }
  });
}
