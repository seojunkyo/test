"use client"

import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react"
import { Pencil, RefreshCw, Check, X, Square } from "lucide-react"
import Message from "./Message"
import Composer from "./Composer"
import { cls } from "./utils"

function ThinkingMessage({ onPause }) {
  return (
    <Message role="assistant">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
        </div>
        <span className="text-sm text-zinc-500">AI is thinking...</span>
        <button
          onClick={onPause}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <Square className="h-3 w-3" /> Pause
        </button>
      </div>
    </Message>
  )
}

const ChatPane = forwardRef(function ChatPane(
  {
    conversation,
    onUpdateConversation,
    onEditMessage,
    onResendMessage,
    onUpdateTitle, // Add onUpdateTitle prop
    isThinking,
    onPauseThinking,
    setIsThinking,
    setThinkingConvId,
    generateStableId,
  },
  ref,
) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState("")
  const composerRef = useRef(null)
  const titleEditRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (titleEditRef.current && !titleEditRef.current.contains(event.target) && editingTitle) {
        saveTitleEdit()
      }
    }

    if (editingTitle) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [editingTitle, titleDraft])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversation?.messages, isThinking])

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        composerRef.current?.insertTemplate(templateContent)
      },
      handleSendMessage: handleSendMessage,
    }),
    [],
  )

  async function handleSendMessage(message, targetConversation = null, isResend = false) {
    if (!message.trim()) return

    const currentConv = targetConversation || conversation

    if (!currentConv) {
      const newConvId = generateStableId("chat_")
      const newConv = {
        id: newConvId,
        title: "New Chat",
        updatedAt: new Date().toISOString(),
        messageCount: 0,
        preview: "Say hello to start...",
        pinned: false,
        folder: "Work Projects",
        messages: [],
      }
      onUpdateConversation?.(newConv)
      // Wait a bit for the conversation to be updated, then retry
      setTimeout(() => handleSendMessage(message, newConv, isResend), 100)
      return
    }

    setBusy(true)
    setIsThinking?.(true)
    setThinkingConvId?.(currentConv.id)

    const now = new Date().toISOString()
    const userMsg = {
      id: generateStableId("msg_"),
      role:"user",
      content: message,
      createdAt: now,
    }

    const aiMsg = {
      id: generateStableId("msg_"),
      role:"assistant",
      content: "",
      streaming: true,
    };

    let updatedConv = currentConv
    if (!isResend) {
      updatedConv = {
        ...currentConv,
        messages: [...(currentConv.messages || []), userMsg],
        updatedAt: now,
        messageCount: (currentConv.messages || []).length + 1,
        preview: message.slice(0, 80),
      }
      onUpdateConversation?.(updatedConv)
    }

    const payload = {
      messages: updateConv.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }

    try {
      const response = await fetch("https://localhost:3000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("[v0] API response:", result)

        setIsThinking?.(false)
        setThinkingConvId?.(null)

        if (result && result.reply) {
          const asstMsg = {
            id: generateStableId("msg_"),
            role: "assistant",
            content: result.reply,
            createdAt: new Date().toISOString(),
          }

          const finalConv = {
            ...updatedConv,
            messages: [...updatedConv.messages, asstMsg],
            updatedAt: new Date().toISOString(),
            messageCount: updatedConv.messages.length + 1,
            preview: asstMsg.content.slice(0, 80),
          }
          onUpdateConversation?.(finalConv)
        }
      } else {
        console.error("[v0] API call failed with status:", response.status)
        setTimeout(() => {
          setIsThinking?.(false)
          setThinkingConvId?.(null)
          const errorMsg = {
            id: generateStableId("msg_"),
            role: "assistant",
            content: "죄송합니다. 현재 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
            createdAt: new Date().toISOString(),
          }

          const errorConv = {
            ...updatedConv,
            messages: [...updatedConv.messages, errorMsg],
            updatedAt: new Date().toISOString(),
            messageCount: updatedConv.messages.length + 1,
            preview: errorMsg.content.slice(0, 80),
          }
          onUpdateConversation?.(errorConv)
        }, 2000)
      }
    } catch (error) {
      console.error("[v0] API call failed:", error)
      setTimeout(() => {
        setIsThinking?.(false)
        setThinkingConvId?.(null)
        const errorMsg = {
          id: generateStableId("msg_"),
          role: "assistant",
          content: "죄송합니다. 현재 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
          createdAt: new Date().toISOString(),
        }

        const errorConv = {
          ...updatedConv,
          messages: [...updatedConv.messages, errorMsg],
          updatedAt: new Date().toISOString(),
          messageCount: updatedConv.messages.length + 1,
          preview: errorMsg.content.slice(0, 80),
        }
        onUpdateConversation?.(errorConv)
      }, 2000)
    } finally {
      setBusy(false)
    }
  }

  if (!conversation) return null

  const messages = Array.isArray(conversation.messages) ? conversation.messages : []
  const count = messages.length || conversation.messageCount || 0

  const lastUserMessageIndex = messages
    .map((m, idx) => ({ ...m, idx }))
    .filter((m) => m.role === "user")
    .pop()?.idx

  const exampleMessages = ["ITSM이란?", "2025년 팀 별 만족도 점수를 알려줘", "팀 별 품질컨덕터를 알려줘"]

  async function handleExampleClick(message) {
    await handleSendMessage(message)
  }

  function startEdit(m) {
    setEditingId(m.id)
    setDraft(m.content)
  }
  function cancelEdit() {
    setEditingId(null)
    setDraft("")
  }
  function saveEdit() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    cancelEdit()
  }
  function saveAndResend() {
    if (!editingId) return

    onResendMessage?.(editingId, draft)
    cancelEdit()
  }

  function startTitleEdit() {
    setEditingTitle(true)
    setTitleDraft(conversation?.title || "New Chat")
  }

  function saveTitleEdit() {
    if (titleDraft.trim() && onUpdateTitle) {
      onUpdateTitle(titleDraft.trim())
    }
    setEditingTitle(false)
    setTitleDraft("")
  }

  function cancelTitleEdit() {
    setEditingTitle(false)
    setTitleDraft("")
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div ref={scrollContainerRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mb-2 text-3xl font-serif tracking-tight sm:text-4xl md:text-5xl">
          {editingTitle ? (
            <div ref={titleEditRef} className="flex items-center gap-2">
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitleEdit()
                  if (e.key === "Escape") cancelTitleEdit()
                }}
                className="flex-1 bg-transparent border-b border-zinc-300 dark:border-zinc-700 outline-none text-2xl font-sans"
                autoFocus
              />
              <button onClick={saveTitleEdit} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={cancelTitleEdit} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <span
              className="inline-block leading-[1.05] font-sans text-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2 py-1 rounded cursor-pointer transition-colors"
              onClick={startTitleEdit}
              title="Click to edit title"
            >
              {conversation?.title || "New Chat"}
            </span>
          )}
        </div>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-semibold text-zinc-800 dark:text-zinc-200">무엇을 도와드릴까요?</h2>
              <p className="text-zinc-600 dark:text-zinc-400">예시를 눌러 시작해보세요</p>
            </div>

            <div className="flex gap-3 max-w-2xl flex-wrap justify-center">
              {exampleMessages.map((message, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(message)}
                  className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500 dark:hover:bg-zinc-750 whitespace-nowrap"
                >
                  <div className="flex items-center justify-center relative z-10">
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {message}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-all duration-300 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, index) => (
              <div key={m.id} className="space-y-2">
                {editingId === m.id ? (
                  <div className={cls("rounded-2xl border p-2", "border-zinc-200 dark:border-zinc-800")}>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="w-full resize-y rounded-xl bg-transparent p-2 text-sm outline-none"
                      rows={3}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={saveEdit}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-zinc-900"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={saveAndResend}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Save & Resend
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <Message role={m.role}>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    {m.role === "user" && index === lastUserMessageIndex && (
                      <div className="mt-1 flex gap-2 text-[11px] text-zinc-500">
                        <button className="inline-flex items-center gap-1 hover:underline" onClick={() => startEdit(m)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-1 hover:underline"
                          onClick={() => onResendMessage?.(m.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Resend
                        </button>
                      </div>
                    )}
                  </Message>
                )}
              </div>
            ))}
            {isThinking && <ThinkingMessage onPause={onPauseThinking} />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <Composer ref={composerRef} onSend={handleSendMessage} busy={busy} />
    </div>
  )
})

export default ChatPane
