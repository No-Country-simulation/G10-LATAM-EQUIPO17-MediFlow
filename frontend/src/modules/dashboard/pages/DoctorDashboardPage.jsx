import DashboardShell from '../components/DashboardShell'

function DoctorDashboardPage() {
  return (
    <DashboardShell
      rol="medico"
      rolEtiqueta="Profesional de la salud"
      saludo="Tu espacio clínico"
      bienvenida="Consulta tus revisiones asignadas y procesa documentos con el Agente MediFlow."
    />
  )
}

export default DoctorDashboardPage
