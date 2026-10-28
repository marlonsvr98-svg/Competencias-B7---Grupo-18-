/**
 * publico/js/modulos/admin-usuarios.js
 * Módulo de administración de usuarios para roles de administrador.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import * as util from '../nucleo/util.js';

await montarPlantilla({ titulo: 'Administración de Usuarios', roles: ['admin'] });

const contenedor = document.getElementById('contenido');
if (contenedor) {
  contenedor.innerHTML = `
    <div class="pila" style="gap: var(--espacio-l);">
      <header class="fila" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--espacio-m);">
        <div>
          <h1 style="font-size: var(--texto-2xl); margin-bottom: var(--espacio-xs);">Usuarios del Sistema</h1>
          <p style="color: var(--color-texto-suave); font-size: var(--texto-s);">
            Gestiona los roles, activación de cuentas y credenciales de acceso.
          </p>
        </div>
        <span class="insignia insignia--info" id="contadorUsuarios">Cargando...</span>
      </header>

      <!-- Filtros y buscador -->
      <section class="tarjeta" style="padding: var(--espacio-m);">
        <div class="admin-usuarios-filtros" style="margin-bottom: 0;">
          <div class="campo admin-usuarios-busqueda" style="margin-bottom: 0;">
            <input type="search" id="inputBuscar" placeholder="Buscar por nombre, apellido o correo..." aria-label="Buscar usuarios">
          </div>
          <div class="fila" style="align-items: center; gap: var(--espacio-s);">
            <label for="filtroRol" style="font-size: var(--texto-s); font-weight: var(--peso-seminegrita);">Filtrar por rol:</label>
            <select id="filtroRol" class="campo" style="margin-bottom: 0; width: auto;">
              <option value="">Todos los roles</option>
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Tabla de usuarios -->
      <section class="tarjeta" style="padding: 0; overflow: hidden;">
        <div class="tabla-contenedor" style="margin-bottom: 0; border: none;">
          <table class="tabla" id="tablaUsuarios">
            <thead>
              <tr>
                <th style="width: 48px;">Foto</th>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th style="text-align: center;">Activo</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody id="cuerpoTabla">
              <tr>
                <td colspan="6" style="text-align: center; padding: var(--espacio-xl);">
                  <span class="cargando" role="status" aria-label="Cargando usuarios"></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  let listaUsuarios = [];
  const inputBuscar = document.getElementById('inputBuscar');
  const filtroRol = document.getElementById('filtroRol');
  const cuerpoTabla = document.getElementById('cuerpoTabla');
  const contadorUsuarios = document.getElementById('contadorUsuarios');

  async function cargarUsuarios() {
    try {
      listaUsuarios = await api.listar('usuarios');
      renderizarTabla();
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      ui.aviso(`Error al cargar usuarios: ${err.message}`, 'error');
      cuerpoTabla.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: var(--espacio-l); color: var(--color-error);">
            No se pudieron cargar los usuarios.
          </td>
        </tr>
      `;
    }
  }

  function renderizarTabla() {
    const textoBusqueda = util.normalizar(inputBuscar.value.trim());
    const rolSeleccionado = filtroRol.value;

    const filtrados = listaUsuarios.filter((u) => {
      if (rolSeleccionado && u.rol !== rolSeleccionado) {
        return false;
      }
      if (!textoBusqueda) return true;

      const nombreCompleto = util.normalizar(`${u.nombre || ''} ${u.apellido || ''}`);
      const correo = util.normalizar(u.correo || '');

      return nombreCompleto.includes(textoBusqueda) || correo.includes(textoBusqueda);
    });

    contadorUsuarios.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'usuario' : 'usuarios'}`;

    if (filtrados.length === 0) {
      cuerpoTabla.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: var(--espacio-xl); color: var(--color-texto-suave);">
            No se encontraron usuarios que coincidan con los filtros aplicados.
          </td>
        </tr>
      `;
      return;
    }

    cuerpoTabla.innerHTML = filtrados
      .map((u) => {
        const idEscapado = ui.escapar(u.id);
        const nombreEscapado = ui.escapar(u.nombre || '');
        const apellidoEscapado = ui.escapar(u.apellido || '');
        const correoEscapado = ui.escapar(u.correo || '');
        const rolActual = u.rol || 'estudiante';
        const estaActivo = u.activo !== false;

        const fotoHtml = u.foto
          ? `<img src="${ui.escapar(u.foto)}" alt="${nombreEscapado}" class="admin-usuarios-avatar">`
          : `<span class="admin-usuarios-avatar">👤</span>`;

        return `
          <tr data-id="${idEscapado}">
            <td>${fotoHtml}</td>
            <td>
              <div class="pila" style="gap: 2px;">
                <strong>${nombreEscapado} ${apellidoEscapado}</strong>
                <small style="color: var(--color-texto-suave);">ID: <code>${idEscapado}</code></small>
              </div>
            </td>
            <td>${correoEscapado}</td>
            <td>
              <select class="admin-usuarios-select-rol" data-id="${idEscapado}" data-anterior="${rolActual}" aria-label="Cambiar rol de ${nombreEscapado}">
                <option value="estudiante" ${rolActual === 'estudiante' ? 'selected' : ''}>Estudiante</option>
                <option value="docente" ${rolActual === 'docente' ? 'selected' : ''}>Docente</option>
                <option value="admin" ${rolActual === 'admin' ? 'selected' : ''}>Administrador</option>
              </select>
            </td>
            <td style="text-align: center;">
              <input type="checkbox" class="check-activo" data-id="${idEscapado}" ${estaActivo ? 'checked' : ''} aria-label="Cuenta activa de ${nombreEscapado}" style="cursor: pointer;">
            </td>
            <td style="text-align: right;">
              <button type="button" class="btn btn--pequeno btn--secundario btn-restablecer" data-id="${idEscapado}" data-correo="${correoEscapado}" data-nombre="${nombreEscapado} ${apellidoEscapado}">
                🔑 Restablecer clave
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Eventos para cambio de rol
    cuerpoTabla.querySelectorAll('.admin-usuarios-select-rol').forEach((select) => {
      select.addEventListener('change', async (e) => {
        const id = select.getAttribute('data-id');
        const anterior = select.getAttribute('data-anterior');
        const nuevoRol = select.value;

        try {
          select.disabled = true;
          await api.actualizar('usuarios', id, { rol: nuevoRol });
          select.setAttribute('data-anterior', nuevoRol);
          ui.aviso('Rol actualizado con éxito', 'exito');

          // Actualizar en memoria local
          const index = listaUsuarios.findIndex((item) => item.id === id);
          if (index !== -1) listaUsuarios[index].rol = nuevoRol;
        } catch (err) {
          select.value = anterior;
          ui.aviso(err.message || 'No se pudo actualizar el rol', 'error');
        } finally {
          select.disabled = false;
        }
      });
    });

    // Eventos para activación / desactivación
    cuerpoTabla.querySelectorAll('.check-activo').forEach((checkbox) => {
      checkbox.addEventListener('change', async () => {
        const id = checkbox.getAttribute('data-id');
        const activo = checkbox.checked;

        try {
          checkbox.disabled = true;
          await api.actualizar('usuarios', id, { activo });
          ui.aviso(activo ? 'Usuario activado' : 'Usuario desactivado', 'info');

          // Actualizar en memoria local
          const index = listaUsuarios.findIndex((item) => item.id === id);
          if (index !== -1) listaUsuarios[index].activo = activo;
        } catch (err) {
          checkbox.checked = !activo;
          ui.aviso(err.message || 'No se pudo cambiar el estado del usuario', 'error');
        } finally {
          checkbox.disabled = false;
        }
      });
    });

    // Eventos para restablecer clave
    cuerpoTabla.querySelectorAll('.btn-restablecer').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const nombre = btn.getAttribute('data-nombre');
        const correo = btn.getAttribute('data-correo');

        const confirmado = await ui.confirmar(
          `¿Deseas restablecer la contraseña para ${nombre} (${correo})? Se generará una clave temporal.`
        );

        if (!confirmado) return;

        try {
          btn.disabled = true;
          btn.textContent = 'Generando...';

          const res = await api.llamar('POST', `/api/admin/usuarios/${id}/restablecer`);

          // Crear modal con la clave y botón para copiar
          const cuerpoModal = document.createElement('div');
          cuerpoModal.className = 'pila';
          cuerpoModal.style.gap = 'var(--espacio-m)';
          cuerpoModal.innerHTML = `
            <p>Se ha generado una nueva contraseña temporal para el usuario <strong>${ui.escapar(correo)}</strong>:</p>
            <div class="fila" style="background: var(--color-fondo); border: 1px solid var(--color-borde); padding: var(--espacio-m); border-radius: var(--radio-m); align-items: center; justify-content: space-between;">
              <code style="font-size: var(--texto-l); font-weight: var(--peso-negrita); letter-spacing: 2px;">${ui.escapar(res.claveTemporal)}</code>
              <button type="button" class="btn btn--pequeno btn--secundario" id="btnCopiarClaveTemporal">
                📋 Copiar
              </button>
            </div>
            <p style="font-size: var(--texto-xs); color: var(--color-texto-suave);">
              Copia y comparte esta contraseña con el usuario. Por seguridad, no se volverá a mostrar en pantalla.
            </p>
          `;

          const btnCopiar = cuerpoModal.querySelector('#btnCopiarClaveTemporal');
          btnCopiar.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(res.claveTemporal);
              btnCopiar.textContent = '✓ ¡Copiada!';
              ui.aviso('Contraseña temporal copiada al portapapeles', 'exito');
            } catch {
              ui.aviso('No se pudo copiar automáticamente. Por favor selecciónala y cópiala manualmente.', 'advertencia');
            }
          });

          await ui.modal({
            titulo: 'Contraseña temporal generada',
            contenido: cuerpoModal,
            acciones: [{ texto: 'Aceptar', valor: 'ok', primario: true }]
          });
        } catch (err) {
          ui.aviso(err.message || 'Error al restablecer la contraseña', 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = '🔑 Restablecer clave';
        }
      });
    });
  }

  // Búsqueda y filtros reactivos
  inputBuscar.addEventListener('input', renderizarTabla);
  filtroRol.addEventListener('change', renderizarTabla);

  // Carga inicial
  cargarUsuarios();
}
