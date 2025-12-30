import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BookRegisterPage } from './pages/BookRegisterPage'
import { BookListPage } from './pages/BookListPage'
import { LocationManagePage } from './pages/LocationManagePage'
import { Navigation } from './components/Navigation/Navigation'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div style={{ fontFamily: 'system-ui', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <Navigation />
          <Routes>
            <Route path="/" element={<BookListPage />} />
            <Route path="/register" element={<BookRegisterPage />} />
            <Route path="/locations" element={<LocationManagePage />} />
          </Routes>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App

