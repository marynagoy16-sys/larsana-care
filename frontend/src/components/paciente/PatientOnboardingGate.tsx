import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  bootstrapPatientAccount,
  getPatientOnboardingStatus,
} from '@/services/patientOnboarding'

const ONBOARDING_PATH = '/paciente/onboarding'

export function PatientOnboardingGate({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [ready, setReady] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  const isOnboardingRoute = location.pathname === ONBOARDING_PATH

  useEffect(() => {
    let mounted = true

    async function checkStatus() {
      try {
        let status = await getPatientOnboardingStatus()

        if (!status.linked) {
          await bootstrapPatientAccount()
          status = await getPatientOnboardingStatus()
        }

        if (!mounted) return
        setNeedsOnboarding(status.needs_onboarding)
      } catch {
        if (!mounted) return
        setNeedsOnboarding(false)
      } finally {
        if (mounted) setReady(true)
      }
    }

    void checkStatus()

    return () => {
      mounted = false
    }
  }, [location.pathname])

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (needsOnboarding && !isOnboardingRoute) {
    return <Navigate to={ONBOARDING_PATH} replace />
  }

  if (!needsOnboarding && isOnboardingRoute) {
    return <Navigate to="/paciente/solicitar" replace />
  }

  return <>{children}</>
}
