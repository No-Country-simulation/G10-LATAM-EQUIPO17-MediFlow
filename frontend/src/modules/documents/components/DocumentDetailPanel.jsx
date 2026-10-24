function DocumentDetailPanel({ documento, nombreDeArchivo, metadata, cargando, error, onClose }) {
  if (!documento) return null

  const fechaValor = new Date(documento.created_at)
  const fecha = documento.created_at && !Number.isNaN(fechaValor.getTime())
    ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeStyle: 'short' }).format(fechaValor)
    : 'Fecha no disponible'

  return (
    <aside className="doc-detail" aria-label={`Detalle de ${nombreDeArchivo(documento)}`}>
      <div className="doc-detail__head">
        <h2>{nombreDeArchivo(documento)}</h2>
        <button type="button" className="doc-detail__close" onClick={onClose} aria-label="Cerrar detalle">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <span className="doc-badge doc-badge--procesado">Completado</span>

      <dl className="doc-detail__list">
        <div><dt>Fecha de finalización</dt><dd>{fecha}</dd></div>
        <div><dt>Identificador de registro</dt><dd>{documento.id}</dd></div>
      </dl>

      {cargando && <p className="doc-detail__notice" role="status">Cargando metadata del resultado…</p>}
      {error && <p className="doc-detail__notice is-error" role="alert">{error}</p>}
      {metadata && !cargando && (
        <>
          <h3 className="doc-detail__subtitle">Datos disponibles del resultado</h3>
          <dl className="doc-detail__list">
            <div><dt>ID del documento</dt><dd>{metadata.documento_id || '—'}</dd></div>
            <div><dt>Tipo de documento</dt><dd>{metadata.tipo_documento || '—'}</dd></div>
            <div><dt>Nivel de prioridad</dt><dd>{metadata.nivel_prioridad || '—'}</dd></div>
            <div><dt>Confianza</dt><dd>{metadata.score_confianza != null ? metadata.score_confianza : '—'}</dd></div>
            <div><dt>Destino</dt><dd>{metadata.destino_enrutamiento || '—'}</dd></div>
          </dl>
          <p className="doc-detail__notice">Esta es la metadata almacenada en OCI, no el resultado clínico completo ni el archivo original.</p>
        </>
      )}
    </aside>
  )
}

export default DocumentDetailPanel
