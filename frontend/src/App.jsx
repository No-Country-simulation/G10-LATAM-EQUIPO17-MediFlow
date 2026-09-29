import LandingPage from './modules/landing/pages/LandingPage'
import AuthPage from './modules/auth/pages/AuthPage'

function getCurrentPage() {
  const { pathname } = window.location
  if (pathname === '/login' || pathname === '/registro') {
    return { page: 'auth', tab: pathname === '/login' ? 'login' : 'registro' }
  }
  return { page: 'landing' }
}

function App() {
  const route = getCurrentPage()

  if (route.page === 'auth') {
    return <AuthPage initialTab={route.tab} />
  }

  return <LandingPage />
}

export default App