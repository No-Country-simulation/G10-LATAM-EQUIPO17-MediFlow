function OciHealthCard({ estado, error, cargando, onReintentar }) {
  if (cargando) {
    return <div className="storage-card is-loading">Comprobando conexión con OCI…</div>
  }

  if (error) {
    return (
      <div className="storage-card is-error" role="alert">
        <h2>Storage no disponible</h2>
        <p>{error}</p>
        <button type="button" className="storage-card__btn" onClick={onReintentar}>
          Reintentar
        </button>
      </div>
    )
  }

  const conectado = estado?.oci_conectado === true
  const buckets = estado?.buckets || []

  return (
    <div className={conectado ? 'storage-card is-ok' : 'storage-card is-warn'}>
      <h2>Estado de OCI Object Storage</h2>
      <span className={conectado ? 'storage-card__status is-ok' : 'storage-card__status is-warn'}>
        <span className="storage-card__dot" aria-hidden="true" />
        {conectado ? 'Conectado' : 'Desconectado'}
      </span>
      {estado?.mensaje && <p className="storage-card__msg">{estado.mensaje}</p>}
      {buckets.length > 0 && (
        <ul className="storage-card__buckets">
          {buckets.map((bucket) => (
            <li key={bucket}>{bucket}</li>
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