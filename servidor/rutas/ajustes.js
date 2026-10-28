/**
 * servidor/rutas/ajustes.js
 * Rutas de administración para configurar ajustes generales y de IA.
 */

import { Router } from 'express';
import { exigirRol } from '../auth.js';
import * as almacen from '../almacen.js';

const router = Router();

// GET /api/admin/ajustes
router.get('/admin/ajustes', exigirRol('admin'), async (req, res, next) => {
  try {
    const ajustes = await almacen.leerConfig('ajustes');
    res.json(ajustes || {});
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/ajustes
router.put('/admin/ajustes', exigirRol('admin'), async (req, res, next) => {
  try {
    const ajustesPrevios = (await almacen.leerConfig('ajustes')) || {};
    const {
      nombrePlataforma,
      maxSubidaMB,
      limiteIADiario,
      limiteTutorDiario,
      chatEntreEstudiantes,
      alertasAdmin,
      iaProveedor,
      iaModelo,
      iaClave
    } = req.body || {};

    const nuevosAjustes = {
      ...ajustesPrevios,
      ...(nombrePlataforma !== undefined && { nombrePlataforma: String(nombrePlataforma).trim() }),
      ...(maxSubidaMB !== undefined && { maxSubidaMB: Number(maxSubidaMB) || 10 }),
      ...(limiteIADiario !== undefined && { limiteIADiario: Number(limiteIADiario) || 30 }),
      ...(limiteTutorDiario !== undefined && { limiteTutorDiario: Number(limiteTutorDiario) || 40 }),
      ...(chatEntreEstudiantes !== undefined && { chatEntreEstudiantes: Boolean(chatEntreEstudiantes) }),
      ...(alertasAdmin !== undefined && { alertasAdmin: Boolean(alertasAdmin) }),
      ...(iaProveedor !== undefined && { iaProveedor: String(iaProveedor).trim().toLowerCase() }),
      ...(iaModelo !== undefined && { iaModelo: String(iaModelo).trim() }),
      ...(iaClave !== undefined && { iaClave: String(iaClave).trim() })
    };

    await almacen.escribirConfig('ajustes', nuevosAjustes);

    res.json({ ok: true, ajustes: nuevosAjustes });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/ia-modelos (consulta modelos disponibles en Gemini)
router.post('/admin/ia-modelos', exigirRol('admin'), async (req, res, next) => {
  try {
    const ajustes = (await almacen.leerConfig('ajustes')) || {};
    const clave = (req.body?.iaClave || ajustes.iaClave || process.env.IA_CLAVE || '').trim();

    const modelosFijos = [
      { id: 'gemini-1.5-flash', nombre: 'Gemini 1.5 Flash (⭐ Recomendado - Máxima disponibilidad y velocidad)' },
      { id: 'gemini-1.5-flash-8b', nombre: 'Gemini 1.5 Flash 8B (Ultra ligero y alta capacidad)' },
      { id: 'gemini-1.5-pro', nombre: 'Gemini 1.5 Pro (Razonamiento avanzado)' },
      { id: 'gemini-2.0-flash', nombre: 'Gemini 2.0 Flash (Nueva generación)' },
      { id: 'gemini-2.0-flash-lite', nombre: 'Gemini 2.0 Flash Lite (Alta tasa de solicitudes)' },
      { id: 'gemini-3.8-flash', nombre: 'Gemini 3.8 Flash' },
      { id: 'gemini-4-argon', nombre: 'Gemini 4 Argon' }
    ];

    if (!clave) {
      return res.json({ modelos: modelosFijos, fuente: 'estatica' });
    }

    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(clave)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.models)) {
          const modelosApi = data.models
            .filter((m) => m && Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
            .map((m) => {
              const id = m.name.replace(/^models\//, '');
              return {
                id,
                nombre: `${m.displayName || id} (${id})`,
                descripcion: m.description || ''
              };
            });

          if (modelosApi.length > 0) {
            return res.json({ modelos: modelosApi, fuente: 'api' });
          }
        }
      }
    } catch (err) {
      console.warn('No se pudo listar modelos desde Gemini API, usando lista fija:', err);
    }

    return res.json({ modelos: modelosFijos, fuente: 'estatica' });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/ia-probar
router.post('/admin/ia-probar', exigirRol('admin'), async (req, res, next) => {
  try {
    const ajustes = (await almacen.leerConfig('ajustes')) || {};
    const clave = (req.body?.iaClave || ajustes.iaClave || process.env.IA_CLAVE || '').trim();
    const modelo = (req.body?.iaModelo || ajustes.iaModelo || process.env.IA_MODELO || 'gemini-1.5-flash').trim();
    const proveedor = (req.body?.iaProveedor || ajustes.iaProveedor || 'gemini').trim().toLowerCase();

    if (!clave) {
      return res.status(400).json({
        ok: false,
        error: 'No se ha proporcionado una clave de API (API Key) para probar.'
      });
    }

    if (proveedor === 'gemini') {
      const modeloNormalizado = modelo.replace(/^models\//, '');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modeloNormalizado)}:generateContent?key=${encodeURIComponent(clave)}`;

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Responde exclusivamente con la palabra CONECTADO.' }]
            }
          ],
          generationConfig: {
            temperature: 0.1
          }
        })
      });

      if (!resp.ok) {
        const errorJson = await resp.json().catch(() => null);
        const mensajeError = errorJson?.error?.message || `Error HTTP ${resp.status}: ${resp.statusText}`;

        // Diagnóstico especial para saturación o alta demanda
        if (mensajeError.includes('high demand') || resp.status === 503) {
          return res.status(503).json({
            ok: false,
            error: `El modelo "${modelo}" tiene alta demanda temporal en los servidores de Google. Te recomendamos seleccionar "gemini-1.5-flash" o "gemini-1.5-flash-8b", que ofrecen máxima disponibilidad continua.`
          });
        }

        if (mensajeError.includes('API key not valid') || resp.status === 400 && mensajeError.includes('API_KEY_INVALID')) {
          return res.status(400).json({
            ok: false,
            error: 'La clave de API ingresada no es válida. Verifica haber copiado la clave completa desde Google AI Studio.'
          });
        }

        return res.status(resp.status >= 400 && resp.status < 500 ? 400 : 502).json({
          ok: false,
          error: `Error al conectar con Gemini: ${mensajeError}`
        });
      }

      const resData = await resp.json();
      const texto = resData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return res.json({
        ok: true,
        mensaje: `¡Conexión exitosa con el modelo ${modelo}!`,
        respuesta: texto.trim()
      });
    }

    return res.status(400).json({ ok: false, error: 'Proveedor de IA no soportado.' });
  } catch (err) {
    next(err);
  }
});

export default router;
