import { Link } from 'react-router-dom'
import './LandingSections.css'

function CtaSection() {
  return (
    <section className="landing-section landing-cta" aria-labelledby="cta-title">
      <div className="landing-cta__inner">
        <h2 id="cta-title">Comienza a procesar documentos clínicos <span>de forma estructurada.</span></h2>
        <p>Crea tu cuenta en segundos. Sube un documento y observa el pipeline de triaje en acción.</p>
        <div className="landing-cta__actions">
          <Link className="landing-cta__primary" to="/login">Iniciar sesión</Link>
          <a className="landing-cta__secondary" href="#como-funciona">Ver cómo funciona</a>
        </div>
      </div>
    </section>
  )
}

export default CtaSection
