'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CircleAlert,
  Fingerprint,
  LoaderCircle,
  ScanFace,
  ShieldCheck,
} from 'lucide-react'
import { BanorteMark } from '@/components/icons'
import { markBiometricSession } from '@/components/auth-gate'

const CREDENTIAL_STORAGE_KEY = 'banorte-demo-webauthn-credential'
const DEMO_USER_ID = new TextEncoder().encode('carlos-ramirez-mendoza-demo')

function createChallenge() {
  const challenge = new Uint8Array(32)
  crypto.getRandomValues(challenge)
  return challenge
}

function toBase64Url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function fromBase64Url(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const decoded = atob(padded)
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0))
}

function getBiometricError(error) {
  if (error?.name === 'NotAllowedError') {
    return 'No pudimos confirmar tu identidad. Intenta de nuevo con tu biometría.'
  }

  if (error?.name === 'InvalidStateError') {
    return 'Este autenticador ya está registrado. Usa “Iniciar con biometría”.'
  }

  return 'No fue posible usar el autenticador biométrico de este dispositivo.'
}

export default function LoginPage() {
  const router = useRouter()
  const [support, setSupport] = useState('checking')
  const [credentialId, setCredentialId] = useState(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkSupport() {
      const supportsWebAuthn =
        window.isSecureContext &&
        'PublicKeyCredential' in window &&
        'credentials' in navigator

      if (!supportsWebAuthn) {
        setSupport('unsupported')
        return
      }

      const hasPlatformAuthenticator =
        typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !==
          'function' ||
        (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())

      setSupport(hasPlatformAuthenticator ? 'ready' : 'unsupported')
      setCredentialId(localStorage.getItem(CREDENTIAL_STORAGE_KEY))
    }

    checkSupport().catch(() => setSupport('unsupported'))
  }, [])

  async function finishAuthentication() {
    markBiometricSession()
    router.replace('/')
  }

  async function registerCredential() {
    setError('')
    setIsAuthenticating(true)

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: createChallenge(),
          rp: { name: 'Banorte GEN-AI' },
          user: {
            id: DEMO_USER_ID,
            name: 'carlos.ramirez@banorte.demo',
            displayName: 'Carlos Ramírez Mendoza',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            residentKey: 'preferred',
            userVerification: 'required',
          },
          timeout: 60_000,
          attestation: 'none',
        },
      })

      if (!credential) throw new Error('No se creó una credencial biométrica.')

      const id = toBase64Url(credential.rawId)
      localStorage.setItem(CREDENTIAL_STORAGE_KEY, id)
      setCredentialId(id)
      await finishAuthentication()
    } catch (registrationError) {
      setError(getBiometricError(registrationError))
    } finally {
      setIsAuthenticating(false)
    }
  }

  async function authenticate() {
    if (!credentialId) return registerCredential()

    setError('')
    setIsAuthenticating(true)

    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: createChallenge(),
          allowCredentials: [
            {
              id: fromBase64Url(credentialId),
              type: 'public-key',
            },
          ],
          userVerification: 'required',
          timeout: 60_000,
        },
      })

      if (!assertion || toBase64Url(assertion.rawId) !== credentialId) {
        throw new Error('La credencial no coincide con la registrada.')
      }

      await finishAuthentication()
    } catch (authenticationError) {
      setError(getBiometricError(authenticationError))
    } finally {
      setIsAuthenticating(false)
    }
  }

  const isReady = support === 'ready'
  const isRegistered = Boolean(credentialId)

  return (
    <main className="hero-bg-pattern relative grid min-h-dvh place-items-center overflow-hidden px-4 py-8 text-slate-800">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-banorte-red" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-red-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-slate-200/70 blur-3xl" />

      <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <div className="bg-banorte-red px-7 py-7 text-white sm:px-9">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-banorte-red shadow-lg shadow-red-950/20">
              <BanorteMark className="h-6 w-6" />
            </span>
            <div className="leading-none">
              <p className="text-lg font-extrabold tracking-tight">BANORTE</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/75">
                El Banco Fuerte de México
              </p>
            </div>
          </div>
          <p className="text-sm font-medium text-white/75">Acceso seguro</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Hola, Carlos</h1>
        </div>

        <div className="px-7 py-8 sm:px-9">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl border border-red-100 bg-red-50 text-banorte-red">
            {isRegistered ? <ScanFace className="h-10 w-10" aria-hidden="true" /> : <Fingerprint className="h-10 w-10" aria-hidden="true" />}
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900">
              {isRegistered ? 'Confirma tu identidad' : 'Activa tu biometría'}
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
              {isRegistered
                ? 'Usa Face ID, tu huella o Windows Hello para entrar a tu asistente financiero.'
                : 'Registra la biometría de este dispositivo para proteger tu acceso.'}
            </p>
          </div>

          {support === 'checking' && (
            <div className="mt-7 flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin text-banorte-red" aria-hidden="true" />
              Revisando el autenticador de este dispositivo...
            </div>
          )}

          {support === 'unsupported' && (
            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm leading-5 text-amber-900">
              <div className="flex gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <p>
                  Este navegador no tiene un autenticador biométrico disponible. Abre la demo en un dispositivo con Face ID, huella o Windows Hello y usa HTTPS o localhost.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-banorte-dark-red" role="alert">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={authenticate}
            disabled={!isReady || isAuthenticating}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-banorte-red px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-banorte-dark-red disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {isAuthenticating ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                Esperando confirmación...
              </>
            ) : (
              <>
                {isRegistered ? <ScanFace className="h-5 w-5" aria-hidden="true" /> : <Fingerprint className="h-5 w-5" aria-hidden="true" />}
                {isRegistered ? 'Iniciar con biometría' : 'Registrar con biometría'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 text-left">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <p className="text-xs leading-5 text-slate-500">
              Tu información biométrica nunca sale de tu dispositivo. Banorte solo solicita una confirmación segura.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
