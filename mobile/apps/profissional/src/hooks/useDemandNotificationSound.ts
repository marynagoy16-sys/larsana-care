import { useEffect, useRef } from 'react'
import { Vibration } from 'react-native'

function playDemandAlertTone() {
  try {
    Vibration.vibrate([0, 120, 60, 120])
  } catch {
    // Pode falhar em simuladores ou dispositivos sem vibrador
  }
}

/** Alerta quando novas demandas aparecem (estilo Uber). */
export function useDemandNotificationSound(currentCount: number, enabled = true) {
  const prevCountRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (prevCountRef.current != null && currentCount > prevCountRef.current) {
      playDemandAlertTone()
    }
    prevCountRef.current = currentCount
  }, [currentCount, enabled])
}
