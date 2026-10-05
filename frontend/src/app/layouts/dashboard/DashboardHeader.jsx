import { useNavigate } from 'react-router-dom'
import Avatar from '../../../shared/ui/Avatar'
import { clearAuthTokens } from '../../../shared/api/apiClient'
import { clearSession, ETIQUETA_ROL, getRol, getSession, ROLES, updateSession } from '../../session'

function DevRoleSwitcher() {
  const rol = getRol()

  if (!import.meta.env.DEV) return null

  const cambiarRol = (nuevoRol) => {
    updateSession({ rol: nuevoRol })
    window.location.reload()
  }

  return (
    <div className="dev-roles" role="group" aria-label="Selector de rol (modo desarrollo)">
      {[ROLES.ADMIN, ROLES.MEDICO, ROLES.PACIENTE].map((valor) => (
        <button
          key={valor}
          type="button"
          className={rol === valor ? 'dev-roles__btn is-active' : 'dev-roles__btn'}
          onClick={() => cambiarRol(valor)}
        >
          {valor}
        </button>
      ))}
      <span className="dev-roles__badge">dev</span>
    </div>
  )
}

function DashboardHeader({ onToggle }) {
  const navigate = useNavigate()
  const sesion = getSession()
  const rol = getRol()

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
      </div>

      <div className="dashboard-header__right">
        <DevRoleSwitcher />
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