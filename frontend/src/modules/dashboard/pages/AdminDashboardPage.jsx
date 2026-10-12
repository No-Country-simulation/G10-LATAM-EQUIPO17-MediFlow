import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarRegistrosTriaje } from '../../agent/services/agentService'
import { listarUsuarios } from '../../users/services/usersService'
import { verificarSaludStorage } from '../../storage/services/storageService'
import './AdminDashboardPage.css'

const ROLE_LABELS = {
  admin: 'Administradores',
  medico: 'Médicos',
  paciente: 'Pacientes',
}

const PIPELINE_STAGES = [
  { label: 'Recibidos', detail: 'Pendientes de clasificación' },
  { label: 'Procesando', detail: 'En análisis por el agente' },
  { label: 'Auditoría humana', detail: 'Casos de baja confianza' },
  { label: 'Completados', detail: 'Registros persistidos' },
]

function AdminDashboardPage() {
  const [usuarios, setUsuarios] = useState([])
  const [registros, setRegistros] = useState([])
  const [storage, setStorage] = useState(null)
  const [usersError, setUsersError] = useState('')
  const [triajeError, setTriajeError] = useState('')
  const [storageError, setStorageError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let activo = true

    async function cargarDatos() {
      setCargando(true)
      const [usersResult, storageResult, triajeResult] = await Promise.allSettled([
        listarUsuarios(),
        verificarSaludStorage(),
        listarRegistrosTriaje(),
      ])

      if (!activo) return

      if (usersResult.status === 'fulfilled') {
        setUsuarios(usersResult.value)
        setUsersError('')
      } else {
        setUsersError(usersResult.reason?.message || 'No se pudieron cargar los usuarios')
      }

      if (storageResult.status === 'fulfilled') {
        setStorage(storageResult.value)
        setStorageError('')
      } else {
        setStorage(null)
        setStorageError(storageResult.reason?.message || 'No se pudo verificar OCI')
      }

      if (triajeResult.status === 'fulfilled') {
        setRegistros(triajeResult.value || [])
        setTriajeError('')
      } else {
        setTriajeError(triajeResult.reason?.message || 'No se pudieron cargar los registros de triaje')
      }

      setCargando(false)
    }

    cargarDatos()

    return () => {
      activo = false
    }
  }, [refreshKey])

  const activos = usuarios.filter((usuario) => usuario.activo).length
  const inactivos = usuarios.length - activos
  const storageConectado = storage?.oci_conectado === true
  const registrosRecientes = [...registros]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4)
  const usuariosRecientes = [...usuarios]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4)

  return (
    <div className="admin-ops">
      <header className="admin-ops__header">
        <div>
          <span className="admin-ops__kicker">Administración / Centro de operaciones</span>
          <h1>Qué necesita atención hoy</h1>
          <p>Una vista operativa de usuarios, infraestructura y flujo clínico.</p>
        </div>
        <button
          type="button"
          className="admin-ops__refresh"
          onClick={() => setRefreshKey((actual) => actual + 1)}
          disabled={cargando}
        >
          {cargando ? 'Actualizando...' : 'Actualizar datos'}
        </button>
      </header>

      <div className="admin-ops__notice" role="status">
        <span className="admin-ops__notice-dot" aria-hidden="true" />
        <span>
          {usersError || storageError || triajeError
            ? 'Hay servicios pendientes de revisión.'
            : 'Los datos de usuarios y storage se consultan desde el backend.'}
        </span>
        <span className="admin-ops__notice-time">Sesión administrativa</span>
      </div>

      <section className="admin-ops__layout" aria-label="Resumen operativo">
        <div className="admin-ops__main-column">
          <section className="ops-panel ops-panel--attention">
            <div className="ops-panel__heading">
              <div>
                <span className="ops-panel__eyebrow">Prioridades</span>
                <h2>Requiere atención</h2>
              </div>
              <span className="ops-panel__count">{inactivos} pendientes</span>
            </div>

            <div className="attention-grid">
              <Link className="attention-item" to="/users">
                <span className="attention-item__marker is-warning" aria-hidden="true" />
                <span className="attention-item__copy">
                  <strong>{inactivos} usuarios inactivos</strong>
                  <span>{usersError || 'Revisa estados de acceso y roles'}</span>
                </span>
                <span className="attention-item__arrow" aria-hidden="true">→</span>
              </Link>

              <Link className="attention-item" to="/storage">
                <span className={`attention-item__marker ${storageConectado ? 'is-ok' : 'is-danger'}`} aria-hidden="true" />
                <span className="attention-item__copy">
                  <strong>{storageConectado ? 'Storage operativo' : 'Storage no verificado'}</strong>
                  <span>{storageError || storage?.mensaje || 'Comprueba la conexión con OCI'}</span>
                </span>
                <span className="attention-item__arrow" aria-hidden="true">→</span>
              </Link>

              <Link className="attention-item" to="/agent">
                <span className={`attention-item__marker ${triajeError ? 'is-danger' : 'is-neutral'}`} aria-hidden="true" />
                <span className="attention-item__copy">
                  <strong>{registros.length} registros de triaje</strong>
                  <span>{triajeError || 'Consulta la actividad clínica procesada'}</span>
                </span>
                <span className="attention-item__arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </section>

          <section className="ops-panel">
            <div className="ops-panel__heading">
              <div>
                <span className="ops-panel__eyebrow">Trazabilidad clínica</span>
                <h2>Flujo de documentos</h2>
              </div>
              <Link className="ops-panel__link" to="/documents">Ver documentos</Link>
            </div>

            <div className="pipeline" aria-label="Etapas del flujo de documentos">
              {PIPELINE_STAGES.map((stage, index) => (
                <div className="pipeline__stage" key={stage.label}>
                  <div className="pipeline__stage-topline">
                    <span className="pipeline__index">0{index + 1}</span>
                    <span className="pipeline__state">
                      {index === PIPELINE_STAGES.length - 1
                        ? `${registros.length} registrados`
                        : 'Sin métrica conectada'}
                    </span>
                  </div>
                  <strong>{stage.label}</strong>
                  <span>{stage.detail}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="ops-panel">
            <div className="ops-panel__heading">
              <div>
                <span className="ops-panel__eyebrow">Actividad clínica</span>
                <h2>Últimos registros de triaje</h2>
              </div>
              <Link className="ops-panel__link" to="/agent">Abrir agente</Link>
            </div>

            {triajeError && <p className="ops-state is-error" role="alert">{triajeError}</p>}
            {!triajeError && registrosRecientes.length === 0 && (
              <p className="ops-state">Aún no hay registros de triaje persistidos.</p>
            )}
            {!triajeError && registrosRecientes.length > 0 && (
              <div className="triage-activity">
                {registrosRecientes.map((registro) => (
                  <div className="triage-activity__row" key={registro.id}>
                    <span className="triage-activity__dot" aria-hidden="true" />
                    <span className="triage-activity__copy">
                      <strong>{registro.ruta_documento || 'Documento clínico'}</strong>
                      <span>{registro.bucket} · {new Date(registro.created_at).toLocaleString()}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="admin-ops__side-column">
          <section className="ops-panel ops-panel--status">
            <div className="ops-panel__heading">
              <div>
                <span className="ops-panel__eyebrow">Infraestructura</span>
                <h2>Estado del sistema</h2>
              </div>
            </div>

            <div className="system-status">
              <div className="system-status__row">
                <span className="system-status__label">Usuarios</span>
                <span className="system-status__value is-ok">{usersError ? 'Revisar' : 'Disponible'}</span>
              </div>
              <div className="system-status__row">
                <span className="system-status__label">Object Storage</span>
                <span className={`system-status__value ${storageConectado ? 'is-ok' : 'is-danger'}`}>
                  {storageConectado ? 'Operativo' : 'Sin conexión'}
                </span>
              </div>
              <div className="system-status__row">
                <span className="system-status__label">Registros de triaje</span>
                <span className={`system-status__value ${triajeError ? 'is-danger' : 'is-neutral'}`}>
                  {triajeError ? 'Revisar' : `${registros.length} registrados`}
                </span>
              </div>
            </div>

            <Link className="ops-panel__wide-link" to="/storage">Abrir monitor de storage <span aria-hidden="true">→</span></Link>
          </section>

          <section className="ops-panel ops-panel--users">
            <div className="ops-panel__heading">
              <div>
                <span className="ops-panel__eyebrow">Accesos</span>
                <h2>Usuarios del espacio</h2>
              </div>
              <Link className="ops-panel__link" to="/users">Gestionar</Link>
            </div>

            <div className="user-summary">
              <div className="user-summary__total">
                <strong>{usuarios.length}</strong>
                <span>cuentas registradas</span>
              </div>
              <div className="user-summary__roles">
                {Object.entries(ROLE_LABELS).map(([rol, etiqueta]) => (
                  <span key={rol}>
                    <strong>{usuarios.filter((usuario) => usuario.rol === rol).length}</strong> {etiqueta}
                  </span>
                ))}
              </div>
            </div>

            <div className="recent-users">
              {usuariosRecientes.map((usuario) => (
                <div className="recent-user" key={usuario.id}>
                  <span className="recent-user__avatar" aria-hidden="true">{usuario.nombre.slice(0, 1)}</span>
                  <span className="recent-user__copy">
                    <strong>{usuario.nombre}</strong>
                    <span>{usuario.email}</span>
                  </span>
                  <span className={`recent-user__status ${usuario.activo ? 'is-ok' : 'is-danger'}`}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))}
              {!cargando && usuariosRecientes.length === 0 && (
                <p className="ops-empty">No hay usuarios para mostrar.</p>
              )}
            </div>
          </section>
        </aside>
      </section>

      <footer className="admin-ops__footer">
        <span>{activos} cuentas activas en el espacio de trabajo</span>
        <Link to="/users">Revisar permisos y roles →</Link>
      </footer>
    </div>
  )
}

export default AdminDashboardPage
