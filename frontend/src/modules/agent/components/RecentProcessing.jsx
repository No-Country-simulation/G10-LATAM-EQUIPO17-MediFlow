import AgentFileIcon from './AgentFileIcon'
import {
  documentoIdDesdeRuta,
  estadoDesdeBucket,
  formatearFecha,
  nombreDesdeRuta,
  tipoDesdeRuta,
} from '../utils/agentFiles'

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((item) => (
        <li key={item} className="agent-skeleton-row" aria-hidden="true">
          <span className="agent-skeleton agent-skeleton--icon" />
          <span className="agent-skeleton-row__copy">
            <span className="agent-skeleton agent-skeleton--title" />
            <span className="agent-skeleton agent-skeleton--meta" />
          </span>
          <span className="agent-skeleton agent-skeleton--badge" />
        </li>
      ))}
    </>
  )
}

function RecentProcessing({
  registros,
  cargando,
  error,
  onReintentar,
  resultados,
  onVerResultado,
}) {
  const visibles = registros.slice(0, 5)
  const resumenRegistros =
    registros.length > 5
      ? `Últimos 5 de ${registros.length}`
      : `${registros.length} ${registros.length === 1 ? 'registro' : 'registros'}`

  return (
    <section className="agent-card agent-recent" aria-labelledby="agent-recent-title" aria-busy={cargando}>
      <div className="agent-card__heading agent-recent__heading">
        <div>
          <span className="agent-eyebrow">Historial</span>
          <h2 id="agent-recent-title">Procesamientos recientes</h2>
          <p>Historial de documentos analizados por el agente.</p>
        </div>
        <span className="agent-recent__count">
          {cargando && registros.length > 0 ? 'Actualizando…' : resumenRegistros}
        </span>
      </div>

      {error && registros.length > 0 && (
        <p className="agent-inline-warning" role="status">
          No se pudo actualizar el historial. Se muestran los últimos datos disponibles.
        </p>
      )}

      {error && registros.length === 0 && !cargando && (
        <div className="agent-state-box" role="alert">
          <span className="agent-state-box__icon" aria-hidden="true">!</span>
          <h3>No se pudo cargar el historial</h3>
          <p>{error}</p>
          {onReintentar && (
            <button type="button" className="agent-button agent-button--secondary" onClick={onReintentar}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {!error && cargando && registros.length === 0 && (
        <ul className="agent-recent__list">
          <SkeletonRows />
        </ul>
      )}

      {!error && !cargando && registros.length === 0 && (
        <div className="agent-state-box">
          <span className="agent-state-box__icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="4" y="2.5" width="14" height="17" rx="3" stroke="currentColor" strokeWidth="1.6" />
              <path d="M7.5 7h7M7.5 10.7h7M7.5 14.4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <h3>Aún no hay procesamientos</h3>
          <p>Selecciona tu primer documento para comenzar el análisis clínico.</p>
        </div>
      )}

      {visibles.length > 0 && (
        <ul className="agent-recent__list" aria-live="polite">
          {visibles.map((registro) => {
            const documentoId = documentoIdDesdeRuta(registro.ruta_triaje)
            const resultado = resultados[documentoId]
            const nombreRuta = nombreDesdeRuta(registro.ruta_documento)
            const nombre =
              nombreRuta && nombreRuta !== 'No disponible'
                ? nombreRuta
                : documentoId || 'Documento clínico'
            const tipoArchivo = tipoDesdeRuta(registro.ruta_documento)
            const estado = resultado
              ? resultado.decision_enrutamiento?.requiere_auditoria_humana
                ? 'En revisión'
                : 'Completado'
              : estadoDesdeBucket(registro.bucket)
            const tono = estado === 'En revisión' ? 'warning' : estado === 'Recibido' ? 'neutral' : 'ok'

            return (
              <li key={registro.id} className="agent-recent-row">
                <AgentFileIcon nombre={nombre} />

                <div className="agent-recent-row__copy">
                  <strong title={nombre}>{nombre}</strong>
                  <span className="agent-recent-row__meta">
                    <span>{tipoArchivo}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatearFecha(registro.created_at)}</span>
                  </span>
                  {resultado?.clasificacion?.tipo_documento && (
                    <span className="agent-recent-row__clinical">
                      {resultado.clasificacion.tipo_documento}
                    </span>
                  )}
                </div>

                <span className={`agent-recent-row__status agent-recent-row__status--${tono}`}>
                  {estado}
                </span>

                {resultado && (
                  <button
                    type="button"
                    className="agent-recent-row__action"
                    onClick={() => onVerResultado(resultado)}
                  >
                    Ver resultado
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default RecentProcessing
