import { useState } from 'react'
import './LandingHeader.css'

const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Agente MediFlow', href: '#agente' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Características', href: '#caracteristicas' },
  { label: 'Seguridad', href: '#seguridad' },
]

function MediFlowLogo() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="30" height="30" rx="9" fill="var(--color-mf-sky)" />
      <path
        d="M9.5 8.6C9.5 7.7 10.2 7 11 7H16.5L19.8 10.2V20.4C19.8 21.2 19.2 21.9 18.5 21.9H11C10.2 21.9 9.5 21.2 9.5 20.4V8.6Z"
        fill="#fff"
      />
      <path d="M16.5 7L19.8 10.2H17.1C16.4 10.2 16.5 10.1 16.5 9.4V7Z" fill="var(--color-mf-bg-4)" />
      <path
        d="M11.6 13.6H17.4M11.6 16.4H15.6"
        stroke="var(--color-mf-dark)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M18.2 18.8L17.4 17.6L16.2 19.2L14.4 15.4L12.9 17.5"
        stroke="var(--color-mf-sky)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

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