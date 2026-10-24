import Modal from '../../../shared/ui/Modal'
import informacionMetadataPng from '../../../shared/assets/Informacion_Metadata.png'

function DocumentDetailPanel({ documento, nombreDeArchivo, metadata, cargando, error, onClose }) {
  if (!documento) return null

  const fechaValor = new Date(documento.created_at)
  const fecha = documento.created_at && !Number.isNaN(fechaValor.getTime())
    ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeStyle: 'short' }).format(fechaValor)
    : 'Fecha no disponible'

  return (
    <Modal
      open
      onClose={onClose}
      ariaLabel={`Detalle de ${nombreDeArchivo(documento)}`}
      className="doc-detail-modal"
      headerClassName="doc-detail-modal__header"
      bodyClassName="doc-detail-modal__body"
      headerContent={(
        <>
          <img
            className="doc-detail-modal__image"
            src={informacionMetadataPng}
            alt=""
            aria-hidden="true"
          />
          <div className="doc-detail-modal__heading">
            <h2 className="doc-detail-modal__title">Información del proceso</h2>
            <p className="doc-detail-modal__file" title={nombreDeArchivo(documento)}>
              {nombreDeArchivo(documento)}
            </p>
          </div>
        </>
      )}
    >
      <div className="doc-detail">
        <span className="doc-badge doc-badge--procesado">Completado</span>

        <dl className="doc-detail__list">
          <div className="doc-detail__row">
            <dt>Fecha de finalización</dt>
            <dd>{fecha}</dd>
          </div>
          <div className="doc-detail__row">
            <dt>Identificador de registro</dt>
            <dd>{documento.id}</dd>
          </div>
        </dl>

        {cargando && <p className="doc-detail__notice" role="status">Cargando metadata del resultado…</p>}
        {error && <p className="doc-detail__notice is-error" role="alert">{error}</p>}
        {metadata && !cargando && (
          <>
            <h3 className="doc-detail__subtitle">Datos disponibles del resultado</h3>
            <dl className="doc-detail__list">
              <div className="doc-detail__row">
                <dt>ID del documento</dt>
                <dd>{metadata.documento_id || '—'}</dd>
              </div>
              <div className="doc-detail__row">
                <dt>Tipo de documento</dt>
                <dd>{metadata.tipo_documento || '—'}</dd>
              </div>
              <div className="doc-detail__row">
                <dt>Nivel de prioridad</dt>
                <dd>{metadata.nivel_prioridad || '—'}</dd>
              </div>
              <div className="doc-detail__row">
                <dt>Confianza</dt>
                <dd>{metadata.score_confianza != null ? metadata.score_confianza : '—'}</dd>
              </div>
              <div className="doc-detail__row">
                <dt>Destino</dt>
                <dd>{metadata.destino_enrutamiento || '—'}</dd>
              </div>
            </dl>
            <p className="doc-detail__notice">
              Esta es la metadata almacenada en OCI, no el resultado clínico completo ni el archivo original.
            </p>
          </>
        )}
      </div>
    </Modal>
  )
}

export default DocumentDetailPanel
