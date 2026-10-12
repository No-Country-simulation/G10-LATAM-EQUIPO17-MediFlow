import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarUsuarios } from '../../users/services/usersService'
import { verificarSaludStorage } from '../../storage/services/storageService'
import './AdminDashboardPage.css'

function AdminDashboardPage() {
  const [usuarios, setUsuarios] = useState([])
  const [storage, setStorage] = useState(null)
  const [usersError, setUsersError] = useState('')
  const [storageError, setStorageError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let activo = true

    async function cargarDatos() {
      setCargando(true)
      const [usersResult, storageResult] = await Promise.allSettled([
        listarUsuarios(),
        verificarSaludStorage(),
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
  const hasAlert = !cargando && Boolean(usersError || inactiveUsers > 0 || storageError || !storageConnected)

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
              {usersError || storageError || (inactiveUsers > 0 ? `${inactiveUsers} usuarios están inactivos.` : 'Storage no está disponible.')}
            </span>
          </div>
        </section>
      )}

      <section className="admin-modules" aria-labelledby="modules-title">
        <div className="admin-section__header">
          <div>
            <span className="admin-section__eyebrow">Módulos administrativos</span>
            <h2 id="modules-title">Administración del sistema</h2>
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
