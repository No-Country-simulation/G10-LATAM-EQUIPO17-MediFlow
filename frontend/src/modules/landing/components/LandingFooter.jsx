import { Link } from 'react-router-dom'
import './LandingSections.css'

const navLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Características', href: '#caracteristicas' },
  { label: 'Seguridad', href: '#seguridad' },
]

function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer__inner landing-footer__inner--rich">
        <div className="landing-footer__main">
          <a className="landing-footer__brand" href="#inicio">Medi<span>Flow</span></a>
          <p className="landing-footer__tagline">Procesamiento clínico más claro, humano e inteligente.</p>
        </div>

        <nav className="landing-footer__nav" aria-label="Enlaces del pie de página">
          <span className="landing-footer__nav-title">Navegación</span>
          <ul className="landing-footer__nav-list">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="landing-footer__access">
          <span className="landing-footer__nav-title">Acceso</span>
          <ul className="landing-footer__nav-list">
            <li><Link to="/login">Iniciar sesión</Link></li>
            <li><Link to="/registro">Crear cuenta</Link></li>
          </ul>
        </div>

        <div className="landing-footer__project">
          <span className="landing-footer__nav-title">Proyecto</span>
          <ul className="landing-footer__nav-list">
            <li>Hackathon Oracle ONE</li>
            <li>Alura LATAM · Grupo 10</li>
            <li>Equipo 17 · 2026</li>
          </ul>
        </div>
      </div>

      <div className="landing-footer__bottom">
        <small>© 2026 MediFlow — Proyecto educativo. No almacena datos clínicos reales.</small>
      </div>
    </footer>
  )
}

export default LandingFooter
