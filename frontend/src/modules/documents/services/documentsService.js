import { apiClient } from '../../../shared/api/apiClient'
import { fetchQuery, queryKeys, queryTTL } from '../../../shared/api/queryCache'

export function listarDocumentos({ estado, prefijo, limite = 50, force = false } = {}) {
  return fetchQuery(
    queryKeys.storageDocumentos({ estado, prefijo, limite }),
    () =>
      apiClient('/storage/documentos', {
        query: { estado, prefijo, limite },
      }),
    { force, ttl: queryTTL.operativo },
  )
}

export function obtenerDocumento(bucket, rutaObjeto) {
  return apiClient(`/storage/documentos/${bucket}/${rutaObjeto}`)
}
