/**
 * servidor/ia.js
 * Ejecución de tareas con IA y registro en consumo-ia.jsonl según contrato §B.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as almacen from './almacen.js';

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.resolve(DIRNAME, 'prompts');
const PREPARADORES_DIR = path.resolve(DIRNAME, 'preparadores');

/**
 * Generador sintético de preguntas formativas para modo de prueba/desarrollo sin clave de IA.
 */
function generarPreguntasSinteticas(variables, cantidad) {
  const tema = variables.tema || 'el tema';
  const preguntas = [];
  const tipos = ['opcion', 'vf', 'completar'];

  for (let i = 0; i < cantidad; i++) {
    const tipo = tipos[i % tipos.length];
    if (tipo === 'opcion') {
      preguntas.push({
        tipo: 'opcion',
        enunciado: `¿Cuál de las siguientes afirmaciones describe mejor un concepto fundamental sobre ${tema}?`,
        opciones: [
          `Constituye una estructura esencial estudiada en el ámbito de ${tema}.`,
          'Es un elemento accesorio que no guarda relación con la unidad temática.',
          'Corresponde únicamente a teorías desactualizadas sin aplicación biológica.',
          'Es una característica secundaria observada esporádicamente.'
        ],
        correcta: 0,
        retroalimentacion: `Es correcta porque representa una propiedad definitoria clave en el aprendizaje de ${tema}.`
      });
    } else if (tipo === 'vf') {
      preguntas.push({
        tipo: 'vf',
        enunciado: `La comprensión de ${tema} permite explicar procesos biológicos y estructurales en los seres vivos.`,
        opciones: ['Verdadero', 'Falso'],
        correcta: true,
        retroalimentacion: `Es verdadero ya que ${tema} es fundamental para el análisis de los sistemas vivos.`
      });
    } else {
      preguntas.push({
        tipo: 'completar',
        enunciado: `El estudio de ____ es indispensable para entender el funcionamiento y organización de la vida.`,
        opciones: [],
        correcta: tema,
        retroalimentacion: `La respuesta correcta es "${tema}" según las definiciones curriculares estudiadas.`
      });
    }
  }

  return preguntas;
}

/**
 * Ejecuta una tarea de IA según contrato §B.
 * @param {string} tarea - Nombre de la tarea (ej. 'generar-preguntas')
 * @param {Object} datos - Parámetros recibidos
 * @param {Object} usuario - Usuario en sesión
 * @param {{ formato?: 'json' | 'texto' }} [opciones={ formato: 'json' }]
 * @returns {Promise<any>}
 */
