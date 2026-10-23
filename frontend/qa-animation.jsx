import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import AnalysisProgressPanel from './src/modules/agent/components/AnalysisProgressPanel'
import './src/index.css'
import './src/modules/agent/pages/agent.css'

function crearArchivo(id, estado, resultadoId = '') {
  return {
    id,
    archivo: {
      name: `documento-${id.toLowerCase()}.pdf`,
      size: 1085,
      type: 'application/pdf',
    },
    tipo: 'PDF',
    estado,
    error: estado === 'error' ? 'El agente no pudo procesar el documento.' : '',
    documentoId: resultadoId,
    resultado: resultadoId ? { documento_id: resultadoId } : null,
    duracion: resultadoId ? 2.4 : null,
  }
}

const escenarios = {
  processing: {
    archivos: [crearArchivo('DOC-1', 'processing')],
    archivoActivoId: 'DOC-1',
    resumen: { total: 1, completados: 0, errores: 0 },
  },
  success: {
    archivos: [crearArchivo('DOC-1', 'completed', 'DOC-1')],
    archivoActivoId: null,
    resumen: { total: 1, completados: 1, errores: 0 },
  },
  error: {
    archivos: [crearArchivo('DOC-1', 'error')],
    archivoActivoId: null,
    resumen: { total: 1, completados: 0, errores: 1 },
  },
  partial: {
    archivos: [crearArchivo('DOC-1', 'completed', 'DOC-1'), crearArchivo('DOC-2', 'error')],
    archivoActivoId: null,
    resumen: { total: 2, completados: 1, errores: 1 },
  },
  multiple: {
    archivos: [
      crearArchivo('DOC-1', 'completed', 'DOC-1'),
      crearArchivo('DOC-2', 'completed', 'DOC-2'),
    ],
    archivoActivoId: null,
    resumen: { total: 2, completados: 2, errores: 0 },
  },
}

function App() {
  const [escenario, setEscenario] = useState('processing')
  const [accion, setAccion] = useState('')
  const datos = escenarios[escenario]

  return (
    <div className="agent-page" style={{ maxWidth: '1180px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {Object.keys(escenarios).map((nombre) => (
          <button
            key={nombre}
            type="button"
            data-qa-estado={nombre}
            onClick={() => {
              setAccion('')
              setEscenario(nombre)
            }}
            style={{
              padding: '8px 12px',
              border: escenario === nombre ? '2px solid #08677a' : '1px solid #dfebf3',
              borderRadius: '8px',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            {nombre}
          </button>
        ))}
      </div>

      <AnalysisProgressPanel
        archivos={datos.archivos}
        archivoActivoId={datos.archivoActivoId}
        fase={escenario === 'processing' ? 'processing' : 'complete'}
        resumen={datos.resumen}
        onNuevaSeleccion={() => setAccion('nueva-seleccion')}
        onReintentarFallidos={() => setAccion('reintentar')}
        onVerResultado={(resultado) => setAccion(`ver:${resultado?.documento_id || 'sin-resultado'}`)}
      />

      <output id="qa-action" aria-live="polite">
        {accion}
      </output>
    </div>
  )
}

createRoot(document.getElementById('qa-root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
