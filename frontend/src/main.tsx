import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { bootstrapNativeShell } from '@/lib/native'
import { installMobileKeyboardViewportFix } from '@/lib/mobileKeyboardViewport'

void bootstrapNativeShell()
installMobileKeyboardViewportFix()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
