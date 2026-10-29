import { apiClient } from '../../../shared/api/apiClient'
import { fetchQuery, invalidateQueryPrefix, queryKeys, queryTTL } from '../../../shared/api/queryCache'
import { listarHistorialDocumentos } from '../../documents/services/documentsService'
import { listarUsuariosPaginados } from '../../users/services/usersService'

const LIMITE = 50

function invalidarRevision() {
  invalidateQueryPrefix('review:')
  invalidateQueryPrefix(queryKeys.registrosTriaje)
}

export function listarCasosAdmin({ offset = 0, force = false } = {}) {
  return listarHistorialDocumentos({ offset, limit: LIMITE, force })
}

export function listarMedicos({ force = false } = {}) {
  return listarUsuariosPaginados({ limit: 200, force })
}

export function listarAsignados({ offset = 0, soloPendientes = false, force = false } = {}) {
  return fetchQuery(
    `review:asignados:${offset}:${soloPendientes}`,
    () => apiClient('/triaje/registros/asignados', {
      query: { offset, limit: LIMITE, solo_pendientes: soloPendientes },
    }),
    { ttl: queryTTL.operativo, force },
  )
}

export async function asignarCaso(registroId, medicoId) {
  const resultado = await apiClient(`/triaje/registros/${encodeURIComponent(registroId)}/asignar`, {
    metodo: 'PATCH', body: { id_medico: medicoId },
  })
  invalidarRevision()
  return resultado
}

export async function guardarComentario(registroId, comentario) {
  const resultado = await apiClient(`/triaje/registros/${encodeURIComponent(registroId)}/comentario`, {
    metodo: 'PATCH', body: { comentario },
  })
  invalidarRevision()
  return resultado
}
