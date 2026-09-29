import { useState } from 'react'
import MediFlowAgentAnimation from './MediFlowAgentAnimation'
import { directories } from './directories'
import './AuthVisualPanel.css'

const shortLabels = {
  laboratorio: 'Laboratorio',
  recetas: 'Recetas',
  informes: 'Informes',
  procedimientos: 'Procedimientos',
}

function AuthVisualPanel() {
  const [activeId, setActiveId] = useState(null)

  return (
    <div className="auth-visual">
      <div className="auth-visual__content">
        <div className="auth-visual__brand">
          <svg
            width="34"
            height="34"
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="30" height="30" rx="9" fill="var(--color-mf-sky)" />
            <path
              d="M9.5 8.6C9.5 7.7 10.2 7 11 7H16.5L19.8 10.2V20.4C19.8 21.2 19.2 21.9 18.5 21.9H11C10.2 21.9 9.5 21.2 9.5 20.4V8.6Z"
              fill="#fff"
            />
            <path d="M16.5 7L19.8 10.2H17.1C16.4 10.2 16.5 10.1 16.5 9.4V7Z" fill="var(--color-mf-bg-4)" />
            <path
              d="M11.6 13.6H17.4M11.6 16.4H15.6"
              stroke="var(--color-mf-dark)"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M18.2 18.8L17.4 17.6L16.2 19.2L14.4 15.4L12.9 17.5"
              stroke="var(--color-mf-sky)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span className="auth-visual__brand-name">MediFlow</span>
          <span className="auth-visual__badge">
            <span className="auth-visual__badge-dot" aria-hidden="true" />
            Procesamiento Autónomo v2.4
          </span>
        </div>

        <h1 className="auth-visual__title">Información clínica, procesada de forma inteligente.</h1>
        <p className="auth-visual__desc">
          MediFlow transforma documentos médicos en información clínica estructurada mediante un
          agente inteligente.
        </p>

        <div className="auth-visual__stage">
          <MediFlowAgentAnimation onFolderStart={setActiveId} />
        </div>

        <div className="auth-visual__footer">
          <p className="auth-visual__footer-txt">
            Detección segura y confiable sobre documentos clínicos.
          </p>
          <ol className="auth-visual__indicators" aria-label="Progreso de procesamiento">
            {directories.map((dir) => (
              <li
                key={dir.id}
                className={activeId === dir.id ? 'auth-visual__indicator is-active' : 'auth-visual__indicator'}
              >
                <span className="auth-visual__indicator-dot" aria-hidden="true" />
                <span className="auth-visual__indicator-label">{shortLabels[dir.id]}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

export default AuthVisualPanel