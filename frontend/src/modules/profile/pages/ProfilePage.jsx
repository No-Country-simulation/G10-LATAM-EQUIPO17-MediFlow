import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AgentProfileCard from '../components/AgentProfileCard'
import EditProfileDrawer from '../components/EditProfileDrawer'
import ProfileCard from '../components/ProfileCard'
import { getRol, getSession, ROLES, updateSession } from '../../../app/session'
import {
  guardarPerfilGuardado,
  invalidarPerfil,
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
    invalidarPerfil()
    setPerfil(perfilActualizado)
    setDrawerAbierto(false)
  }, [perfil])

  const cuentaActiva = perfil.activo !== false
  const descripcion = {
    [ROLES.ADMIN]: 'Consulta tu cuenta y accede a la gestión del sistema.',
    [ROLES.MEDICO]: 'Consulta tu cuenta y tus herramientas de trabajo clínico.',
    [ROLES.PACIENTE]: 'Consulta la información y el estado de tu cuenta.',
  }[perfil.rol] || 'Consulta la información de tu cuenta.'

  return (
    <div className="profile-page">
      <header className="profile-page__header">
        <div>
          <span className="profile-page__eyebrow">MI CUENTA</span>
          <h1>Mi perfil</h1>
          <p>{descripcion}</p>
        </div>

        <span className={`profile-page__status${cuentaActiva ? '' : ' is-inactive'}`}>
          <span className="profile-page__status-dot" aria-hidden="true" />
          {cuentaActiva ? 'Cuenta activa' : 'Cuenta inactiva'}
        </span>
      </header>

      <div className="profile-page__grid">
        {perfil.rol === ROLES.MEDICO ? <AgentProfileCard /> : (
          <section className="profile-context" aria-labelledby="profile-context-title">
            <span className="profile-page__eyebrow">TU ESPACIO</span>
            <h2 id="profile-context-title">
              {perfil.rol === ROLES.ADMIN ? 'Administración' : 'Cuenta personal'}
            </h2>
            <p>
              {perfil.rol === ROLES.ADMIN
                ? 'Accede a las áreas de administración disponibles para tu cuenta.'
                : 'Consulta tu espacio personal y revisa la información asociada a tu acceso.'}
            </p>
            <nav aria-label="Accesos desde mi perfil" className="profile-context__links">
              {perfil.rol === ROLES.ADMIN ? (
                <>
                  <Link to="/users">Usuarios y permisos <span aria-hidden="true">→</span></Link>
                  <Link to="/storage">Almacenamiento OCI <span aria-hidden="true">→</span></Link>
                </>
              ) : (
                <Link to="/dashboard">Ir a mi espacio <span aria-hidden="true">→</span></Link>
              )}
            </nav>
          </section>
        )}
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
