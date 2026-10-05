import TriajeStages from '../components/TriajeStages'
import './agent.css'

function AgentPage() {
  return (
    <div className="agent-page">
      <header className="agent-page__intro">
        <span className="agent-page__kicker">Núcleo de MediFlow</span>
        <h1>Agente MediFlow</h1>
        <p>
          El agente recibe documentos clínicos, identifica su tipo, extrae la información
          relevante y decide su destino. La integración con el pipeline de triaje está en
          desarrollo en el backend.
        </p>
      </header>

      <div className="agent-page__panels">
        <TriajeStages />

        <section className="agent-notice" aria-label="Estado del agente">
          <h2>Pipeline de triaje en implementación</h2>
          <p>
            Los endpoints <code>POST /triaje/</code> y <code>POST /triaje/archivo</code> aún
            devuelven <strong>501</strong> en el backend. Esta vista quedará lista para la
            carga de documentos y la visualización de resultados cuando el pipeline esté
            disponible.
          </p>
          <span className="agent-notice__badge">Disponible próximamente</span>
        </section>
      </div>
    </div>
  )
}

export default AgentPage