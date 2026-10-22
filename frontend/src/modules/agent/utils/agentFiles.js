export const MAX_ARCHIVO_BYTES = 10 * 1024 * 1024

export const TIPOS_ARCHIVO = Object.freeze({
  'application/pdf': { etiqueta: 'PDF', extension: 'pdf' },
  'image/png': { etiqueta: 'PNG', extension: 'png' },
  'image/jpeg': { etiqueta: 'JPG', extension: 'jpg' },
  'image/jpg': { etiqueta: 'JPG', extension: 'jpg' },
})

const EXTENSIONES_PERMITIDAS = new Set(['pdf', 'png', 'jpg', 'jpeg'])

export function extensionDeNombre(nombre) {
  const texto = String(nombre || '').trim()
  const punto = texto.lastIndexOf('.')
  if (punto < 0 || punto === texto.length - 1) return ''
  return texto.slice(punto + 1).toLowerCase()
}

export function etiquetaDeArchivo(nombre) {
  const extension = extensionDeNombre(nombre)
  if (extension === 'pdf') return 'PDF'
  if (extension === 'png') return 'PNG'
  if (extension === 'jpg' || extension === 'jpeg') return 'JPG'
  return 'Archivo'
}

export function validarArchivo(file, existentes = []) {
  if (!file) {
    return { valido: false, error: 'No se recibió ningún archivo.' }
  }

  const extension = extensionDeNombre(file.name)
  const tipo = TIPOS_ARCHIVO[file.type]

  if (!extension || !EXTENSIONES_PERMITIDAS.has(extension) || !tipo) {
    return {
      valido: false,
      error: 'Formato no admitido. Selecciona un PDF, PNG o JPG.',
    }
  }

  if (file.size === 0) {
    return { valido: false, error: 'El archivo está vacío.' }
  }

  if (file.size > MAX_ARCHIVO_BYTES) {
    return {
      valido: false,
      error: 'El archivo supera el límite de 10 MB.',
    }
  }

  const duplicado = existentes.some(
    (existente) =>
      existente.archivo?.name === file.name &&
      existente.archivo?.size === file.size &&
      existente.archivo?.lastModified === file.lastModified,
  )

  if (duplicado) {
    return { valido: false, error: 'Este archivo ya está en la selección.' }
  }

  return {
    valido: true,
    tipo: tipo.etiqueta,
    extension,
    error: '',
  }
}

export function formatearBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toLocaleString('es-CL', { maximumFractionDigits: 1 })} KB`
  const mb = kb / 1024
  return `${mb.toLocaleString('es-CL', { maximumFractionDigits: 1 })} MB`
}

export function formatearDuracion(segundos) {
  if (!Number.isFinite(segundos)) return 'N/D'
  if (segundos < 1) return `${Math.round(segundos * 1000)} ms`
  return `${segundos.toLocaleString('es-CL', { maximumFractionDigits: 1 })} s`
}

function identificadorAleatorio() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

export function generarDocumentoId(file, indice) {
  const base = String(file?.name || 'documento')
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  return `DOC-${Date.now()}-${String(indice + 1).padStart(2, '0')}-${base || 'CLINICO'}-${identificadorAleatorio()}`
    .slice(0, 128)
}

export function parseFechaServidor(fecha) {
  if (!fecha) return null
  if (fecha instanceof Date) return Number.isNaN(fecha.getTime()) ? null : fecha

  const texto = String(fecha).trim()
  if (!texto) return null

  const tieneZona = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(texto)
  const normalizada = /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ? `${texto}T00:00:00Z`
    : tieneZona
      ? texto
      : `${texto}Z`

  const valor = new Date(normalizada)
  return Number.isNaN(valor.getTime()) ? null : valor
}

export function esFechaDeHoy(fecha) {
  const valor = parseFechaServidor(fecha)
  if (!valor) return false
  const hoy = new Date()
  return (
    valor.getFullYear() === hoy.getFullYear() &&
    valor.getMonth() === hoy.getMonth() &&
    valor.getDate() === hoy.getDate()
  )
}

export function formatearFecha(fecha) {
  const valor = parseFechaServidor(fecha)
  if (!valor) return '—'
  return valor.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

export function ordenarRegistros(registros) {
  return [...registros].sort(
    (a, b) =>
      (parseFechaServidor(b.created_at)?.getTime() ?? 0) -
      (parseFechaServidor(a.created_at)?.getTime() ?? 0),
  )
}

export function nombreDesdeRuta(ruta) {
  const partes = String(ruta || '').split('/').filter(Boolean)
  const base = partes[partes.length - 1] || ''
  try {
    return decodeURIComponent(base)
  } catch {
    return base
  }
}

export function documentoIdDesdeRuta(ruta) {
  return nombreDesdeRuta(ruta).replace(/\.json$/i, '')
}

export function tipoDesdeRuta(ruta) {
  const extension = extensionDeNombre(nombreDesdeRuta(ruta))
  if (!extension) return '—'
  return extension.toUpperCase()
}

export function estadoDesdeBucket(bucket) {
  if (/auditor/i.test(String(bucket || ''))) return 'En revisión'
  if (/recib/i.test(String(bucket || ''))) return 'Recibido'
  return 'Completado'
}

export function mensajeErrorProcesamiento(error) {
  switch (error?.status) {
    case 0:
      return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
    case 401:
      return 'La sesión expiró. Inicia sesión nuevamente para continuar.'
    case 403:
      return 'No tienes permisos para procesar documentos con el agente.'
    case 413:
      return 'El archivo supera el límite de 10 MB.'
    case 429:
      return 'Se alcanzó el límite de solicitudes. Espera un momento y vuelve a intentarlo.'
    case 503:
      return 'El servicio de análisis no está disponible en este momento.'
    default:
      return 'El agente no pudo procesar el documento. Inténtalo nuevamente.'
  }
}
