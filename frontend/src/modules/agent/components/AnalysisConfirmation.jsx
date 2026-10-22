import AgentFileIcon from './AgentFileIcon'
import { formatearBytes } from '../utils/agentFiles'

function AnalysisConfirmation({ archivos, onConfirmar, onVolver }) {
  const pesoTotal = archivos.reduce((total, item) => total + (item.archivo?.size || 0), 0)

  return (
    <section className="agent-confirm" aria-labelledby="agent-confirm-title">
      <div className="agent-confirm__icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path
            d="M16 3.8 26.5 8v8.2c0 6.4-4.2 11.8-10.5 13.9C9.7 28 5.5 22.6 5.5 16.2V8L16 3.8Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="m11.5 16 3.1 3.1 6.1-6.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="agent-confirm__heading">
        <span className="agent-eyebrow">Paso final</span>
        <h2 id="agent-confirm-title" tabIndex={-1}>Confirmar análisis</h2>
        <p>
          Se analizarán los documentos seleccionados mediante el agente MediFlow. Comprueba
          que has elegido los archivos correctos antes de continuar.
        </p>
      </div>

      <div className="agent-confirm__summary">
        <span>
          <strong>{archivos.length}</strong>
          {archivos.length === 1 ? ' documento' : ' documentos'}
        </span>
        <span aria-hidden="true">·</span>
        <span>{formatearBytes(pesoTotal)} en total</span>
      </div>

      <ul className="agent-confirm__list">
        {archivos.map((item) => (
          <li key={item.id}>
            <AgentFileIcon nombre={item.archivo?.name} tipo={item.tipo} />
            <span title={item.archivo?.name}>{item.archivo?.name}</span>
            <small>{formatearBytes(item.archivo?.size)}</small>
          </li>
        ))}
      </ul>

      <p className="agent-confirm__note">
        El agente procesará los documentos de forma secuencial. Los resultados aparecerán a
        medida que cada archivo complete su análisis.
      </p>

      <div className="agent-confirm__actions">
        <button type="button" className="agent-button agent-button--secondary" onClick={onVolver}>
          Volver a revisar
        </button>
        <button type="button" className="agent-button agent-button--primary" onClick={onConfirmar}>
          Iniciar análisis
        </button>
      </div>
    </section>
  )
}

export default AnalysisConfirmation
