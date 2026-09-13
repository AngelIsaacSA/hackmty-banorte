"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useEffect, useMemo, useRef, useState } from "react"
import ChatHero, { BrandHeader } from "./chat-hero"
import InterfacePanel from "./generative/InterfacePanel"
import MessageList from "./message-list"
import PromptInput from "./prompt-input"

function normalizeScreens(output) {
  if (!output || typeof output !== "object") return null
  if (Array.isArray(output.screens) && output.screens.length > 0) return output.screens
  if (output.component) return [{ component: output.component, data: output.data }]
  return null
}

// Recorre los mensajes de atrás hacia adelante y regresa la última interfaz
// generada (screens ya normalizado a arreglo), o null si no hay ninguna.
// Esto es lo que hace que el panel "recuerde" en qué interfaz estaba: como
// se deriva de `messages` (que useChat nunca borra salvo un reset), colapsar
// y reabrir el panel siempre cae en la misma interfaz sin estado adicional.
function findLatestInterface(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role !== "assistant") continue

    const parts = (message.parts || []).filter(
      (part) => part.type === "dynamic-tool" || part.type.startsWith("tool-")
    )

    for (let j = parts.length - 1; j >= 0; j--) {
      const part = parts[j]
      if (part.state !== "output-available") continue
      const screens = normalizeScreens(part.output)
      if (screens) {
        return { key: `${message.id}-${part.type}-${j}`, screens }
      }
    }
  }
  return null
}

export default function BanorteChat() {
  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })
  const [input, setInput] = useState("")
  const bottomRef = useRef(null)

  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [screenIndexByKey, setScreenIndexByKey] = useState({})
  const [lastSeenKey, setLastSeenKey] = useState(null)

  const hasMessages = messages.length > 0
  const isBusy = status === "submitted" || status === "streaming"
  const activeInterface = useMemo(() => findLatestInterface(messages), [messages])

  useEffect(() => {
    if (hasMessages) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, hasMessages])

  // Cuando llega una interfaz nueva (una que no habíamos visto), el panel se
  // expande solo. Si el usuario reabre una que ya vio (tras colapsar), no se
  // vuelve a forzar la expansión aquí — eso lo dispara el chip del chat o el
  // botón de expandir del panel colapsado. Se ajusta durante el render (no
  // en un efecto) siguiendo el patrón recomendado por React para "resetear"
  // estado cuando cambia algo derivado de props/estado externo.
  const activeKey = activeInterface?.key ?? null
  if (activeKey && activeKey !== lastSeenKey) {
    setLastSeenKey(activeKey)
    setPanelCollapsed(false)
  }

  const submit = () => {
    const text = input.trim()
    if (!text || isBusy) return
    sendMessage({ text })
    setInput("")
  }

  const send = (text) => {
    if (isBusy) return
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
  }

  return (
    <div className="mx-auto flex w-full min-h-0 max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 md:py-10">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className={`flex flex-col ${hasMessages ? "" : "flex-1 justify-center"}`}>
          <BrandHeader compact={hasMessages} />
          {!hasMessages && <ChatHero onQuick={send} />}
        </div>

        {hasMessages && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <MessageList
              messages={messages}
              status={status}
              bottomRef={bottomRef}
              onOpenInterface={() => setPanelCollapsed(false)}
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
          onClose={resetAll}
          onSelectMovimiento={onSelectMovimiento}
          onElegirPlan={onElegirPlan}
        />
      )}
    </div>
  )
}
