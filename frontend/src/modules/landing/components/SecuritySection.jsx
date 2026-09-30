import './LandingSections.css'

function SecuritySection() {
  return (
    <section className="landing-section landing-security" id="seguridad" aria-labelledby="security-title">
      <div className="landing-security__seal" aria-hidden="true">
        <span>✓</span>
      </div>
      <div className="landing-security__content">
        <span className="landing-kicker"><span aria-hidden="true">●</span>Seguridad y control</span>
        <h2 id="security-title">La tecnología acompaña. <span>La responsabilidad permanece.</span></h2>
        <p>MediFlow está pensado para apoyar a los equipos clínicos con trazabilidad, revisión humana y una gestión clara del recorrido de cada documento.</p>
      </div>
    </section>
  )
}

export default SecuritySection
