/**
 * Book Register Page
 * Main page for book registration
 */

import { useState } from 'react'
import { BookForm } from '../components/BookForm/BookForm'

const DEFAULT_USER_ID = 'default-user'

export function BookRegisterPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSuccess = () => {
    // Refresh to show success message or redirect
    setRefreshKey((prev) => prev + 1)
    alert('書籍が登録されました！')
  }

  return (
    <div>
      <BookForm key={refreshKey} onSuccess={handleSuccess} defaultUserId={DEFAULT_USER_ID} />
    </div>
  )
}

