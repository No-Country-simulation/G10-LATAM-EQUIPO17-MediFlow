import { apiClient } from '../../../shared/api/apiClient'
import { DEMO_USUARIOS } from '../mocks/demoUsuarios'

// TODO: al conectar la sesión real al backend, cambiar a false para consumir
// GET /auth/usuarios y PATCH /auth/usuarios/{id}/rol de verdad.
const USO_DEMO = true

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