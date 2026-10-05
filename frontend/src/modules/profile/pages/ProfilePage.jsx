import ProfileCard from '../components/ProfileCard'
import { getSession, getRol } from '../../../app/session'
import './profile.css'

function ProfilePage() {
  const sesion = getSession() || {}
  const usuario = {
    id: sesion.id || 'local-session',
    nombre: sesion.nombre || 'Usuario',
    email: sesion.email || '',
    rol: getRol(),
    activo: true,
    created_at: null,
    last_login: null,
  }

  return (
    <div className="profile-page">
      <header className="profile-page__intro">
        <span className="profile-page__kicker">Mi cuenta</span>
        <h1>Mi perfil</h1>
        <p>Tus datos de acceso en MediFlow.</p>
      </header>

      <ProfileCard usuario={usuario} />
    </div>
  )
}

export default ProfilePage