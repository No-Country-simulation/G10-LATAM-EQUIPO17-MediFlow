import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AgentHeader from '../components/AgentHeader'
import AgentMetrics from '../components/AgentMetrics'
import AnalysisProgressPanel from '../components/AnalysisProgressPanel'
import DocumentUploadPanel from '../components/DocumentUploadPanel'
import InferenceInspector from '../components/InferenceInspector'
import RecentProcessing from '../components/RecentProcessing'
import TriajeStages from '../components/TriajeStages'
import { listarRegistrosTriaje, procesarTriajeArchivo } from '../services/agentService'
import {
  esFechaDeHoy,
  etiquetaDeArchivo,
  generarDocumentoId,
  mensajeErrorProcesamiento,
  ordenarRegistros,
  validarArchivo,
} from '../utils/agentFiles'
import './agent.css'

function crearIdLocal(indice) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `archivo-${Date.now()}-${indice}-${Math.random().toString(36).slice(2, 8)}`
}

function enfocarTitulo(id) {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.focus({ preventScroll: true })
  })
}

function mensajeErrorHistorial(error) {
  if (error?.status === 0) {
    return 'No se pudo conectar con el servidor para consultar el historial.'
  }
  if (error?.status === 403) {
    return 'No tienes permisos para consultar el historial de procesamientos.'
  }
  return 'No se pudo cargar el historial de procesamientos.'
}

