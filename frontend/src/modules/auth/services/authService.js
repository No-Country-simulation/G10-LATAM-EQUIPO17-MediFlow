import {
  apiClient,
  clearAuthTokens,
  setAuthTokens,
} from '../../../shared/api/apiClient'

async function autenticar(ruta, body) {
  const tokens = await apiClient(ruta, {
    metodo: 'POST',
    body,
  })

  setAuthTokens(tokens)

  try {
    const usuario = await apiClient('/auth/me')
    return { tokens, usuario }
  } catch (error) {
    clearAuthTokens()
    throw error
  }
}

export function iniciarSesion({ email, password }) {
  return autenticar('/auth/login', {
    email,
    password,
  })
}

export function registrarUsuario({ nombre, email, password }) {
  return autenticar('/auth/registro', {
    nombre,
    email,
    password,
  })
}

export function obtenerMensajeAuth(error) {
  if (Array.isArray(error?.detail)) {
    return error.detail.map((item) => item.msg).join('. ')
  }

  return error?.message || 'No se pudo completar la operación'
}