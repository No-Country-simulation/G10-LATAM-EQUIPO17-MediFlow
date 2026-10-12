import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarRegistrosTriaje } from '../../agent/services/agentService'
import { listarUsuarios } from '../../users/services/usersService'
import { verificarSaludStorage } from '../../storage/services/storageService'
import './AdminDashboardPage.css'

function formatDate(value) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

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
        setUsuarios([])
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
        setRegistros([])
        setTriajeError(triajeResult.reason?.message || 'No se pudieron cargar los registros de triaje')
      }

      setCargando(false)
    }

    cargarDatos()

    return () => {
      activo = false
    }
  }, [refreshKey])

  const usersAvailable = !usersError
  const activeUsers = usuarios.filter((usuario) => usuario.activo).length
  const inactiveUsers = usuarios.length - activeUsers
  const storageConnected = storage?.oci_conectado === true
  const recentRecords = [...registros]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
  const pendingItems = usersError || inactiveUsers > 0 ? 1 : 0

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <span className="admin-dashboard__eyebrow">Administración</span>
          <h1>Resumen del espacio</h1>
          <p>Una lectura rápida de lo que requiere atención y del estado de MediFlow.</p>
        </div>
        <button
          type="button"
          className="admin-dashboard__refresh"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={cargando}
        >
          {cargando ? 'Actualizando…' : 'Actualizar'}
        </button>
      </header>

      <section className="admin-section admin-section--attention" aria-labelledby="attention-title">
        <div className="admin-section__header">
          <div>
            <span className="admin-section__number">01</span>
            <div>
              <span className="admin-section__eyebrow">Acciones pendientes</span>
              <h2 id="attention-title">Requiere atención</h2>
            </div>
          </div>
          <span className="admin-section__summary">
            {pendingItems === 0 ? 'Todo en orden' : `${pendingItems} pendiente${pendingItems === 1 ? '' : 's'}`}
          </span>
        </div>

        <div className="attention-list">
          {pendingItems === 0 && (
            <div className="attention-empty">
              <span className="attention-empty__mark" aria-hidden="true">✓</span>
              <span>
                <strong>No hay acciones pendientes</strong>
                <small>Los accesos de usuarios están al día.</small>
              </span>
            </div>
          )}
          {pendingItems > 0 && (
            <Link className="attention-row" to="/users">
              <span className={`attention-row__status ${usersError ? 'is-error' : 'is-warning'}`} aria-hidden="true" />
              <span className="attention-row__content">
                <strong>{usersError ? 'Usuarios no disponibles' : `${inactiveUsers} usuarios requieren revisión`}</strong>
                <span>{usersError || 'Revisa estados de acceso y roles'}</span>
              </span>
              <span className="attention-row__action">Ir a Usuarios <span aria-hidden="true">→</span></span>
            </Link>
          )}
        </div>
      </section>

      <section className="admin-section" aria-labelledby="status-title">
        <div className="admin-section__header">
          <div>
            <span className="admin-section__number">02</span>
            <div>
              <span className="admin-section__eyebrow">Lectura del sistema</span>
              <h2 id="status-title">Estado del espacio</h2>
            </div>
          </div>
          <span className="admin-section__helper">Datos consultados desde el backend</span>
        </div>

        <div className="status-grid">
          <Link className="status-card" to="/users">
            <span className="status-card__topline">
              <span className="status-card__label">Usuarios</span>
              <span className={`status-card__dot ${usersError ? 'is-error' : 'is-ok'}`} aria-hidden="true" />
            </span>
            <strong>{usersAvailable ? 'Disponible' : 'Revisar'}</strong>
            <span>{usersAvailable ? `${usuarios.length} cuentas · ${activeUsers} activas` : usersError}</span>
            <span className="status-card__link">Gestionar usuarios →</span>
          </Link>

          <Link className="status-card" to="/storage">
            <span className="status-card__topline">
              <span className="status-card__label">Object Storage</span>
              <span className={`status-card__dot ${storageConnected ? 'is-ok' : 'is-error'}`} aria-hidden="true" />
            </span>
            <strong>{storageConnected ? 'Operativo' : 'Sin conexión'}</strong>
            <span>{storageError || storage?.mensaje || 'Buckets y conexión OCI'}</span>
            <span className="status-card__link">Abrir Storage →</span>
          </Link>

          <Link className="status-card" to="/agent">
            <span className="status-card__topline">
              <span className="status-card__label">Actividad de triaje</span>
              <span className={`status-card__dot ${triajeError ? 'is-error' : 'is-ok'}`} aria-hidden="true" />
            </span>
            <strong>{triajeError ? 'Revisar' : `${registros.length} registros`}</strong>
            <span>{triajeError || 'Registros persistidos disponibles'}</span>
            <span className="status-card__link">Abrir agente →</span>
          </Link>
        </div>
      </section>

      <section className="admin-section" aria-labelledby="activity-title">
        <div className="admin-section__header">
          <div>
            <span className="admin-section__number">03</span>
            <div>
              <span className="admin-section__eyebrow">Seguimiento</span>
              <h2 id="activity-title">Actividad reciente</h2>
            </div>
          </div>
          <Link className="admin-section__link" to="/agent">Ver agente <span aria-hidden="true">↗</span></Link>
        </div>

        {triajeError && <p className="admin-dashboard__state is-error" role="alert">{triajeError}</p>}
        {!triajeError && recentRecords.length === 0 && (
          <p className="admin-dashboard__state">Todavía no hay registros de triaje persistidos.</p>
        )}
        {!triajeError && recentRecords.length > 0 && (
          <div className="activity-table-wrap">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Bucket</th>
                  <th>Fecha</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map((registro) => (
                  <tr key={registro.id}>
                    <td><strong>{registro.ruta_documento || registro.ruta_triaje || 'Documento clínico'}</strong></td>
                    <td><span className="activity-table__bucket">{registro.bucket}</span></td>
                    <td>{formatDate(registro.created_at)}</td>
                    <td>{registro.id_usuario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="admin-dashboard__footer">
        <span>{storageConnected ? 'Object Storage conectado' : 'Object Storage pendiente de verificación'}</span>
        <Link to="/users">Administrar permisos y roles →</Link>
      </footer>
    </div>
  )
}

export default AdminDashboardPage
