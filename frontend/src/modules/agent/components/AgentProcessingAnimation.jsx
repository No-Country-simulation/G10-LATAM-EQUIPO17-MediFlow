import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import agenteProcesamiento1 from '../../../shared/assets/Agente_Procesamiento1.png'
import agenteProcesamiento2 from '../../../shared/assets/Agente_Procesamiento2.png'
import agenteProcesamiento3 from '../../../shared/assets/Agente_Procesamiento3.png'
import agenteProcesamiento4 from '../../../shared/assets/Agente_Procesamiento4.png'

const FOTOGRAMAS = [
  agenteProcesamiento1,
  agenteProcesamiento2,
  agenteProcesamiento3,
  agenteProcesamiento4,
]

const PERMANENCIA = 0.63
const FUNDIDO = 0.2
const FLOTACION = 3.25

/**
 * @param {{ mensaje?: string }} props
 */
function AgentProcessingAnimation({ mensaje = 'Procesando documento clínico' }) {
  const rootRef = useRef(null)
  const floatRef = useRef(null)
  const frameRefs = useRef([])

  useLayoutEffect(() => {
    const frames = frameRefs.current.filter(Boolean)
    if (!frames.length) return undefined

    const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      gsap.set(frames, { opacity: 0, visibility: 'hidden' })
      gsap.set(frames[0], { opacity: 1, visibility: 'visible' })

      if (movimientoReducido) return

      const secuencia = gsap.timeline({ repeat: -1 })

      frames.forEach((frame, indice) => {
        const siguiente = frames[(indice + 1) % frames.length]

        secuencia.to(frame, { opacity: 1, duration: PERMANENCIA, ease: 'none' })
        secuencia.set(siguiente, { visibility: 'visible' })
        secuencia.to(frame, { opacity: 0, duration: FUNDIDO, ease: 'sine.inOut' }, '<')
        secuencia.to(siguiente, { opacity: 1, duration: FUNDIDO, ease: 'sine.inOut' }, '<')
        secuencia.set(frame, { visibility: 'hidden' })
      })

      gsap.to(floatRef.current, {
        y: -3,
        duration: FLOTACION,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    }, rootRef)

    return () => ctx.revert()
  }, [])

  return (
    <div className="agent-processing" ref={rootRef}>
      <div className="agent-processing__stage" aria-hidden="true">
        <div className="agent-processing__float" ref={floatRef}>
          {FOTOGRAMAS.map((fotograma, indice) => (
            <img
              key={fotograma}
              ref={(elemento) => {
                frameRefs.current[indice] = elemento
              }}
              className="agent-processing__frame"
              src={fotograma}
              alt=""
              draggable="false"
              decoding="async"
            />
          ))}
        </div>
      </div>

      <p className="agent-processing__status">
        <span>{mensaje}</span>
        <span className="agent-processing__dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
    </div>
  )
}

export default AgentProcessingAnimation
