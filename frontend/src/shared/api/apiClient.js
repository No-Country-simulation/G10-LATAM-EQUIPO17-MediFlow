const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const TOKENS_KEY = 'mediflow.tokens'

export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : 'Error de comunicación con el servidor')
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export function setAuthTokens({ access_token, refresh_token }) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify({ access_token, refresh_token }))
}

export function clearAuthTokens() {
  localStorage.removeItem(TOKENS_KEY)
}

export function getAccessToken() {
  const raw = localStorage.getItem(TOKENS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw).access_token || null
  } catch {
    return null
  }
}

export function getRefreshToken() {
  const raw = localStorage.getItem(TOKENS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw).refresh_token || null
  } catch {
    return null
  }
}

export async function apiClient(ruta, { metodo = 'GET', body, query } = {}) {
  const url = new URL(`${API_BASE_URL}${ruta}`)

  if (query) {
    Object.entries(query).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        url.searchParams.set(clave, valor)
      }
    })
  }

  const headers = { Accept: 'application/json' }
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const esFormData = body instanceof FormData

  const config = { method: metodo, headers }
  if (body !== undefined) {
    if (!esFormData) {
      headers['Content-Type'] = 'application/json'
      config.body = JSON.stringify(body)
    } else {
      config.body = body
    }
  }

  let response
  try {
    response = await fetch(url.toString(), config)
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor')
  }

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const detail = data?.detail ?? data?.mensaje ?? 'Solicitud fallida'
    throw new ApiError(response.status, detail)
  }

  return data
}