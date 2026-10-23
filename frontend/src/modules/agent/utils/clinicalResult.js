import {
  etiquetaDeArchivo,
  formatearBytes,
  formatearDuracion,
  formatearFecha,
} from './agentFiles'

const TIPOS_DOCUMENTO = {
  'Receta Medica': 'Receta Médica',
  'Informe de Estudio por Imagenes': 'Informe de Estudio por Imágenes',
  'Informe de Laboratorio': 'Informe de Laboratorio',
  'Orden de Solicitud de Procedimiento': 'Orden de Solicitud de Procedimiento',
  'Epicrisis / Informe de Alta': 'Epicrisis / Informe de Alta',
  'Certificado Medico': 'Certificado Médico',
  'Desconocido': 'Desconocido',
}

const DESTINOS = {
  Cola_Emergencia_Medica: 'Cola de Emergencia Médica',
  Farmacia_Hospitalaria: 'Farmacia Hospitalaria',
  Auditoria_Autorizaciones: 'Auditoría de Autorizaciones',
  Historia_Clinica_Electronica: 'Historia Clínica Electrónica',
  Cola_Revision_Humana: 'Cola de Revisión Humana',
}

const PRIORIDADES = {
  rutina: 'Rutina',
  urgente: 'Urgente',
  emergencia: 'Emergencia',
}

const PERSISTENCIA = {
  exito: { texto: 'OCI — Exitoso', tono: 'ok' },
  pendiente: { texto: 'OCI — Pendiente', tono: 'warning' },
  fallido: { texto: 'OCI — Fallido', tono: 'danger' },
  error: { texto: 'OCI — Fallido', tono: 'danger' },
}

function textoODisponible(valor, reemplazo = 'No disponible') {
  if (valor === null || valor === undefined) return reemplazo
  const texto = String(valor).trim()
  return texto || reemplazo
}

