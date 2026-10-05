import DocumentStateBadge from './DocumentStateBadge'

function DocumentDetailPanel({ documento, onClose }) {
  if (!documento) return null

  const fecha = documento.fecha_recepcion || '—'
  const metadata = documento.metadata || documento

  return (
    <aside className="doc-detail" aria-label={`Detalle de ${documento.documento_id}`}>
      <div className="doc-detail__head">
        <h2>{documento.documento_id || 'Documento'}</h2>
        <button type="button" className="doc-detail__close" onClick={onClose} aria-label="Cerrar detalle">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <DocumentStateBadge estado={metadata.estado || documento.estado} />

      <dl className="doc-detail__list">
        <div><dt>Fecha de recepción</dt><dd>{fecha}</dd></div>
        <div><dt>Tipo de documento</dt><dd>{metadata.tipo_documento || '—'}</dd></div>
        <div><dt>Nivel de prioridad</dt><dd>{metadata.nivel_prioridad || '—'}</dd></div>
        <div><dt>Confianza</dt><dd>{metadata.score_confianza != null ? metadata.score_confianza : '—'}</dd></div>
        <div><dt>Destino</dt><dd>{metadata.destino_enrutamiento || '—'}</dd></div>
      </dl>
    </aside>
  )
}

export default DocumentDetailPanel