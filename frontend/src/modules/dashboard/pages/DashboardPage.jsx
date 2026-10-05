import { getRol } from '../../../app/session'
import AdminDashboardPage from './AdminDashboardPage'
import DoctorDashboardPage from './DoctorDashboardPage'
import PatientDashboardPage from './PatientDashboardPage'

function DashboardPage() {
  const rol = getRol()

  if (rol === 'admin') return <AdminDashboardPage />
  if (rol === 'medico') return <DoctorDashboardPage />
  return <PatientDashboardPage />
}

export default DashboardPage