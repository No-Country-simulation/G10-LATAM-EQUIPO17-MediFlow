import { apiClient } from '../../../shared/api/apiClient'
import { fetchQuery, queryKeys, queryTTL } from '../../../shared/api/queryCache'

export function verificarSaludStorage({ force = false } = {}) {
  return fetchQuery(
    queryKeys.storageHealth,
    () => apiClient('/storage/health'),
    { force, ttl: queryTTL.operativo },
  )
}

export function listarDocumentos(estado, prefijo = '', limite = 50, { force = false } = {}) {
  return fetchQuery(
    queryKeys.storageDocumentos({ estado, prefijo, limite }),
    () =>
      apiClient('/storage/documentos', {
        query: { estado, prefijo, limite },
      }),
    { force, ttl: queryTTL.operativo },
  )
}

export function obtenerMetadataDocumento(bucket, rutaObjeto, { force = false } = {}) {
  const rutaCodificada = rutaObjeto.split('/').map(encodeURIComponent).join('/')
  return fetchQuery(
    queryKeys.storageMetadata(bucket, rutaObjeto),
    () => apiClient(`/storage/documentos/${encodeURIComponent(bucket)}/${rutaCodificada}`),
    { force, ttl: queryTTL.operativo },
  )
}
