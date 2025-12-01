"use client"
import { useState, useRef, useEffect } from "react"
import { MoreVertical, Pin, PinOff, Pencil, Trash2, Check, X } from "lucide-react"
import { cls, timeAgo } from "./utils"

export default function ConversationRow({ data, active, onSelect, onTogglePin, onRename, onDelete, showMeta }) {
  const [showMenu, setShowMenu] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState(data.title)
  const menuRef = useRef(null)
  const inputRef = useRef(null)

  const count = Array.isArray(data.messages) ? data.messages.length : data.messageCount

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showMenu])

  // Focus input when renaming starts
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const handleMenuClick = (e) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handlePin = (e) => {
    e.stopPropagation()
    onTogglePin()
    setShowMenu(false)
  }

  const handleStartRename = (e) => {
    e.stopPropagation()
    setIsRenaming(true)
    setNewTitle(data.title)
    setShowMenu(false)
  }

  const handleSaveRename = (e) => {
    e?.stopPropagation()
    if (newTitle.trim() && newTitle !== data.title) {
      onRename?.(data.id, newTitle.trim())
    }
    setIsRenaming(false)
  }

  const handleCancelRename = (e) => {
    e?.stopPropagation()
    setIsRenaming(false)
    setNewTitle(data.title)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete?.(data.id)
    setShowMenu(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSaveRename(e)
    } else if (e.key === "Escape") {
      handleCancelRename(e)
    }
  }

  return (
    <div className="group relative">
      <div
        onClick={onSelect}
        className={cls(
          "-mx-1 flex w-[calc(100%+8px)] items-center gap-2 rounded-lg px-2 py-2 text-left cursor-pointer",
          active
            ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800/60 dark:text-zinc-100"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
        )}
        title={data.title}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onSelect()
          }
        }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isRenaming ? (
              <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none text-sm font-medium"
                />
                <button onClick={handleSaveRename} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded">
                  <Check className="h-3 w-3" />
                </button>
                <button onClick={handleCancelRename} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <>
                <span className="truncate text-sm font-medium tracking-tight">{data.title}</span>
                <span className="shrink-0 text-[11px] text-zinc-500 dark:text-zinc-400">{timeAgo(data.updatedAt)}</span>
              </>
            )}
          </div>
          {showMeta && !isRenaming && (
            <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">{count} messages</div>
          )}
        </div>

        {!isRenaming && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuClick}
              className="rounded-md p-1 text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:bg-zinc-200/50 dark:text-zinc-300 dark:hover:bg-zinc-700/60"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                <button
                  onClick={handlePin}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {data.pinned ? (
                    <>
                      <PinOff className="h-4 w-4" />
                      고정 해제
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4" />
                      고정
                    </>
                  )}
                </button>
                <button
                  onClick={handleStartRename}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <Pencil className="h-4 w-4" />
                  이름 변경
                </button>
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700"
                >
                  <Trash2 className="h-4 w-4" />
                  삭제
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute left-[calc(100%+6px)] top-1 hidden w-64 rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-700 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 md:group-hover:block">
        <div className="line-clamp-6 whitespace-pre-wrap">{data.preview}</div>
      </div>
    </div>
  )
}
