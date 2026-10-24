import { useCallback, useEffect, useRef, useState } from 'react'
import OciHealthCard from '../components/OciHealthCard'
import { listarDocumentos, obtenerMetadataDocumento, verificarSaludStorage } from '../services/storageService'
import './storage.css'

const ESTADOS = [
  { value: 'recibido', label: 'Recibidos' },
  { value: 'procesado', label: 'Procesados' },
  { value: 'auditoria_humana', label: 'Auditoría humana' },
]

function mensajeErrorStorage(error, recurso) {
  switch (error?.status) {
    case 0:
      return 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.'
    case 401:
      return 'La sesión expiró. Inicia sesión de nuevo para consultar Storage.'
    case 403:
      if (recurso === 'conexión') return 'No tienes permiso para comprobar la conexión con OCI. Esta consulta requiere el rol administrador.'
      if (recurso === 'metadata') return 'No tienes permiso para consultar la metadata de este documento.'
      return 'No tienes permiso para listar documentos. Esta consulta requiere el rol médico o administrador.'
    case 404:
      return recurso === 'metadata'
        ? 'El documento ya no se encuentra en OCI. Actualiza el listado e inténtalo de nuevo.'
        : 'No se encontró el bucket correspondiente a este estado en OCI.'
    case 429:
      return 'Se alcanzó el límite de consultas del servidor. Espera un momento antes de reintentar.'
    case 503:
      return 'OCI no está disponible en este momento. Inténtalo de nuevo más tarde.'
    default:
      return `No se pudo consultar ${recurso}. Inténtalo de nuevo más tarde.`
  }
}

