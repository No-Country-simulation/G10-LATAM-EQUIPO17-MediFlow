import { Link } from 'react-router-dom'
import { AgentIcon, DocumentsIcon, StorageIcon, UsersIcon } from '../../../../app/icons'

function mostrarValor(valor, cargando) {
  if (cargando) return '—'
  if (valor === null || valor === undefined) return 'N/D'
  return valor
}

function DashboardStatCard({ to, icono: Icono, etiqueta, valor, detalle, tono, cargando }) {
  return (
    <Link
      className={`admin-stat admin-stat--${tono}`}
      to={to}
      aria-label={`${etiqueta}: ${mostrarValor(valor, cargando)}`}
      aria-busy={cargando}
    >
      <span className="admin-stat__icon" aria-hidden="true">
        <Icono />
      </span>
      <span className="admin-stat__label">{etiqueta}</span>
      <strong className="admin-stat__value">{mostrarValor(valor, cargando)}</strong>
      <small className="admin-stat__detail">{cargando ? 'Cargando información…' : detalle}</small>
      <span className="admin-stat__arrow" aria-hidden="true">→</span>
    </Link>
  )
}

function QuickStatsGrid({ metricas, cargando }) {
  const storageDetalle = metricas?.storageConectado === null || metricas?.storageConectado === undefined
    ? 'Sin verificar'
    : metricas.storageConectado
      ? `OCI · ${metricas.storageRegion || 'Object Storage'}`
      : 'Almacenamiento no disponible'

  return (
    <section className="admin-stats" aria-labelledby="stats-title">
      <header className="admin-section-heading">
        <div>
          <span className="admin-section-heading__eyebrow">Visión general</span>
          <h2 id="stats-title">Estadísticas generales</h2>
        </div>
        <p>Resumen de las cuentas y los documentos administrados por la plataforma.</p>
      </header>

      <div className="admin-stats__grid">
        <DashboardStatCard
          to="/users"
          icono={UsersIcon}
          etiqueta="Usuarios totales"
          valor={metricas?.usuariosTotal}
          detalle={metricas?.usuariosActivos === null || metricas?.usuariosActivos === undefined
            ? 'Sin información'
            : `${metricas.usuariosActivos} activos`}
          tono="blue"
          cargando={cargando}
        />
        <DashboardStatCard
          to="/users"
          icono={UsersIcon}
          etiqueta="Profesionales de salud"
          valor={metricas?.medicos}
          detalle="Rol médico"
          tono="teal"
          cargando={cargando}
        />
        <DashboardStatCard
          to="/users"
          icono={UsersIcon}
          etiqueta="Pacientes"
          valor={metricas?.pacientes}
          detalle="Rol paciente"
          tono="green"
          cargando={cargando}
        />
        <DashboardStatCard
          to="/documents"
          icono={DocumentsIcon}
          etiqueta="Registros de triaje"
          valor={metricas?.documentosTotal}
          detalle={metricas?.documentosHoy === null || metricas?.documentosHoy === undefined
            ? 'Registros de triaje'
            : `${metricas.documentosHoy} procesados hoy`}
          tono="violet"
          cargando={cargando}
        />
        <DashboardStatCard
          to="/reviews"
          icono={AgentIcon}
          etiqueta="Registros asignados"
          valor={metricas?.triaje?.asignados ?? null}
          detalle={
            metricas?.triaje
              ? 'Histórico: incluye eliminados'
              : 'Sin información'
          }
          tono="teal"
          cargando={cargando}
        />
        <DashboardStatCard
          to="/storage"
          icono={AgentIcon}
          etiqueta="Objetos en bucket de auditoría"
          valor={metricas?.enRevision ?? null}
          detalle={metricas?.enRevisionTruncado ? 'Al menos 500 objetos listados' : 'Objetos almacenados en OCI'}
          tono="amber"
          cargando={cargando}
        />
        <DashboardStatCard
          to="/storage"
          icono={StorageIcon}
          etiqueta="Estado del almacenamiento"
          valor={
            metricas?.storageConectado === null || metricas?.storageConectado === undefined
              ? null
              : metricas.storageConectado
                ? 'Conectado'
                : 'Revisar'
          }
          detalle={storageDetalle}
          tono="amber"
          cargando={cargando}
        />
      </div>
    </section>
  )
}

export default QuickStatsGrid
