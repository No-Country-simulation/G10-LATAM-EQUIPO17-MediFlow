import DashboardShell from '../components/DashboardShell'

function DoctorDashboardPage() {
  return (
    <DashboardShell
      rol="medico"
      rolEtiqueta="Profesional de la salud"
      saludo="Tu espacio clínico"
      bienvenida="Revisa el flujo de documentos y sigue el trabajo del Agente MediFlow."
    />
  )
}

export default DoctorDashboardPage