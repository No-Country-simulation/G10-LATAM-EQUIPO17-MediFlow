import { Navigate, Outlet } from 'react-router-dom'
import { getRol, getSession } from '../session'

export function RequireAuth() {
  const sesion = getSession()
  if (!sesion) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireRole({ roles, children }) {
  const rol = getRol()
  if (!roles.includes(rol)) return <Navigate to="/dashboard" replace />
  return children
}