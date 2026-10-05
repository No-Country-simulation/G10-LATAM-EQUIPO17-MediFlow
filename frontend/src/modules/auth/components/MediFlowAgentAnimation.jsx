import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { directories } from './directories'
import agenteFlowData from '../../../shared/assets/agente-flowData.png'
import './MediFlowAgentAnimation.css'

function createAgentAnimation({
  stage,
  folders,
  fronts,
  files,
  chips,
  agent,
  statusText,
  scan,
  glow,
  onFolderStart,
}) {
  gsap.set(files, { autoAlpha: 0, scale: 0.85 })
  gsap.set(chips, { autoAlpha: 0 })
  gsap.set(scan, { autoAlpha: 0 })
  gsap.set(glow, { autoAlpha: 0 })
  gsap.set(agent, { xPercent: -50, yPercent: -50, scale: 1 })

  const medirDestinos = () => {
    const stageRect = stage.getBoundingClientRect()
    const agentRect = agent.getBoundingClientRect()
    const centroX = agentRect.left - stageRect.left + agentRect.width / 2
    const centroY = agentRect.top - stageRect.top + agentRect.height / 2

    return folders.map((folder) => {
      const rect = folder.getBoundingClientRect()
      const centerX = rect.left - stageRect.left + rect.width / 2
      const centerY = rect.top - stageRect.top + rect.height / 2
      return { dx: centroX - centerX, dy: centroY - centerY }
    })
  }

  const posicionesIniciales = medirDestinos()

  const timeline = gsap.timeline({
    repeat: -1,
    repeatDelay: 0.5,
  })

  function secuencia(indice) {
    const folder = folders[indice]
    const front = fronts[indice]
    const file = files[indice]
    const chipGroup = chips[indice]
    const direccion = posicionesIniciales[indice]

    const folderAvance = 0.28

    folders.forEach((otro, j) => {
      if (j !== indice) timeline.to(otro, { autoAlpha: 0.4, duration: 0.4 }, '<')
    })

    timeline.to(folder, { scale: 1.06, duration: 0.3, ease: 'power2.out' })
    timeline.call(() => onFolderStart(directories[indice].id))

    timeline.to(folder, {
      x: direccion.dx * folderAvance,
      y: direccion.dy * folderAvance,
      scale: 1.08,
      duration: 0.8,
      ease: 'power2.inOut',
    })
    timeline.to(front, { rotationX: -80, duration: 0.6, ease: 'back.out(1.3)' }, '<+0.12')

    timeline.set(file, { autoAlpha: 1, y: 10, scale: 0.9 })
    timeline.to(file, { y: -2, scale: 1, duration: 0.3, ease: 'power2.out' })

    timeline.to(file, {
      x: direccion.dx * (1 - folderAvance) * 0.9,
      y: direccion.dy * (1 - folderAvance) * 0.9 + 18,
      scale: 0.92,
      autoAlpha: 0,
      duration: 0.7,
      ease: 'power2.inOut',
    })

    timeline.call(() => {
      if (statusText) statusText.textContent = 'Analizando documento...'
    })
    timeline.to(agent, {
      scale: 1.02,
      yoyo: true,
      repeat: 1,
      duration: 0.35,
      ease: 'sine.inOut',
    })
    timeline.to(glow, { autoAlpha: 1, duration: 0.35 }, '<')

    timeline.fromTo(
      scan,
      { y: 0, autoAlpha: 0 },
      { y: 18, autoAlpha: 1, duration: 1, ease: 'none' },
    )

    timeline.to(chipGroup, { autoAlpha: 1, duration: 0.2 })
    timeline.fromTo(
      chipGroup.querySelectorAll('.mfva-chip'),
      { yPercent: 14, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.3, stagger: 0.12, ease: 'power2.out' },
    )
    timeline.to({}, { duration: 0.6 })

    timeline.to(chipGroup, { autoAlpha: 0, duration: 0.3 })
    timeline.to(file, { autoAlpha: 0, scale: 0.7, duration: 0.3 }, '<')
    timeline.to(glow, { autoAlpha: 0, duration: 0.3 }, '<')
    timeline.to(scan, { autoAlpha: 0, duration: 0.2 })
    timeline.call(() => {
      if (statusText) statusText.textContent = 'Procesando...'
    })

    timeline.to(front, { rotationX: 0, duration: 0.5, ease: 'back.in(1.1)' }, '<+0.2')
    folders.forEach((otro, j) => {
      if (j !== indice) timeline.to(otro, { autoAlpha: 1, duration: 0.3 }, '<')
    })
    timeline.to(folder, { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' })
  }

  directories.forEach((_, indice) => secuencia(indice))

  return timeline
}

function FolderIcon({ tipo }) {
  const esImagen = tipo === 'IMG'
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true">
      <path
        d="M4.5 2h6.6L15 5.9v12a1.7 1.7 0 0 1-1.7 1.7H4.5A1.7 1.7 0 0 1 2.8 18V3.7A1.7 1.7 0 0 1 4.5 2Z"
        fill="var(--color-mf-bg-2)"
        stroke="var(--color-mf-sky)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 2v3.6a.8.8 0 0 0 .8.8h3.2"
        stroke="var(--color-mf-sky)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {esImagen ? (
        <circle cx="9.4" cy="13.4" r="2.2" stroke="var(--color-mf-dark-3)" strokeWidth="1.2" />
      ) : (
        <>
          <path
            d="M5.6 12.2h8.4M5.6 14.8h6"
            stroke="var(--color-mf-dark-3)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M9.2 16.6 8.6 15.6 7.6 17l-1.4-2.6-.8.9"
            stroke="var(--color-mf-sky)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}
    </svg>
  )
}

function MediFlowAgentAnimation({ onFolderStart }) {
  const stageRef = useRef(null)
  const folderRefs = useRef([])
  const frontRefs = useRef([])
  const fileRefs = useRef([])
  const chipRefs = useRef([])
  const agentRef = useRef(null)
  const statusTextRef = useRef(null)
  const scanRef = useRef(null)
  const glowRef = useRef(null)
  const onFolderStartRef = useRef(onFolderStart)

  useEffect(() => {
    onFolderStartRef.current = onFolderStart
  }, [onFolderStart])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      createAgentAnimation({
        stage: stageRef.current,
        folders: folderRefs.current,
        fronts: frontRefs.current,
        files: fileRefs.current,
        chips: chipRefs.current,
        agent: agentRef.current,
        statusText: statusTextRef.current,
        scan: scanRef.current,
        glow: glowRef.current,
        onFolderStart: (id) => onFolderStartRef.current?.(id),
      })
    }, stageRef)

    return () => ctx.revert()
  }, [])

  return (
    <div className="mfva" ref={stageRef}>
      <svg className="mfva__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line x1="12" y1="12" x2="50" y2="50" className="mfva__line" />
        <line x1="88" y1="12" x2="50" y2="50" className="mfva__line" />
        <line x1="12" y1="88" x2="50" y2="50" className="mfva__line" />
        <line x1="88" y1="88" x2="50" y2="50" className="mfva__line" />
      </svg>

      {directories.map((dir, i) => (
        <div
          key={dir.id}
          className={`mfva-folder mfva-folder--${dir.id}`}
          ref={(el) => {
            folderRefs.current[i] = el
          }}
        >
          <span className="mfva-folder__back" />
          <span className="mfva-folder__tab" />
          <div
            className="mfva-folder__front"
            ref={(el) => {
              frontRefs.current[i] = el
            }}
          >
            <FolderIcon tipo={dir.file.type} />
            <span className="mfva-folder__text">
              <span className="mfva-folder__title">{dir.title}</span>
              <span className="mfva-folder__subtitle">{dir.subtitle}</span>
            </span>
          </div>
          <div
            className="mfva-file"
            ref={(el) => {
              fileRefs.current[i] = el
            }}
          >
            <span className="mfva-file__type">{dir.file.type}</span>
            <span className="mfva-file__name">{dir.file.name}</span>
          </div>
        </div>
      ))}

      <div
        className="mfva-agent"
        ref={(el) => {
          agentRef.current = el
        }}
      >
        <span className="mfva-agent__glow" ref={glowRef} aria-hidden="true" />
        <div className="mfva-agent__status">
          <span className="mfva-agent__dot" aria-hidden="true" />
          <span className="mfva-agent__status-text" ref={statusTextRef}>
            Procesando...
          </span>
        </div>
        <img
          className="mfva-agent__img"
          src={agenteFlowData}
          alt="Agente inteligente MediFlow"
        />
        <span className="mfva-scan" ref={scanRef} aria-hidden="true" />
      </div>

      {directories.map((dir, i) => (
        <ul
          key={`${dir.id}-chips`}
          className="mfva-chips"
          aria-label={`Datos detectados de ${dir.title}`}
          ref={(el) => {
            chipRefs.current[i] = el
          }}
        >
          {dir.detected.map((dato) => (
            <li key={dato} className="mfva-chip">
              <span className="mfva-chip__check" aria-hidden="true" />
              {dato}
            </li>
          ))}
        </ul>
      ))}
    </div>
  )
}

export default MediFlowAgentAnimation