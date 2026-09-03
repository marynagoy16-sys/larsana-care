import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/providers/AuthProvider'
import { CookieConsentBanner } from '@/components/legal/CookieConsentBanner'
import { LegalReacceptGate } from '@/components/legal/LegalReacceptGate'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
})

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          {children}
          <LegalReacceptGate />
          <CookieConsentBanner />
          <Toaster position="top-center" richColors closeButton />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
