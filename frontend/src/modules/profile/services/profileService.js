import { apiClient } from '../../../shared/api/apiClient'
import { fetchQuery, invalidateQuery, queryKeys, queryTTL } from '../../../shared/api/queryCache'

const PERFIL_GUARDADO_KEY = 'mediflow.profile.overrides'

function leerPerfilesGuardados() {
  try {
    const raw = localStorage.getItem(PERFIL_GUARDADO_KEY)
    if (!raw) return {}

    const datos = JSON.parse(raw)
    return datos && typeof datos === 'object' ? datos : {}
  } catch {
    return {}
  }
}

export function obtenerPerfil({ force = false } = {}) {
  return fetchQuery(
    queryKeys.perfil,
    () => apiClient('/auth/me'),
    { force, ttl: queryTTL.perfil },
  )
}

export function invalidarPerfil() {
  invalidateQuery(queryKeys.perfil)
}

export function obtenerPerfilGuardado(usuarioId) {
  if (!usuarioId) return null

  const guardados = leerPerfilesGuardados()
  return guardados[usuarioId] || null
}

export function guardarPerfilGuardado(usuarioId, cambios) {
  if (!usuarioId) return null

  const guardados = leerPerfilesGuardados()
  const actualizado = {
    ...guardados[usuarioId],
    nombre: cambios.nombre,
    email: cambios.email,
    actualizado_en: new Date().toISOString(),
  }

  guardados[usuarioId] = actualizado
  localStorage.setItem(PERFIL_GUARDADO_KEY, JSON.stringify(guardados))

  return actualizado
}
