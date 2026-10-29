function formatearFecha(valor) {
  const fecha = new Date(valor)
  return valor && !Number.isNaN(fecha.getTime())
    ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(fecha)
    : 'Fecha no disponible'
}

function DocumentsTable({ documentos, onSeleccionar, seleccionadoId, nombreDeArchivo, esAdmin, onEliminar }) {
  if (documentos.length === 0) return null

  return (
    <div className="doc-table-wrap">
      <table className="doc-table">
        <thead>
          <tr>
            <th scope="col">Archivo</th>
            <th scope="col">Fecha</th>
            <th scope="col">Proceso</th>
            <th scope="col"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {documentos.map((documento) => (
            <tr key={documento.id}>
              <td>
                <strong className="doc-table__id">{nombreDeArchivo(documento)}</strong>
                <span className="doc-table__meta">Registro {documento.id}</span>
              </td>
              <td>{formatearFecha(documento.created_at)}</td>
              <td><span className="doc-badge doc-badge--procesado">Completado</span></td>
              <td className="doc-table__acciones">
                <div className="doc-table__action-group">
                  <button
                    type="button"
                    className="doc-table__btn"
                    onClick={() => onSeleccionar(documento)}
                    aria-pressed={seleccionadoId === documento.id}
                  >
                    Ver detalle
                  </button>
                  {esAdmin && onEliminar && (
                    <button
                      type="button"
                      className="doc-table__btn doc-table__btn--danger"
                      onClick={(event) => onEliminar(documento, event.currentTarget)}
                      aria-label={`Eliminar registro ${documento.id}`}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DocumentsTable
