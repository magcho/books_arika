/**
 * Barcode Scanner Component
 * Camera-based ISBN barcode scanning using browser APIs
 * 
 * TODO: Implement actual barcode scanning functionality
 * - Option 1: Use html5-qrcode library (supports ISBN barcodes)
 * - Option 2: Use @zxing/library for barcode scanning
 * - Current implementation only provides camera access UI
 * - Manual ISBN input is available as fallback
 */

import { useState, useRef, useEffect } from 'react'

interface BarcodeScannerProps {
  onScan: (isbn: string) => void
  onError: (error: Error) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onError, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualISBN, setManualISBN] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup: stop camera stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        streamRef.current = stream
        setIsScanning(true)
      }
    } catch (error) {
      onError(
        new Error(
          'カメラへのアクセスが拒否されました。手動でISBNを入力してください。'
        )
      )
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const handleManualSubmit = () => {
    if (manualISBN.trim()) {
      onScan(manualISBN.trim())
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '100%',
        }}
      >
        <h2 style={{ marginTop: 0 }}>バーコードスキャン</h2>

        {!isScanning ? (
          <div>
            <p>カメラでISBNバーコードをスキャンします</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={startScanning} style={{ flex: 1 }}>
                スキャン開始
              </button>
              <button onClick={onClose} style={{ flex: 1 }}>
                キャンセル
              </button>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ccc' }}>
              <p>または、手動でISBNを入力:</p>
              <input
                type="text"
                value={manualISBN}
                onChange={(e) => setManualISBN(e.target.value)}
                placeholder="ISBNを入力"
                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
              />
              <button onClick={handleManualSubmit} style={{ width: '100%' }}>
                確定
              </button>
            </div>
          </div>
        ) : (
          <div>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                maxHeight: '300px',
                backgroundColor: '#000',
                borderRadius: '4px',
              }}
              playsInline
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={stopScanning} style={{ flex: 1 }}>
                停止
              </button>
              <button onClick={onClose} style={{ flex: 1 }}>
                閉じる
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              注意: 実際のバーコード読み取り機能は、html5-qrcodeなどのライブラリを使用して実装する必要があります。
              現在は手動入力のみ対応しています。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