function AgentPage() {
  const [archivos, setArchivos] = useState([])
  const [fase, setFase] = useState('idle')
  const [registros, setRegistros] = useState([])
  const [cargandoHistorial, setCargandoHistorial] = useState(true)
  const [historialCargado, setHistorialCargado] = useState(false)
  const [errorHistorial, setErrorHistorial] = useState('')
  const [resultados, setResultados] = useState({})
  const [resultadoInspeccion, setResultadoInspeccion] = useState(null)
  const [duraciones, setDuraciones] = useState([])
  const [resumen, setResumen] = useState({ total: 0, completados: 0, errores: 0 })
  const [archivoActivoId, setArchivoActivoId] = useState(null)
  const [estadoAgente, setEstadoAgente] = useState('desconocido')

  const procesandoRef = useRef(false)

  const cargarRegistros = useCallback(async (mostrarCarga = true) => {
    if (mostrarCarga) {
      setCargandoHistorial(true)
      setErrorHistorial('')
    }

    try {
      const datos = await listarRegistrosTriaje()
      setRegistros(Array.isArray(datos) ? datos : [])
      setHistorialCargado(true)
      setErrorHistorial('')
    } catch (error) {
      setErrorHistorial(mensajeErrorHistorial(error))
    } finally {
      setCargandoHistorial(false)
    }
  }, [])

  useEffect(() => {
    let activo = true

    listarRegistrosTriaje()
      .then((datos) => {
        if (!activo) return
        setRegistros(Array.isArray(datos) ? datos : [])
        setHistorialCargado(true)
        setErrorHistorial('')
      })
      .catch((error) => {
        if (activo) setErrorHistorial(mensajeErrorHistorial(error))
      })
      .finally(() => {
        if (activo) setCargandoHistorial(false)
      })

    return () => {
      activo = false
    }
  }, [])

  const registrosOrdenados = useMemo(() => ordenarRegistros(registros), [registros])

  const metricas = useMemo(() => {
    const procesadosHoy = historialCargado
      ? registros.filter((registro) => esFechaDeHoy(registro.created_at)).length
      : null
    const analisisCompletados = historialCargado ? registros.length : null
    const latenciaMedia = duraciones.length
      ? duraciones.reduce((total, duracion) => total + duracion, 0) / duraciones.length
      : null

    return {
      procesadosHoy,
      enCola: null,
      analisisCompletados,
      latenciaMedia,
    }
  }, [duraciones, historialCargado, registros])

  const agregarArchivos = useCallback((seleccionados) => {
    if (!seleccionados.length) return

    setArchivos((previos) => {
      const siguientes = [...previos]

      seleccionados.forEach((file, indice) => {
        const validacion = validarArchivo(file, siguientes)
        siguientes.push({
          id: crearIdLocal(indice),
          archivo: file,
          tipo: validacion.tipo || etiquetaDeArchivo(file.name),
          estado: validacion.valido ? 'valid' : 'invalid',
          error: validacion.error || '',
          documentoId: '',
          resultado: null,
          duracion: null,
        })
      })

      return siguientes
    })

    setFase((actual) => (actual === 'idle' || actual === 'confirm' ? 'review' : actual))
  }, [])

  const eliminarArchivo = (id) => {
    if (fase === 'processing') return

    const restantes = archivos.filter((item) => item.id !== id)
    setArchivos(restantes)

    if (restantes.length === 0) {
      setFase('idle')
      setResumen({ total: 0, completados: 0, errores: 0 })
      enfocarTitulo('agent-upload-title')
    } else if (fase === 'confirm') {
      setFase('review')
      enfocarTitulo('agent-upload-title')
    }
  }

  const limpiarSeleccion = () => {
    if (fase === 'processing') return
    setArchivos([])
    setFase('idle')
    setResumen({ total: 0, completados: 0, errores: 0 })
    setArchivoActivoId(null)
    enfocarTitulo('agent-upload-title')
  }

  const continuarAnalisis = () => {
    const validos = archivos.filter((item) => item.estado === 'valid')
    const invalidos = archivos.filter((item) => item.estado === 'invalid')
    if (validos.length === 0 || invalidos.length > 0) return
    setFase('confirm')
    enfocarTitulo('agent-confirm-title')
  }

  const volverARevisar = () => {
    setFase('review')
    enfocarTitulo('agent-upload-title')
  }

  const iniciarAnalisis = async () => {
    if (procesandoRef.current) return

    const validos = archivos.filter((item) => item.estado === 'valid')
    if (validos.length === 0) return

    procesandoRef.current = true
    setFase('processing')
    enfocarTitulo('agent-analysis-title')
    setEstadoAgente('procesando')
    setResultadoInspeccion(null)
    setArchivoActivoId(null)
    setResumen({ total: validos.length, completados: 0, errores: 0 })
    setArchivos((previos) =>
      previos.map((item) =>
        item.estado === 'valid'
          ? { ...item, error: '', documentoId: '', resultado: null, duracion: null }
          : item,
      ),
    )

    let completados = 0
    let errores = 0
    let falloCritico = false
    let ultimoResultado = null

    try {
      for (let indice = 0; indice < validos.length; indice += 1) {
        const item = validos[indice]
        const documentoId = generarDocumentoId(item.archivo, indice)

        setArchivoActivoId(item.id)
        setArchivos((previos) =>
          previos.map((archivo) =>
            archivo.id === item.id
              ? { ...archivo, estado: 'processing', error: '', documentoId }
              : archivo,
          ),
        )

        const inicio = performance.now()

        try {
          const respuesta = await procesarTriajeArchivo(item.archivo, documentoId, 'manual')

          if (!respuesta || typeof respuesta !== 'object') {
            throw new Error('Respuesta inválida del servicio de análisis.')
          }

          const duracion = (performance.now() - inicio) / 1000
          const idRespuesta = respuesta.documento_id || documentoId

          completados += 1
          ultimoResultado = respuesta
          setResultados((previos) => ({ ...previos, [idRespuesta]: respuesta }))
          setDuraciones((previas) => [...previas, duracion])
          setArchivos((previos) =>
            previos.map((archivo) =>
              archivo.id === item.id
                ? {
                    ...archivo,
                    estado: 'completed',
                    documentoId: idRespuesta,
                    resultado: respuesta,
                    duracion,
                    error: '',
                  }
                : archivo,
            ),
          )
        } catch (error) {
          errores += 1
          if (error?.status === 0 || error?.status === 503) falloCritico = true

          const mensaje = mensajeErrorProcesamiento(error)
          setArchivos((previos) =>
            previos.map((archivo) =>
              archivo.id === item.id
                ? { ...archivo, estado: 'error', error: mensaje }
                : archivo,
            ),
          )
        } finally {
          setResumen({ total: validos.length, completados, errores })
        }
      }
    } finally {
      setArchivoActivoId(null)
      setFase('complete')
      setResultadoInspeccion(ultimoResultado)
      procesandoRef.current = false

      if (completados > 0 && errores === 0) {
        setEstadoAgente('operativo')
      } else if (completados > 0) {
        setEstadoAgente('error')
      } else if (falloCritico) {
        setEstadoAgente('no-disponible')
      } else {
        setEstadoAgente('error')
      }

      cargarRegistros()
    }
  }

  const reintentarFallidos = () => {
    if (procesandoRef.current) return

    const fallidos = archivos.filter((item) => item.estado === 'error')
    if (fallidos.length === 0) return

    setArchivos(
      fallidos.map((item, indice) => ({
        ...item,
        id: crearIdLocal(indice),
        estado: 'valid',
        error: '',
        documentoId: '',
        resultado: null,
        duracion: null,
      })),
    )
    setResumen({ total: 0, completados: 0, errores: 0 })
    setArchivoActivoId(null)
    setFase('review')
    enfocarTitulo('agent-upload-title')
  }

  const nuevaSeleccion = () => {
    if (procesandoRef.current) return
    setArchivos([])
    setFase('idle')
    setResumen({ total: 0, completados: 0, errores: 0 })
    setArchivoActivoId(null)
    enfocarTitulo('agent-upload-title')
  }

  const verResultado = useCallback((resultado) => {
    if (!resultado) return
    setResultadoInspeccion(resultado)

    window.requestAnimationFrame(() => {
      const inspector = document.getElementById('agent-inference')
      if (!inspector) return
      const movimientoReducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      inspector.scrollIntoView({
        behavior: movimientoReducido ? 'auto' : 'smooth',
        block: 'nearest',
      })
    })
  }, [])

  const estadoPipeline =
    fase === 'processing'
      ? 'processing'
      : fase === 'complete'
        ? resumen.errores > 0
          ? 'error'
          : 'complete'
        : 'idle'

  return (
    <div className="agent-page">
      <AgentHeader estado={estadoAgente} />

      <AgentMetrics
        metricas={metricas}
        cargandoHistorial={cargandoHistorial && !historialCargado}
      />

      {fase === 'processing' || fase === 'complete' ? (
        <AnalysisProgressPanel
          archivos={archivos}
          archivoActivoId={archivoActivoId}
          fase={fase}
          resumen={resumen}
          onNuevaSeleccion={nuevaSeleccion}
          onReintentarFallidos={reintentarFallidos}
          onVerResultado={verResultado}
        />
      ) : (
        <DocumentUploadPanel
          archivos={archivos}
          fase={fase}
          onAgregar={agregarArchivos}
          onEliminar={eliminarArchivo}
          onLimpiar={limpiarSeleccion}
          onContinuar={continuarAnalisis}
          onVolver={volverARevisar}
          onConfirmar={iniciarAnalisis}
        />
      )}

      <TriajeStages estado={estadoPipeline} />

      <div className="agent-bottom">
        <RecentProcessing
          registros={registrosOrdenados}
          cargando={cargandoHistorial}
          error={errorHistorial}
          onReintentar={() => cargarRegistros()}
          resultados={resultados}
          onVerResultado={verResultado}
        />
        <InferenceInspector resultado={resultadoInspeccion} />
      </div>
    </div>
  )
}

export default AgentPage
