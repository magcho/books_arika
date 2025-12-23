/**
 * Location Manage Page
 * Main page for location management
 */

import { LocationManager } from '../components/LocationManager/LocationManager'
import { DEFAULT_USER_ID } from '../config/constants'

export function LocationManagePage() {
  return (
    <div>
      <LocationManager userId={DEFAULT_USER_ID} />
    </div>
  )
}

