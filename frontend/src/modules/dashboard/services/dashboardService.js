import { ROLES } from '../../../app/session'
import { listarRegistrosTriaje } from '../../agent/services/agentService'
import { ESTADO_DOCUMENTO } from '../../documents/types/estados'
import { listarDocumentos } from '../../documents/services/documentsService'
import { verificarSaludStorage } from '../../storage/services/storageService'
import { listarUsuarios } from '../../users/services/usersService'

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
    { path: '/documents', etiqueta: 'Mis documentos', descripcion: 'Consulta tu historial de procesos completados' },
    { path: '/profile', etiqueta: 'Mi perfil', descripcion: 'Revisa tus datos de acceso' },
  ],
}

export function resumenPorRol(rol) {
  return {
    metricas: METRICAS[rol] || [],
    accesos: ACCESOS[rol] || [],
  }
}

const LIMITE_AUDITORIA = 500

function parseFecha(fecha) {
  if (!fecha) return null
  if (fecha instanceof Date) return Number.isNaN(fecha.getTime()) ? null : fecha

  const texto = String(fecha).trim()
  if (!texto) return null

  const tieneZona = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(texto)
  const normalizada = /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ? `${texto}T00:00:00Z`
    : tieneZona
      ? texto
      : `${texto}Z`
  const valor = new Date(normalizada)
  return Number.isNaN(valor.getTime()) ? null : valor
}

function esDelDiaActual(fecha) {
  const valor = parseFecha(fecha)
  if (!valor) return false
  const hoy = new Date()
  return (
    valor.getFullYear() === hoy.getFullYear() &&
    valor.getMonth() === hoy.getMonth() &&
    valor.getDate() === hoy.getDate()
  )
}

function inicialesDe(nombre) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return '?'
  return partes.slice(0, 2).map((parte) => parte[0]).join('').toUpperCase()
}

function esBucketDeAuditoria(bucket) {
  return /auditor/i.test(String(bucket || ''))
}

function construirActividades(registros, usuarios) {
  const usuariosPorId = new Map((usuarios || []).map((usuario) => [usuario.id, usuario]))

  return [...registros]
    .sort((a, b) => (parseFecha(b.created_at)?.getTime() ?? 0) - (parseFecha(a.created_at)?.getTime() ?? 0))
    .slice(0, 6)
    .map((registro) => {
      const usuario = usuariosPorId.get(registro.id_usuario)
      const nombre = usuario?.nombre || 'Usuario no disponible'
      return {
        id: registro.id,
        usuario: nombre,
        iniciales: inicialesDe(nombre),
        accion: 'Triaje completado',
        modulo: 'Agente MediFlow',
        fecha: parseFecha(registro.created_at),
        estado: esBucketDeAuditoria(registro.bucket) ? 'En revisión' : 'Completado',
      }
    })
}

/**
 * Reúne en una sola carga la información real disponible para el dashboard admin.
 * Cada fuente es independiente: si una falla, el resto del dashboard sigue operativo.
 */
export async function cargarResumenAdmin({ force = false } = {}) {
  const [usuariosResultado, storageResultado, registrosResultado, auditoriaResultado] =
    await Promise.allSettled([
      listarUsuarios({ force }),
      verificarSaludStorage({ force }),
      listarRegistrosTriaje({ force }),
      listarDocumentos({ estado: ESTADO_DOCUMENTO.AUDITORIA, limite: LIMITE_AUDITORIA, force }),
    ])

  const usuarios = usuariosResultado.status === 'fulfilled' && Array.isArray(usuariosResultado.value)
    ? usuariosResultado.value
    : null
  const storage = storageResultado.status === 'fulfilled' ? storageResultado.value : null
  const registros = registrosResultado.status === 'fulfilled' && Array.isArray(registrosResultado.value)
    ? registrosResultado.value
    : null
  const auditoria = auditoriaResultado.status === 'fulfilled' && Array.isArray(auditoriaResultado.value)
    ? auditoriaResultado.value
    : null

  const metricas = {
    usuariosTotal: usuarios ? usuarios.length : null,
    usuariosActivos: usuarios ? usuarios.filter((usuario) => usuario.activo).length : null,
    medicos: usuarios ? usuarios.filter((usuario) => usuario.rol === ROLES.MEDICO).length : null,
    pacientes: usuarios ? usuarios.filter((usuario) => usuario.rol === ROLES.PACIENTE).length : null,
    documentosTotal: registros ? registros.length : null,
    documentosHoy: registros ? registros.filter((registro) => esDelDiaActual(registro.created_at)).length : null,
    enRevision: auditoria
      ? auditoria.length >= LIMITE_AUDITORIA
        ? `${LIMITE_AUDITORIA}+`
        : auditoria.length
      : null,
    enRevisionTruncado: auditoria ? auditoria.length >= LIMITE_AUDITORIA : false,
    storageConectado: storage ? storage.oci_conectado === true : null,
    storageRegion: storage?.region || null,
  }

  return {
    metricas,
    actividades: registros ? construirActividades(registros, usuarios || []) : [],
    fallos: {
      usuarios: usuariosResultado.status === 'rejected',
      storage: storageResultado.status === 'rejected',
      registros: registrosResultado.status === 'rejected',
      auditoria: auditoriaResultado.status === 'rejected',
    },
  }
}
