"use client"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Bot } from "lucide-react"
import { useState } from "react"

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [isLogin, setIsLogin] = useState(true)

  const handleClose = () => {
    onClose()
  }

  const handleLogin = () => {
    if (onLogin) {
      onLogin()
    }
    handleClose()
  }

  const handleSignup = () => {
    if (onLogin) {
      onLogin()
    }
    handleClose()
  }

  const handleBackdropClick = (e) => {
    // Don't close the modal when clicking outside - user must login first
    e.stopPropagation()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-cyan-900/20 via-slate-900/40 to-cyan-800/30 backdrop-blur-md"
            onClick={handleBackdropClick}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl dark:border-white/10 dark:bg-slate-900/80">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-amber-50/30 dark:from-cyan-900/20 dark:to-amber-900/10" />

              <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-cyan-400/20 to-amber-400/20 rounded-full blur-xl" />
              <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-br from-amber-400/20 to-cyan-400/20 rounded-full blur-xl" />

              <div className="relative p-8">
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-amber-500 shadow-lg">
                    <Bot className="h-8 w-8 text-white" />
                  </div>

                  <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-800 to-slate-800 bg-clip-text text-transparent dark:from-cyan-300 dark:to-slate-300 mb-3">
                    다시 오신 걸 환영합니다
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed text-balance">
                    로그인 또는 회원 가입하여 더 스마트한 습관,
                    <br />
                    파일 및 이미지 업로드 등을 이용하세요.
                  </p>

                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLogin}
                      className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4 text-white font-semibold shadow-lg hover:from-cyan-700 hover:to-cyan-800 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      로그인
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSignup}
                      className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-6 py-4 text-slate-800 dark:text-slate-200 font-semibold hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 backdrop-blur-sm"
                    >
                      무료로 회원 가입
                    </motion.button>
                  </div>

                  <div className="mt-8">
                    <button className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors duration-200">
                      로그아웃 유지
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
