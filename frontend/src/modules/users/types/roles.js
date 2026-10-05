import { ROLES } from '../../../app/session'

export const ROL_OPCIONES = [
  { value: 'todos', label: 'Todos los roles' },
  { value: ROLES.ADMIN, label: 'Administrador' },
  { value: ROLES.MEDICO, label: 'Médico' },
  { value: ROLES.PACIENTE, label: 'Paciente' },
]

export const ESTADO_OPCIONES = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
]

export const OPCIONES_ROL_CAMBIO = [
  { value: ROLES.ADMIN, label: 'Administrador' },
  { value: ROLES.MEDICO, label: 'Médico' },
  { value: ROLES.PACIENTE, label: 'Paciente' },
]