import { useEffect, useState } from 'react'
import AgentStatusCard from '../components/admin/AgentStatusCard'
import AuditLog from '../components/admin/AuditLog'
import QuickAccessPanel from '../components/admin/QuickAccessPanel'
import QuickStatsGrid from '../components/admin/QuickStatsGrid'
import RecentActivity from '../components/admin/RecentActivity'
import { cargarResumenAdmin } from '../services/dashboardService'
import './AdminDashboardPage.css'

const ETIQUETAS_FALLOS = {
  usuarios: 'usuarios',
  storage: 'almacenamiento',
  registros: 'registros de triaje',
  auditoria: 'documentos en revisión',
  metricasTriaje: 'métricas de triaje',
}

function AdminDashboardPage() {
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [actualizadoEn, setActualizadoEn] = useState(null)

  useEffect(() => {
    let activo = true

    cargarResumenAdmin({ force: refreshKey > 0 })
      .then((datos) => {
        if (!activo) return
        setResumen(datos)
      })
      .catch(() => {
        if (!activo) return
        setResumen({
          metricas: {},
          actividades: [],
          fallos: { usuarios: true, storage: true, registros: true, auditoria: true },
        })
      })
      .finally(() => {
        if (!activo) return
        setCargando(false)
        setActualizadoEn(new Date())
      })

    return () => {
      activo = false
    }
  }, [refreshKey])

  const fallos = resumen?.fallos || {}
  const seccionesConFallo = Object.entries(fallos)
    .filter(([, fallo]) => fallo)
    .map(([clave]) => ETIQUETAS_FALLOS[clave])

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__toolbar">
        <p className="admin-dashboard__updated" role="status">
          {cargando
            ? 'Actualizando información…'
            : actualizadoEn
              ? `Actualizado a las ${actualizadoEn.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`
              : ''}
        </p>
        <button
          type="button"
          className="admin-dashboard__refresh"
          onClick={() => {
            setCargando(true)
            setRefreshKey((valor) => valor + 1)
          }}
          disabled={cargando}
        >
          {cargando ? 'Actualizando…' : 'Actualizar estado'}
        </button>
      </div>

      {!cargando && seccionesConFallo.length > 0 && (
        <section className="admin-alert" aria-labelledby="admin-alert-title">
          <span className="admin-alert__mark" aria-hidden="true">!</span>
          <div>
            <strong id="admin-alert-title">Algunas métricas no están disponibles</strong>
            <span>
              No se pudo actualizar: {seccionesConFallo.join(', ')}. El resto del panel sigue
              operativo.
            </span>
          </div>
        </section>
      )}

      <AgentStatusCard />

      <QuickStatsGrid metricas={resumen?.metricas} cargando={cargando} />

      <div className="admin-dashboard__split">
        <RecentActivity
          actividades={resumen?.actividades}
          cargando={cargando}
          fallo={Boolean(fallos.registros)}
        />
        <QuickAccessPanel />
      </div>

      <AuditLog />
    </div>
  )
}

export default AdminDashboardPage
