import { apiClient } from '../../../shared/api/apiClient'
import { fetchQuery, invalidateQuery, queryKeys, queryTTL } from '../../../shared/api/queryCache'
import { DEMO_USUARIOS } from '../mocks/demoUsuarios'

const USO_DEMO = false

export function listarUsuarios({ force = false } = {}) {
  if (USO_DEMO) return Promise.resolve(DEMO_USUARIOS)

  return fetchQuery(
    queryKeys.usuarios,
    () => apiClient('/auth/usuarios'),
    { force, ttl: queryTTL.operativo },
  )
}

export async function cambiarRol(usuarioId, rol) {
  if (USO_DEMO) return { id: usuarioId, rol }

  const resultado = await apiClient(`/auth/usuarios/${usuarioId}/rol`, {
    metodo: 'PATCH',
    body: { rol },
  })

  invalidateQuery(queryKeys.usuarios)
  return resultado
}
