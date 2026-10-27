import './LandingSections.css'

const garantias = [
  {
    icono: '🔐',
    titulo: 'Control de acceso por roles',
    texto: 'Administradores, médicos y pacientes acceden solo a lo que les corresponde, con tokens JWT y sesiones controladas.',
  },
  {
    icono: '📋',
    titulo: 'Registro de auditoría',
    texto: 'Cada solicitud, cada acción y cada cambio queda registrado con usuario, timestamp y resultado.',
  },
  {
    icono: '🛡️',
    titulo: 'Validación en cada capa',
    texto: 'Contraseñas robustas, rate limiting por usuario, y validación estricta de tipos de archivo y tamaños.',
  },
  {
    icono: '👁️',
    titulo: 'Revisión humana obligatoria',
    texto: 'Cuando la confianza del análisis es baja, el documento se deriva a un profesional antes de avanzar.',
  },
]

function SecuritySection() {
  return (
    <section className="landing-section" id="seguridad" aria-labelledby="security-title">
      <div className="landing-section__inner">
        <div className="landing-security__header">
          <div className="landing-security__seal" aria-hidden="true">
            <span>✓</span>
          </div>
          <div>
            <span className="landing-kicker"><span aria-hidden="true">●</span>Seguridad y control</span>
            <h2 id="security-title">La tecnología acompaña. <span>La responsabilidad permanece.</span></h2>
            <p>MediFlow está diseñado con seguridad en cada capa: autenticación, autorización, auditoría y validación de datos clínicos.</p>
          </div>
        </div>
        <div className="landing-security__grid">
          {garantias.map((item) => (
            <article className="landing-security__card" key={item.titulo}>
              <span className="landing-security__card-icon" aria-hidden="true">{item.icono}</span>
              <h3>{item.titulo}</h3>
              <p>{item.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SecuritySection
