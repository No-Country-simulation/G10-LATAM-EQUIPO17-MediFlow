function UsersPagination({ pagina, totalPaginas, onCambiarPagina }) {
  if (totalPaginas <= 1) return null

  return (
    <nav className="users-pagination" aria-label="Paginación de usuarios">
      <button
        type="button"
        className="users-pagination__btn"
        onClick={() => onCambiarPagina(pagina - 1)}
        disabled={pagina <= 1}
      >
        Anterior
      </button>
      <span className="users-pagination__info">
        Página <strong>{pagina}</strong> de {totalPaginas}
      </span>
      <button
        type="button"
        className="users-pagination__btn"
        onClick={() => onCambiarPagina(pagina + 1)}
        disabled={pagina >= totalPaginas}
      >
        Siguiente
      </button>
    </nav>
  )
}

export default UsersPagination