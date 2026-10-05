import { apiClient } from '../../../shared/api/apiClient'

/**
 * Envía una solicitud de triaje textual al backend.
 * No se utiliza todavía en la UI: POST /triaje/ sigue devolviendo 501.
 * @param {import('../types/triaje.js').SolicitudTriaje} solicitud
 */
export function procesarTriaje(solicitud) {
  return apiClient('/triaje/', { metodo: 'POST', body: solicitud })
}

/**
 * Envía un archivo clínico al pipeline de triaje.
 * No se utiliza todavía en la UI: POST /triaje/archivo sigue devolviendo 501.
 * @param {File} archivo Archivo PDF, PNG o JPG (máximo 10 MB).
 * @param {string} documentoId Identificador del documento.
 * @param {string} [canalOrigen] Canal de ingreso (default "manual").
 */
export function procesarTriajeArchivo(archivo, documentoId, canalOrigen = 'manual') {
  const formData = new FormData()
  formData.append('archivo', archivo)
  formData.append('documento_id', documentoId)
  formData.append('canal_origen', canalOrigen)
  return apiClient('/triaje/archivo', { metodo: 'POST', body: formData })
}