import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import * as almacen from './almacen.js';
import { puede } from './permisos.js';
import { aplicar } from './ganchos.js';

import { cargarUsuario } from './auth.js';

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const PUBLICO_DIR = path.resolve(DIRNAME, '../publico');
const RUTAS_DIR = path.resolve(DIRNAME, 'rutas');
const PUERTO = process.env.PORT || process.env.PUERTO || 3000;

const app = express();

// Servir archivos estáticos de publico/
app.use(express.static(PUBLICO_DIR));

// JSON con límite de 1 MB
app.use(express.json({ limit: '1mb' }));

// Middleware cargarUsuario
app.use(cargarUsuario);

// Monta automáticamente cada servidor/rutas/*.js antes de la API genérica
async function montarRutasDinamicas() {
  try {
    const entradas = await fs.readdir(RUTAS_DIR, { withFileTypes: true });
    const archivos = entradas
      .filter((e) => e.isFile() && e.name.endsWith('.js'))
      .map((e) => e.name)
      .sort();

    for (const archivo of archivos) {
      const rutaArchivo = path.join(RUTAS_DIR, archivo);
      const modulo = await import(pathToFileURL(rutaArchivo).href);
      if (modulo && modulo.default) {
        app.use('/api', modulo.default);
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Error al montar rutas dinámicas:', err);
    }
  }
}

await montarRutasDinamicas();

// --- API Genérica ---

// GET /api/:col (con filtros exactos por query)
app.get('/api/:col', async (req, res, next) => {
  try {
    const { col } = req.params;

    const tienePermisoGeneral = await puede(req.usuario, 'leer', col);
    const tienePermisoPropio =
      !tienePermisoGeneral &&
      Boolean(req.usuario?.id) &&
      (await puede(req.usuario, 'leer', col, { usuarioId: req.usuario.id }));

    if (!tienePermisoGeneral && !tienePermisoPropio) {
      const err = new Error('Acceso no permitido');
      err.estado = req.usuario ? 403 : 401;
      throw err;
    }

    let items;
    if (Object.keys(req.query).length > 0) {
      items = await almacen.buscar(col, req.query);
    } else {
      items = await almacen.leer(col);
    }

    if (!tienePermisoGeneral && tienePermisoPropio) {
      items = items.filter((item) => item && item.usuarioId === req.usuario.id);
    }

    items = await aplicar(col, 'filtrarLista', items, req.usuario);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/:col/:id
app.get('/api/:col/:id', async (req, res, next) => {
  try {
    const { col, id } = req.params;
    const items = await almacen.leer(col);
    const registro = items.find((item) => item && item.id === id);

    if (!registro) {
      const err = new Error('Registro no encontrado');
      err.estado = 404;
      throw err;
    }

    const permitido = await puede(req.usuario, 'leer', col, registro);
    if (!permitido) {
      const err = new Error('Acceso no permitido');
      err.estado = req.usuario ? 403 : 401;
      throw err;
    }

    const filtrados = await aplicar(col, 'filtrarLista', [registro], req.usuario);
    const salida = Array.isArray(filtrados) ? filtrados[0] : registro;
    res.json(salida);
  } catch (err) {
    next(err);
  }
});

// POST /api/:col
app.post('/api/:col', async (req, res, next) => {
  try {
    const { col } = req.params;
    const datosEntrada = req.body || {};

    const permitido = await puede(req.usuario, 'escribir', col, datosEntrada);
    if (!permitido) {
      const err = new Error('Acceso no permitido');
      err.estado = req.usuario ? 403 : 401;
      throw err;
    }

    const datosProcesados = await aplicar(col, 'antesDeGuardar', datosEntrada, req.usuario, null);
    const nuevo = await almacen.agregar(col, datosProcesados);
    await aplicar(col, 'despuesDeGuardar', nuevo, req.usuario, null);

    res.status(201).json(nuevo);
  } catch (err) {
    next(err);
  }
});

// PUT /api/:col/:id (fusiona campos)
app.put('/api/:col/:id', async (req, res, next) => {
  try {
    const { col, id } = req.params;
    const items = await almacen.leer(col);
    const anterior = items.find((item) => item && item.id === id);

    if (!anterior) {
      const err = new Error('Registro no encontrado');
      err.estado = 404;
      throw err;
    }

    const permitido = await puede(req.usuario, 'escribir', col, anterior);
    if (!permitido) {
      const err = new Error('Acceso no permitido');
      err.estado = req.usuario ? 403 : 401;
      throw err;
    }

    const cambios = await aplicar(col, 'antesDeGuardar', req.body || {}, req.usuario, anterior);
    const actualizado = await almacen.actualizar(col, id, cambios);
    await aplicar(col, 'despuesDeGuardar', actualizado, req.usuario, anterior);

    res.json(actualizado);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/:col/:id
app.delete('/api/:col/:id', async (req, res, next) => {
  try {
    const { col, id } = req.params;
    const items = await almacen.leer(col);
    const anterior = items.find((item) => item && item.id === id);

    if (!anterior) {
      const err = new Error('Registro no encontrado');
      err.estado = 404;
      throw err;
    }

    const permitido = await puede(req.usuario, 'escribir', col, anterior);
    if (!permitido) {
      const err = new Error('Acceso no permitido');
      err.estado = req.usuario ? 403 : 401;
      throw err;
    }

    const eliminado = await almacen.eliminar(col, id);
    res.json({ ok: true, eliminado });
  } catch (err) {
    next(err);
  }
});

// Manejo centralizado de errores en formato { error }
app.use((err, req, res, next) => {
  const estado = err.estado || err.status || 500;
  res.status(estado).json({ error: err.message || 'Error interno del servidor' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PUERTO, () => {
    console.log(`Servidor iniciado en http://localhost:${PUERTO}`);
  });
}

export default app;
