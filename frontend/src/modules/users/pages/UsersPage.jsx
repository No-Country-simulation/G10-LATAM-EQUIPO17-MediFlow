import { useEffect, useMemo, useState } from 'react'
import UsersFilters from '../components/UsersFilters'
import UsersTable from '../components/UsersTable'
import UsersPagination from '../components/UsersPagination'
import ChangeRoleModal from '../components/ChangeRoleModal'
import { cambiarRol, listarUsuarios } from '../services/usersService'
import './users.css'

const USERS_PER_PAGE = 8

const PAGINA_INICIAL = 1

function UsersPage() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [rolFiltro, setRolFiltro] = useState('todos')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [pagina, setPagina] = useState(PAGINA_INICIAL)
  const [usuarioEnModal, setUsuarioEnModal] = useState(null)

  useEffect(() => {
    let activo = true
    listarUsuarios()
      .then((datos) => {
        if (!activo) return
        setUsuarios(datos)
        setError('')
      })
      .catch((err) => {
        if (!activo) return
        setError(err.message || 'No se pudieron cargar los usuarios')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  const filteredUsers = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return usuarios.filter((usuario) => {
      const coincideTexto =
        !termino ||
        usuario.nombre.toLowerCase().includes(termino) ||
        usuario.email.toLowerCase().includes(termino)
      const coincideRol = rolFiltro === 'todos' || usuario.rol === rolFiltro
      const coincideEstado =
        estadoFiltro === 'todos' || (estadoFiltro === 'activo' ? usuario.activo : !usuario.activo)
      return coincideTexto && coincideRol && coincideEstado
    })
  }, [usuarios, busqueda, rolFiltro, estadoFiltro])

  const totalPaginas = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE))
  const paginaSegura = Math.min(pagina, totalPaginas)

  const visibleUsers = useMemo(
    () =>
      filteredUsers.slice(
        (paginaSegura - 1) * USERS_PER_PAGE,
        paginaSegura * USERS_PER_PAGE,
      ),
    [filteredUsers, paginaSegura],
  )

  const aplicarFiltro = (setter) => (valor) => {
    setter(valor)
    setPagina(PAGINA_INICIAL)
  }

  const handleCambiarRol = (usuarioId, rol) => {
    cambiarRol(usuarioId, rol)
      .then(() => {
        setUsuarios((previos) =>
          previos.map((usuario) => (usuario.id === usuarioId ? { ...usuario, rol } : usuario)),
        )
        setUsuarioEnModal(null)
      })
      .catch((err) => setError(err.message || 'No se pudo cambiar el rol'))
  }

  return (
    <div className="users-page">
      <header className="users-page__intro">
        <span className="users-page__kicker">Administración</span>
        <h1>Usuarios</h1>
        <p>Gestiona los roles y estados de acceso de los profesionales y pacientes.</p>
      </header>

      <UsersFilters
        busqueda={busqueda}
        rolFiltro={rolFiltro}
        estadoFiltro={estadoFiltro}
        onBusqueda={aplicarFiltro(setBusqueda)}
        onRol={aplicarFiltro(setRolFiltro)}
        onEstado={aplicarFiltro(setEstadoFiltro)}
      />

      <p className="users-page__count" role="status">
        Mostrando {visibleUsers.length} de {filteredUsers.length} usuarios
      </p>

      {cargando && <p className="users-page__state">Cargando usuarios…</p>}
      {!cargando && error && <p className="users-page__state is-error" role="alert">{error}</p>}
      {!cargando && !error && (
        <>
          <UsersTable usuarios={visibleUsers} onCambiarRol={setUsuarioEnModal} />
          <UsersPagination
            pagina={paginaSegura}
            totalPaginas={totalPaginas}
            onCambiarPagina={setPagina}
          />
        </>
      )}

      <ChangeRoleModal
        usuario={usuarioEnModal}
        onClose={() => setUsuarioEnModal(null)}
        onConfirmar={handleCambiarRol}
      />
    </div>
  )
}

export default UsersPage