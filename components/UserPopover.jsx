"use client"
import { useState } from "react"
import { User, LogOut } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

export default function UserPopover({ children, onLogout }) {
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end" side="bottom">
        <div className="p-4">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">user@example.com</div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 mb-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">사용자 이름</span>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
