# Ecosistema Educativo Digital

Plataforma web educativa para la gestión de asignaturas, actividades interactivas, gamificación y tutoría con inteligencia artificial.

## Requisitos

- Node.js 20+ (versión LTS)
- npm 10+

## Instalación y ejecución local

1. Instalar dependencias:
```bash
npm install
```

2. Cargar datos semilla iniciales:
```bash
npm run semilla
```

3. Iniciar el servidor:
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`.

### Usuarios de prueba (contraseña común: `Demo12345`)
- **Administrador:** `admin@demo.ec`
- **Docente:** `docente1@demo.ec`
- **Estudiante:** `estudiante1@demo.ec`

---

## Despliegue en Render

El repositorio incluye soporte nativo para despliegue en **Render** mediante `render.yaml` o configuración manual de Web Service:

### Opción A: Despliegue automático (Blueprint)
1. En Render Dashboard, selecciona **New +** > **Blueprint**.
2. Conecta este repositorio: `https://github.com/marlonsvr98-svg/Competencias-B7---Grupo-18-.git`.
3. Render detectará automáticamente `render.yaml`, configurará el entorno Node 20+, el comando de compilación y las variables.

### Opción B: Despliegue manual (Web Service)
1. En Render Dashboard, selecciona **New +** > **Web Service**.
2. Conecta el repositorio de GitHub.
3. Configura los parámetros:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. En **Environment Variables**, define:
   - `NODE_VERSION`: `20.18.0`
   - `IA_PROVEEDOR`: `gemini` (opcional)
   - `IA_MODELO`: `gemini-1.5-flash` (opcional)
   - `IA_CLAVE`: *Tu clave API de Google Gemini* (opcional)
