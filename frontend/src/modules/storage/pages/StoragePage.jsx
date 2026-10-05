import { useCallback, useEffect, useState } from 'react'
import OciHealthCard from '../components/OciHealthCard'
import { verificarSaludStorage } from '../services/storageService'
import './storage.css'

function StoragePage() {
  const [estado, setEstado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(() => {
    verificarSaludStorage()
      .then((datos) => {
        setEstado(datos)
        setError('')
      })
      .catch((err) => {
        const mensaje = err.status === 503
          ? 'Buckets no disponibles. Verifica la configuración OCI en el backend.'
          : err.message || 'No se pudo consultar el estado del storage.'
        setError(mensaje)
        setEstado(null)
      })
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const handleReintentar = () => {
    setCargando(true)
    cargar()
  }

  return (
    <div className="storage-page">
      <header className="storage-page__intro">
        <span className="storage-page__kicker">Infraestructura</span>
        <h1>Storage</h1>
        <p>
          Monitorea el estado de la infraestructura OCI Object Storage de MediFlow.
          Solo disponible para administradores.
        </p>
      </header>

      <OciHealthCard
        estado={estado}
        error={error}
        cargando={cargando}
        onReintentar={handleReintentar}
      />
    </div>
  )
}

export default StoragePage