import DocumentStateBadge from './DocumentStateBadge'

function DocumentsTable({ documentos, onSeleccionar, seleccionadoId }) {
  if (documentos.length === 0) return null

  return (
    <div className="doc-table-wrap">
      <table className="doc-table">
        <thead>
          <tr>
            <th scope="col">Documento</th>
            <th scope="col">Tipo</th>
            <th scope="col">Prioridad</th>
            <th scope="col">Estado</th>
            <th scope="col"><span className="sr-only">Detalle</span></th>
          </tr>
        </thead>
        <tbody>
          {documentos.map((documento) => (
            <tr key={documento.documento_id}>
              <td>
                <strong className="doc-table__id">{documento.documento_id}</strong>
                <span className="doc-table__meta">{documento.fecha_recepcion || '—'}</span>
              </td>
              <td>{documento.tipo_documento || '—'}</td>
              <td>
                <span className="doc-table__prioridad">{documento.nivel_prioridad || '—'}</span>
              </td>
              <td><DocumentStateBadge estado={documento.estado} /></td>
              <td className="doc-table__acciones">
                <button
                  type="button"
                  className="doc-table__btn"
                  onClick={() => onSeleccionar(documento)}
                  aria-pressed={seleccionadoId === documento.documento_id}
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DocumentsTable