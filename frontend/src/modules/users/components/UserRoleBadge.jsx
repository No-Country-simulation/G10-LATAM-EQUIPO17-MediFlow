import { ETIQUETA_ROL } from '../../../app/session'

function UserRoleBadge({ rol }) {
  return <span className={`role-badge role-badge--${rol}`}>{ETIQUETA_ROL[rol] || rol}</span>
}

export default UserRoleBadge