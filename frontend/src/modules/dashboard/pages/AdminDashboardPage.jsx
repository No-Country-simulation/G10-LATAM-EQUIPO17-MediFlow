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

  const usuariosDisponibles = !usersError
  const activos = usuarios.filter((usuario) => usuario.activo).length
  const inactivos = usuarios.length - activos
  const storageConectado = storage?.oci_conectado === true
  const registrosRecientes = [...registros]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
  const bucketsTriaje = new Set(registros.map((registro) => registro.bucket)).size
  const ultimoTriaje = registrosRecientes[0]?.created_at
  const pendientes = [
    !usuariosDisponibles || inactivos > 0,
    Boolean(storageError) || !storageConectado,
    Boolean(triajeError),
  ].filter(Boolean).length

  return (
    <div className="admin-console">
      <header className="admin-console__header">
        <div>
          <div className="admin-console__eyebrow">
            <span className="admin-console__eyebrow-line" aria-hidden="true" />
            Control administrativo
          </div>
          <h1>Centro de operaciones</h1>
          <p>Supervisa accesos, infraestructura y actividad clínica desde un mismo lugar.</p>
        </div>
        <button
          type="button"
          className="admin-console__refresh"
          onClick={() => setRefreshKey((actual) => actual + 1)}
          disabled={cargando}
        >
          <span aria-hidden="true">↻</span>
          {cargando ? 'Actualizando' : 'Actualizar'}
        </button>
      </header>

      <div className="admin-console__context" role="status">
        <span className="admin-console__context-dot" aria-hidden="true" />
        <span>{usersError || storageError || triajeError ? 'Hay datos que requieren revisión.' : 'Conectado al entorno local de MediFlow.'}</span>
        <span className="admin-console__context-meta">Última consulta al abrir esta vista</span>
      </div>

      <section className="admin-console__focus" aria-label="Atención prioritaria">
        <div className="admin-console__focus-intro">
          <span className="admin-console__section-label">Ahora</span>
          <h2>Atención prioritaria</h2>
          <p>Acciones que pueden afectar el acceso administrativo o la continuidad del servicio.</p>
        </div>
        <div className="admin-console__focus-count">
          <strong>{pendientes}</strong>
          <span>{pendientes === 1 ? 'señal activa' : 'señales activas'}</span>
        </div>
        <div className="admin-console__focus-actions">
          <Link className={usersError || inactivos > 0 ? 'focus-action is-alert' : 'focus-action'} to="/users">
            <span className="focus-action__index">01</span>
            <span className="focus-action__copy">
              <strong>{usersError ? 'Usuarios no disponibles' : inactivos > 0 ? `${inactivos} accesos para revisar` : 'Accesos sin pendientes'}</strong>
              <span>{usersError || 'Revisar estado de cuentas y roles'}</span>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link className={!storageConectado ? 'focus-action is-alert' : 'focus-action'} to="/storage">
            <span className="focus-action__index">02</span>
            <span className="focus-action__copy">
              <strong>{storageConectado ? 'Storage operativo' : 'Storage requiere revisión'}</strong>
              <span>{storageError || storage?.mensaje || 'Verificar conexión y buckets'}</span>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="admin-console__metrics" aria-label="Indicadores principales">
        <article className="console-metric">
          <span className="console-metric__label">Cuentas activas</span>
          <strong>{usuariosDisponibles ? activos : '—'}</strong>
          <span>{usuariosDisponibles ? `${inactivos} para revisar` : 'Datos no disponibles'}</span>
        </article>
        <article className="console-metric">
          <span className="console-metric__label">Registros de triaje</span>
          <strong>{triajeError ? '—' : registros.length}</strong>
          <span>{triajeError ? 'Servicio no disponible' : 'Persistidos en el sistema'}</span>
        </article>
        <article className="console-metric">
          <span className="console-metric__label">Buckets en uso</span>
          <strong>{triajeError ? '—' : bucketsTriaje}</strong>
          <span>{storageConectado ? 'OCI conectado' : 'Storage sin verificar'}</span>
        </article>
        <article className="console-metric console-metric--status">
          <span className="console-metric__label">Último registro</span>
          <strong>{triajeError ? '—' : ultimoTriaje ? new Date(ultimoTriaje).toLocaleDateString() : '—'}</strong>
          <span>{ultimoTriaje ? formatDate(ultimoTriaje).split(', ')[1] : 'Sin actividad registrada'}</span>
        </article>
      </section>

      <section className="admin-console__workspace" aria-label="Actividad y accesos">
        <article className="console-panel console-panel--activity">
          <div className="console-panel__header">
            <div>
              <span className="admin-console__section-label">Trazabilidad clínica</span>
              <h2>Actividad de triaje</h2>
            </div>
            <Link to="/agent">Abrir agente <span aria-hidden="true">↗</span></Link>
          </div>

          {triajeError && <p className="console-state is-error" role="alert">{triajeError}</p>}
          {!triajeError && registrosRecientes.length === 0 && (
            <p className="console-state">Todavía no hay registros persistidos para mostrar.</p>
          )}
          {!triajeError && registrosRecientes.length > 0 && (
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
                  {registrosRecientes.map((registro) => (
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
        </article>

        <article className="console-panel console-panel--access">
          <div className="console-panel__header">
            <div>
              <span className="admin-console__section-label">Gobierno de acceso</span>
              <h2>Distribución de usuarios</h2>
            </div>
            <Link to="/users">Gestionar <span aria-hidden="true">↗</span></Link>
          </div>

          {usersError ? (
            <p className="console-state is-error">No se puede consultar la distribución de roles.</p>
          ) : (
            <div className="role-distribution">
              {Object.entries(ROLE_LABELS).map(([rol, etiqueta]) => {
                const cantidad = usuarios.filter((usuario) => usuario.rol === rol).length
                const porcentaje = usuarios.length ? (cantidad / usuarios.length) * 100 : 0
                return (
                  <div className="role-row" key={rol}>
                    <div className="role-row__label"><span>{etiqueta}</span><strong>{cantidad}</strong></div>
                    <div className="role-row__track"><span style={{ width: `${porcentaje}%` }} /></div>
                  </div>
                )
              })}
              {usuarios.length === 0 && <p className="console-state">No hay cuentas registradas.</p>}
            </div>
          )}

          <Link className="console-panel__action" to="/users">Revisar permisos y estados <span aria-hidden="true">→</span></Link>
        </article>
      </section>

      <footer className="admin-console__footer">
        <span>Los datos se consultan desde el backend de MediFlow.</span>
        <span>{storageConectado ? 'Storage conectado' : 'Storage pendiente de verificación'}</span>
      </footer>
    </div>
  )
}

export default AdminDashboardPage