function textoPlano(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

function capitalizar(valor) {
  const texto = textoODisponible(valor)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function normalizarLista(valor) {
  if (!Array.isArray(valor)) return null
  return valor.map((item) => textoPlano(item)).filter(Boolean)
}

function formatearTipoDocumento(valor) {
  if (!valor) return 'No disponible'
  return TIPOS_DOCUMENTO[valor] || textoODisponible(valor)
}

function formatearDestino(valor) {
  if (!valor) return 'No disponible'
  return DESTINOS[valor] || textoODisponible(valor).replaceAll('_', ' ')
}

function formatearPrioridad(valor) {
  if (!valor) return 'No disponible'
  return PRIORIDADES[valor] || textoODisponible(valor)
}

function formatearFechaDocumento(valor) {
  if (!valor) return 'No disponible'

  const texto = String(valor).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [anio, mes, dia] = texto.split('-').map(Number)
    const fecha = new Date(anio, mes - 1, dia)
    if (Number.isNaN(fecha.getTime())) return 'No disponible'
    return fecha.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const fecha = new Date(texto)
  if (Number.isNaN(fecha.getTime())) return 'No disponible'
  return fecha.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatearFechaProcesamiento(valor) {
  if (!valor) return 'No disponible'
  const fecha = formatearFecha(valor)
  return fecha === '—' ? 'No disponible' : fecha
}

function construirMedicamentos(valor) {
  if (valor === null || valor === undefined) {
    return {
      estado: 'no-disponible',
      valores: [],
      texto: 'No disponible',
    }
  }

  if (!Array.isArray(valor)) {
    return {
      estado: 'no-disponible',
      valores: [],
      texto: 'No disponible',
    }
  }

  const valores = normalizarLista(valor) || []
  if (valores.length === 0) {
    return {
      estado: 'ninguno',
      valores: [],
      texto: 'Ninguno registrado',
    }
  }

  return {
    estado: 'lista',
    valores,
    texto: valores.join(', '),
  }
}

function construirPersistencia(almacenamiento) {
  const estado = textoPlano(almacenamiento?.status_backup).toLowerCase()
  if (!estado) {
    return { texto: 'No disponible', tono: 'neutral' }
  }

  return PERSISTENCIA[estado] || {
    texto: `OCI — ${textoODisponible(estado)}`,
    tono: 'neutral',
  }
}

function construirHallazgos({
  tipoDocumento,
  decision,
  prioridad,
  persistencia,
}) {
  const principal = []
  const observaciones = []
  const justificacion = textoPlano(decision?.justificacion_enrutamiento)

  if (decision?.requiere_auditoria_humana) {
    principal.push(
      justificacion || 'El agente marcó este documento para revisión humana.',
    )
  }

  if (tipoDocumento === 'Desconocido') {
    if (decision?.requiere_auditoria_humana) {
      observaciones.push('El tipo de documento no pudo clasificarse con certeza.')
    } else {
      principal.push('El tipo de documento no pudo clasificarse con certeza. Requiere verificación humana.')
    }
  }

  if (decision?.destino_principal) {
    observaciones.push(
      `El documento fue enrutado a ${formatearDestino(decision.destino_principal)}.`,
    )
  }

  if (prioridad === 'Urgente' || prioridad === 'Emergencia') {
    observaciones.push(`Prioridad ${prioridad.toLowerCase()} asignada por el agente.`)
  }

  if (persistencia.tono === 'danger') {
    observaciones.push('La persistencia en OCI no se completó correctamente.')
  }

  return {
    principal: principal[0] || null,
    observaciones,
  }
}

function normalizarLote(lote) {
  if (!lote) return null
  const total = Number(lote.total)
  if (!Number.isFinite(total)) return null
  return {
    total,
    completados: Number(lote.completados) || 0,
    errores: Number(lote.errores) || 0,
  }
}

/**
 * Convierte la respuesta real del backend en un modelo de presentación.
 * No inventa campos clínicos: los valores ausentes se muestran como
 * "No disponible" o con el estado informativo correspondiente.
 *
 * @param {import('../types/triaje.js').RespuestaTriaje} resultado
 * @param {{
 *   archivo?: { name?: string, size?: number, type?: string }|null,
 *   nombreArchivo?: string|null,
 *   archivoTipo?: string,
 *   tipo?: string,
 *   duracion?: number|null,
 *   procesadoEn?: string|null,
 *   registro?: { created_at?: string }|null,
 *   lote?: { total?: number, completados?: number, errores?: number }|null,
 * }} [contexto]
 * @returns {import('../types/triaje.js').ResultadoClinicoVista}
 */
export function construirResultadoClinico(resultado, contexto = {}) {
  const clasificacion = resultado?.clasificacion || {}
  const datos = resultado?.datos_extraidos || {}
  const decision = resultado?.decision_enrutamiento || {}
  const almacenamiento = resultado?.almacenamiento_oci || {}

  const archivoNombre =
    textoPlano(contexto.archivo?.name) ||
    textoPlano(contexto.nombreArchivo) ||
    'Documento clínico'
  const tipoContexto = textoPlano(contexto.archivoTipo) || textoPlano(contexto.tipo)
  const archivoTipo =
    tipoContexto && tipoContexto !== '—'
      ? tipoContexto
      : etiquetaDeArchivo(archivoNombre)
  const archivoTamano = Number.isFinite(contexto.archivo?.size)
    ? formatearBytes(contexto.archivo.size)
    : null

  const tipoDocumento = formatearTipoDocumento(clasificacion.tipo_documento)
  const prioridad = formatearPrioridad(clasificacion.nivel_prioridad)
  const destino = formatearDestino(decision.destino_principal)
  const medicamentos = construirMedicamentos(datos.medicamentos)
  const persistencia = construirPersistencia(almacenamiento)

  const campos = [
    { etiqueta: 'Estudio realizado', valor: textoPlano(datos.estudio_realizado) },
    { etiqueta: 'Diagnóstico principal', valor: textoPlano(datos.diagnostico_principal) },
    { etiqueta: 'CIE-10 sugerido', valor: textoPlano(datos.cie10_sugerido) },
  ].filter((campo) => campo.valor)

  const dosis = normalizarLista(datos.dosis)
  if (dosis?.length) {
    campos.push({ etiqueta: 'Dosis', valor: dosis.join(', ') })
  }

  const cantidadCampos = campos.length
  const score = clasificacion.score_confianza_clasificacion
  const confianza =
    typeof score === 'number' && Number.isFinite(score)
      ? `${Math.round(score * 100)}%`
      : 'No disponible'
  const duracion = Number(contexto.duracion)

  const fechaProcesamiento = formatearFechaProcesamiento(
    contexto.procesadoEn || contexto.registro?.created_at,
  )
  const fechaDocumento = formatearFechaDocumento(
    resultado?.fecha_documento || resultado?.fechaDocumento,
  )
  const resumen = textoPlano(resultado?.resumen || resultado?.resumen_documento) || null

  return {
    documentoId: textoODisponible(resultado?.documento_id),
    archivoNombre,
    archivoTipo,
    archivoTamano,
    tipoDocumento,
    fechaDocumento,
    fechaProcesamiento,
    resumen,
    especialidad: textoODisponible(clasificacion.especialidad),
    destino,
    prioridad,
    campos,
    cantidadCampos,
    medicamentos,
    persistencia,
    hallazgos: construirHallazgos({
      tipoDocumento: clasificacion.tipo_documento || '',
      decision,
      prioridad,
      persistencia,
    }),
    revisionHumana: Boolean(decision.requiere_auditoria_humana),
    estado:
      resultado?.status && resultado.status !== 'procesado'
        ? capitalizar(resultado.status)
        : 'Completado',
    tiempo: Number.isFinite(duracion) ? formatearDuracion(duracion) : 'No disponible',
    confianza,
    lote: normalizarLote(contexto.lote),
  }
}
