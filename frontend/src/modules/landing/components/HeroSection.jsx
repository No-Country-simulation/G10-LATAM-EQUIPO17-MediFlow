import AgentPreview from './AgentPreview'
import './HeroSection.css'

const checks = [
  'Procesamiento inteligente',
  'Clasificación automática',
  'Extracción estructurada',
  'Revisión humana',
]

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7.2" fill="var(--color-mf-bg-3)" />
      <path
        d="M4.4 8.3 6.6 10.5 11.7 5.4"
        stroke="var(--color-mf-sky)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HeroSection() {
  return (
    <section className="hero" id="inicio">
      <div className="hero__content">
        <span className="hero__badge">
          <span className="hero__badge-dot" aria-hidden="true" />
          IA aplicada al procesamiento clínico
        </span>

        <h1 className="hero__title">
          Transformamos documentos clínicos en{' '}
          <span className="hero__title-accent">información inteligente</span>
        </h1>

        <p className="hero__description">
          MediFlow utiliza un agente autónomo para analizar, clasificar, extraer y organizar
          información clínica de manera rápida y estructurada.
        </p>

        <div className="hero__actions">
          <a className="hero__btn hero__btn--primary" href="#agente">
            Conocer al agente
            <span aria-hidden="true">→</span>
          </a>
          <a className="hero__btn hero__btn--secondary" href="#como-funciona">
            Ver cómo funciona
          </a>
        </div>

        <ul className="hero__checks">
          {checks.map((check) => (
            <li key={check} className="hero__check">
              <CheckIcon />
              <span>{check}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="hero__preview" id="agente">
        <AgentPreview />
      </div>
    </section>
  )
}

export default HeroSection