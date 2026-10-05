import { NavLink, useNavigate } from 'react-router-dom'
import Avatar from '../../../shared/ui/Avatar'
import MediFlowLogo from '../../../shared/ui/MediFlowLogo'
import { clearAuthTokens } from '../../../shared/api/apiClient'
import { clearSession, ETIQUETA_ROL, getRol, getSession } from '../../session'
import { rutasDelRol } from '../../navigation'

function DashboardSidebar({ collapsed, onToggle, pathname }) {
  const navigate = useNavigate()
  const sesion = getSession()
  const rol = getRol()
  const items = rutasDelRol(rol)

  const handleLogout = () => {
    clearSession()
    clearAuthTokens()
    navigate('/', { replace: true })
  }

  return (
    <aside className={collapsed ? 'sidebar is-collapsed' : 'sidebar'}>
      <div className="sidebar__brand">
        <span className="sidebar__logo">
          <MediFlowLogo size={30} />
        </span>
        {!collapsed && <span className="sidebar__brand-name">MediFlow</span>}
      </div>

      <button
        type="button"
        className="sidebar__toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
        aria-expanded={!collapsed}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10.5 4 6.5 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <nav className="sidebar__nav" aria-label="Navegación interna">
        {items.map((item) => {
          const Icono = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) => (isActive ? 'sidebar__link is-active' : 'sidebar__link')}
              data-tip={collapsed ? item.label : undefined}
              aria-label={item.label}
            >
              <span className="sidebar__link-icon">
                <Icono />
              </span>
              {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar__bottom">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive || pathname === '/profile' ? 'sidebar__user is-active' : 'sidebar__user'
          }
          data-tip={collapsed ? 'Mi perfil' : undefined}
          aria-label="Mi perfil"
        >
          <Avatar nombre={sesion?.nombre} rol={rol} size={34} />
          {!collapsed && (
            <span className="sidebar__user-copy">
              <strong>{sesion?.nombre || 'Usuario'}</strong>
              <small>{ETIQUETA_ROL[rol] || rol}</small>
            </span>
          )}
        </NavLink>

        {!collapsed && (
          <button type="button" className="sidebar__logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        )}
      </div>
    </aside>
  )
}

export default DashboardSidebar