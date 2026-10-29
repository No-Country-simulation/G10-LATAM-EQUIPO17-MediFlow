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
  const rutaCodificada = rutaObjeto.split('/').map(encodeURIComponent).join('/')
  return fetchQuery(
    queryKeys.storageMetadata(bucket, rutaObjeto),
    () => apiClient(`/storage/documentos/${encodeURIComponent(bucket)}/${rutaCodificada}`),
    { ttl: queryTTL.operativo },
  )
}

export function listarHistorialDocumentos({ offset = 0, limit = 50, force = false } = {}) {
  return fetchQuery(
    `${queryKeys.registrosTriaje}:${offset}:${limit}`,
    () => apiClient('/triaje/registros', { query: { offset, limit } }),
    { force, ttl: queryTTL.operativo },
  )
}
