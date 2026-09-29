import LandingPage from './modules/landing/pages/LandingPage'
import AuthPage from './modules/auth/pages/AuthPage'
import DocumentProcessingPage from './modules/document-processing/pages/DocumentProcessingPage'

function getCurrentPage() {
  const { pathname } = window.location
  if (pathname === '/login' || pathname === '/registro') {
    return { page: 'auth', tab: pathname === '/login' ? 'login' : 'registro' }
  }
  if (pathname === '/document-processing') {
    return { page: 'document-processing' }
  }
  return { page: 'landing' }
}

function App() {
  const route = getCurrentPage()

  if (route.page === 'auth') {
    return <AuthPage initialTab={route.tab} />
  }

  if (route.page === 'document-processing') {
    return <DocumentProcessingPage />
  }

  return <LandingPage />
}

export default App
