import { useEffect, useState } from 'react'
import DocumentsFilters from '../components/DocumentsFilters'
import DocumentsTable from '../components/DocumentsTable'
import DocumentDetailPanel from '../components/DocumentDetailPanel'
import { listarDocumentos } from '../services/documentsService'
import './documents.css'

function DocumentsPage() {
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [documentos, setDocumentos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)

  useEffect(() => {
    if (estadoFiltro === 'todos') return undefined

    let activo = true
    listarDocumentos({ estado: estadoFiltro })
      .then((datos) => {
        if (!activo) return
        setDocumentos(datos?.objects || datos || [])
        setError('')
        setSeleccionado(null)
      })
      .catch((err) => {
        if (!activo) return
        const mensaje = err.status === 401
          ? 'Necesitas una sesión válida (médico o admin) para consultar documentos.'
          : err.message || 'No se pudieron cargar los documentos.'
        setError(mensaje)
        setDocumentos([])
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [estadoFiltro])

  const handleEstado = (valor) => {
    setCargando(true)
    setEstadoFiltro(valor)
  }

  const visibles = documentos.filter((documento) => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return true
    return (
      String(documento.documento_id || '').toLowerCase().includes(texto) ||
      String(documento.tipo_documento || '').toLowerCase().includes(texto)
    )
  })

  return (
    <div className="doc-page">
      <header className="doc-page__intro">
        <span className="doc-page__kicker">Repositorio clínico</span>
        <h1>Documentos</h1>
        <p>
          Explora los documentos recibidos, procesados y en auditoría humana almacenados en OCI.
        </p>
      </header>

      <DocumentsFilters
        estadoFiltro={estadoFiltro}
        busqueda={busqueda}
        onEstado={handleEstado}
        onBusqueda={setBusqueda}
      />

      <p className="doc-page__count" role="status">
        {estadoFiltro === 'todos'
          ? 'Selecciona un estado para listar documentos.'
          : `Mostrando ${visibles.length} documento${visibles.length === 1 ? '' : 's'}`}
      </p>

      {cargando && <p className="doc-page__state">Cargando documentos…</p>}

      {!cargando && error && (
        <p className="doc-page__state is-error" role="alert">{error}</p>
      )}

      {!cargando && !error && estadoFiltro !== 'todos' && visibles.length === 0 && (
        <p className="doc-page__state">No hay documentos en este estado.</p>
      )}

      <div className="doc-page__layout">
        <div className="doc-page__list">
          <DocumentsTable
            documentos={visibles}
            onSeleccionar={setSeleccionado}
            seleccionadoId={seleccionado?.documento_id}
          />
        </div>
        <DocumentDetailPanel documento={seleccionado} onClose={() => setSeleccionado(null)} />
      </div>
    </div>
  )
}

export default DocumentsPage