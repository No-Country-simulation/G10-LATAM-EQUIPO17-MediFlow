import { useCallback, useEffect, useState } from 'react'
import AgentProfileCard from '../components/AgentProfileCard'
import EditProfileDrawer from '../components/EditProfileDrawer'
import ProfileCard from '../components/ProfileCard'
import { getRol, getSession, updateSession } from '../../../app/session'
import {
  guardarPerfilGuardado,
  obtenerPerfil,
  obtenerPerfilGuardado,
} from '../services/profileService'
import './profile.css'

function perfilDesdeSesion() {
  const sesion = getSession() || {}

  return {
    id: null,
    nombre: sesion.nombre || 'Usuario',
    email: sesion.email || '',
    rol: getRol() || sesion.rol || null,
    activo: true,
    created_at: null,
    last_login: null,
  }
}

function aplicarCambiosGuardados(perfil) {
  const guardado = obtenerPerfilGuardado(perfil.id)
  if (!guardado) return perfil

  return {
    ...perfil,
    nombre: guardado.nombre || perfil.nombre,
    email: guardado.email || perfil.email,
  }
}

function ProfilePage() {
  const [perfil, setPerfil] = useState(perfilDesdeSesion)
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  useEffect(() => {
    let vigente = true

    obtenerPerfil()
      .then((datos) => {
        if (!vigente || !datos) return

        const perfilCombinado = aplicarCambiosGuardados(datos)
        setPerfil(perfilCombinado)

        const guardado = obtenerPerfilGuardado(datos.id)
        if (guardado) {
          updateSession({
            nombre: perfilCombinado.nombre,
            email: perfilCombinado.email,
          })
        }
      })
      .catch(() => {
        // La sesión local sigue mostrando los datos disponibles sin bloquear la vista.
      })

    return () => {
      vigente = false
    }
  }, [])

  const abrirDrawer = useCallback(() => setDrawerAbierto(true), [])
  const cerrarDrawer = useCallback(() => setDrawerAbierto(false), [])

  const guardarCambios = useCallback((cambios) => {
    const perfilActualizado = { ...perfil, ...cambios }

    guardarPerfilGuardado(perfil.id, cambios)
    updateSession({ nombre: cambios.nombre, email: cambios.email })
    setPerfil(perfilActualizado)
    setDrawerAbierto(false)
  }, [perfil])

  const cuentaActiva = perfil.activo !== false

  return (
    <div className="profile-page">
      <header className="profile-page__header">
        <div>
          <span className="profile-page__eyebrow">MI CUENTA</span>
          <h1>Mi perfil</h1>
          <p>Administra tu información personal y la seguridad de tu cuenta.</p>
        </div>

        <span className={`profile-page__status${cuentaActiva ? '' : ' is-inactive'}`}>
          <span className="profile-page__status-dot" aria-hidden="true" />
          {cuentaActiva ? 'Cuenta activa' : 'Cuenta inactiva'}
        </span>
      </header>

      <div className="profile-page__grid">
        <AgentProfileCard />
        <ProfileCard perfil={perfil} onEditar={abrirDrawer} />
      </div>

      {drawerAbierto ? (
        <EditProfileDrawer
          perfil={perfil}
          onCerrar={cerrarDrawer}
          onGuardar={guardarCambios}
        />
      ) : null}
    </div>
  )
}

export default ProfilePage
