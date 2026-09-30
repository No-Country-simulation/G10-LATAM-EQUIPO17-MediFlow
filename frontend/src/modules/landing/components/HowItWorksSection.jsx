import './LandingSections.css'

const steps = [
  {
    number: '01',
    title: 'Recibe',
    description: 'Centraliza documentos clínicos y administrativos en un flujo claro y controlado.',
  },
  {
    number: '02',
    title: 'Analiza',
    description: 'El agente identifica el tipo de documento y extrae la información relevante.',
  },
  {
    number: '03',
    title: 'Organiza',
    description: 'Clasifica, prioriza y enruta cada caso según su contexto y nivel de confianza.',
  },
]

function HowItWorksSection() {
  return (
    <section className="landing-section landing-section--how" id="como-funciona" aria-labelledby="how-title">
      <div className="landing-section__inner">
        <div className="landing-section__heading">
          <span className="landing-kicker"><span aria-hidden="true">●</span>Cómo funciona</span>
          <h2 id="how-title">Del documento a la decisión, <span>sin perder el contexto.</span></h2>
          <p>Un flujo simple para que la información llegue al lugar correcto en el momento adecuado.</p>
        </div>
        <div className="landing-steps">
          {steps.map((step) => (
            <article className="landing-step" key={step.number}>
              <span className="landing-step__number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
