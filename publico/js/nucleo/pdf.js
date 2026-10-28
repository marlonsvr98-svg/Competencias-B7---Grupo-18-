/**
 * publico/js/nucleo/pdf.js
 * Generación de diplomas y certificados en PDF según contrato §A.
 */

import * as api from './api.js';
import * as sesion from './sesion.js';
import * as ui from './ui.js';

const NOMBRES_BLOOM = {
  1: 'Recordar',
  2: 'Comprender',
  3: 'Aplicar',
  4: 'Analizar',
  5: 'Evaluar'
};

/**
 * Carga dinámicamente jsPDF desde el CDN si no está presente en window.
 */
async function cargarJsPdf() {
  if (typeof window !== 'undefined' && window.jspdf) {
    return window.jspdf.jsPDF;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      if (window.jspdf && window.jspdf.jsPDF) {
        resolve(window.jspdf.jsPDF);
      } else {
        reject(new Error('No se pudo inicializar la librería jsPDF'));
      }
    };
    script.onerror = () => reject(new Error('Error al cargar jsPDF desde el CDN'));
    document.head.appendChild(script);
  });
}

/**
 * Genera y descarga el diploma en formato PDF para el estudiante.
 * @param {{ tipo: "cumplimiento" | "nivel-quiz", temaId: string, nivel?: number }} opciones
 * @returns {Promise<{ codigo: string }>}
 */
export async function generarDiploma({ tipo = 'nivel-quiz', temaId, nivel = 1 }) {
  const usuario = sesion.usuarioActual();
  if (!usuario) {
    throw new Error('Debes iniciar sesión para obtener tu diploma');
  }

  ui.cargando(true);

  try {
    const JsPDFClass = await cargarJsPdf();

    // Obtener información del tema y asignatura
    const [temas, asignaturas, unidades] = await Promise.all([
      api.listar('temas'),
      api.listar('asignaturas'),
      api.listar('unidades')
    ]);

    const tema = (temas || []).find((t) => t && t.id === temaId);
    const tituloTema = tema ? tema.titulo : 'Tema de Competencias';

    const unidad = (unidades || []).find((u) => u && u.id === tema?.unidadId);
    const asig = (asignaturas || []).find((a) => a && a.id === unidad?.asignaturaId);
    const nombreAsig = asig ? asig.nombre : 'Educación Digital';

    const codigo = `DIP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Estudiante';
    const nivelNombre = NOMBRES_BLOOM[nivel] || `Nivel ${nivel}`;
    const fechaTexto = new Date().toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Guardar registro en certificados en segundo plano
    try {
      await api.crear('certificados', {
        codigo,
        usuarioId: usuario.id,
        tipo,
        detalle: { temaId, nivel, nivelNombre, tema: tituloTema, asignatura: nombreAsig },
        nombreCompleto
      });
    } catch {}

    // Crear PDF apaisado A4 (297 x 210 mm)
    const doc = new JsPDFClass({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Marco exterior e interior
    doc.setDrawColor(0, 46, 69); // #002e45
    doc.setLineWidth(3);
    doc.rect(10, 10, 277, 190);

    doc.setDrawColor(255, 105, 0); // #ff6900
    doc.setLineWidth(1);
    doc.rect(14, 14, 269, 182);

    // Encabezado institucional
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 46, 69);
    doc.text('ECOSISTEMA EDUCATIVO DIGITAL', 148.5, 35, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(38, 71, 99);
    doc.text('CERTIFICADO DE LOGRO Y COMPETENCIAS ACADÉMICAS', 148.5, 45, { align: 'center' });

    // Concede el diploma
    doc.setFontSize(12);
    doc.setTextColor(80, 101, 117);
    doc.text('Otorga el presente diploma de acreditación a:', 148.5, 65, { align: 'center' });

    // Nombre del estudiante
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(0, 46, 69);
    doc.text(nombreCompleto.toUpperCase(), 148.5, 82, { align: 'center' });

    // Línea bajo el nombre
    doc.setDrawColor(255, 105, 0);
    doc.setLineWidth(0.8);
    doc.line(60, 86, 237, 86);

    // Texto de acreditación
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(24, 45, 62);
    const textoAcreditacion =
      `Por haber superado con éxito la evaluación formativa de Nivel ${nivel} (${nivelNombre})\n` +
      `demostrando dominio cognitivo en el tema curricular "${tituloTema}"\n` +
      `correspondiente a la asignatura de ${nombreAsig}.`;

    doc.text(textoAcreditacion, 148.5, 105, { align: 'center', lineHeightFactor: 1.5 });

    // Firmas y sellos
    doc.setFontSize(11);
    doc.setTextColor(80, 101, 117);

    doc.line(45, 160, 105, 160);
    doc.text('Coordinación Académica\nEcosistema Educativo', 75, 166, { align: 'center' });

    doc.line(192, 160, 252, 160);
    doc.text('Docente Tutor / Evaluador\nÁrea Curricular', 222, 166, { align: 'center' });

    // Pie con fecha y código de verificación
    doc.setFontSize(9);
    doc.setTextColor(100, 115, 130);
    doc.text(`Fecha de emisión: ${fechaTexto}  |  Código de verificación: ${codigo}`, 148.5, 185, { align: 'center' });

    // Descargar
    const nombreArchivo = `diploma-nivel-${nivel}-${temaId}.pdf`;
    doc.save(nombreArchivo);

    ui.cargando(false);
    ui.aviso(`¡Diploma descargado correctamente! (${codigo})`, 'exito');

    return { codigo };
  } catch (err) {
    ui.cargando(false);
    console.error('Error al generar diploma en PDF:', err);
    ui.aviso(`Error al generar diploma: ${err.message}`, 'error');
    throw err;
  }
}
