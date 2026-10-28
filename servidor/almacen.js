import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const DATOS_DIR = path.resolve(DIRNAME, '../datos');

// Validación de nombres de colección
function validarColeccion(col) {
  if (typeof col !== 'string') {
    const err = new Error('El nombre de la colección debe ser texto');
    err.estado = 400;
    throw err;
  }
  const limpia = col.replace(/\\/g, '/');
  // Nombres solo con minúsculas, números y guiones, con una subcarpeta opcional
  if (!/^[a-z0-9-]+(?:\/[a-z0-9_-]+)?$/.test(limpia)) {
    const err = new Error(`Nombre de colección inválido: "${col}"`);
    err.estado = 400;
    throw err;
  }
  return limpia;
}

function rutaColeccion(col) {
  const normalizada = validarColeccion(col);
  const partes = normalizada.split('/');
  const ruta = path.join(DATOS_DIR, ...partes) + '.json';
  if (!ruta.startsWith(DATOS_DIR)) {
    const err = new Error('Acceso no permitido');
    err.estado = 403;
    throw err;
  }
  return ruta;
}

// Respaldo diario en la primera escritura de cada día
let fechaUltimoRespaldo = null;

async function depurarRespaldosAntiguos(dirRespaldos) {
  try {
    const entradas = await fs.readdir(dirRespaldos, { withFileTypes: true });
    const respaldos = entradas
      .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
      .map((e) => e.name)
      .sort();

    if (respaldos.length > 14) {
      const aEliminar = respaldos.slice(0, respaldos.length - 14);
      for (const dir of aEliminar) {
        await fs.rm(path.join(dirRespaldos, dir), { recursive: true, force: true });
      }
    }
  } catch (err) {
    console.error('Error al depurar respaldos antiguos:', err);
  }
}

async function asegurarRespaldoDiario() {
  const hoy = new Date().toISOString().slice(0, 10);
  if (fechaUltimoRespaldo === hoy) return;

  const dirRespaldos = path.join(DATOS_DIR, 'respaldos');
  const destino = path.join(dirRespaldos, hoy);

  try {
    await fs.access(destino);
    fechaUltimoRespaldo = hoy;
    return;
  } catch {
    // Si no existe, procedemos a crearlo
  }

  try {
    await fs.mkdir(destino, { recursive: true });
    const entradas = await fs.readdir(DATOS_DIR, { withFileTypes: true });
    for (const entrada of entradas) {
      if (entrada.name === 'respaldos') continue;
      const origenEntrada = path.join(DATOS_DIR, entrada.name);
      const destinoEntrada = path.join(destino, entrada.name);
      await fs.cp(origenEntrada, destinoEntrada, { recursive: true });
    }

    fechaUltimoRespaldo = hoy;
    await depurarRespaldosAntiguos(dirRespaldos);
  } catch (err) {
    console.error('Error al generar respaldo diario:', err);
  }
}

// Cola de escrituras por archivo
const colas = new Map();

