import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { BookRegisterPage } from './pages/BookRegisterPage'

function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'system-ui', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <nav
          style={{
            backgroundColor: '#fff',
            padding: '1rem',
            borderBottom: '1px solid #ddd',
            marginBottom: '1rem',
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              color: '#007bff',
              fontWeight: 'bold',
              fontSize: '1.2rem',
            }}
          >
            Books Arika
          </Link>
          <Link
            to="/register"
            style={{
              textDecoration: 'none',
              color: '#007bff',
              marginLeft: '1rem',
            }}
          >
            書籍登録
          </Link>
        </nav>
        <Routes>
          <Route
            path="/"
            element={
              <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <h1>Books Arika</h1>
                <p>書籍管理システムへようこそ</p>
                <Link
                  to="/register"
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                  }}
                >
                  書籍を登録する
                </Link>
              </div>
            }
          />
          <Route path="/register" element={<BookRegisterPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App

