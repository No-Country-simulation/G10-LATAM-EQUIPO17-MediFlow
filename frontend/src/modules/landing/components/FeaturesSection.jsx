import './LandingSections.css'

const features = [
  {
    icon: '01',
    title: 'Clasificación inteligente',
    description: 'Reconoce distintos tipos de documentos y prepara cada caso para el siguiente paso.',
  },
  {
    icon: '02',
    title: 'Extracción estructurada',
    description: 'Convierte contenido clínico en información ordenada, clara y fácil de consultar.',
  },
  {
    icon: '03',
    title: 'Revisión humana',
    description: 'Mantiene a los profesionales dentro del flujo cuando un caso necesita validación.',
  },
]

function FeaturesSection() {
  return (
    <section className="landing-section landing-section--tinted" id="caracteristicas" aria-labelledby="features-title">
      <div className="landing-section__inner">
        <div className="landing-section__heading">
          <span className="landing-kicker"><span aria-hidden="true">●</span>Características</span>
          <h2 id="features-title">Diseñado para trabajar con la <span>complejidad clínica.</span></h2>
        </div>
        <div className="landing-features">
          {features.map((feature) => (
            <article className="landing-feature" key={feature.title}>
              <span className="landing-feature__icon" aria-hidden="true">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
