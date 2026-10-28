/**
 * publico/js/nucleo/menu.js
 * Definición de enlaces del menú del sistema según contrato §A.
 */

export const MENU = [
  { texto: 'Inicio', href: '/index.html', roles: ['publico'] },
  { texto: 'Actividades', href: '/paginas/actividades.html', roles: ['publico'] },
  { texto: 'Mis asignaturas', href: '/paginas/asignaturas.html', roles: ['estudiante', 'docente'] },
  { texto: 'Noticias', href: '/paginas/noticias.html', roles: ['sesion'] },
  { texto: 'Canciones', href: '/paginas/canciones.html', roles: ['sesion'] },
  { texto: 'Mi perfil', href: '/paginas/perfil.html', roles: ['sesion'] },
  { texto: 'Contenidos', href: '/paginas/editor-contenidos.html', roles: ['docente', 'admin'] },
  { texto: 'Banco de preguntas', href: '/paginas/banco-preguntas.html', roles: ['docente', 'admin'] },
  { texto: 'Asignaturas', href: '/paginas/admin-asignaturas.html', roles: ['admin'] },
  { texto: 'Distributivo', href: '/paginas/distributivo.html', roles: ['admin'] },
  { texto: 'Usuarios', href: '/paginas/admin-usuarios.html', roles: ['admin'] },
  { texto: 'Configuración IA', href: '/paginas/admin-ajustes.html', roles: ['admin'] }
];
