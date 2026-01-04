/**
 * Navigation Component
 * Provides page navigation links
 */

import { Link, useLocation } from 'react-router-dom'

export function Navigation() {
  const location = useLocation()

  const linkStyle = (path: string) => ({
    textDecoration: 'none',
    color: location.pathname === path ? '#0056b3' : '#007bff',
    marginLeft: '1rem',
    fontWeight: location.pathname === path ? 'bold' : 'normal',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    backgroundColor: location.pathname === path ? '#e7f3ff' : 'transparent',
  })

  return (
    <nav
      aria-label="メインナビゲーション"
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
      <Link to="/" style={linkStyle('/')}>
        書籍一覧
      </Link>
      <Link to="/register" style={linkStyle('/register')}>
        書籍登録
      </Link>
      <Link to="/locations" style={linkStyle('/locations')}>
        場所管理
      </Link>
      <Link to="/settings" style={linkStyle('/settings')}>
        設定
      </Link>
    </nav>
  )
}
