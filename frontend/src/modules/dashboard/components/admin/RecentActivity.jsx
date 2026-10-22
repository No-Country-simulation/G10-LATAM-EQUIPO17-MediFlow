function formatFecha(fecha) {
  if (!fecha) return '—'
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return '—'
  return valor.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

function EstadoActividad({ estado }) {
  const esRevision = estado === 'En revisión'
  return (
    <span className={`admin-activity__state ${esRevision ? 'is-review' : 'is-ok'}`}>
      <span className="admin-activity__state-dot" aria-hidden="true" />
      {estado}
    </span>
  )
}

function RecentActivity({ actividades, cargando, fallo }) {
  const items = actividades || []

  return (
    <section className="admin-activity" aria-labelledby="activity-title">
      <header className="admin-section-heading admin-section-heading--compact">
        <div>
          <span className="admin-section-heading__eyebrow">Actividad</span>
          <h2 id="activity-title">Actividad reciente</h2>
          <p>Últimos movimientos de la plataforma</p>
        </div>
      </header>

      {cargando && (
        <div className="admin-activity__skeleton" aria-busy="true" aria-label="Cargando actividad reciente">
          {[0, 1, 2, 3].map((item) => (
            <span key={item} className="admin-skeleton admin-activity__skeleton-row" />
          ))}
        </div>
      )}

      {!cargando && fallo && (
        <div className="admin-activity__empty" role="alert">
          <strong>No se pudo cargar la actividad reciente</strong>
          <p>
            Los registros de triaje no están disponibles en este momento. Usa “Actualizar
            estado” para volver a intentarlo.
          </p>
        </div>
      )}

      {!cargando && !fallo && items.length === 0 && (
        <div className="admin-activity__empty" role="status">
          <strong>Todavía no hay actividad registrada</strong>
          <p>
            Cuando el agente procese documentos clínicos, los últimos movimientos aparecerán
            en esta sección.
          </p>
        </div>
      )}

      {!cargando && !fallo && items.length > 0 && (
        <div className="admin-activity__table-wrapper">
          <table className="admin-activity__table">
            <caption className="admin-visually-hidden">
              Últimos registros de triaje procesados por el agente
            </caption>
            <thead>
              <tr>
                <th scope="col">Usuario</th>
                <th scope="col">Acción</th>
                <th scope="col">Módulo</th>
                <th scope="col">Fecha y hora</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((actividad) => (
                <tr key={actividad.id} className="admin-activity__row">
                  <td data-label="Usuario">
                    <span className="admin-activity__user">
                      <span className="admin-activity__avatar" aria-hidden="true">
                        {actividad.iniciales}
                      </span>
                      <span className="admin-activity__user-name" title={actividad.usuario}>
                        {actividad.usuario}
                      </span>
                    </span>
                  </td>
                  <td data-label="Acción">{actividad.accion}</td>
                  <td data-label="Módulo">{actividad.modulo}</td>
                  <td data-label="Fecha y hora" className="admin-activity__date">
                    {formatFecha(actividad.fecha)}
                  </td>
                  <td data-label="Estado">
                    <EstadoActividad estado={actividad.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!fallo && (
        <footer className="admin-activity__foot">
          <span>
            Basado en los últimos registros de triaje. El estado se deriva del destino del
            procesamiento y se muestran hasta 6 movimientos.
          </span>
        </footer>
      )}
    </section>
  )
}

export default RecentActivity
