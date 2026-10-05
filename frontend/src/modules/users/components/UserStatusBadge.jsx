function UserStatusBadge({ activo }) {
  return (
    <span className={activo ? 'status-badge is-active' : 'status-badge'}>
      <span className="status-badge__dot" aria-hidden="true" />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

export default UserStatusBadge