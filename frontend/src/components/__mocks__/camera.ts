/**
 * Camera API mock utility for BarcodeScanner component in Storybook
 */

export const mockCameraAPI = () => {
  // Mock navigator.mediaDevices.getUserMedia
  if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia = async (_constraints: MediaStreamConstraints) => {
      // Return a mock MediaStream with a video track
      const mockStream = {
        getTracks: () => [
          {
            kind: 'video',
            stop: () => {},
            enabled: true,
          },
        ],
      } as MediaStream
      
      return Promise.resolve(mockStream)
    }
  }
}

export const restoreCameraAPI = () => {
  // Restore original implementation if needed
  // For Storybook, we typically don't need to restore
}

