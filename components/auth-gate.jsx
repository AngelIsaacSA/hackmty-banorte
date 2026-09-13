'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'

const AUTH_SESSION_KEY = 'banorte-demo-biometric-session'

export function markBiometricSession() {
  sessionStorage.setItem(AUTH_SESSION_KEY, 'authenticated')
}

function subscribeToSession() {
  return () => {}
}

function getClientSession() {
  return sessionStorage.getItem(AUTH_SESSION_KEY) === 'authenticated'
}

function getServerSession() {
  return false
}

export default function AuthGate({ children }) {
  const router = useRouter()
  const isAuthenticated = useSyncExternalStore(
    subscribeToSession,
    getClientSession,
    getServerSession,
  )

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-dvh place-items-center bg-banorte-gray-subtle">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-banorte-red" aria-label="Verificando sesión" />
      </main>
    )
  }

  return children
}
