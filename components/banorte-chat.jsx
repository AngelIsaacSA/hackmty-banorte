"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useEffect, useMemo, useRef, useState } from "react"
import ChatHero, { BrandHeader } from "./chat-hero"
import InterfacePanel from "./generative/InterfacePanel"
import { XIcon } from "./icons"
import MessageList from "./message-list"
import PromptInput from "./prompt-input"

function normalizeScreens(output) {
  if (!output || typeof output !== "object") return null
  if (Array.isArray(output.screens) && output.screens.length > 0) return output.screens
  if (output.component) return [{ component: output.component, data: output.data }]
  return null
}

// Recorre todos los mensajes y regresa CADA interfaz generada (screens ya
// normalizado a arreglo), en el orden en que se generaron, con el id del
// mensaje al que pertenece cada una. El chip "Ver interfaz generada" de un
// mensaje viejo debe abrir SU interfaz, no la más reciente de todo el chat
// — por eso se necesita la lista completa, no solo la última.
function findAllInterfaces(messages) {
  const interfaces = []
  for (const message of messages) {
    if (message.role !== "assistant") continue

    const parts = (message.parts || []).filter(
      (part) => part.type === "dynamic-tool" || part.type.startsWith("tool-")
    )

    for (let j = parts.length - 1; j >= 0; j--) {
      const part = parts[j]
      if (part.state !== "output-available") continue
      const screens = normalizeScreens(part.output)
      if (screens) {
        interfaces.push({ key: `${message.id}-${part.type}-${j}`, messageId: message.id, screens })
        break
      }
    }
  }
  return interfaces
}