function StoragePage() {
  const [estado, setEstado] = useState(null)
  const [ultimaComprobacion, setUltimaComprobacion] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('recibido')
  const [prefijo, setPrefijo] = useState('')
  const [limite, setLimite] = useState(50)
  const [formato, setFormato] = useState('todos')
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [cargandoDocumentos, setCargandoDocumentos] = useState(false)
  const [cargandoMetadata, setCargandoMetadata] = useState(false)
  const [error, setError] = useState('')
  const [errorDocumentos, setErrorDocumentos] = useState('')
  const [errorMetadata, setErrorMetadata] = useState('')
  const filtroInicializado = useRef(false)
  const solicitudDocumentos = useRef(0)
  const solicitudMetadata = useRef(0)

  const cargarDocumentos = useCallback(async (estadoActual, prefijoActual = '', limiteActual = 50, { force = false } = {}) => {
    const solicitudActual = ++solicitudDocumentos.current
    setCargandoDocumentos(true)
    setErrorDocumentos('')
    setDocumentoSeleccionado(null)
    setMetadata(null)
    solicitudMetadata.current += 1

    try {
      const datos = await listarDocumentos(estadoActual, prefijoActual, limiteActual, { force })
      if (solicitudActual !== solicitudDocumentos.current) return
      setDocumentos(Array.isArray(datos) ? [...datos].sort((a, b) => {
        const fechaA = Date.parse(a.creado)
        const fechaB = Date.parse(b.creado)
        return Number.isNaN(fechaA) || Number.isNaN(fechaB) ? 0 : fechaB - fechaA
      }) : [])
    } catch (err) {
      if (solicitudActual !== solicitudDocumentos.current) return
      setDocumentos([])
      setErrorDocumentos(mensajeErrorStorage(err, 'documentos'))
    } finally {
      if (solicitudActual === solicitudDocumentos.current) setCargandoDocumentos(false)
    }
  }, [])

  const cargar = useCallback(async (estadoActual = 'recibido', limiteActual = 50, { force = false } = {}) => {
    setCargando(true)
    try {
      const datos = await verificarSaludStorage({ force })
      setEstado(datos)
      setError('')
      setUltimaComprobacion(new Date())
      await cargarDocumentos(estadoActual, '', limiteActual, { force })
    } catch (err) {
      setUltimaComprobacion(new Date())
      setError(mensajeErrorStorage(err, 'conexión'))
      setEstado(null)
      setDocumentos([])
    } finally {
      setCargando(false)
    }
  }, [cargarDocumentos])

  useEffect(() => {
    Promise.resolve().then(() => cargar('recibido'))
  }, [cargar])

  useEffect(() => {
    if (!filtroInicializado.current) {
      filtroInicializado.current = true
      return undefined
    }

    const temporizador = window.setTimeout(() => {
      cargarDocumentos(estadoSeleccionado, prefijo.trim(), limite)
    }, 350)

    return () => window.clearTimeout(temporizador)
  }, [estadoSeleccionado, prefijo, limite, cargarDocumentos])

  const cambiarEstado = (nuevoEstado) => {
    if (nuevoEstado === estadoSeleccionado) return
    solicitudDocumentos.current += 1
    solicitudMetadata.current += 1
    setDocumentoSeleccionado(null)
    setDocumentos([])
    setCargandoDocumentos(true)
    setEstadoSeleccionado(nuevoEstado)
    setPrefijo('')
  }

  const cambiarPrefijo = (valor) => {
    solicitudDocumentos.current += 1
    solicitudMetadata.current += 1
    setDocumentoSeleccionado(null)
    setDocumentos([])
    setCargandoDocumentos(true)
    setPrefijo(valor)
  }

  const cambiarLimite = (valor) => {
    solicitudDocumentos.current += 1
    solicitudMetadata.current += 1
    setDocumentoSeleccionado(null)
    setDocumentos([])
    setCargandoDocumentos(true)
    setLimite(Number(valor))
  }

  const actualizarDocumentos = () => {
    cargarDocumentos(estadoSeleccionado, prefijo.trim(), limite, { force: true })
  }

  const handleReintentar = () => {
    cargar(estadoSeleccionado, limite, { force: true })
  }

  const seleccionarDocumento = async (documento) => {
    const solicitudActual = ++solicitudMetadata.current
    const buckets = estado?.buckets && typeof estado.buckets === 'object'
      ? Object.keys(estado.buckets)
      : []
    const indiceEstado = ESTADOS.findIndex((item) => item.value === estadoSeleccionado)
    const bucket = buckets[indiceEstado]

    if (!bucket) {
      setErrorMetadata('No se pudo identificar el bucket del documento. Vuelve a comprobar la conexión con OCI.')
      setDocumentoSeleccionado(documento)
      setMetadata(null)
      return
    }

    setDocumentoSeleccionado(documento)
    setCargandoMetadata(true)
    setErrorMetadata('')
    setMetadata(null)

    try {
      const datos = await obtenerMetadataDocumento(bucket, documento.nombre)
      if (solicitudActual === solicitudMetadata.current) setMetadata(datos)
    } catch (err) {
      if (solicitudActual === solicitudMetadata.current) {
        setErrorMetadata(mensajeErrorStorage(err, 'metadata'))
      }
    } finally {
      if (solicitudActual === solicitudMetadata.current) setCargandoMetadata(false)
    }
  }

  const cerrarMetadata = () => {
    solicitudMetadata.current += 1
    setDocumentoSeleccionado(null)
    setMetadata(null)
  }

  const buckets = estado?.buckets && typeof estado.buckets === 'object'
    ? Object.keys(estado.buckets) : []
  const bucketActual = buckets[ESTADOS.findIndex((item) => item.value === estadoSeleccionado)]
  const documentosVisibles = formato === 'todos'
    ? documentos
    : documentos.filter((documento) => tipoArchivo(documento.nombre) === formato)

  return (
    <div className="storage-page">
      <header className="storage-page__intro">
        <span className="storage-page__kicker">Infraestructura</span>
        <h1>Storage</h1>
        <p>
          Monitorea el estado de la infraestructura OCI Object Storage de MediFlow.
          Solo disponible para administradores.
        </p>
      </header>

      <OciHealthCard
        estado={estado}
        error={error}
        cargando={cargando}
        ultimaComprobacion={ultimaComprobacion}
        onReintentar={handleReintentar}
      />

      {!error && !cargando && (
        <section className="storage-documents" aria-labelledby="documents-title">
          <div className="storage-section__heading">
            <div>
              <span className="storage-page__kicker">Contenido almacenado</span>
              <h2 id="documents-title">Documentos</h2>
            </div>
            <div className="storage-documents__tools">
              <span className="storage-documents__count">{cargandoDocumentos || errorDocumentos ? '—' : documentosVisibles.length} resultados mostrados (máx. {limite} consultados)</span>
              <button type="button" className="storage-refresh" onClick={actualizarDocumentos} disabled={cargandoDocumentos}>
                {cargandoDocumentos ? 'Actualizando…' : 'Actualizar'}
              </button>
            </div>
          </div>

          {bucketActual && <p className="storage-documents__bucket">Bucket actual: <strong>{bucketActual}</strong></p>}

          <div className="storage-tabs" role="tablist" aria-label="Estado de los documentos">
            {ESTADOS.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={estadoSeleccionado === item.value}
                className={estadoSeleccionado === item.value ? 'is-active' : ''}
                onClick={() => cambiarEstado(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="storage-search">
            <div className="storage-search__field">
              <label htmlFor="storage-prefix">Buscar por prefijo</label>
              <div className="storage-search__controls">
                <input
                  id="storage-prefix"
                  type="search"
                  value={prefijo}
                  onChange={(event) => cambiarPrefijo(event.target.value)}
                  placeholder="Ej. 2026/10/22/"
                />
                {prefijo && <button type="button" onClick={() => cambiarPrefijo('')}>Limpiar filtro</button>}
              </div>
              <small>Los resultados se actualizan automáticamente mientras escribes.</small>
            </div>
            <div className="storage-search__field">
              <label htmlFor="storage-format">Formato de archivo</label>
              <select id="storage-format" value={formato} onChange={(event) => setFormato(event.target.value)}>
                <option value="todos">Todos los formatos</option>
                <option value="PDF">PDF</option>
                <option value="IMG">Imágenes (JPG, PNG)</option>
                <option value="JSON">JSON</option>
                <option value="TXT">TXT</option>
                <option value="DOC">Otros</option>
              </select>
              <small>Filtra solo los documentos cargados, no todo OCI.</small>
            </div>
          </div>

          <div className="storage-documents__panel">
            {cargandoDocumentos && <p className="storage-feedback">Cargando documentos…</p>}
            {!cargandoDocumentos && errorDocumentos && <p className="storage-feedback is-error" role="alert">{errorDocumentos}</p>}
            {!cargandoDocumentos && !errorDocumentos && documentosVisibles.length === 0 && (
              <p className="storage-feedback">{documentos.length > 0 ? 'Ninguno de los documentos cargados tiene este formato.' : prefijo ? 'No hay documentos que coincidan con este prefijo.' : 'No hay documentos almacenados en este estado.'}</p>
            )}
            {!cargandoDocumentos && !errorDocumentos && documentosVisibles.length > 0 && (
              <div className="storage-table-wrap">
                <table className="storage-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th><span className="sr-only">Acción</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentosVisibles.map((documento) => (
                      <tr key={documento.nombre}>
                        <td>
                          <span className="storage-table__file">
                            <span className="storage-table__type" aria-hidden="true">{tipoArchivo(documento.nombre)}</span>
                            <span className="storage-table__name">{documento.nombre}</span>
                          </span>
                        </td>
                        <td>
                          <button type="button" className="storage-table__action" onClick={() => seleccionarDocumento(documento)}>
                            Ver metadata
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="storage-limit">
            <label htmlFor="storage-limit">Resultados por consulta</label>
            <select id="storage-limit" value={limite} onChange={(event) => cambiarLimite(event.target.value)}>
              {[50, 100, 250, 500].map((cantidad) => (
                <option key={cantidad} value={cantidad}>{cantidad}</option>
              ))}
            </select>
            <small>No es el total de documentos del bucket.</small>
          </div>
        </section>
      )}

      {documentoSeleccionado && (
        <section className="storage-metadata" aria-labelledby="metadata-title">
          <div className="storage-section__heading">
            <div>
              <span className="storage-page__kicker">Detalle del documento</span>
              <h2 id="metadata-title">Metadata</h2>
            </div>
            <button type="button" className="storage-metadata__close" onClick={cerrarMetadata}>
              Cerrar
            </button>
          </div>
          <p className="storage-metadata__path">{documentoSeleccionado.nombre}</p>
          {cargandoMetadata && <p className="storage-feedback">Consultando metadata…</p>}
          {!cargandoMetadata && errorMetadata && <p className="storage-feedback is-error" role="alert">{errorMetadata}</p>}
          {!cargandoMetadata && metadata && <MetadataDetails datos={metadata} />}
        </section>
      )}
    </div>
  )
}

function MetadataDetails({ datos }) {
  const campos = datos.metadata || {}
  const etiquetas = {
    documento_id: 'ID del documento',
    tipo_documento: 'Tipo de documento',
    nivel_prioridad: 'Nivel de prioridad',
    score_confianza: 'Confianza',
    canal_origen: 'Canal de origen',
    paciente_nombre: 'Paciente',
    medico_solicitante: 'Médico solicitante',
    diagnostico_principal: 'Diagnóstico principal',
    cie10: 'Código CIE10',
    fecha_recepcion: 'Fecha de recepción',
    destino_enrutamiento: 'Destino',
  }

  return (
    <div className="storage-metadata__details">
      <div className="storage-metadata__location">
        <span>Bucket</span>
        <strong>{datos.bucket || '—'}</strong>
        <span>Ruta</span>
        <strong>{datos.ruta || '—'}</strong>
      </div>
      <dl className="storage-metadata__grid">
        {Object.entries(campos).map(([clave, valor]) => (
          <div key={clave}>
            <dt>{etiquetas[clave] || clave.replaceAll('_', ' ')}</dt>
            <dd>
              {clave === 'nivel_prioridad'
                ? <span className={`storage-priority storage-priority--${normalizarPrioridad(valor)}`}>{valor || '—'}</span>
                : valor ?? '—'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function tipoArchivo(nombre) {
  const extension = String(nombre || '').split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png'].includes(extension)) return 'IMG'
  if (['pdf', 'json', 'txt'].includes(extension)) return extension.toUpperCase()
  return 'DOC'
}

function normalizarPrioridad(valor) {
  return String(valor || 'rutina').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export default StoragePage
