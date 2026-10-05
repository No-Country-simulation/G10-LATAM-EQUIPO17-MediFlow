import { Link } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import QuickLinks from '../components/QuickLinks'
import { resumenPorRol } from '../services/dashboardService'
import './dashboard.css'

function DashboardShell({ rol, rolEtiqueta, saludo, bienvenida }) {
  const { metricas, accesos } = resumenPorRol(rol)

  return (
    <div className="dash-page">
      <header className="dash-page__intro">
        <span className="dash-page__kicker">Panel de {rolEtiqueta}</span>
        <h1>{saludo}</h1>
        <p>{bienvenida}</p>
      </header>

      {metricas.length > 0 && (
        <section className="metric-grid" aria-label="Métricas principales">
          {metricas.map((metrica) => (
            <MetricCard key={metrica.id} metrica={metrica} />
          ))}
        </section>
      )}

      <QuickLinks accesos={accesos} />

      <footer className="dash-page__foot">
        <Link to="/agent">Explorar el Agente MediFlow</Link>
      </footer>
    </div>
  )
}

export default DashboardShell