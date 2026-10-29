import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AgentHeader from '../components/AgentHeader'
import AgentMetrics from '../components/AgentMetrics'
import AnalysisProgressPanel from '../components/AnalysisProgressPanel'
import ClinicalResultPanel from '../components/ClinicalResultPanel'
import DocumentUploadPanel from '../components/DocumentUploadPanel'
import TriajeStages from '../components/TriajeStages'
import { listarRegistrosTriaje, procesarTriajeArchivo } from '../services/agentService'
import {
  esFechaDeHoy,
  etiquetaDeArchivo,
  generarDocumentoId,
  mensajeErrorProcesamiento,
  validarArchivo,
} from '../utils/agentFiles'
import { construirResultadoClinico } from '../utils/clinicalResult'
import './agent.css'

const MENSAJE_CANCELACION =
  'Se canceló la espera de la respuesta por solicitud del usuario. El servidor puede continuar el procesamiento.'

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

function AgentPage() {
  const [archivos, setArchivos] = useState([])
  const [fase, setFase] = useState('idle')
  const [registros, setRegistros] = useState([])
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [cargandoHistorial, setCargandoHistorial] = useState(true)
  const [historialCargado, setHistorialCargado] = useState(false)
  const [resultadoClinico, setResultadoClinico] = useState(null)
  const [vista, setVista] = useState('agente')
  const [duraciones, setDuraciones] = useState([])
  const [resumen, setResumen] = useState({ total: 0, completados: 0, errores: 0 })
  const [archivoActivoId, setArchivoActivoId] = useState(null)
  const [estadoAgente, setEstadoAgente] = useState('desconocido')
  const [cancelando, setCancelando] = useState(false)

  const procesandoRef = useRef(false)
  const ejecucionRef = useRef(null)
  const solicitudRegistros = useRef(0)

  const cargarRegistros = useCallback(async ({ force = false } = {}) => {
    const solicitudActual = ++solicitudRegistros.current
    setCargandoHistorial(true)

    try {
      const datos = await listarRegistrosTriaje({ force })
      if (solicitudActual !== solicitudRegistros.current) return
      setRegistros(Array.isArray(datos?.items) ? datos.items : [])
      setTotalRegistros(datos?.total ?? 0)
      setHistorialCargado(true)
    } catch {
      if (solicitudActual !== solicitudRegistros.current) return
      setHistorialCargado(false)
    } finally {
      if (solicitudActual === solicitudRegistros.current) setCargandoHistorial(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => cargarRegistros())

    return () => {
      solicitudRegistros.current += 1
    }
  }, [cargarRegistros])

  useEffect(() => {
    return () => {
      const ejecucion = ejecucionRef.current
      if (ejecucion) {
        ejecucion.cancelada = true
        ejecucion.controller.abort()
        ejecucionRef.current = null
      }
      procesandoRef.current = false
    }
  }, [])

  const metricas = useMemo(() => {
    const procesadosHoy = historialCargado && totalRegistros === registros.length
      ? registros.filter((registro) => esFechaDeHoy(registro.created_at)).length
      : null
    const analisisCompletados = historialCargado ? totalRegistros : null
    const latenciaMedia = duraciones.length
      ? duraciones.reduce((total, duracion) => total + duracion, 0) / duraciones.length
      : null

    return {
      procesadosHoy,
      enCola: null,
      analisisCompletados,
      latenciaMedia,
    }
  }, [duraciones, historialCargado, registros, totalRegistros])

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
          procesadoEn: null,
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
    setVista('agente')
    setResultadoClinico(null)
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

    const ejecucion = {
      id: crearIdLocal(0),
      controller: new AbortController(),
      cancelada: false,
      archivoActivoId: null,
    }

    ejecucionRef.current = ejecucion
    procesandoRef.current = true
    setCancelando(false)
    setFase('processing')
    enfocarTitulo('agent-analysis-title')
    setEstadoAgente('procesando')
    setResultadoClinico(null)
    setVista('agente')
    setArchivoActivoId(null)
    setResumen({ total: validos.length, completados: 0, errores: 0 })
    setArchivos((previos) =>
      previos.map((item) =>
        item.estado === 'valid'
          ? {
              ...item,
              error: '',
              documentoId: '',
              resultado: null,
              duracion: null,
              procesadoEn: null,
            }
          : item,
      ),
    )

    let completados = 0
    let errores = 0
    let falloCritico = false

    try {
      for (let indice = 0; indice < validos.length; indice += 1) {
        if (ejecucion.cancelada || ejecucionRef.current !== ejecucion) break

        const item = validos[indice]
        const documentoId = generarDocumentoId(item.archivo, indice)

        ejecucion.archivoActivoId = item.id
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
          const respuesta = await procesarTriajeArchivo(item.archivo, documentoId, 'manual', {
            signal: ejecucion.controller.signal,
          })

          if (ejecucion.cancelada || ejecucionRef.current !== ejecucion) {
            if (ejecucion.cancelada && ejecucionRef.current === ejecucion) {
              errores += 1
              setArchivos((previos) =>
                previos.map((archivo) =>
                  archivo.id === item.id
                    ? { ...archivo, estado: 'error', error: MENSAJE_CANCELACION }
                    : archivo,
                ),
              )
            }
            break
          }

          const respuestaValida =
            respuesta &&
            typeof respuesta === 'object' &&
            !Array.isArray(respuesta) &&
            typeof respuesta.documento_id === 'string' &&
            respuesta.documento_id.trim() !== '' &&
            respuesta.clasificacion &&
            typeof respuesta.clasificacion === 'object' &&
            !Array.isArray(respuesta.clasificacion)

          if (!respuestaValida) {
            throw new Error('Respuesta inválida del servicio de análisis.')
          }

          const duracion = (performance.now() - inicio) / 1000
          const idRespuesta = respuesta.documento_id || documentoId

          completados += 1
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
                    procesadoEn: new Date().toISOString(),
                    error: '',
                  }
                : archivo,
            ),
          )
        } catch (error) {
          if (ejecucionRef.current !== ejecucion) break

          if (ejecucion.cancelada || error?.name === 'AbortError') {
            ejecucion.cancelada = true
            errores += 1
            setArchivos((previos) =>
              previos.map((archivo) =>
                archivo.id === item.id
                  ? { ...archivo, estado: 'error', error: MENSAJE_CANCELACION }
                  : archivo,
              ),
            )
            break
          }

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
          ejecucion.archivoActivoId = null
          if (ejecucionRef.current === ejecucion) {
            setResumen({ total: validos.length, completados, errores })
          }
        }
      }
    } finally {
      if (ejecucionRef.current === ejecucion) {
        setArchivoActivoId(null)
        setFase(ejecucion.cancelada ? 'cancelled' : 'complete')
        setCancelando(false)
        procesandoRef.current = false

        if (ejecucion.cancelada) {
          setEstadoAgente('cancelado')
        } else if (completados > 0 && errores === 0) {
          setEstadoAgente('operativo')
        } else if (completados > 0) {
          setEstadoAgente('error')
        } else if (falloCritico) {
          setEstadoAgente('no-disponible')
        } else {
          setEstadoAgente('error')
        }

        ejecucionRef.current = null

        if (!ejecucion.cancelada || completados > 0) {
          cargarRegistros({ force: true })
        }
      }
    }
  }

  const detenerProcesamiento = useCallback(() => {
    const ejecucion = ejecucionRef.current
    if (!ejecucion || ejecucion.cancelada) return

    ejecucion.cancelada = true
    setCancelando(true)
    ejecucion.controller.abort()
  }, [])

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
        procesadoEn: null,
      })),
    )
    setResumen({ total: 0, completados: 0, errores: 0 })
    setArchivoActivoId(null)
    setVista('agente')
    setResultadoClinico(null)
    setFase('review')
    enfocarTitulo('agent-upload-title')
  }

  const nuevaSeleccion = () => {
    if (procesandoRef.current) return
    setArchivos([])
    setFase('idle')
    setResumen({ total: 0, completados: 0, errores: 0 })
    setArchivoActivoId(null)
    setVista('agente')
    setResultadoClinico(null)
    enfocarTitulo('agent-upload-title')
  }

  const verResultado = useCallback((resultado, contexto = {}) => {
    if (!resultado || fase === 'cancelled') return
    setResultadoClinico(construirResultadoClinico(resultado, contexto))
    setVista('resultado')

    window.requestAnimationFrame(() => {
      const titulo = document.getElementById('agent-result-title')
      if (!titulo) return

      titulo.focus({ preventScroll: true })
      const movimientoReducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      titulo.scrollIntoView({
        behavior: movimientoReducido ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  }, [fase])

  const volverAlAgente = useCallback(() => {
    setVista('agente')
    setResultadoClinico(null)
    enfocarTitulo(
      fase === 'processing' || fase === 'complete' || fase === 'cancelled'
        ? 'agent-analysis-title'
        : fase === 'confirm'
          ? 'agent-confirm-title'
          : 'agent-upload-title',
    )
  }, [fase])

  const analizarOtroDocumento = useCallback(() => {
    if (procesandoRef.current) return
    setVista('agente')
    setResultadoClinico(null)
    setArchivos([])
    setFase('idle')
    setResumen({ total: 0, completados: 0, errores: 0 })
    setArchivoActivoId(null)
    enfocarTitulo('agent-upload-title')
  }, [])

  const estadoPipeline =
    fase === 'processing'
      ? 'processing'
      : fase === 'cancelled'
        ? 'cancelled'
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

      {vista === 'resultado' && resultadoClinico && fase !== 'cancelled' ? (
        <ClinicalResultPanel
          key={`${resultadoClinico.documentoId}-${resultadoClinico.fechaProcesamiento}`}
          vista={resultadoClinico}
          onVolver={volverAlAgente}
          onAnalizarOtro={analizarOtroDocumento}
          puedeAnalizarOtro={fase !== 'processing'}
        />
      ) : (
        <>
          {fase === 'processing' || fase === 'complete' || fase === 'cancelled' ? (
            <AnalysisProgressPanel
              archivos={archivos}
              archivoActivoId={archivoActivoId}
              fase={fase}
              resumen={resumen}
              onDetener={detenerProcesamiento}
              cancelando={cancelando}
              mensajeCancelacion={MENSAJE_CANCELACION}
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
        </>
      )}
    </div>
  )
}

export default AgentPage
