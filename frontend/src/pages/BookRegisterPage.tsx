/**
 * Book Register Page
 * Main page for book registration
 */

import { useState } from 'react'
import { BookForm } from '../components/BookForm/BookForm'
import { DEFAULT_USER_ID } from '../config/constants'

export function BookRegisterPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSuccess = () => {
    // Refresh to show success message or redirect
    setRefreshKey((prev) => prev + 1)
    alert('書籍が登録されました！')
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <BookForm key={refreshKey} onSuccess={handleSuccess} defaultUserId={DEFAULT_USER_ID} />
    </div>
  )
}

