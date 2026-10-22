import Avatar from '../../../shared/ui/Avatar'
import { ETIQUETA_ROL } from '../../../app/session'
import {
  ClockIcon,
  LockIcon,
  MailIcon,
  PencilIcon,
  ShieldCheckIcon,
  UserIcon,
} from './ProfileIcons'

function formatearUltimoAcceso(valor) {
  if (!valor) return 'No disponible'

  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return 'No disponible'

  const ahora = new Date()
  const esHoy =
    fecha.getFullYear() === ahora.getFullYear() &&
    fecha.getMonth() === ahora.getMonth() &&
    fecha.getDate() === ahora.getDate()

  if (esHoy) {
    const hora = new Intl.DateTimeFormat('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(fecha)

    return `Hoy, ${hora} hrs.`
  }

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(fecha)
}

function DataItem({ icon, label, value, sub }) {
  return (
    <div className="profile-data__item">
      <span className="profile-data__icon" aria-hidden="true">{icon}</span>
      <div className="profile-data__copy">
        <span className="profile-data__label">{label}</span>
        <strong className="profile-data__value">{value || 'No disponible'}</strong>
        {sub ? <span className="profile-data__sub">{sub}</span> : null}
      </div>
    </div>
  )
}

function ProfileCard({ perfil, onEditar }) {
  const { nombre, email, rol } = perfil
  const etiquetaRol = ETIQUETA_ROL[rol] || rol || 'Usuario'

  return (
    <article className="profile-user">
      <header className="profile-user__head">
        <div className="profile-user__identity">
          <Avatar nombre={nombre} rol={rol} size={56} className="profile-user__avatar" />
          <div className="profile-user__name-block">
            <span className="profile-user__role">{etiquetaRol.toUpperCase()}</span>
            <h2>{nombre || 'Usuario'}</h2>
            <p>Información de tu cuenta MediFlow</p>
          </div>
        </div>

        <button type="button" className="profile-user__edit" onClick={onEditar}>
          <PencilIcon />
          Editar mi perfil
        </button>
      </header>

      <div className="profile-data">
        <DataItem
          icon={<MailIcon />}
          label="CORREO ELECTRÓNICO"
          value={email}
        />
        <DataItem
          icon={<LockIcon />}
          label="CONTRASEÑA"
          value="••••••••••••"
          sub="Contraseña"
        />
        <DataItem
          icon={<UserIcon />}
          label="ROL DE USUARIO"
          value={etiquetaRol}
        />
        <DataItem
          icon={<ClockIcon />}
          label="ÚLTIMO ACCESO"
          value={formatearUltimoAcceso(perfil.last_login)}
        />
      </div>

      <div className="profile-security">
        <span className="profile-security__icon" aria-hidden="true">
          <ShieldCheckIcon />
        </span>
        <div>
          <strong>Tu información está protegida</strong>
          <p>Usamos estándares de seguridad para mantener tus datos seguros.</p>
        </div>
      </div>
    </article>
  )
}

export default ProfileCard
