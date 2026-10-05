const SESSION_KEY = 'mediflow.session'

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  MEDICO: 'medico',
  PACIENTE: 'paciente',
})

export const ETIQUETA_ROL = Object.freeze({
  admin: 'Administrador',
  medico: 'Médico',
  paciente: 'Paciente',
})

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveSession(sesion) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion))
}

export function updateSession(cambios) {
  const actual = getSession() || {}
  saveSession({ ...actual, ...cambios })
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function getRol() {
  return getSession()?.rol || null
}

export function getUsuario() {
  const sesion = getSession()
  return sesion ? { nombre: sesion.nombre, email: sesion.email, rol: sesion.rol } : null
}