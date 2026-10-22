import { useLocation, useNavigate } from 'react-router-dom'
import Avatar from '../../../shared/ui/Avatar'
import { clearAuthTokens } from '../../../shared/api/apiClient'
import { clearSession, ETIQUETA_ROL, getRol, getSession } from '../../session'
import { tituloDeRuta } from '../../navigation'

function DashboardHeader({ onToggle }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const sesion = getSession()
  const rol = getRol()
  const tituloActual = tituloDeRuta(pathname)
  const esDashboard = pathname === '/dashboard'

  const handleLogout = () => {
    clearSession()
    clearAuthTokens()
    navigate('/', { replace: true })
  }

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__left">
        <button
          type="button"
          className="dashboard-header__menu"
          onClick={onToggle}
          aria-label="Abrir menú lateral"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>

        <div className="dashboard-header__context">
          <nav className="dashboard-header__breadcrumb" aria-label="Ubicación actual">
            <span>MediFlow</span>
            <span aria-hidden="true">/</span>
            <span className="dashboard-header__breadcrumb-current">{tituloActual || 'Panel'}</span>
          </nav>
          {esDashboard && <h1 className="dashboard-header__title">Panel de Administración</h1>}
        </div>
      </div>

      <div className="dashboard-header__right">
        <div className="dashboard-header__user">
          <span className="dashboard-header__user-name">{sesion?.nombre || 'Usuario'}</span>
          <span className="dashboard-header__user-rol">{ETIQUETA_ROL[rol] || rol}</span>
        </div>
        <Avatar nombre={sesion?.nombre} rol={rol} size={36} />
        <button type="button" className="dashboard-header__logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}

export default DashboardHeader