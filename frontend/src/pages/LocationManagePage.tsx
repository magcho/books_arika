/**
 * Location Manage Page
 * Main page for location management
 */

import { LocationManager } from '../components/LocationManager/LocationManager'
import { DEFAULT_USER_ID } from '../config/constants'

export function LocationManagePage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <LocationManager userId={DEFAULT_USER_ID} />
    </div>
  )
}

