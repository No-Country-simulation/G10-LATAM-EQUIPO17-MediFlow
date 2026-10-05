import {
  AgentIcon,
  DashboardIcon,
  DocumentsIcon,
  ProfileIcon,
  StorageIcon,
  UsersIcon,
} from './icons'
import { ROLES } from './session'

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', roles: [ROLES.ADMIN, ROLES.MEDICO, ROLES.PACIENTE], icon: DashboardIcon },
  { path: '/agent', label: 'Agente MediFlow', roles: [ROLES.ADMIN, ROLES.MEDICO], icon: AgentIcon },
  { path: '/users', label: 'Usuarios', roles: [ROLES.ADMIN], icon: UsersIcon },
  { path: '/documents', label: 'Documentos', roles: [ROLES.ADMIN, ROLES.MEDICO], icon: DocumentsIcon },
  { path: '/storage', label: 'Storage', roles: [ROLES.ADMIN], icon: StorageIcon },
  { path: '/profile', label: 'Mi perfil', roles: [ROLES.ADMIN, ROLES.MEDICO, ROLES.PACIENTE], icon: ProfileIcon },
]

export const rutasDelRol = (rol) => NAV_ITEMS.filter((item) => item.roles.includes(rol))

export function tituloDeRuta(pathname) {
  return NAV_ITEMS.find((item) => item.path === pathname)?.label || ''
}