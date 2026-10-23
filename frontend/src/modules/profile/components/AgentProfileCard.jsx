import agenteFlowData from '../../../shared/assets/agente-flowData.png'
import { Link } from 'react-router-dom'

function AgentProfileCard() {
  return (
    <article className="profile-agent">
      <span className="profile-agent__badge">
        <span className="profile-agent__badge-dot" aria-hidden="true" />
        Herramienta clínica
      </span>

      <div className="profile-agent__visual">
        <img
          src={agenteFlowData}
          alt="Asistente médico digital de MediFlow"
          className="profile-agent__image"
        />
      </div>

      <div className="profile-agent__copy">
        <span className="profile-agent__eyebrow">ASISTENTE MÉDICO DIGITAL</span>
        <h2>Tu agente MediFlow</h2>
        <p>Accede al agente para procesar documentos clínicos.</p>
      </div>

      <div className="profile-agent__tags">
        <Link to="/agent">Abrir Agente MediFlow →</Link>
      </div>
    </article>
  )
}

export default AgentProfileCard
