import UserRoleBadge from './UserRoleBadge'
import UserStatusBadge from './UserStatusBadge'

function UsersTable({ usuarios, onCambiarRol }) {
  if (usuarios.length === 0) {
    return (
      <p className="users-table__empty" role="status">
        No se encontraron usuarios con los filtros aplicados.
      </p>
    )
  }

  return (
    <div className="users-table-wrap">
      <table className="users-table">
        <thead>
          <tr>
            <th scope="col">Usuarios</th>
            <th scope="col">Rol</th>
            <th scope="col">Estado</th>
            <th scope="col"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id}>
              <td>
                <strong className="users-table__nombre">{usuario.nombre}</strong>
                <span className="users-table__email">{usuario.email}</span>
              </td>
              <td><UserRoleBadge rol={usuario.rol} /></td>
              <td><UserStatusBadge activo={usuario.activo} /></td>
              <td className="users-table__acciones">
                <button type="button" className="users-table__btn" onClick={() => onCambiarRol(usuario)}>
                  Cambiar rol
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default UsersTable