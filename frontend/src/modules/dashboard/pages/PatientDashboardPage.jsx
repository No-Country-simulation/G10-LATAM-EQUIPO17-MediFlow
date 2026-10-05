import DashboardShell from '../components/DashboardShell'

function PatientDashboardPage() {
  return (
    <DashboardShell
      rol="paciente"
      rolEtiqueta="Paciente"
      saludo="Hola, bienvenido a tu espacio"
      bienvenida="Consulta el estado de tus documentos y tu perfil de acceso."
    />
  )
}

export default PatientDashboardPage