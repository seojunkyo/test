"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Calendar, LayoutGrid, MoreHorizontal } from "lucide-react"
import Sidebar from "./Sidebar"
import Header from "./Header"
import ChatPane from "./ChatPane"
import GhostIconButton from "./GhostIconButton"
import ThemeToggle from "./ThemeToggle"
import LoginModal from "./LoginModal" // Added LoginModal import
import SearchModal from "./SearchModal" // Added SearchModal import
import { INITIAL_CONVERSATIONS, INITIAL_TEMPLATES, INITIAL_FOLDERS } from "./mockData"

let idCounter = 0
const generateStableId = (prefix = "") => `${prefix}${++idCounter}`

export default function AIAssistantUI() {
  const [theme, setTheme] = useState("light")
  const [isClient, setIsClient] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false) // Added login modal state
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Added login state management
  const [hasInitialized, setHasInitialized] = useState(false) // Added initialization flag to prevent duplicate chat creation
  const [showSearchModal, setShowSearchModal] = useState(false)

  const [userData, setUserData] = useState({
    username: "",
    mail: "",
  })

  useEffect(() => {
    setIsClient(true)
    const saved = localStorage.getItem("theme")
    if (saved) {
      setTheme(saved)
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
    }

    const loginStatus = localStorage.getItem("isLoggedIn")
    const hasVisited = localStorage.getItem("hasVisited")

    if (loginStatus === "true") {
      setIsLoggedIn(true)
      setShowLoginModal(false) // Don't show login modal if already logged in
    } else {
      setIsLoggedIn(false)
      if (!hasVisited) {
        setShowLoginModal(true)
        localStorage.setItem("hasVisited", "true")
      }
    }

    setHasInitialized(true) // Mark as initialized
  }, [])

  useEffect(() => {
    if (!isClient) return

    try {
      if (theme === "dark") document.documentElement.classList.add("dark")
      else document.documentElement.classList.remove("dark")
      document.documentElement.setAttribute("data-theme", theme)
      document.documentElement.style.colorScheme = theme
      localStorage.setItem("theme", theme)
    } catch {}
  }, [theme, isClient])

  useEffect(() => {
    if (!isClient) return

    try {
      const media = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)")
      if (!media) return
      const listener = (e) => {
        const saved = localStorage.getItem("theme")
        if (!saved) setTheme(e.matches ? "dark" : "light")
      }
      media.addEventListener("change", listener)
      return () => media.removeEventListener("change", listener)
    } catch {}
  }, [isClient])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState({ pinned: true, recent: false })

  useEffect(() => {
    if (!isClient) return

    try {
      const raw = localStorage.getItem("sidebar-collapsed")
      if (raw) {
        setCollapsed(JSON.parse(raw))
      }
    } catch {}
  }, [isClient])

  useEffect(() => {
    if (!isClient) return

    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed))
    } catch {}
  }, [collapsed, isClient])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!isClient) return

    try {
      const saved = localStorage.getItem("sidebar-collapsed-state")
      if (saved) {
        setSidebarCollapsed(JSON.parse(saved))
      }
    } catch {}
  }, [isClient])

  useEffect(() => {
    if (!isClient) return

    try {
      localStorage.setItem("sidebar-collapsed-state", JSON.stringify(sidebarCollapsed))
    } catch {}
  }, [sidebarCollapsed, isClient])

  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS)
  const [selectedId, setSelectedId] = useState(null)
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
  const [folders, setFolders] = useState(INITIAL_FOLDERS)

  const [query, setQuery] = useState("")
  const searchRef = useRef(null)

  const [isThinking, setIsThinking] = useState(false)
  const [thinkingConvId, setThinkingConvId] = useState(null)

  useEffect(() => {
    if (!isClient) return

    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        createNewChat()
      }
      if (!e.metaKey && !e.ctrlKey && e.key === "/") {
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault()
          setShowSearchModal(true) // Open search modal on '/'
        }
      }
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sidebarOpen, conversations, isClient])

  useEffect(() => {
    if (!hasInitialized || !isLoggedIn) return // Don't create chat if not initialized or not logged in

    if (!selectedId && conversations.length === 0) {
      createNewChat()
    }
  }, [hasInitialized, isLoggedIn, selectedId, conversations.length])

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q))
  }, [conversations, query])

  const pinned = filtered.filter((c) => c.pinned).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  const recent = filtered
    .filter((c) => !c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 10)

  const folderCounts = React.useMemo(() => {
    const map = Object.fromEntries(folders.map((f) => [f.name, 0]))
    for (const c of conversations) if (map[c.folder] != null) map[c.folder] += 1
    return map
  }, [conversations, folders])

  function togglePin(id) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))
  }

  function createNewChat() {
    const id = generateStableId("chat_")
    const item = {
      id,
      title: "New Chat",
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      preview: "Say hello to start...",
      pinned: false,
      folder: "Work Projects",
      messages: [], // Ensure messages array is empty for new chats
    }
    setConversations((prev) => [item, ...prev])
    setSelectedId(id)
    setSidebarOpen(false)
  }

  function resetToHome() {
    if (selectedId) {
      // Clear messages of current conversation without creating a new one
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                messages: [],
                messageCount: 0,
                preview: "Say hello to start...",
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      )
    }
    setSidebarOpen(false)
  }

  function createFolder() {
    const name = prompt("Folder name")
    if (!name) return
    if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) return alert("Folder already exists.")
    setFolders((prev) => [...prev, { id: generateStableId("folder_"), name }])
  }

  function editMessage(convId, messageId, newContent) {
    const now = new Date().toISOString()
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = (c.messages || []).map((m) =>
          m.id === messageId ? { ...m, content: newContent, editedAt: now } : m,
        )
        return {
          ...c,
          messages: msgs,
          preview: msgs[msgs.length - 1]?.content?.slice(0, 80) || c.preview,
        }
      }),
    )
  }

  function resendMessage(convId, messageId, newContent = null) {
    const conv = conversations.find((c) => c.id === convId)
    const msg = conv?.messages?.find((m) => m.id === messageId)
    if (!msg || !composerRef.current) return

    const contentToSend = newContent || msg.content

    const messageIndex = conv.messages.findIndex((m) => m.id === messageId)
    if (messageIndex === -1) return

    const messagesBeforeResend = conv.messages.slice(0, messageIndex + 1)
    if (newContent) {
      messagesBeforeResend[messageIndex] = {
        ...messagesBeforeResend[messageIndex],
        content: newContent,
        editedAt: new Date().toISOString(),
      }
    }

    const updatedConv = {
      ...conv,
      messages: messagesBeforeResend,
      updatedAt: new Date().toISOString(),
      messageCount: messagesBeforeResend.length,
      preview: messagesBeforeResend[messagesBeforeResend.length - 1]?.content?.slice(0, 80) || conv.preview,
    }

    setConversations((prev) => prev.map((c) => (c.id === convId ? updatedConv : c)))

    if (composerRef.current && typeof composerRef.current.handleSendMessage === "function") {
      composerRef.current.handleSendMessage(contentToSend, updatedConv, true)
    }
  }

  function pauseThinking() {
    setIsThinking(false)
    setThinkingConvId(null)
  }

  function handleUseTemplate(template) {
    // This will be passed down to the Composer component
    // The Composer will handle inserting the template content
    if (composerRef.current) {
      composerRef.current.insertTemplate(template.content)
    }
  }

  function updateConversationTitle(convId, newTitle) {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c)),
    )
  }

  const composerRef = useRef(null)

  const selected = conversations.find((c) => c.id === selectedId) || nul

  if (!isLoggedIn && showLoginModal) {
    return (
      <div className="h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        conversations={conversations}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id)
          setShowSearchModal(false)
        }}
        togglePin={togglePin}
        createNewChat={createNewChat}
      />

      <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 border-b border-zinc-200/60 bg-white/80 px-3 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="ml-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-flex h-4 w-4 items-center justify-center">✱</span> AI Assistant
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GhostIconButton label="Schedule">
            <Calendar className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="Apps">
            <LayoutGrid className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="More">
            <MoreHorizontal className="h-4 w-4" />
          </GhostIconButton>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>

      <div className="mx-auto flex h-[calc(100vh-0px)] max-w-[1400px]">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          theme={theme}
          setTheme={setTheme}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          conversations={conversations}
          pinned={pinned}
          recent={recent}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          togglePin={togglePin}
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          createNewChat={createNewChat}
          isClient={isClient}
          userData={userData}
          isLoggedIn={isLoggedIn}
          showSearchModal={showSearchModal}
          setShowSearchModal={setShowSearchModal}
          onResetToHome={resetToHome} // Pass resetToHome handler to Sidebar
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <Header
            createNewChat={createNewChat}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarOpen={setSidebarOpen}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
          />
          <ChatPane
            ref={composerRef}
            conversation={selected}
            onUpdateConversation={(updatedConv) => {
              setConversations((prev) => prev.map((c) => (c.id === updatedConv.id ? updatedConv : c)))
            }}
            onEditMessage={(messageId, newContent) => selected && editMessage(selected.id, messageId, newContent)}
            onResendMessage={(messageId, newContent) => selected && resendMessage(selected.id, messageId, newContent)}
            onUpdateTitle={(newTitle) => selected && updateConversationTitle(selected.id, newTitle)}
            isThinking={isThinking && thinkingConvId === selected?.id}
            onPauseThinking={pauseThinking}
            setIsThinking={setIsThinking}
            setThinkingConvId={setThinkingConvId}
            generateStableId={generateStableId}
          />
        </main>
      </div>
    </div>
  )
}
