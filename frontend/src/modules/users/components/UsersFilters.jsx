import Select from '../../../shared/ui/Select'
import { ESTADO_OPCIONES, ROL_OPCIONES } from '../types/roles'

function UsersFilters({ busqueda, rolFiltro, estadoFiltro, onBusqueda, onRol, onEstado }) {
  return (
    <div className="users-filters">
      <label className="users-filters__search">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="m10.2 10.2 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={busqueda}
          onChange={(event) => onBusqueda(event.target.value)}
          placeholder="Buscar por nombre o correo"
          aria-label="Buscar usuarios por nombre o correo"
        />
      </label>

      <Select
        id="filtro-rol"
        name="filtro-rol"
        value={rolFiltro}
        onChange={(event) => onRol(event.target.value)}
        options={ROL_OPCIONES}
        ariaLabel="Filtrar por rol"
      />
      <Select
        id="filtro-estado"
        name="filtro-estado"
        value={estadoFiltro}
        onChange={(event) => onEstado(event.target.value)}
        options={ESTADO_OPCIONES}
        ariaLabel="Filtrar por estado"
      />
    </div>
  )
}

export default UsersFilters