function encolarEscritura(rutaArchivo, operacion) {
  const colaActual = colas.get(rutaArchivo) || Promise.resolve();
  const nuevaCola = colaActual
    .catch(() => {})
    .then(async () => {
      await asegurarRespaldoDiario();
      await fs.mkdir(path.dirname(rutaArchivo), { recursive: true });
      const rutaTmp = `${rutaArchivo}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
      await operacion(rutaTmp);
      try {
        await fs.rename(rutaTmp, rutaArchivo);
      } catch (err) {
        // En Windows, si el destino ya existe o está retenido temporalmente
        await fs.copyFile(rutaTmp, rutaArchivo);
        await fs.unlink(rutaTmp).catch(() => {});
      }
    });

  colas.set(rutaArchivo, nuevaCola);
  return nuevaCola;
}

// Generador de ID: 3 primeras letras de la colección + "_" + número de 6 dígitos
function generarId(col, lista) {
  const segmento = col.includes('/') ? col.split('/')[0] : col;
  const letras = segmento.replace(/[^a-z]/g, '');
  const prefijo = (letras.slice(0, 3) || 'reg').toLowerCase();
  let maxNum = 0;

  for (const item of lista) {
    if (item && typeof item.id === 'string') {
      const match = item.id.match(/_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const siguiente = String(maxNum + 1).padStart(6, '0');
  return `${prefijo}_${siguiente}`;
}

export async function leer(col) {
  const ruta = rutaColeccion(col);
  try {
    const contenido = await fs.readFile(ruta, 'utf-8');
    if (!contenido.trim()) return [];
    return JSON.parse(contenido);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export async function escribir(col, lista) {
  const ruta = rutaColeccion(col);
  const json = JSON.stringify(lista, null, 2);
  await encolarEscritura(ruta, async (rutaTmp) => {
    await fs.writeFile(rutaTmp, json, 'utf-8');
  });
}

export async function agregar(col, reg) {
  const lista = await leer(col);
  const id = reg.id || generarId(col, lista);
  const fecha = reg.fecha || new Date().toISOString();
  const nuevo = { id, ...reg, fecha };
  lista.push(nuevo);
  await escribir(col, lista);
  return nuevo;
}

export async function actualizar(col, id, cambios) {
  const lista = await leer(col);
  const indice = lista.findIndex((item) => item && item.id === id);
  if (indice === -1) {
    const err = new Error(`Registro con id "${id}" no encontrado en ${col}`);
    err.estado = 404;
    throw err;
  }
  const actualizado = { ...lista[indice], ...cambios, id };
  lista[indice] = actualizado;
  await escribir(col, lista);
  return actualizado;
}

export async function eliminar(col, id) {
  const lista = await leer(col);
  const indice = lista.findIndex((item) => item && item.id === id);
  if (indice === -1) {
    const err = new Error(`Registro con id "${id}" no encontrado en ${col}`);
    err.estado = 404;
    throw err;
  }
  const eliminado = lista.splice(indice, 1)[0];
  await escribir(col, lista);
  return eliminado;
}

export async function buscar(col, filtro = {}) {
  const lista = await leer(col);
  const claves = Object.keys(filtro);
  if (claves.length === 0) return lista;
  return lista.filter((item) => {
    for (const clave of claves) {
      if (String(item[clave]) !== String(filtro[clave])) return false;
    }
    return true;
  });
}

export async function anexarLinea(archivo, obj) {
  const limpia = archivo.replace(/\\/g, '/');
  const ruta = path.join(DATOS_DIR, limpia);
  if (!ruta.startsWith(DATOS_DIR)) {
    const err = new Error('Ruta de archivo no permitida');
    err.estado = 403;
    throw err;
  }
  const linea = JSON.stringify(obj) + '\n';
  await encolarEscritura(ruta, async (rutaTmp) => {
    try {
      const existente = await fs.readFile(ruta, 'utf-8');
      await fs.writeFile(rutaTmp, existente + linea, 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        await fs.writeFile(rutaTmp, linea, 'utf-8');
      } else {
        throw err;
      }
    }
  });
}

export async function leerLineas(archivo) {
  const limpia = archivo.replace(/\\/g, '/');
  const ruta = path.join(DATOS_DIR, limpia);
  if (!ruta.startsWith(DATOS_DIR)) {
    const err = new Error('Ruta de archivo no permitida');
    err.estado = 403;
    throw err;
  }
  try {
    const contenido = await fs.readFile(ruta, 'utf-8');
    return contenido
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export async function leerConfig(nombre) {
  const limpia = nombre.replace(/\\/g, '/');
  const ruta = path.join(DATOS_DIR, 'config', `${limpia}.json`);
  if (!ruta.startsWith(path.join(DATOS_DIR, 'config'))) {
    const err = new Error('Ruta de configuración no permitida');
    err.estado = 403;
    throw err;
  }
  try {
    const contenido = await fs.readFile(ruta, 'utf-8');
    return JSON.parse(contenido);
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

export async function escribirConfig(nombre, obj) {
  const limpia = nombre.replace(/\\/g, '/');
  const ruta = path.join(DATOS_DIR, 'config', `${limpia}.json`);
  if (!ruta.startsWith(path.join(DATOS_DIR, 'config'))) {
    const err = new Error('Ruta de configuración no permitida');
    err.estado = 403;
    throw err;
  }
  const json = JSON.stringify(obj, null, 2);
  await encolarEscritura(ruta, async (rutaTmp) => {
    await fs.writeFile(rutaTmp, json, 'utf-8');
  });
}

