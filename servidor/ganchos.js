import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const GANCHOS_DIR = path.resolve(DIRNAME, 'ganchos');

const registroGanchos = new Map();

/**
 * Carga todos los módulos de ganchos desde servidor/ganchos/<col>.js
 */
export async function cargarGanchos() {
  try {
    const entradas = await fs.readdir(GANCHOS_DIR, { withFileTypes: true });
    for (const entrada of entradas) {
      if (entrada.isFile() && entrada.name.endsWith('.js')) {
        const coleccion = entrada.name.slice(0, -3);
        const rutaCompleta = path.join(GANCHOS_DIR, entrada.name);
        const urlModulo = pathToFileURL(rutaCompleta).href;
        const modulo = await import(urlModulo);
        if (modulo && modulo.default) {
          registroGanchos.set(coleccion, modulo.default);
        }
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Error al cargar ganchos:', err);
    }
  }
}

// Carga inicial automática de los ganchos
await cargarGanchos();

/**
 * Aplica un gancho sobre una colección. Si el gancho no existe, devuelve el primer argumento.
 * @param {string} col - Nombre de la colección.
 * @param {'filtrarLista'|'antesDeGuardar'|'despuesDeGuardar'|string} nombre - Nombre del gancho.
 * @param  {...any} args - Argumentos a pasar al gancho.
 * @returns {Promise<any>}
 */
export async function aplicar(col, nombre, ...args) {
  let gancho = registroGanchos.get(col);
  if (!gancho && typeof col === 'string' && col.includes('/')) {
    gancho = registroGanchos.get(col.split('/')[0]);
  }

  if (!gancho || typeof gancho[nombre] !== 'function') {
    return args[0];
  }

  const resultado = await gancho[nombre](...args);
  return resultado !== undefined ? resultado : args[0];
}
