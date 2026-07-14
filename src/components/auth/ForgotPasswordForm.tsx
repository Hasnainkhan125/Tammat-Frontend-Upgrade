"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { Mail, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react"

interface ForgotPasswordFormProps {
  onBackToSignIn: () => void
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToSignIn }) => {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (error) {
      console.error("Reset password error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
          className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle2 className="w-8 h-8 text-primary" strokeWidth={2} />
        </motion.div>
        <h3 className="text-lg font-semibold text-foreground">Check your email</h3>
        <p className="text-sm text-text-secondary">
          We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
        </p>
        <Button
          onClick={onBackToSignIn}
          variant="outline"
          className="w-full rounded-xl h-11 font-medium transition-all hover:shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Sign In
        </Button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </Label>
        <div
          className={`
            relative flex items-center rounded-xl px-3.5 h-12
            bg-[#F4F6F8] dark:bg-white/[0.06]
            transition-all duration-200
            ${emailFocused ? 'bg-white dark:bg-white/[0.09] shadow-[0_2px_14px_rgba(15,23,42,0.08)]' : ''}
          `}
        >
          <Mail
            className={`w-4 h-4 shrink-0 mr-2.5 rtl:mr-0 rtl:ml-2.5 transition-colors duration-200 ${
              emailFocused ? 'text-primary' : 'text-text-muted'
            }`}
          />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            required
            placeholder="you@example.com"
            style={{ fontSize: '16px', outline: 'none', boxShadow: 'none' }}
            className="
              flex-1 min-w-0 bg-transparent border-0
              text-foreground placeholder:text-text-muted
              focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0
            "
          />
          <motion.div
            initial={false}
            animate={{ width: emailFocused ? '100%' : '0%' }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute left-0 right-0 bottom-0 h-[2px] bg-primary rounded-full"
          />
        </div>
      </div>

<motion.div
  whileHover={{ scale: loading ? 1 : 1.02 }}
  whileTap={{ scale: loading ? 1 : 0.96 }}
  className="pt-2"
>
  <Button
    type="submit"
    disabled={loading}
    className="
      group
      relative
      h-12
      w-full
      overflow-hidden
      rounded-2xl
      border
      border-[var(--primary)]/20
      bg-[var(--primary)]
      text-white
      font-semibold
      shadow-[0_8px_25px_rgba(10,50,105,0.25)]
      transition-all
      duration-300

      hover:scale-[1.01]
      hover:brightness-110

      active:scale-[0.98]
      active:brightness-90

      disabled:cursor-not-allowed
      disabled:opacity-70
    "
  >
    {/* Shine Animation */}
    <span
      className="
        absolute
        inset-0
        -translate-x-full
        bg-gradient-to-r
        from-transparent
        via-white/20
        to-transparent
        transition-transform
        duration-700
        group-hover:translate-x-full
      "
    />

         <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-1.5"
              >
                Send Reset Link
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </motion.span>
            )}
          </AnimatePresence>
  </Button>
</motion.div>
<Button
  onClick={onBackToSignIn}
  variant="outline"
  className="
    group
    w-full
    h-11
    rounded-xl
    border-[var(--primary)]/20
    bg-background
    font-medium
    transition-all
    duration-300
    hover:scale-[1.02]
    hover:border-[var(--primary)]/50
    hover:bg-[var(--primary)]/10
    hover:text-[var(--primary)]
  "
>
  <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
  Back to Sign In
</Button>
    </form>
  )
}