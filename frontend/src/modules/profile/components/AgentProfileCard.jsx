import agenteFlowData from '../../../shared/assets/agente-flowData.png'

function AgentProfileCard() {
  return (
    <article className="profile-agent">
      <span className="profile-agent__badge">
        <span className="profile-agent__badge-dot" aria-hidden="true" />
        Tu agente asignado
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
        <p>Disponible para ayudarte a gestionar información clínica de forma segura.</p>
      </div>

      <div className="profile-agent__tags">
        <span>✓ Gestión clínica</span>
        <span>✓ Siempre disponible</span>
      </div>
    </article>
  )
}

export default AgentProfileCard
