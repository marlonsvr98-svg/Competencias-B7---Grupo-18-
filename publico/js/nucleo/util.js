/**
 * publico/js/nucleo/util.js
 * Funciones utilitarias del ecosistema según contrato §A.
 */

import { escapar } from './ui.js';

export function normalizar(texto) {
  if (texto === null || texto === undefined) return '';
  const mayusculas = String(texto).trim().toUpperCase();
  // Preserva la Ñ y retira tildes y diéresis del resto de caracteres
  return mayusculas
    .replace(/Ñ/g, '\uE000')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\uE000/g, 'Ñ');
}

export function barajar(lista) {
  if (!Array.isArray(lista)) return [];
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function fechaLarga(iso) {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'long',
    timeZone: 'America/Guayaquil'
  }).format(fecha);
}

export function fechaRelativa(iso) {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '';
  const diffSeg = Math.round((fecha.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('es-EC', { numeric: 'auto' });
  const absSeg = Math.abs(diffSeg);

  if (absSeg < 60) return rtf.format(diffSeg, 'second');
  const diffMin = Math.round(diffSeg / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHoras = Math.round(diffMin / 60);
  if (Math.abs(diffHoras) < 24) return rtf.format(diffHoras, 'hour');
  const diffDias = Math.round(diffHoras / 24);
  if (Math.abs(diffDias) < 30) return rtf.format(diffDias, 'day');
  const diffMeses = Math.round(diffDias / 30);
  if (Math.abs(diffMeses) < 12) return rtf.format(diffMeses, 'month');
  const diffAnios = Math.round(diffDias / 365);
  return rtf.format(diffAnios, 'year');
}

export function parametro(nombre) {
  if (typeof window === 'undefined' || !window.location) return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(nombre);
}

export function formatoBasico(texto) {
  if (!texto) return '';
  const seguro = escapar(texto);
  const conNegritas = seguro.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const bloques = conNegritas.split(/\r?\n\s*\r?\n/);

  const htmlBloques = bloques.map((bloque) => {
    const lineas = bloque.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lineas.length === 0) return '';

    const todasSonLista = lineas.every((l) => l.startsWith('- '));
    if (todasSonLista) {
      const items = lineas.map((l) => `<li>${l.slice(2).trim()}</li>`).join('');
      return `<ul>${items}</ul>`;
    }

    const partes = [];
    let enLista = false;
    let itemsLista = [];

    for (const linea of lineas) {
      if (linea.startsWith('- ')) {
        enLista = true;
        itemsLista.push(`<li>${linea.slice(2).trim()}</li>`);
      } else {
        if (enLista) {
          partes.push(`<ul>${itemsLista.join('')}</ul>`);
          itemsLista = [];
          enLista = false;
        }
        partes.push(linea);
      }
    }

    if (enLista) {
      partes.push(`<ul>${itemsLista.join('')}</ul>`);
    }

    return partes
      .map((p) => (p.startsWith('<ul>') ? p : `<p>${p}</p>`))
      .join('');
  });

  return htmlBloques.filter(Boolean).join('');
}
