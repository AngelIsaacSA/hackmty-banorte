"use client"

import { useEffect, useRef, useState } from "react"
import { CircleAlert } from "lucide-react"
import { ArrowRight, MicIcon } from "./icons"

const SUGGESTIONS = [
  { label: "¿En qué gasté más este mes?", prompt: "¿En qué gasté más este mes?" },
  { label: "¿Me alcanza para fin de mes?", prompt: "¿Me alcanza para fin de mes?" },
  { label: "Último cobro de OXXO", prompt: "¿Dónde se fue mi último cobro de OXXO?" },
  { label: "Movimientos de los últimos 3 meses", prompt: "Quiero ver mis últimos movimientos de los últimos 3 meses" },
  { label: "¿En qué se me cobró hoy?", prompt: "¿En qué se me cobró hoy?" },
  { label: "¿Dónde se fue mi dinero?", prompt: "¿Dónde se fue mi dinero este mes?" },
]

export default function PromptInput({ value, onChange, onSubmit, onSuggestion, disabled, showHeading, showSuggestions }) {
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState("")
  const recognitionRef = useRef(null)
  const valueRef = useRef(value)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  // Detiene el reconocimiento si el componente se desmonta a media
  // escucha (por ejemplo, si el usuario manda el mensaje de otra forma).
  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      if (event.nativeEvent.isComposing || event.keyCode === 229) return
      event.preventDefault()
      onSubmit()
    }
  }

  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceError("Este navegador no soporta dictado por voz. Prueba en Chrome o Edge.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "es-MX"
    recognition.interimResults = true
    recognition.continuous = false

    // Dicta a partir de lo que ya había escrito, en vez de reemplazarlo,
    // para poder combinar texto escrito y hablado.
    const baseValue = valueRef.current ? `${valueRef.current} ` : ""

    recognition.onresult = (event) => {
      let transcript = ""
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript
      }
      onChange(`${baseValue}${transcript}`)
    }

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setVoiceError("Activa el permiso del micrófono para dictar.")
      } else if (event.error === "audio-capture") {
        setVoiceError("No se detectó micrófono en este dispositivo.")
      } else if (event.error === "network") {
        setVoiceError("Sin conexión al servicio de voz, revisa tu internet.")
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setVoiceError("No se pudo escuchar el audio, intenta de nuevo.")
      }
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition

    try {
      recognition.start()
      setIsListening(true)
    } catch {
      // Si el navegador bloquea el micrófono a nivel de política de SO
      // (común en Windows con permisos gestionados), recognition.start()
      // puede tirar una excepción síncrona en vez de disparar onerror. Sin
      // este try/catch, esa excepción se perdía sin avisar nada al
      // usuario — parecía que el botón no hacía absolutamente nada.
      setVoiceError("No se pudo iniciar el dictado. Revisa los permisos de micrófono de Windows y del navegador.")
    }
  }

  const toggleVoice = async () => {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceError("Este navegador no soporta dictado por voz. Prueba en Chrome o Edge.")
      return
    }

    setVoiceError("")

    // Pedir el permiso de micrófono por separado, ANTES de iniciar
    // SpeechRecognition, evita una carrera conocida en Chrome/Android:
    // si el diálogo de permiso aparece a la vez que arranca el
    // reconocimiento, la sesión de voz puede morir en silencio y el
    // primer intento del usuario simplemente no hace nada.
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
      } catch {
        setVoiceError("Activa el permiso del micrófono para dictar.")
        return
      }
    }

    startRecognition()
  }

  return (
    <section className="mx-auto w-full max-w-3xl pb-2">
      {showHeading && (
        <div className="mb-2.5 px-2">
          <label htmlFor="ai-prompt-input" className="text-base font-semibold text-slate-900 sm:text-lg">
            ¿Qué hacemos hoy?
          </label>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="relative flex items-center"
      >
        <input
          id="ai-prompt-input"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu consulta o comando financiero aquí..."
          className="w-full rounded-full border-2 border-slate-300 bg-white py-4 pl-6 pr-32 text-sm text-slate-800 shadow-lg shadow-slate-900/5 outline-none transition-all placeholder:text-slate-400 focus:border-banorte-red focus:ring-4 focus:ring-red-100 sm:text-base"
        />
        <div className="absolute right-2.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleVoice}
            onContextMenu={(event) => event.preventDefault()}
            disabled={disabled}
            title={isListening ? "Detener dictado" : "Activar entrada de voz"}
            className={`select-none touch-manipulation rounded-full p-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isListening
                ? "animate-pulse bg-red-50 text-banorte-red"
                : "text-slate-400 hover:bg-slate-100 hover:text-banorte-red"
            }`}
          >
            <MicIcon className="h-5 w-5" />
            <span className="sr-only">{isListening ? "Detener dictado" : "Activar entrada de voz"}</span>
          </button>
          <button
            type="submit"
            disabled={disabled}
            title="Enviar mensaje"
            className="inline-flex items-center justify-center rounded-full bg-banorte-red p-2.5 text-sm font-medium text-white shadow-md shadow-red-500/20 transition-all hover:bg-banorte-dark-red active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2.5"
          >
            <span className="hidden pr-1 font-semibold sm:inline">Enviar</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      {voiceError && (
        <div className="mt-2 flex items-center justify-center gap-1.5 px-2 text-center text-xs text-amber-700">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" />
          {voiceError}
        </div>
      )}

      {showSuggestions && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-400">Sugerencias:</span>
          {SUGGESTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSuggestion(item.prompt)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 transition-colors hover:bg-slate-100"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
