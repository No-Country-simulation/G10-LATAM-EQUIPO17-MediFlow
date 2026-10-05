const ETAPAS = [
  {
    numero: '01',
    titulo: 'Ingesta',
    detalle: 'Recepción del documento clínico.',
  },
  {
    numero: '02',
    titulo: 'Clasificación',
    detalle: 'Tipo de documento, especialidad y prioridad.',
  },
  {
    numero: '03',
    titulo: 'Extracción',
    detalle: 'Datos clínicos relevantes del texto.',
  },
  {
    numero: '04',
    titulo: 'Enrutamiento',
    detalle: 'Decisión de destino y auditoría si aplica.',
  },
]

function TriajeStages() {
  return (
    <ol className="agent-stages">
      {ETAPAS.map((etapa) => (
        <li key={etapa.numero} className="agent-stages__item">
          <span className="agent-stages__numero">{etapa.numero}</span>
          <span className="agent-stages__copy">
            <strong>{etapa.titulo}</strong>
            <small>{etapa.detalle}</small>
          </span>
        </li>
      ))}
    </ol>
  )
}

export default TriajeStages