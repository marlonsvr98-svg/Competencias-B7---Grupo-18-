/**
 * servidor/rutas/subidas.js
 * Ruta para la subida de archivos según contrato §C y reglas de permisos de rol.
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { exigirRol } from '../auth.js';
import { leerConfig } from '../almacen.js';

const router = Router();

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const SUBIDAS_DIR = path.resolve(DIRNAME, '../../publico/recursos/subidas');

// Asegurar que la carpeta de destino exista
if (!fs.existsSync(SUBIDAS_DIR)) {
  fs.mkdirSync(SUBIDAS_DIR, { recursive: true });
}

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, SUBIDAS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const nombreAleatorio = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, nombreAleatorio);
  }
});

// POST /api/subidas (requiere sesión)
router.post('/subidas', exigirRol(), async (req, res, next) => {
  try {
    const ajustes = await leerConfig('ajustes');
    const maxDocenteMB = ajustes && ajustes.maxSubidaMB ? Number(ajustes.maxSubidaMB) : 10;
    const esDocenteOAdmin =
      req.usuario && (req.usuario.rol === 'docente' || req.usuario.rol === 'admin');
    const maxBytes = (esDocenteOAdmin ? maxDocenteMB : 2) * 1024 * 1024;

    const upload = multer({
      storage,
      limits: {
        fileSize: maxBytes
      },
      fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const mimetypesValidos = ['image/jpeg', 'image/png', 'image/webp'];
        const extensionesValidas = ['.jpg', '.jpeg', '.png', '.webp'];

        if (esDocenteOAdmin) {
          mimetypesValidos.push('application/pdf', 'audio/mpeg', 'audio/mp3');
          extensionesValidas.push('.pdf', '.mp3');
        }

        if (mimetypesValidos.includes(file.mimetype) && extensionesValidas.includes(ext)) {
          cb(null, true);
        } else {
          const mensaje = esDocenteOAdmin
            ? 'Solo se permiten imágenes JPG, PNG, WEBP, documentos PDF o audios MP3'
            : 'Solo se permiten imágenes JPG, PNG o WEBP';
          const err = new Error(mensaje);
          err.estado = 400;
          cb(err);
        }
      }
    }).single('archivo');

    upload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          const limiteTexto = esDocenteOAdmin ? `${maxDocenteMB} MB` : '2 MB';
          return res.status(400).json({ error: `El archivo excede el límite máximo de ${limiteTexto}` });
        }
        return res.status(err.estado || 400).json({ error: err.message || 'Error al subir archivo' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No se envió ningún archivo en el campo "archivo"' });
      }

      const url = `/recursos/subidas/${req.file.filename}`;
      res.json({ url });
    });
  } catch (err) {
    next(err);
  }
});

export default router;
