import './AgentPreview.css'

const procesamiento = [
  'Documento recibido',
  'Tipo identificado',
  'Datos extraídos',
  'Prioridad evaluada',
  'Destino determinado',
]

const documentos = [
  { nombre: 'resultado_laboratorio.pdf', pos: 'tl', tipo: 'pdf' },
  { nombre: 'receta_medica.jpg', pos: 'tr', tipo: 'img' },
  { nombre: 'informe_clinico.pdf', pos: 'bl', tipo: 'pdf' },
  { nombre: 'orden_procedimiento.png', pos: 'br', tipo: 'img' },
]

function FileIcon({ tipo }) {
  const esImagen = tipo === 'img'
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
      <path
        d="M4 1.5h6.2L14 5.4v11.1a1.6 1.6 0 0 1-1.6 1.6H4a1.6 1.6 0 0 1-1.6-1.6V3.1A1.6 1.6 0 0 1 4 1.5Z"
        fill="var(--color-mf-bg-2)"
        stroke="var(--color-mf-sky)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M10.2 1.6v3.4a.8.8 0 0 0 .8.8h3"
        stroke="var(--color-mf-sky)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {esImagen ? (
        <circle cx="8.2" cy="12.4" r="2" stroke="var(--color-mf-dark-3)" strokeWidth="1.1" />
      ) : (
        <>
          <path
            d="M5 11.2h8M5 13.8h5.4"
            stroke="var(--color-mf-dark-3)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M8.2 15.4 7.6 14.4 6.6 15.8 5.4 13.4 4.8 14.2"
            stroke="var(--color-mf-sky)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}
    </svg>
  )
}

function ReCheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M3.6 7.7 5.9 10 11 4.9"
        stroke="var(--color-mf-sky)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AgentPreview() {
  return (
    <div className="agent">
      <svg
        className="agent__lines"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line x1="17" y1="15" x2="50" y2="50" className="agent__line" />
        <line x1="83" y1="15" x2="50" y2="50" className="agent__line" />
        <line x1="17" y1="85" x2="50" y2="50" className="agent__line" />
        <line x1="83" y1="85" x2="50" y2="50" className="agent__line" />
      </svg>

      {documentos.map((doc) => (
        <div key={doc.nombre} className={`agent__doc agent__doc--${doc.pos}`}>
          <FileIcon tipo={doc.tipo} />
          <span className="agent__doc-name">{doc.nombre}</span>
        </div>
      ))}

      <article className="agent__card">
        <div className="agent__card-head">
          <h2 className="agent__card-title">MediFlow Agent</h2>
          <span className="agent__card-status">
            <span className="agent__status-dot" aria-hidden="true" />
            Procesando...
          </span>
        </div>
        <ul className="agent__checks">
          {procesamiento.map((item) => (
            <li key={item} className="agent__check">
              <ReCheckIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  )
}

export default AgentPreview