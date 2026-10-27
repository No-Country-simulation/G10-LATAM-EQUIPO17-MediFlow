import { apiClient } from '../../../shared/api/apiClient'
import {
  fetchQuery,
  invalidateQuery,
  invalidateQueryPrefix,
  queryKeys,
  queryTTL,
} from '../../../shared/api/queryCache'

function invalidarRecursosDeTriaje() {
  invalidateQuery(queryKeys.registrosTriaje)
  invalidateQueryPrefix('storage:documentos:')
  invalidateQueryPrefix('storage:metadata:')
}

/**
 * Envía una solicitud de triaje textual al backend.
 * @param {import('../types/triaje.js').SolicitudTriaje} solicitud
 */
export function procesarTriaje(solicitud) {
  return apiClient('/triaje/', { metodo: 'POST', body: solicitud }).then((respuesta) => {
    invalidarRecursosDeTriaje()
    return respuesta
  })
}

/**
 * Envía un archivo clínico al pipeline de triaje.
 * El backend procesa un archivo por solicitud y responde de forma síncrona.
 * @param {File} archivo Archivo PDF, PNG o JPG (máximo 10 MB).
 * @param {string} documentoId Identificador del documento.
 * @param {string} [canalOrigen] Canal de ingreso (default "manual").
 * @param {{ signal?: AbortSignal }} [opciones]
 */
export function procesarTriajeArchivo(archivo, documentoId, canalOrigen = 'manual', { signal } = {}) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  formData.append('documento_id', documentoId)
  formData.append('canal_origen', canalOrigen)

  return apiClient('/triaje/archivo', {
    metodo: 'POST',
    body: formData,
    signal,
  }).then((respuesta) => {
    invalidarRecursosDeTriaje()
    return respuesta
  })
}

export function listarRegistrosTriaje({ force = false } = {}) {
  return fetchQuery(
    queryKeys.registrosTriaje,
    () => apiClient('/triaje/registros'),
    { force, ttl: queryTTL.operativo },
  )
}

export function eliminarRegistroTriaje(registroId) {
  return apiClient(`/triaje/registros/${registroId}`, { metodo: 'DELETE' }).then((respuesta) => {
    invalidarRecursosDeTriaje()
    return respuesta
  })
}
