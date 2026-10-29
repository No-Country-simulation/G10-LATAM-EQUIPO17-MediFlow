import { apiClient } from '../../../shared/api/apiClient'
import { fetchQuery, invalidateQueryPrefix, queryKeys, queryTTL } from '../../../shared/api/queryCache'
import { DEMO_USUARIOS } from '../mocks/demoUsuarios'

const USO_DEMO = false

export function listarUsuarios({ force = false } = {}) {
  if (USO_DEMO) return Promise.resolve(DEMO_USUARIOS)

  return fetchQuery(
    queryKeys.usuarios,
    () => apiClient('/auth/usuarios').then(res => res.items ?? res),
    { force, ttl: queryTTL.operativo },
  )
}

export function listarUsuariosPaginados({ offset = 0, limit = 200, force = false } = {}) {
  return fetchQuery(
    `${queryKeys.usuarios}:${offset}:${limit}`,
    () => apiClient('/auth/usuarios', { query: { offset, limit } }),
    { force, ttl: queryTTL.operativo },
  )
}

export function buscarUsuarios(q, { offset = 0, limit = 50, force = false } = {}) {
  if (USO_DEMO) {
    const termino = q.toLowerCase()
    return Promise.resolve(
      DEMO_USUARIOS.filter(
        (u) => u.nombre.toLowerCase().includes(termino) || u.email.toLowerCase().includes(termino),
      ),
    )
  }

  const params = new URLSearchParams({ q, offset: String(offset), limit: String(limit) })
  return fetchQuery(
    `usuarios:buscar:${q}:${offset}:${limit}`,
    () => apiClient(`/auth/usuarios/buscar?${params}`).then(res => res.items ?? res),
    { force, ttl: queryTTL.operativo },
  )
}

export async function cambiarRol(usuarioId, rol) {
  if (USO_DEMO) return { id: usuarioId, rol }

  const resultado = await apiClient(`/auth/usuarios/${usuarioId}/rol`, {
    metodo: 'PATCH',
    body: { rol },
  })

  invalidateQueryPrefix(queryKeys.usuarios)
  return resultado
}
