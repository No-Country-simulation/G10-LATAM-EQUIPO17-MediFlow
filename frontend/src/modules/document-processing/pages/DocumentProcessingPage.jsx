import { useEffect, useState } from 'react'
import DocumentUploader from '../components/DocumentUploader.jsx'
import ProcessingPipeline from '../components/ProcessingPipeline.jsx'
import ProcessingResult from '../components/ProcessingResult.jsx'
import { MOCK_PROCESSING_RESULT, PROCESSING_STEPS } from '../mocks/documentProcessingMock.js'
import '../document-processing.css'

function DocumentProcessingPage() {
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('idle')
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (phase !== 'processing') return undefined

    if (currentStep >= PROCESSING_STEPS.length) return undefined

    const timer = window.setTimeout(() => {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      if (nextStep >= PROCESSING_STEPS.length) setPhase('complete')
    }, 850)
    return () => window.clearTimeout(timer)
  }, [currentStep, phase])

  const handleFileSelected = (selectedFile, validationError) => {
    setFile(selectedFile)
    setError(validationError)
    setPhase('idle')
    setCurrentStep(0)
  }

  const handleProcess = () => {
    if (!file) {
      setError('Selecciona un documento antes de iniciar el procesamiento.')
      return
    }

    setError('')
    setCurrentStep(0)
    setPhase('processing')
  }

  const handleReset = () => {
    setFile(null)
    setError('')
    setPhase('idle')
    setCurrentStep(0)
  }

  const isProcessing = phase === 'processing'

  return (
    <main className="document-page">
      <header className="document-header">
        <a className="document-brand" href="/" aria-label="MediFlow, volver al inicio">
          <span className="document-brand__mark" aria-hidden="true">+</span>
          <span>Medi<span>Flow</span></span>
        </a>
        <a className="document-back" href="/">Volver al inicio</a>
      </header>

      <div className="document-shell">
        <div className="document-intro">
          <span className="section-kicker"><span aria-hidden="true">●</span>Document Processing</span>
          <h1>Procesa un documento <span>con claridad.</span></h1>
          <p>Carga un documento clínico y deja que MediFlow organice la información para el siguiente paso.</p>
        </div>

        <div className="document-layout">
          <section className="document-card document-card--upload" aria-labelledby="upload-title">
            <div className="card-heading">
              <div>
                <span className="card-eyebrow">01 / Ingesta</span>
                <h2 id="upload-title">Carga tu documento</h2>
              </div>
              <span className="card-number">01</span>
            </div>
            <DocumentUploader file={file} error={error} disabled={isProcessing} onFileSelected={handleFileSelected} />
            <div className="document-fields">
              <label htmlFor="document-id">Identificador del documento</label>
              <input id="document-id" type="text" defaultValue="DOC-MOCK-2026-001" disabled={isProcessing} />
              <label htmlFor="source-channel">Canal de origen</label>
              <select id="source-channel" defaultValue="manual" disabled={isProcessing}>
                <option value="manual">Carga manual</option>
                <option value="guardia">Guardia de emergencias</option>
                <option value="consulta">Consulta externa</option>
              </select>
            </div>
            <button className="process-button" type="button" disabled={isProcessing} onClick={handleProcess}>
              {isProcessing ? 'Procesando documento...' : 'Procesar documento'}
              <span aria-hidden="true">→</span>
            </button>
            {phase === 'complete' && <button className="reset-button" type="button" onClick={handleReset}>Procesar otro documento</button>}
          </section>

          <div className="document-workspace">
            {phase === 'idle' && (
              <section className="empty-workspace" aria-label="Estado del procesamiento">
                <div className="empty-orbit" aria-hidden="true"><span /><span /><span /></div>
                <span className="card-eyebrow">02 / Análisis</span>
                <h2>Tu flujo inteligente comienza aquí</h2>
                <p>Cuando cargues un documento, verás cómo el agente identifica, extrae y organiza la información.</p>
              </section>
            )}
            {isProcessing && <ProcessingPipeline currentStep={currentStep} isComplete={false} />}
            {phase === 'complete' && <ProcessingResult result={MOCK_PROCESSING_RESULT} />}
          </div>
        </div>
      </div>
    </main>
  )
}

export default DocumentProcessingPage
