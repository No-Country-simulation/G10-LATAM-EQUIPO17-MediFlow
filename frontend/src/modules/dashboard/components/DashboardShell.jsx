import { useEffect, useState } from 'react'
import MetricCard from '../components/MetricCard'
import QuickLinks from '../components/QuickLinks'
import { cargarMetricasPorRol, resumenPorRol } from '../services/dashboardService'
import './dashboard.css'

function DashboardShell({ rol, rolEtiqueta, saludo, bienvenida }) {
  const { accesos } = resumenPorRol(rol)
  const [metricas, setMetricas] = useState([])
  const [estado, setEstado] = useState('cargando')

  useEffect(() => {
    let activo = true
    cargarMetricasPorRol(rol)
      .then((datos) => {
        if (!activo) return
        setMetricas(datos)
        setEstado('listo')
      })
      .catch(() => {
        if (activo) setEstado('error')
      })
    return () => { activo = false }
  }, [rol])

  return (
    <div className="dash-page">
      <header className="dash-page__intro">
        <span className="dash-page__kicker">Panel de {rolEtiqueta}</span>
        <h1>{saludo}</h1>
        <p>{bienvenida}</p>
      </header>

      {estado === 'cargando' && <p className="dash-page__feedback" role="status">Consultando tu información…</p>}
      {estado === 'error' && <p className="dash-page__feedback" role="alert">No se pudo consultar tu resumen. Puedes acceder a tus secciones desde los enlaces de abajo.</p>}
      {estado === 'listo' && metricas.length > 0 && (
        <section className="metric-grid" aria-label="Métricas principales">
          {metricas.map((metrica) => (
            <MetricCard key={metrica.id} metrica={metrica} />
          ))}
        </section>
      )}

      <QuickLinks accesos={accesos} />
    </div>
  )
}

export default DashboardShell
