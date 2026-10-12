import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarRegistrosTriaje } from '../../agent/services/agentService'
import { listarUsuarios } from '../../users/services/usersService'
import { verificarSaludStorage } from '../../storage/services/storageService'
import './AdminDashboardPage.css'

function AdminDashboardPage() {
  const [usuarios, setUsuarios] = useState([])
  const [storage, setStorage] = useState(null)
  const [registros, setRegistros] = useState([])
  const [usersError, setUsersError] = useState('')
  const [storageError, setStorageError] = useState('')
  const [triajeError, setTriajeError] = useState('')
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

  const activeUsers = usuarios.filter((usuario) => usuario.activo).length
  const inactiveUsers = usuarios.length - activeUsers
  const storageConnected = storage?.oci_conectado === true
  const hasAlert = !cargando && Boolean(usersError || inactiveUsers > 0 || storageError || !storageConnected || triajeError)

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <span className="admin-dashboard__eyebrow">MediFlow</span>
          <h1>Administración del sistema</h1>
          <p>Gestiona el acceso de los usuarios y el almacenamiento documental de la plataforma.</p>
        </div>
        <button
          type="button"
          className="admin-dashboard__refresh"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={cargando}
        >
          {cargando ? 'Actualizando…' : 'Actualizar estado'}
        </button>
      </header>

      {hasAlert && (
        <section className="admin-alert" aria-labelledby="alert-title">
          <span className="admin-alert__mark" aria-hidden="true">!</span>
          <div>
            <strong id="alert-title">Hay elementos que requieren revisión</strong>
            <span>
              {usersError || storageError || triajeError || (inactiveUsers > 0 ? `${inactiveUsers} usuarios están inactivos.` : 'Storage no está disponible.')}
            </span>
          </div>
        </section>
      )}

      <section className="admin-summary" aria-labelledby="summary-title">
        <div className="admin-section__header">
          <div>
            <span className="admin-section__eyebrow">Estado actual</span>
            <h2 id="summary-title">Resumen</h2>
          </div>
        </div>

        <div className="admin-summary__grid">
          <div className="admin-summary__item">
            <span>Usuarios</span>
            <strong>{usersError ? 'No disponible' : usuarios.length}</strong>
            <small>{usersError || `${activeUsers} activas`}</small>
          </div>
          <div className="admin-summary__item">
            <span>Accesos</span>
            <strong>{usersError ? 'No disponible' : inactiveUsers}</strong>
            <small>{usersError || (inactiveUsers === 1 ? 'cuenta inactiva' : 'cuentas inactivas')}</small>
          </div>
          <div className="admin-summary__item">
            <span>Almacenamiento</span>
            <strong>{storageConnected ? 'Operativo' : 'Revisar'}</strong>
            <small>{storageError || storage?.mensaje || 'Object Storage'}</small>
          </div>
          <div className="admin-summary__item">
            <span>Triaje</span>
            <strong>{triajeError ? 'Revisar' : registros.length}</strong>
            <small>{triajeError || 'registros disponibles'}</small>
          </div>
        </div>
      </section>

      <section className="admin-modules" aria-labelledby="modules-title">
        <div className="admin-section__header">
          <div>
            <span className="admin-section__eyebrow">Accesos directos</span>
            <h2 id="modules-title">Módulos</h2>
          </div>
        </div>

        <div className="admin-module-list">
          <Link className="admin-module" to="/users">
            <span className="admin-module__index">01</span>
            <span className="admin-module__body">
              <strong>Usuarios y permisos</strong>
              <span>Gestiona cuentas, roles y estados de acceso.</span>
              <small>{usersError ? 'Información no disponible' : `${usuarios.length} cuentas · ${activeUsers} activas`}</small>
            </span>
            <span className={`admin-module__status ${usersError ? 'is-error' : inactiveUsers > 0 ? 'is-warning' : 'is-ok'}`}>
              {usersError ? 'Revisar' : inactiveUsers > 0 ? `${inactiveUsers} inactivos` : 'Al día'}
            </span>
            <span className="admin-module__arrow" aria-hidden="true">↗</span>
          </Link>

          <Link className="admin-module" to="/storage">
            <span className="admin-module__index">02</span>
            <span className="admin-module__body">
              <strong>Archivos y almacenamiento</strong>
              <span>Consulta la conexión con OCI y el estado de los buckets.</span>
              <small>{storageError || storage?.mensaje || 'Object Storage'}</small>
            </span>
            <span className={`admin-module__status ${storageConnected ? 'is-ok' : 'is-error'}`}>
              {storageConnected ? 'Operativo' : 'Revisar'}
            </span>
            <span className="admin-module__arrow" aria-hidden="true">↗</span>
          </Link>

          <Link className="admin-module" to="/agent">
            <span className="admin-module__index">03</span>
            <span className="admin-module__body">
              <strong>Actividad de triaje</strong>
              <span>Consulta los registros clínicos generados por el agente.</span>
              <small>{triajeError || `${registros.length} registros disponibles`}</small>
            </span>
            <span className={`admin-module__status ${triajeError ? 'is-error' : 'is-ok'}`}>
              {triajeError ? 'Revisar' : 'Disponible'}
            </span>
            <span className="admin-module__arrow" aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <footer className="admin-dashboard__footer">
        <span>Selecciona un módulo para consultar y gestionar su información.</span>
        <Link to="/agent">Ir al Agente MediFlow <span aria-hidden="true">↗</span></Link>
      </footer>
    </div>
  )
}

export default AdminDashboardPage