export default function BanorteChat() {
  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })
  const [input, setInput] = useState("")
  const bottomRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const shouldStickToBottom = useRef(true)

  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [screenIndexByKey, setScreenIndexByKey] = useState({})
  const [lastSeenKey, setLastSeenKey] = useState(null)
  const [activeInterfaceKey, setActiveInterfaceKey] = useState(null)

  const hasMessages = messages.length > 0
  const isBusy = status === "submitted" || status === "streaming"
  const allInterfaces = useMemo(() => findAllInterfaces(messages), [messages])
  const latestInterface = allInterfaces[allInterfaces.length - 1] ?? null
  const activeInterface =
    allInterfaces.find((i) => i.key === activeInterfaceKey) ?? latestInterface

  // Antes esto pegaba el scroll hasta abajo en CADA cambio de `messages`,
  // incluyendo cada token que llega mientras el agente sigue escribiendo —
  // si el usuario intentaba subir a leer algo, el chat lo "jalaba" de
  // vuelta abajo a cada rato y se sentía como que no se podía scrollear.
  // Ahora solo se pega abajo si el usuario ya estaba cerca del final (igual
  // que cualquier chat real: si subiste a leer historial, se respeta y no
  // te regresa solo).
  useEffect(() => {
    if (hasMessages && shouldStickToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, hasMessages])

  function handleScroll() {
    const container = scrollContainerRef.current
    if (!container) return
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    shouldStickToBottom.current = distanceFromBottom < 96
  }

  // Cuando llega una interfaz nueva (una que no habíamos visto), se vuelve la
  // activa y el panel se expande solo. Si el usuario reabre una que ya vio
  // (tras colapsar, o el chip de un mensaje viejo), no se fuerza la
  // expansión aquí — eso lo dispara onOpenInterface o el botón de expandir
  // del panel colapsado. Se ajusta durante el render (no en un efecto)
  // siguiendo el patrón recomendado por React para "resetear" estado cuando
  // cambia algo derivado de props/estado externo.
  const latestKey = latestInterface?.key ?? null
  if (latestKey && latestKey !== lastSeenKey) {
    setLastSeenKey(latestKey)
    setActiveInterfaceKey(latestKey)
    setPanelCollapsed(false)
  }

  const submit = () => {
    const text = input.trim()
    if (!text || isBusy) return
    shouldStickToBottom.current = true
    sendMessage({ text })
    setInput("")
  }

  const send = (text) => {
    if (isBusy) return
    shouldStickToBottom.current = true
    sendMessage({ text })
    setInput("")
  }

  const onSelectMovimiento = (movimiento) => {
    send(
      `Muéstrame el detalle de este movimiento: ${movimiento.comercio}, $${Math.abs(
        movimiento.monto
      )} MXN, ${movimiento.fecha}.`
    )
  }

  const onElegirPlan = (meses) => {
    send(`Quiero el plan de ${meses} meses.`)
  }

  const onVerHistorial = () => {
    send('Muéstrame mis últimos movimientos de este mes.')
  }

  const onBuscarComercio = (comercio) => {
    send(`Muéstrame todos mis cargos de ${comercio}.`)
  }

  const onVerCategoria = (categoria) => {
    send(`¿Cuánto he gastado en ${categoria}?`)
  }

  // El chip "Ver interfaz generada" de un mensaje debe abrir la interfaz de
  // ESE mensaje, no siempre la más reciente del chat.
  const onOpenInterface = (messageId) => {
    const match = allInterfaces.find((i) => i.messageId === messageId)
    if (match) setActiveInterfaceKey(match.key)
    setPanelCollapsed(false)
  }

  const screenIndex = activeInterface ? screenIndexByKey[activeInterface.key] ?? 0 : 0

  const setScreenIndex = (index) => {
    if (!activeInterface) return
    setScreenIndexByKey((prev) => ({ ...prev, [activeInterface.key]: index }))
  }

  // El botón X del panel: borra TODO (historial + interfaces) y regresa a
  // la pantalla de inicio, según el flujo de "vida de la interfaz" acordado.
  // stop() es necesario: si hay una respuesta en curso y solo se limpiara
  // `messages`, al terminar de streamear esa respuesta se volvía a insertar
  // en el arreglo y "revivía" la conversación que se acababa de cerrar.
  const resetAll = () => {
    stop()
    setMessages([])
    setInput("")
    setPanelCollapsed(false)
    setScreenIndexByKey({})
    setLastSeenKey(null)
    setActiveInterfaceKey(null)
  }

  return (
    <div className="mx-auto flex w-full min-h-0 max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 md:py-10">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className={`flex flex-col ${hasMessages ? "" : "flex-1 justify-center"}`}>
          {hasMessages ? (
            <div className="flex items-center justify-between">
              <BrandHeader compact />
              <button
                type="button"
                onClick={resetAll}
                title="Terminar conversación y empezar de nuevo"
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-banorte-red hover:text-banorte-red"
              >
                <XIcon className="h-3.5 w-3.5" />
                Nueva conversación
              </button>
            </div>
          ) : (
            <BrandHeader />
          )}
          {!hasMessages && <ChatHero onQuick={send} />}
        </div>

        {hasMessages && (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto"
          >
            <MessageList
              messages={messages}
              status={status}
              bottomRef={bottomRef}
              onOpenInterface={onOpenInterface}
            />
          </div>
        )}

        <PromptInput
          value={input}
          onChange={setInput}
          onSubmit={submit}
          onSuggestion={send}
          disabled={isBusy}
          showHeading={!hasMessages}
          showSuggestions={!hasMessages}
        />
      </main>

      {activeInterface && (
        <InterfacePanel
          screens={activeInterface.screens}
          screenIndex={screenIndex}
          onScreenChange={setScreenIndex}
          collapsed={panelCollapsed}
          onCollapse={() => setPanelCollapsed(true)}
          onExpand={() => setPanelCollapsed(false)}
          onSelectMovimiento={onSelectMovimiento}
          onElegirPlan={onElegirPlan}
          onVerHistorial={onVerHistorial}
          onBuscarComercio={onBuscarComercio}
          onVerCategoria={onVerCategoria}
        />
      )}
    </div>
  )
}
