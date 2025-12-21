import { useState } from 'react'

function App() {
  const [status, setStatus] = useState<string>('Checking...')

  const checkHealth = async () => {
    try {
      const response = await fetch('http://localhost:8787/health')
      const data = await response.json()
      setStatus(`Backend is healthy: ${JSON.stringify(data)}`)
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Books Arika - Frontend</h1>
      <p>Status: {status}</p>
      <button onClick={checkHealth}>Check Backend Health</button>
    </div>
  )
}

export default App

