/**
 * publico/js/modulos/privacidad.js
 * Módulo de aviso de privacidad y protección de datos conforme a la LOPDP del Ecuador.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';

await montarPlantilla({ titulo: 'Aviso de Privacidad', roles: ['publico'] });

const contenedor = document.getElementById('contenido');
if (contenedor) {
  contenedor.innerHTML = `
    <article class="tarjeta privacidad-tarjeta">
      <header style="margin-bottom: var(--espacio-l); border-bottom: 1px solid var(--color-borde); padding-bottom: var(--espacio-m);">
        <h1 style="font-size: var(--texto-2xl); margin-bottom: var(--espacio-xs);">Aviso de Privacidad</h1>
        <p style="color: var(--color-texto-suave); font-size: var(--texto-s);">
          Ecosistema Educativo Digital · Protección de Datos Personales
        </p>
      </header>

      <section class="privacidad-seccion">
        <h2>1. Finalidad del tratamiento</h2>
        <p>
          Los datos personales recolectados en esta plataforma tienen como exclusiva finalidad la gestión académica,
          el seguimiento del progreso pedagógico, la retroalimentación formativa y la acreditación de competencias digitales.
        </p>
      </section>

      <section class="privacidad-seccion">
        <h2>2. Datos personales tratados</h2>
        <p>Tratamos únicamente los datos indispensables para fines educativos:</p>
        <ul>
          <li><strong>Identificación y contacto:</strong> Nombres, apellidos y dirección de correo electrónico.</li>
          <li><strong>Actividad en la plataforma:</strong> Registros de acceso, intentos en actividades, respuestas a cuestionarios, interacciones socráticas y logros obtenidos.</li>
        </ul>
      </section>

      <section class="privacidad-seccion">
        <h2>3. Derechos de los titulares (LOPDP Ecuador)</h2>
        <p>
          De conformidad con la Ley Orgánica de Protección de Datos Personales (LOPDP) de la República del Ecuador,
          tienes derecho a solicitar el <strong>acceso</strong>, <strong>rectificación</strong>, <strong>actualización</strong> y
          <strong>eliminación</strong> de tus datos personales, así como a revocar tu consentimiento en cualquier momento.
        </p>
      </section>

      <section class="privacidad-seccion">
        <h2>4. Contacto para el ejercicio de derechos</h2>
        <p>
          Para ejercer cualquiera de tus derechos o realizar consultas sobre el tratamiento de tu información personal,
          puedes comunicarte con nuestro canal de atención de privacidad:
        </p>
        <p style="margin-top: var(--espacio-xs);">
          📧 Correo de contacto: <a href="mailto:privacidad@educa.ec" style="font-weight: var(--peso-seminegrita);">privacidad@educa.ec</a>
        </p>
      </section>

      <footer style="margin-top: var(--espacio-xl); display: flex; gap: var(--espacio-m);">
        <a href="/paginas/registro.html" class="btn btn--primario">Volver al Registro</a>
        <a href="/index.html" class="btn btn--secundario">Ir al Inicio</a>
      </footer>
    </article>
  `;
}
