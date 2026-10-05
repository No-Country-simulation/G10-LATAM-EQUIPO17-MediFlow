import { apiClient } from '../../../shared/api/apiClient'

export function obtenerPerfil() {
  return apiClient('/auth/me')
}