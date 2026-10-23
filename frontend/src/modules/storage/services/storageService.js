import { apiClient } from '../../../shared/api/apiClient'

export function verificarSaludStorage() {
  return apiClient('/storage/health')
}

export function listarDocumentos(estado, prefijo = '', limite = 50) {
  return apiClient('/storage/documentos', {
    query: { estado, prefijo, limite },
  })
}

export function obtenerMetadataDocumento(bucket, rutaObjeto) {
  const rutaCodificada = rutaObjeto.split('/').map(encodeURIComponent).join('/')
  return apiClient(`/storage/documentos/${encodeURIComponent(bucket)}/${rutaCodificada}`)
}
