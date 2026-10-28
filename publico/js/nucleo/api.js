/**
 * publico/js/nucleo/api.js
 * Funciones de comunicación con la API del servidor según contrato §A.
 */

export async function llamar(metodo, ruta, cuerpo = null) {
  const headers = {};
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const opciones = {
    method: metodo.toUpperCase(),
    headers
  };

  if (cuerpo !== null && cuerpo !== undefined) {
    if (typeof FormData !== 'undefined' && cuerpo instanceof FormData) {
      opciones.body = cuerpo;
    } else {
      headers['Content-Type'] = 'application/json';
      opciones.body = JSON.stringify(cuerpo);
    }
  }

  const res = await fetch(ruta, opciones);

  if (res.status === 401) {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('usuario');
    }

    const pathname = typeof window !== 'undefined' && window.location ? window.location.pathname : '';
    const enPaginaAuth = pathname.endsWith('ingreso.html') || pathname.endsWith('registro.html');

    if (!enPaginaAuth && typeof window !== 'undefined' && window.location) {
      window.location.href = '/paginas/ingreso.html';
    }

    throw new Error('Sesión expirada o no autorizada');
  }

  let respuestaJson = null;
  const tipoContenido = res.headers.get('content-type') || '';
  if (tipoContenido.includes('application/json')) {
    try {
      respuestaJson = await res.json();
    } catch {
      respuestaJson = null;
    }
  }

  if (respuestaJson && typeof respuestaJson === 'object' && 'error' in respuestaJson) {
    throw new Error(respuestaJson.error);
  }

  if (!res.ok) {
    throw new Error(respuestaJson?.error || `Error HTTP ${res.status}`);
  }

  return respuestaJson;
}

export async function listar(col, filtros = {}) {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      params.append(clave, valor);
    }
  }
  const query = params.toString();
  const ruta = query ? `/api/${col}?${query}` : `/api/${col}`;
  return llamar('GET', ruta);
}

export async function obtener(col, id) {
  return llamar('GET', `/api/${col}/${id}`);
}

export async function crear(col, datos) {
  return llamar('POST', `/api/${col}`, datos);
}

export async function actualizar(col, id, cambios) {
  return llamar('PUT', `/api/${col}/${id}`, cambios);
}

export async function eliminar(col, id) {
  return llamar('DELETE', `/api/${col}/${id}`);
}

export async function subir(archivo) {
  const formData = new FormData();
  formData.append('archivo', archivo);
  return llamar('POST', '/api/subidas', formData);
}

export async function ia(tarea, datos) {
  return llamar('POST', `/api/ia/${tarea}`, datos);
}
