import DashboardShell from '../components/DashboardShell'

function AdminDashboardPage() {
  return (
    <DashboardShell
      rol="admin"
      rolEtiqueta="Administración"
      saludo="Resumen operativo de MediFlow"
      bienvenida="Monitorea usuarios, documentos y la infraestructura de storage desde un solo lugar."
    />
  )
}

export default AdminDashboardPage