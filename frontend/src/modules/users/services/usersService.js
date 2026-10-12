import { apiClient } from '../../../shared/api/apiClient'
import { DEMO_USUARIOS } from '../mocks/demoUsuarios'

const USO_DEMO = false

export function listarUsuarios() {
  if (USO_DEMO) return Promise.resolve(DEMO_USUARIOS)
  return apiClient('/auth/usuarios')
}

export function cambiarRol(usuarioId, rol) {
  if (USO_DEMO) {
    return Promise.resolve({ id: usuarioId, rol })
  }
  return apiClient(`/auth/usuarios/${usuarioId}/rol`, { metodo: 'PATCH', body: { rol } })
}
