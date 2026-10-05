import Select from '../../../shared/ui/Select'
import { ESTADO_OPCIONES } from '../types/estados'

function DocumentsFilters({ estadoFiltro, busqueda, onEstado, onBusqueda }) {
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
          placeholder="Buscar documento"
          aria-label="Buscar por identificador de documento"
        />
      </label>

      <Select
        id="filtro-estado-doc"
        name="filtro-estado-doc"
        value={estadoFiltro}
        onChange={(event) => onEstado(event.target.value)}
        options={ESTADO_OPCIONES}
        ariaLabel="Filtrar documentos por estado"
      />
    </div>
  )
}

export default DocumentsFilters