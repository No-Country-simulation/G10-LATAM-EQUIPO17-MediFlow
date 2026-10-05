import { ROLES } from '../../../app/session'

const METRICAS = {
  [ROLES.ADMIN]: [
    { id: 'usuarios', etiqueta: 'Usuarios registrados', valor: '34', tendencia: '+4 esta semana' },
    { id: 'documentos', etiqueta: 'Documentos procesados', valor: '512', tendencia: '+12% vs. semana anterior' },
    { id: 'auditoria', etiqueta: 'En auditoría humana', valor: '7', tendencia: 'requieren revisión' },
    { id: 'storage', etiqueta: 'Estado de storage', valor: 'Operativo', tendencia: 'OCI conectado' },
  ],
  [ROLES.MEDICO]: [
    { id: 'documentos', etiqueta: 'Documentos procesados', valor: '128', tendencia: '+8 hoy' },
    { id: 'pendientes', etiqueta: 'En cola del agente', valor: '3', tendencia: 'esperando triaje' },
    { id: 'urgencias', etiqueta: 'Prioridad urgente', valor: '2', tendencia: 'requieren atención' },
  ],
  [ROLES.PACIENTE]: [
    { id: 'documentos', etiqueta: 'Mis documentos', valor: '14', tendencia: 'en tu historial' },
    { id: 'nuevos', etiqueta: 'Nuevos resultados', valor: '1', tendencia: 'listo para revisar' },
  ],
}

const ACCESOS = {
  [ROLES.ADMIN]: [
    { path: '/users', etiqueta: 'Gestionar usuarios', descripcion: 'Roles y estados de acceso' },
    { path: '/documents', etiqueta: 'Ver documentos', descripcion: 'Consultar el repositorio clínico' },
    { path: '/storage', etiqueta: 'Estado del storage', descripcion: 'Monitoreo de infraestructura OCI' },
    { path: '/agent', etiqueta: 'Agente MediFlow', descripcion: 'Núcleo de triaje y enrutamiento' },
  ],
  [ROLES.MEDICO]: [
    { path: '/agent', etiqueta: 'Agente MediFlow', descripcion: 'Triaje y enrutamiento de documentos' },
    { path: '/documents', etiqueta: 'Ver documentos', descripcion: 'Consultar el repositorio clínico' },
  ],
  [ROLES.PACIENTE]: [
    { path: '/profile', etiqueta: 'Mi perfil', descripcion: 'Revisa tus datos de acceso' },
  ],
}

export function resumenPorRol(rol) {
  return {
    metricas: METRICAS[rol] || [],
    accesos: ACCESOS[rol] || [],
  }
}