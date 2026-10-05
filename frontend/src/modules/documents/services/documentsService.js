import { apiClient } from '../../../shared/api/apiClient'

export function listarDocumentos({ estado, prefijo, limite = 50 } = {}) {
  return apiClient('/storage/documentos', {
    query: { estado, prefijo, limite },
  })
}

export function obtenerDocumento(bucket, rutaObjeto) {
  return apiClient(`/storage/documentos/${bucket}/${rutaObjeto}`)
}