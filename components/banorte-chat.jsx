"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useEffect, useRef, useState } from "react"
import ChatHero, { BrandHeader } from "./chat-hero"
import MessageList from "./message-list"
import PromptInput from "./prompt-input"

export default function BanorteChat() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })
  const [input, setInput] = useState("")
  const bottomRef = useRef(null)

  const hasMessages = messages.length > 0
  const isBusy = status === "submitted" || status === "streaming"

  useEffect(() => {
    if (hasMessages) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, hasMessages])

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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 md:py-10">
      <div className={`flex flex-col ${hasMessages ? "" : "flex-1 justify-center"}`}>
        <BrandHeader compact={hasMessages} />
        {!hasMessages && <ChatHero onQuick={send} />}
      </div>

      {hasMessages && (
        <div className="flex flex-1 flex-col">
          <MessageList messages={messages} status={status} bottomRef={bottomRef} />
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
  )
}
