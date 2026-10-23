function OciHealthCard({ estado, error, cargando, ultimaComprobacion, onReintentar }) {
  const fechaComprobacion = ultimaComprobacion?.toLocaleString('es-CO', {
    dateStyle: 'medium', timeStyle: 'short',
  })

  if (cargando) {
    return <div className="storage-card is-loading">Comprobando conexión con OCI…</div>
  }

  if (error) {
    return (
      <div className="storage-card is-error" role="alert">
        <h2>Storage no disponible</h2>
        <p>{error}</p>
        {fechaComprobacion && <p className="storage-card__checked">Última comprobación: {fechaComprobacion} (hora local)</p>}
        <button type="button" className="storage-card__btn" onClick={onReintentar}>
          Reintentar
        </button>
      </div>
    )
  }

  const conectado = estado?.oci_conectado === true
  const buckets = estado?.buckets && typeof estado.buckets === 'object'
    ? Object.entries(estado.buckets)
    : []

  return (
    <div className={conectado ? 'storage-card is-ok' : 'storage-card is-warn'}>
      <h2>Estado de OCI Object Storage</h2>
      <span className={conectado ? 'storage-card__status is-ok' : 'storage-card__status is-warn'}>
        <span className="storage-card__dot" aria-hidden="true" />
        {conectado ? 'Conectado' : 'Desconectado'}
      </span>
      {fechaComprobacion && <p className="storage-card__checked">Última comprobación: {fechaComprobacion} (hora local)</p>}
      {estado?.mensaje && <p className="storage-card__msg">{estado.mensaje}</p>}
      {buckets.length > 0 && (
        <ul className="storage-card__buckets">
          {buckets.map(([bucket, status]) => (
            <li key={bucket}><span>{bucket}</span><strong>{status === 'ok' ? 'Operativo' : 'No disponible'}</strong></li>
          ))}
        </ul>
      )}
      {!conectado && (
        <button type="button" className="storage-card__btn" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export default OciHealthCard
