import { useEffect, useState } from 'react'
import { consultarAuditoria } from '../../services/dashboardService'

function formatFecha(fecha) {
  if (!fecha) return '—'
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return '—'
  return valor.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

function statusTono(status) {
  if (!status) return ''
  if (status >= 500) return 'is-error'
  if (status >= 400) return 'is-warn'
  return 'is-ok'
}

function AuditLog() {
  const [registros, setRegistros] = useState([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [pagina, setPagina] = useState(0)
  const limite = 10

  useEffect(() => {
    let activo = true
    setCargando(true)

    consultarAuditoria({ offset: pagina * limite, limit: limite, force: pagina > 0 })
      .then((datos) => {
        if (!activo) return
        setRegistros(datos.items || [])
        setTotal(datos.total || 0)
        setError(false)
      })
      .catch(() => {
        if (!activo) return
        setError(true)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => { activo = false }
  }, [pagina])

  const totalPaginas = Math.max(1, Math.ceil(total / limite))

  return (
    <section className="admin-activity admin-audit" aria-labelledby="audit-title">
      <header className="admin-section-heading admin-section-heading--compact">
        <div>
          <span className="admin-section-heading__eyebrow">Seguridad</span>
          <h2 id="audit-title">Log de auditoría</h2>
          <p>Registro de solicitudes HTTP procesadas por la plataforma</p>
        </div>
      </header>

      {cargando && (
        <div className="admin-activity__skeleton" aria-busy="true" aria-label="Cargando auditoría">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="admin-skeleton admin-activity__skeleton-row" />
          ))}
        </div>
      )}

      {!cargando && error && (
        <div className="admin-activity__empty" role="alert">
          <strong>No se pudo cargar el log de auditoría</strong>
          <p>El endpoint de auditoría no está disponible. Verifica que el servicio esté activo.</p>
        </div>
      )}

      {!cargando && !error && registros.length === 0 && (
        <div className="admin-activity__empty" role="status">
          <strong>Sin registros de auditoría</strong>
          <p>Cuando se realicen solicitudes al sistema, los registros aparecerán aquí.</p>
        </div>
      )}

      {!cargando && !error && registros.length > 0 && (
        <div className="admin-activity__table-wrapper">
          <table className="admin-activity__table">
            <caption className="admin-visually-hidden">Registros de auditoría del sistema</caption>
            <thead>
              <tr>
                <th scope="col">Método</th>
                <th scope="col">Ruta</th>
                <th scope="col">Status</th>
                <th scope="col">Usuario</th>
                <th scope="col">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((reg) => (
                <tr key={reg.id} className="admin-activity__row">
                  <td data-label="Método">
                    <span className="admin-audit__method">{reg.metodo}</span>
                  </td>
                  <td data-label="Ruta">
                    <span className="admin-audit__ruta" title={reg.ruta}>{reg.ruta}</span>
                  </td>
                  <td data-label="Status">
                    <span className={`admin-activity__state ${statusTono(reg.status_code)}`}>
                      <span className="admin-activity__state-dot" aria-hidden="true" />
                      {reg.status_code}
                    </span>
                  </td>
                  <td data-label="Usuario">
                    <span className="admin-audit__uid">{reg.usuario_id || '—'}</span>
                  </td>
                  <td data-label="Fecha" className="admin-activity__date">
                    {formatFecha(reg.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && total > limite && (
        <footer className="admin-audit__pagination">
          <button
            type="button"
            className="admin-audit__page-btn"
            disabled={pagina === 0}
            onClick={() => setPagina((p) => p - 1)}
          >
            ← Anterior
          </button>
          <span className="admin-audit__page-info">
            Página {pagina + 1} de {totalPaginas} · {total} registros
          </span>
          <button
            type="button"
            className="admin-audit__page-btn"
            disabled={pagina + 1 >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Siguiente →
          </button>
        </footer>
      )}
    </section>
  )
}

export default AuditLog
