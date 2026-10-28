/**
 * servidor/semilla.js
 * Script para inicializar datos de prueba desde datos/semilla/ a datos/
 * Ejecución: npm run semilla [-- --forzar]
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const DATOS_DIR = path.resolve(DIRNAME, '../datos');
const SEMILLA_DIR = path.resolve(DATOS_DIR, 'semilla');

async function main() {
  const argumentos = process.argv.slice(2);
  const esForzar = argumentos.includes('--forzar');

  if (!fsSync.existsSync(SEMILLA_DIR)) {
    console.error(`Error: El directorio de datos semilla no existe: ${SEMILLA_DIR}`);
    process.exit(1);
  }

  if (esForzar) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    try {
      const respuesta = (
        await rl.question(
          'ADVERTENCIA: La bandera --forzar sobrescribirá las colecciones existentes. ¿Deseas continuar? (s/N): '
        )
      )
        .trim()
        .toLowerCase();

      if (respuesta !== 's' && respuesta !== 'si' && respuesta !== 'y' && respuesta !== 'yes') {
        console.log('Operación de carga de semilla cancelada.');
        process.exit(0);
      }
    } finally {
      rl.close();
    }
  }

  const entradas = await fs.readdir(SEMILLA_DIR, { withFileTypes: true });
  const archivosSemilla = entradas
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => e.name);

  if (archivosSemilla.length === 0) {
    console.log('No se encontraron archivos .json en datos/semilla/');
    return;
  }

  // Pre-generar hash de la contraseña para usuarios si se requiere
  let claveHashDemo = null;

  for (const archivo of archivosSemilla) {
    const coleccion = archivo.slice(0, -5);
    const rutaOrigen = path.join(SEMILLA_DIR, archivo);
    const rutaDestino = path.join(DATOS_DIR, archivo);
    const destinoExiste = fsSync.existsSync(rutaDestino);

    if (destinoExiste && !esForzar) {
      console.log(`Colección "${coleccion}" ya existe. Omitiendo (usa --forzar para sobrescribir).`);
      continue;
    }

    const contenidoRaw = await fs.readFile(rutaOrigen, 'utf-8');
    const datos = JSON.parse(contenidoRaw);

    if (coleccion === 'usuarios') {
      if (!claveHashDemo) {
        claveHashDemo = await bcrypt.hash('Demo12345', 10);
      }
      const usuariosConClave = datos.map((u) => ({
        ...u,
        claveHash: claveHashDemo
      }));
      await fs.writeFile(rutaDestino, JSON.stringify(usuariosConClave), 'utf-8');
      console.log(`✓ Colección "${coleccion}" cargada con hash generado para la clave "Demo12345" (${usuariosConClave.length} registros).`);
    } else {
      await fs.writeFile(rutaDestino, JSON.stringify(datos), 'utf-8');
      console.log(`✓ Colección "${coleccion}" cargada exitosamente (${datos.length} registros).`);
    }
  }

  console.log('\nProceso de carga de semilla finalizado.');
}

main().catch((err) => {
  console.error('Error al ejecutar la semilla:', err);
  process.exit(1);
});
