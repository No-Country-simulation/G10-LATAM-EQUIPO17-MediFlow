import './LandingSections.css'

const iconos = {
  candado: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
      <circle cx="12" cy="16.5" r="1.5" />
    </svg>
  ),
  auditoria: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  ),
  escudo: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  revision: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
}

const garantias = [
  {
    icono: iconos.candado,
    titulo: 'Control de acceso por roles',
    texto: 'Administradores, médicos y pacientes acceden solo a lo que les corresponde, con tokens JWT y sesiones controladas.',
  },
  {
    icono: iconos.auditoria,
    titulo: 'Registro de auditoría',
    texto: 'Cada solicitud, cada acción y cada cambio queda registrado con usuario, timestamp y resultado.',
  },
  {
    icono: iconos.escudo,
    titulo: 'Validación en cada capa',
    texto: 'Contraseñas robustas, rate limiting por usuario, y validación estricta de tipos de archivo y tamaños.',
  },
  {
    icono: iconos.revision,
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
