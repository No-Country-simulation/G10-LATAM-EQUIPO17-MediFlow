import { apiClient } from '../../../shared/api/apiClient'

export function verificarSaludStorage() {
  return apiClient('/storage/health')
}