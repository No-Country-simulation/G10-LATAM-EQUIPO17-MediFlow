function DocumentsFilters({ busqueda, onBusqueda }) {
  return (
    <div className="doc-filters">
      <label className="doc-filters__search">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="m10.2 10.2 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={busqueda}
          onChange={(event) => onBusqueda(event.target.value)}
          placeholder="Buscar por archivo o identificador"
          aria-label="Buscar por nombre de archivo o identificador"
        />
      </label>
    </div>
  )
}

export default DocumentsFilters
