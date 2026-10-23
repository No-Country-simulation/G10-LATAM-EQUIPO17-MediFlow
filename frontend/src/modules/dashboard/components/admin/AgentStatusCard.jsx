import { Link } from 'react-router-dom'
import { AgentIcon } from '../../../../app/icons'
import { getSession } from '../../../../app/session'
import resultadosPng from '../../../../shared/assets/Resultados.png'

function AgentStatusCard() {
  const sesion = getSession()
  const nombre = sesion?.nombre || 'Administrador'

  return (
    <section className="admin-agent" aria-labelledby="agent-panel-title">
      <div className="admin-agent__content">
        <span className="admin-agent__eyebrow">
          <span className="admin-agent__icon" aria-hidden="true">
            <AgentIcon />
          </span>
          <span className="admin-agent__environment-dot" aria-hidden="true" />
          El núcleo inteligente de la plataforma
        </span>

        <h2 id="agent-panel-title">Análisis clínico inteligente</h2>
        <p className="admin-agent__description">
          Transforma documentos clínicos en información estructurada mediante procesos
          inteligentes de clasificación, extracción y revisión.
        </p>

        <div className="admin-agent__actions">
          <Link className="admin-agent__cta" to="/agent">
            Explorar agente inteligente
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <p className="admin-agent__note">
          Consulta el estado de los procesos de análisis y la actividad reciente de la plataforma.
        </p>
        <p className="admin-agent__welcome">Bienvenido, {nombre}</p>
      </div>

      <img className="admin-agent__visual" src={resultadosPng} alt="" />
    </section>
  )
}

export default AgentStatusCard