export async function ejecutarTarea(tarea, datos, usuario, { formato = 'json' } = {}) {
  let variables = { ...datos };

  // 1. Cargar y ejecutar preparador si existe
  try {
    const rutaPrep = path.join(PREPARADORES_DIR, `${tarea}.js`);
    const prepUrl = pathToFileURL(rutaPrep).href;
    const moduloPrep = await import(prepUrl);
    if (moduloPrep && typeof moduloPrep.default === 'function') {
      variables = await moduloPrep.default(datos, usuario);
    }
  } catch (err) {
    if (err.code !== 'ERR_MODULE_NOT_FOUND' && !err.message.includes('Cannot find module')) {
      throw err;
    }
  }

  // 2. Cargar plantilla de prompt
  let promptSistema = '';
  let promptUsuario = '';

  try {
    const rutaPrompt = path.join(PROMPTS_DIR, `${tarea}.txt`);
    const textoPrompt = await fs.readFile(rutaPrompt, 'utf-8');
    const partes = textoPrompt.split('### USUARIO');

    promptSistema = partes[0] || '';
    promptUsuario = partes[1] || '';

    // Reemplazar {{claves}}
    for (const [clave, valor] of Object.entries(variables)) {
      const regex = new RegExp(`{{${clave}}}`, 'g');
      promptSistema = promptSistema.replace(regex, String(valor ?? ''));
      promptUsuario = promptUsuario.replace(regex, String(valor ?? ''));
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`Error al leer plantilla de prompt ${tarea}:`, err);
    }
  }

  // 3. Invocar IA real si hay clave configurada en ajustes.json o .env, o generar fallback didáctico
  let resultado = null;
  const ajustes = await almacen.leerConfig('ajustes');
  const claveIA = (ajustes && typeof ajustes.iaClave === 'string' && ajustes.iaClave.trim() !== '')
    ? ajustes.iaClave.trim()
    : (process.env.IA_CLAVE || '').trim();
  const modeloIA = (ajustes && typeof ajustes.iaModelo === 'string' && ajustes.iaModelo.trim() !== '')
    ? ajustes.iaModelo.trim()
    : (process.env.IA_MODELO || 'gemini-1.5-flash').trim();
  const proveedor = (ajustes && typeof ajustes.iaProveedor === 'string' && ajustes.iaProveedor.trim() !== '')
    ? ajustes.iaProveedor.trim().toLowerCase()
    : (process.env.IA_PROVEEDOR || 'gemini').trim().toLowerCase();

  if (claveIA !== '') {
    try {
      if (proveedor === 'gemini') {
        const modeloNormalizado = modeloIA.replace(/^models\//, '');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modeloNormalizado)}:generateContent?key=${encodeURIComponent(claveIA)}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${promptSistema}\n\n${promptUsuario}` }]
              }
            ],
            generationConfig: {
              temperature: 0.4,
              responseMimeType: formato === 'json' ? 'application/json' : 'text/plain'
            }
          })
        });

        if (resp.ok) {
          const resData = await resp.json();
          const textoRes = resData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (formato === 'json') {
            const limpio = textoRes.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
            resultado = JSON.parse(limpio);
          } else {
            resultado = textoRes;
          }
        } else {
          const detalleError = await resp.text();
          console.warn(`Respuesta no exitosa de Gemini con ${modeloNormalizado} (${resp.status}):`, detalleError);

          // Si el modelo seleccionado sufre alta demanda (503 / 429) y no era gemini-1.5-flash, reintentar con gemini-1.5-flash
          if ((resp.status === 503 || resp.status === 429) && modeloNormalizado !== 'gemini-1.5-flash') {
            console.info('Reintentando con modelo gemini-1.5-flash de alta disponibilidad...');
            const urlFallback = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(claveIA)}`;
            const respFallback = await fetch(urlFallback, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: `${promptSistema}\n\n${promptUsuario}` }] }],
                generationConfig: {
                  temperature: 0.4,
                  responseMimeType: formato === 'json' ? 'application/json' : 'text/plain'
                }
              })
            });

            if (respFallback.ok) {
              const resDataFb = await respFallback.json();
              const textoResFb = resDataFb?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (formato === 'json') {
                const limpioFb = textoResFb.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
                resultado = JSON.parse(limpioFb);
              } else {
                resultado = textoResFb;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error al invocar proveedor de IA, utilizando generador sintético:', err);
    }
  }

  // Fallback didáctico si no hay respuesta de proveedor externo
  if (resultado === null) {
    if (tarea === 'generar-preguntas') {
      const cant = Number(variables.cantidad) || 5;
      resultado = generarPreguntasSinteticas(variables, cant);
    } else if (tarea === 'tutor') {
      resultado = `¡Hola, ${variables.estudiante || 'estudiante'}! Como tu tutor socrático en ${variables.asignatura || 'esta asignatura'}, estoy aquí para acompañarte a razonar. ¿Qué es lo primero que recuerdas o imaginas sobre este concepto a partir de lo estudiado en nuestras unidades?`;
    } else {
      resultado = formato === 'json' ? [] : 'Respuesta generada';
    }
  }

  // 4. Anexar registro en consumo-ia.jsonl
  try {
    await almacen.anexarLinea('consumo-ia.jsonl', {
      usuarioId: usuario ? usuario.id : null,
      tarea,
      entrada: datos,
      salida: resultado,
      ok: true,
      fecha: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error al registrar consumo de IA:', err);
  }

  return resultado;
}
