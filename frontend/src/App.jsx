import { Navigate, Route, Routes } from 'react-router-dom'
import { ROLES } from './app/session'
import { RequireAuth, RequireRole } from './app/guards/RequireAuth'
import DashboardLayout from './app/layouts/dashboard/DashboardLayout'
import LandingPage from './modules/landing/pages/LandingPage'
import AuthPage from './modules/auth/pages/AuthPage'
import DocumentProcessingPage from './modules/document-processing/pages/DocumentProcessingPage'
import DashboardPage from './modules/dashboard/pages/DashboardPage'
import AgentPage from './modules/agent/pages/AgentPage'
import UsersPage from './modules/users/pages/UsersPage'
import DocumentsPage from './modules/documents/pages/DocumentsPage'
import StoragePage from './modules/storage/pages/StoragePage'
import ProfilePage from './modules/profile/pages/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage initialTab="login" />} />
      <Route path="/registro" element={<AuthPage initialTab="registro" />} />
      <Route path="/document-processing" element={<DocumentProcessingPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/agent"
            element={
              <RequireRole roles={[ROLES.ADMIN, ROLES.MEDICO]}>
                <AgentPage />
              </RequireRole>
            }
          />
          <Route
            path="/users"
            element={
              <RequireRole roles={[ROLES.ADMIN]}>
                <UsersPage />
              </RequireRole>
            }
          />
          <Route
            path="/documents"
            element={
              <RequireRole roles={[ROLES.ADMIN, ROLES.MEDICO]}>
                <DocumentsPage />
              </RequireRole>
            }
          />
          <Route
            path="/storage"
            element={
              <RequireRole roles={[ROLES.ADMIN]}>
                <StoragePage />
              </RequireRole>
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App