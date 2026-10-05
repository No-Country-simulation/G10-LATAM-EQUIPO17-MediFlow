import { useState } from 'react'
import MediFlowLogo from '../../../shared/ui/MediFlowLogo'
import './LandingHeader.css'

const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Agente MediFlow', href: '#agente' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Características', href: '#caracteristicas' },
  { label: 'Seguridad', href: '#seguridad' },
]

function LandingHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="landing-header">
      <nav className="landing-nav" aria-label="Navegación principal">
        <a className="landing-nav__brand" href="#inicio">
          <span className="landing-nav__logo">
            <MediFlowLogo />
          </span>
          <span className="landing-nav__name">MediFlow</span>
        </a>

        <ul className={open ? 'landing-nav__links is-open' : 'landing-nav__links'}>
          {navItems.map((item) => (
            <li key={item.label}>
              <a
                className="landing-nav__link"
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            </li>
          ))}
          <li className="landing-nav__mobile-action">
            <a className="landing-nav__login" href="/login">
              Iniciar sesión
            </a>
          </li>
        </ul>

        <div className="landing-nav__actions">
          <a className="landing-nav__login" href="/login">
            Iniciar sesión
          </a>
          <button
            type="button"
            className="landing-nav__toggle"
            aria-expanded={open}
            aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="landing-nav__toggle-bar" />
            <span className="landing-nav__toggle-bar" />
            <span className="landing-nav__toggle-bar" />
          </button>
        </div>
      </nav>
    </header>
  )
}

export default LandingHeader