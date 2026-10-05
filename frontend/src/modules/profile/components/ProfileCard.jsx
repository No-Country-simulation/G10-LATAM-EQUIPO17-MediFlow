import Avatar from '../../../shared/ui/Avatar'
import { ETIQUETA_ROL } from '../../../app/session'

function ProfileCard({ usuario }) {
  const { nombre, email, rol } = usuario
  const etiqueta = ETIQUETA_ROL[rol] || rol

  return (
    <article className="profile-card">
      <div className="profile-card__head">
        <Avatar nombre={nombre} rol={rol} size={56} />
        <div className="profile-card__id">
          <h2>{nombre}</h2>
          <span className="profile-card__rol">{etiqueta}</span>
        </div>
      </div>

      <dl className="profile-card__list">
        <div><dt>Correo electrónico</dt><dd>{email}</dd></div>
        <div><dt>Rol</dt><dd>{etiqueta}</dd></div>
        <div><dt>Identificador</dt><dd>{usuario.id || '—'}</dd></div>
        <div><dt>Cuenta</dt><dd>{usuario.activo === false ? 'Inactiva' : 'Activa'}</dd></div>
        <div><dt>Registro</dt><dd>{usuario.created_at ? new Date(usuario.created_at).toLocaleDateString() : '—'}</dd></div>
      </dl>

      <p className="profile-card__note">
        Los datos provienen de la sesión local. Cuando la sesión esté conectada al backend,
        el perfil se cargará desde <code>GET /auth/me</code>.
      </p>
    </article>
  )
}

export default ProfileCard