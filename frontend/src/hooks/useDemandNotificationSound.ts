import { useEffect, useRef } from 'react'

function playDemandAlertTone() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
    void ctx.close()
  } catch {
    // Autoplay pode ser bloqueado até interação do usuário
  }
}

/** Toca alerta sonoro quando novas demandas aparecem (estilo Uber). */
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
