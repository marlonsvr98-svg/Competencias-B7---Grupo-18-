/**
 * servidor/crear-admin.js
 * Script CLI para crear un usuario administrador inicial o adicional.
 */

import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import bcrypt from 'bcryptjs';
import * as almacen from './almacen.js';

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    console.log('=== Crear Administrador ===');
    const nombre = (await rl.question('Nombre: ')).trim();
    const apellido = (await rl.question('Apellido: ')).trim();
    const correo = (await rl.question('Correo: ')).trim().toLowerCase();
    const clave = (await rl.question('Contraseña: ')).trim();

    if (!nombre || !apellido || !correo || !clave) {
      console.error('Error: Todos los campos son obligatorios.');
      process.exit(1);
    }

    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(correo)) {
      console.error('Error: El formato del correo electrónico no es válido.');
      process.exit(1);
    }

    if (clave.length < 8 || !/[a-zA-Z]/.test(clave) || !/\d/.test(clave)) {
      console.error('Error: La contraseña debe tener al menos 8 caracteres y contener letras y números.');
      process.exit(1);
    }

    const usuarios = await almacen.leer('usuarios');
    const existe = usuarios.some((u) => u && u.correo && u.correo.toLowerCase() === correo);
    if (existe) {
      console.error('Error: El correo ya está registrado.');
      process.exit(1);
    }

    const claveHash = await bcrypt.hash(clave, 10);
    const nuevoAdmin = await almacen.agregar('usuarios', {
      nombre,
      apellido,
      correo,
      claveHash,
      rol: 'admin',
      activo: true,
      foto: '',
      consentimiento: {
        aceptado: true,
        fecha: new Date().toISOString()
      }
    });

    console.log(`Administrador creado con éxito: ${nuevoAdmin.id} (${nuevoAdmin.correo})`);
  } catch (err) {
    console.error('Error al crear administrador:', err);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
