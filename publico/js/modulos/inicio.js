/**
 * publico/js/modulos/inicio.js
 * Página de inicio con estados diferenciados para usuarios anónimos y autenticados.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import * as util from '../nucleo/util.js';
import { usuarioActual } from '../nucleo/sesion.js';
import { calcularAvance } from './asignaturas.js';

await montarPlantilla({ titulo: 'Inicio' });

const contenedor = document.getElementById('contenido');

async function renderizarInicio() {
  if (!contenedor) return;

  const usuario = usuarioActual();

  // 1. VISTA SIN SESIÓN
  if (!usuario) {
    contenedor.innerHTML = `
      <div class="pila" style="gap: var(--espacio-xl);">
        <section class="inicio-hero">
          <span class="insignia insignia--info" style="align-self: flex-start;">Plataforma Educativa Digital</span>
          <h1 class="inicio-hero__titulo">Aprende, Descubre y Desarrolla tus Competencias</h1>
          <p class="inicio-hero__descripcion">
            Un ecosistema integral para la formación académica: unidades pedagógicas interactivas,
            evaluaciones formativas, canciones educativas, noticias comunitarias y acompañamiento docente.
          </p>
          <div class="fila" style="gap: var(--espacio-s); margin-top: var(--espacio-s); flex-wrap: wrap;">
            <a href="/paginas/ingreso.html" class="btn btn--primario">Ingresar a mi cuenta →</a>
            <a href="/paginas/registro.html" class="btn btn--secundario">Crear cuenta nueva</a>
          </div>
        </section>

        <!-- Tarjeta destacada: Escape del cuerpo humano -->
        <article class="tarjeta fila" style="justify-content: space-between; align-items: center; background: linear-gradient(135deg, rgba(0, 46, 69, 0.04), rgba(255, 105, 0, 0.08)); border-left: 4px solid var(--color-acento); gap: var(--espacio-m); flex-wrap: wrap;">
          <div class="fila" style="align-items: center; gap: var(--espacio-m);">
            <div style="font-size: var(--texto-3xl); line-height: 1;">🔬</div>
            <div class="pila" style="gap: var(--espacio-xs);">
              <div class="fila" style="align-items: center; gap: var(--espacio-xs);">
                <strong style="color: var(--color-primario); font-size: var(--texto-l);">Escape del cuerpo humano</strong>
                <span class="insignia insignia--advertencia" style="font-size: 10px;">¡Nuevo Juego!</span>
              </div>
              <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;">
                Explora los sistemas del cuerpo humano, supera desafíos científicos y demuestra lo que has aprendido.
              </p>
            </div>
          </div>
          <a href="/paginas/escape-cuerpo.html" class="btn btn--primario" style="background-color: var(--color-acento); border-color: var(--color-acento);">
            🎮 Jugar ahora →
          </a>
        </article>

        <!-- Pilares informativos -->
        <div class="grid-auto">
          <article class="tarjeta pila" style="gap: var(--espacio-xs);">
            <div style="font-size: var(--texto-xl);">📚</div>
            <h3 style="margin: 0; font-size: var(--texto-m);">Contenidos Curriculares</h3>
            <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;">
              Temas organizados por unidades, objetivos claros, resúmenes conceptuales y recursos multimedia.
            </p>
          </article>

          <article class="tarjeta pila" style="gap: var(--espacio-xs);">
            <div style="font-size: var(--texto-xl);">🎮</div>
            <h3 style="margin: 0; font-size: var(--texto-m);">Aprendizaje y Canciones</h3>
            <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;">
              Actividades interactivas, glosarios y canciones con letra sincronizada para afianzar conceptos.
            </p>
          </article>

          <article class="tarjeta pila" style="gap: var(--espacio-xs);">
            <div style="font-size: var(--texto-xl);">📈</div>
            <h3 style="margin: 0; font-size: var(--texto-m);">Seguimiento de Avance</h3>
            <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;">
              Control personal de temas revisados, porcentajes de progreso por asignatura y avisos actualizados.
            </p>
          </article>
        </div>
      </div>
    `;
    return;
  }

  // 2. VISTA CON SESIÓN ACTIVA
  try {
    ui.cargando(true);

    const esDocenteOAdmin = usuario.rol === 'docente' || usuario.rol === 'admin';
    const esAdmin = usuario.rol === 'admin';

    // Recuperar último tema de localStorage
    let ultimoTema = null;
    try {
      const guardado = localStorage.getItem('ultimoTema');
      if (guardado) ultimoTema = JSON.parse(guardado);
    } catch {}

    // Cargar asignaturas y noticias en paralelo
    const [asignaturas, todasNoticias, unidades, temas, progreso] = await Promise.all([
      api.listar('asignaturas'),
      api.listar('noticias'),
      api.listar('unidades'),
      api.listar('temas'),
      api.listar('progreso-temas')
    ]);

    // Calcular avance para cada asignatura
    const datosPreCargados = { unidades, temas, progreso };
    const asignaturasConAvance = await Promise.all(
      (asignaturas || []).map(async (asig) => {
        const pct = await calcularAvance(asig.id, datosPreCargados);
        return { ...asig, avance: pct };
      })
    );

    // Filtrar y ordenar las 3 noticias publicadas más recientes (destacadas primero)
    const noticiasPublicadas = (todasNoticias || [])
      .filter((n) => n && n.estado === 'publicado')
      .sort((a, b) => {
        if (a.destacada && !b.destacada) return -1;
        if (!a.destacada && b.destacada) return 1;
        const fechaA = new Date(a.fechaPublicacion || a.fecha || 0).getTime();
        const fechaB = new Date(b.fechaPublicacion || b.fecha || 0).getTime();
        return fechaB - fechaA;
      })
      .slice(0, 3);

    contenedor.innerHTML = `
      <div class="pila" style="gap: var(--espacio-xl);">
        <!-- Saludo al usuario -->
        <header class="fila" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--espacio-s);">
          <div>
            <h1 style="font-size: var(--texto-xxl); margin: 0; color: var(--color-primario);">
              ¡Hola, ${ui.escapar(usuario.nombre)}! 👋
            </h1>
            <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin-top: 4px;">
              Bienvenido de nuevo a tu espacio de aprendizaje.
            </p>
          </div>
          <span class="insignia insignia--info" style="font-size: var(--texto-s); text-transform: capitalize;">
            Rol: ${ui.escapar(usuario.rol)}
          </span>
        </header>

        <!-- Bloque: Continuar donde te quedaste -->
        ${
          ultimoTema && ultimoTema.id
            ? `
            <section class="tarjeta-continuar">
              <div class="fila" style="align-items: center; gap: var(--espacio-m);">
                <div style="font-size: var(--texto-xl);">🚀</div>
                <div class="pila" style="gap: 2px;">
                  <span style="font-size: var(--texto-xs); color: var(--color-texto-suave); font-weight: var(--peso-seminegrita);">
                    CONTINUAR DONDE TE QUEDASTE
                  </span>
                  <strong style="font-size: var(--texto-m); color: var(--color-primario);">
                    ${ui.escapar(ultimoTema.titulo || 'Tema en curso')}
                  </strong>
                </div>
              </div>
              <a href="/paginas/tema.html?id=${encodeURIComponent(ultimoTema.id)}" class="btn btn--primario">
                Continuar estudio →
              </a>
            </section>
          `
            : ''
        }

        <!-- Accesos rápidos para docentes y administradores -->
        ${
          esDocenteOAdmin
            ? `
            <section class="pila" style="gap: var(--espacio-s);">
              <h2 style="font-size: var(--texto-m); margin: 0; color: var(--color-texto-suave);">
                HERRAMIENTAS DE GESTIÓN RÁPIDA
              </h2>
              <div class="accesos-rapidos-grid">
                <a href="/paginas/editor-contenidos.html" class="acceso-rapido-card">
                  <span>📚</span>
                  <span>Editor de Contenidos</span>
                </a>
                <a href="/paginas/editor-noticia.html" class="acceso-rapido-card">
                  <span>📰</span>
                  <span>Redactar Noticia</span>
                </a>
                <a href="/paginas/editor-cancion.html" class="acceso-rapido-card">
                  <span>🎵</span>
                  <span>Crear Canción</span>
                </a>
                ${
                  esAdmin
                    ? `
                    <a href="/paginas/distributivo.html" class="acceso-rapido-card">
                      <span>👥</span>
                      <span>Distributivo</span>
                    </a>
                  `
                    : ''
                }
              </div>
            </section>
          `
            : ''
        }

        <!-- Tarjeta destacada del Escape Room Educativo -->
        <article class="tarjeta fila" style="justify-content: space-between; align-items: center; background: linear-gradient(135deg, rgba(0, 46, 69, 0.04), rgba(255, 105, 0, 0.08)); border-left: 4px solid var(--color-acento); gap: var(--espacio-m); flex-wrap: wrap;">
          <div class="fila" style="align-items: center; gap: var(--espacio-m);">
            <div style="font-size: var(--texto-3xl); line-height: 1;">🔬</div>
            <div class="pila" style="gap: var(--espacio-xs);">
              <div class="fila" style="align-items: center; gap: var(--espacio-xs);">
                <strong style="color: var(--color-primario); font-size: var(--texto-l);">Escape del cuerpo humano</strong>
                <span class="insignia insignia--advertencia" style="font-size: 10px;">¡Desafío Biológico!</span>
              </div>
              <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;">
                Explora los sistemas del cuerpo humano, supera desafíos científicos y demuestra lo que has aprendido.
              </p>
            </div>
          </div>
          <a href="/paginas/escape-cuerpo.html" class="btn btn--primario" style="background-color: var(--color-acento); border-color: var(--color-acento);">
            🎮 Entrar al juego →
          </a>
        </article>

        <!-- Sección: Mis Asignaturas con su avance -->
        <section class="pila" style="gap: var(--espacio-m);">
          <div class="fila" style="justify-content: space-between; align-items: center;">
            <h2 style="font-size: var(--texto-l); margin: 0;">Mis Asignaturas</h2>
            <a href="/paginas/asignaturas.html" class="btn btn--pequeno btn--texto">
              Ver todas (${asignaturasConAvance.length}) →
            </a>
          </div>

          ${
            asignaturasConAvance.length === 0
              ? `
              <div class="tarjeta pila" style="text-align: center; padding: var(--espacio-l); gap: var(--espacio-s);">
                <p style="color: var(--color-texto-suave); margin: 0;">Aún no tienes asignaturas registradas.</p>
              </div>
            `
              : `
              <div class="inicio-grid-asignaturas">
                ${asignaturasConAvance
                  .map((asig) => {
                    const idEscapado = ui.escapar(asig.id);
                    const nombreEscapado = ui.escapar(asig.nombre || 'Asignatura');
                    const nivelEscapado = ui.escapar(asig.nivel || 'General');
                    const pct = asig.avance || 0;

                    return `
                      <a href="/paginas/asignatura.html?id=${idEscapado}" class="inicio-tarjeta-asignatura">
                        <div class="fila" style="justify-content: space-between; align-items: flex-start;">
                          <h3 style="font-size: var(--texto-m); margin: 0; color: var(--color-primario);">
                            ${nombreEscapado}
                          </h3>
                          <span class="insignia" style="font-size: 10px;">${nivelEscapado}</span>
                        </div>

                        <div class="pila" style="gap: 4px; margin-top: var(--espacio-xs);">
                          <div class="fila" style="justify-content: space-between; font-size: var(--texto-xs);">
                            <span style="color: var(--color-texto-suave);">Avance</span>
                            <strong>${pct}%</strong>
                          </div>
                          <div class="progreso">
                            <div class="progreso__barra" style="width: ${pct}%;"></div>
                          </div>
                        </div>
                      </a>
                    `;
                  })
                  .join('')}
              </div>
            `
          }
        </section>

        <!-- Sección: Últimas Noticias Publicadas -->
        <section class="pila" style="gap: var(--espacio-m);">
          <div class="fila" style="justify-content: space-between; align-items: center;">
            <h2 style="font-size: var(--texto-l); margin: 0;">Últimas Novedades</h2>
            <a href="/paginas/noticias.html" class="btn btn--pequeno btn--texto">
              Ir a Noticias →
            </a>
          </div>

          ${
            noticiasPublicadas.length === 0
              ? `
              <div class="tarjeta pila" style="text-align: center; padding: var(--espacio-l); gap: var(--espacio-s);">
                <p style="color: var(--color-texto-suave); margin: 0;">No hay noticias publicadas por el momento.</p>
              </div>
            `
              : `
              <div class="inicio-grid-noticias">
                ${noticiasPublicadas
                  .map((noticia) => {
                    const idEscapado = ui.escapar(noticia.id);
                    const tituloEscapado = ui.escapar(noticia.titulo || 'Noticia');
                    const resumenEscapado = ui.escapar(noticia.resumen || '');
                    const categoriaEscapada = ui.escapar(noticia.categoria || 'Institucional');
                    const fechaTexto = noticia.fechaPublicacion
                      ? util.fechaRelativa(noticia.fechaPublicacion)
                      : noticia.fecha
                      ? util.fechaRelativa(noticia.fecha)
                      : 'Reciente';

                    return `
                      <a href="/paginas/noticia.html?id=${idEscapado}" class="inicio-noticia-card">
                        ${
                          noticia.imagen
                            ? `<img src="${ui.escapar(noticia.imagen)}" alt="${tituloEscapado}" class="inicio-noticia-card__img" loading="lazy">`
                            : ''
                        }
                        <div class="pila" style="padding: var(--espacio-m); gap: var(--espacio-xs); flex: 1;">
                          <div class="fila" style="gap: var(--espacio-xs); align-items: center;">
                            <span class="insignia insignia--info" style="font-size: 10px;">${categoriaEscapada}</span>
                            ${noticia.destacada ? `<span class="insignia" style="background-color: var(--color-advertencia); color: var(--color-texto-inverso); font-size: 10px;">⭐ Destacada</span>` : ''}
                          </div>
                          <h3 style="font-size: var(--texto-s); margin: 0; line-height: var(--interlineado-apretado);">
                            ${tituloEscapado}
                          </h3>
                          <p style="color: var(--color-texto-suave); font-size: var(--texto-xs); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${resumenEscapado}
                          </p>
                          <small style="color: var(--color-texto-suave); font-size: 10px; margin-top: auto; padding-top: var(--espacio-xs);">
                            🕒 ${fechaTexto}
                          </small>
                        </div>
                      </a>
                    `;
                  })
                  .join('')}
              </div>
            `
          }
        </section>
      </div>
    `;
  } catch (err) {
    console.error('Error al renderizar inicio con sesión:', err);
    contenedor.innerHTML = `
      <div class="tarjeta pila" style="text-align: center; gap: var(--espacio-m); margin-top: var(--espacio-xl);">
        <h2 style="color: var(--color-error);">Error al cargar página de inicio</h2>
        <p style="color: var(--color-texto-suave);">${ui.escapar(err.message)}</p>
      </div>
    `;
  } finally {
    ui.cargando(false);
  }
}

renderizarInicio();
