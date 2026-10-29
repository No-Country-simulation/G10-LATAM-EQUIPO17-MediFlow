import DashboardShell from '../components/DashboardShell'

function PatientDashboardPage() {
  return (
    <DashboardShell
      rol="paciente"
      rolEtiqueta="Paciente"
      saludo="Hola, bienvenido a tu espacio"
      bienvenida="Envía documentos a triaje, consulta tus procesos completados y revisa tu perfil."
    />
  )
}

export default PatientDashboardPage
