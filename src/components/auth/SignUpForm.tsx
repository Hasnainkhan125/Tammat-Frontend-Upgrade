"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { Eye, EyeOff, User, Mail, Phone, Lock, Building2, UserCog, Check, Loader2, ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

interface SignUpFormProps {
  onSwitchToSignIn: () => void
}

const ROLES = [
  { value: "user", label: "Individual User", icon: User },
  { value: "amer", label: "Amer Officer", icon: UserCog },
]

const fieldInputClass =
  "flex-1 min-w-0 bg-transparent border-0 text-foreground placeholder:text-text-muted focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
const fieldInputStyle: React.CSSProperties = { fontSize: '16px', outline: 'none', boxShadow: 'none' }

// ⬇️ Moved OUTSIDE the form component so it's a stable reference across renders.
// This is what fixes the "only types one character" bug — previously this was
// declared inside SignUpForm, so React remounted the input on every keystroke.
const Field = ({
  id,
  icon: Icon,
  isFocused,
  children,
}: {
  id: string
  icon: React.ElementType
  isFocused: boolean
  children: React.ReactNode
}) => (
  <div
    className={`
      relative flex items-center rounded-xl px-3.5 h-12
      bg-[#F4F6F8] dark:bg-white/[0.06]
      transition-all duration-200
      ${isFocused ? 'bg-white dark:bg-white/[0.09] shadow-[0_2px_14px_rgba(15,23,42,0.08)]' : ''}
    `}
  >
    <Icon className={`w-4 h-4 shrink-0 mr-2.5 rtl:mr-0 rtl:ml-2.5 transition-colors duration-200 ${isFocused ? 'text-primary' : 'text-text-muted'}`} />
    {children}
    <motion.div
      initial={false}
      animate={{ width: isFocused ? '100%' : '0%' }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute left-0 right-0 bottom-0 h-[2px] bg-primary rounded-full"
    />
  </div>
)

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToSignIn }) => {
  const { signUp } = useAuth()
  const { t } = useTranslation()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [role, setRole] = useState("user")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signUp(email, password, `${firstName} ${lastName}`, {
        firstName,
        lastName,
        phoneNumber,
        role
      })
      toast.success("Account created successfully", {
        description: "Please check your email for verification",
      })
      onSwitchToSignIn()
    } catch (error) {
      console.error("Sign up error:", error)
      toast.error("Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const strength = Math.min(password.length / 10, 1)
  const strengthLabel = password.length === 0 ? "" : password.length < 6 ? "Weak" : password.length < 9 ? "Good" : "Strong"
  const strengthColor = strength < 0.4 ? "bg-red-400" : strength < 0.7 ? "bg-amber-400" : "bg-primary"

  const selectedRole = ROLES.find(r => r.value === role)!

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</Label>
          <Field id="firstName" icon={User} isFocused={focused === "firstName"}>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onFocus={() => setFocused("firstName")}
              onBlur={() => setFocused(null)}
              required
              placeholder="John"
              style={fieldInputStyle}
              className={fieldInputClass}
            />
          </Field>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-sm font-medium text-foreground">Last Name</Label>
          <Field id="lastName" icon={User} isFocused={focused === "lastName"}>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onFocus={() => setFocused("lastName")}
              onBlur={() => setFocused(null)}
              required
              placeholder="Doe"
              style={fieldInputStyle}
              className={fieldInputClass}
            />
          </Field>
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
        <Field id="email" icon={Mail} isFocused={focused === "email"}>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused(null)}
            required
            placeholder="john@example.com"
            style={fieldInputStyle}
            className={fieldInputClass}
          />
        </Field>
      </div>

      {/* Phone Number */}
      <div className="space-y-1.5">
        <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">Phone Number</Label>
        <Field id="phoneNumber" icon={Phone} isFocused={focused === "phoneNumber"}>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onFocus={() => setFocused("phoneNumber")}
            onBlur={() => setFocused(null)}
            placeholder="+971 50 123 4567"
            style={fieldInputStyle}
            className={fieldInputClass}
          />
        </Field>
      </div>

      {/* Role Selection — custom dropdown */}
      <div className="space-y-1.5 relative">
        <Label htmlFor="role" className="text-sm font-medium text-foreground">Account Type</Label>
        <button
          type="button"
          id="role"
          onClick={() => setRoleOpen(!roleOpen)}
          className={`
            w-full flex items-center justify-between rounded-xl px-3.5 h-12
            bg-[#F4F6F8] dark:bg-white/[0.06] text-left
            transition-all duration-200
            ${roleOpen ? 'bg-white dark:bg-white/[0.09] shadow-[0_2px_14px_rgba(15,23,42,0.08)]' : ''}
          `}
        >
          <span className="flex items-center gap-2.5">
            <Building2 className={`w-4 h-4 shrink-0 transition-colors duration-200 ${roleOpen ? 'text-primary' : 'text-text-muted'}`} />
            <span className="text-foreground text-[15px]">{selectedRole.label}</span>
          </span>
          <motion.svg
            animate={{ rotate: roleOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="text-text-muted shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {roleOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setRoleOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute z-20 top-full mt-1.5 w-full rounded-xl bg-white dark:bg-[#1a1a1a] shadow-[0_8px_30px_rgba(0,0,0,0.14)] border border-black/5 dark:border-white/10 p-1.5 overflow-hidden"
              >
                {ROLES.map((r) => {
                  const RIcon = r.icon
                  const active = r.value === role
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setRole(r.value)
                        setRoleOpen(false)
                      }}
                      className={`
                        w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                        transition-colors duration-150
                        ${active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.06]'}
                      `}
                    >
                      <span className="flex items-center gap-2.5">
                        <RIcon className="w-4 h-4" />
                        {r.label}
                      </span>
                      {active && <Check className="w-4 h-4" />}
                    </button>
                  )
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
        <Field id="password" icon={Lock} isFocused={focused === "password"}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused(null)}
            required
            placeholder="Create a strong password"
            style={fieldInputStyle}
            className={fieldInputClass}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="shrink-0 p-1 -m-1 text-text-muted hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={showPassword ? 'hide' : 'show'}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </Field>

        {/* Strength meter */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
            <motion.div
              initial={false}
              animate={{ width: `${strength * 100}%` }}
              transition={{ duration: 0.25 }}
              className={`h-full rounded-full ${strengthColor}`}
            />
          </div>
          <span className="text-xs text-text-muted w-10 text-right">{strengthLabel}</span>
        </div>
        <p className="text-xs text-text-muted">Must be at least 6 characters long</p>
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

    <AnimatePresence mode="wait">
      {loading ? (
        <motion.span
          key="loading"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="relative z-10 flex items-center gap-2"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating account...
        </motion.span>
      ) : (
        <motion.span
          key="idle"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="relative z-10 flex items-center gap-2"
        >
          Create Account
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </motion.span>
      )}
    </AnimatePresence>
  </Button>
</motion.div>

      <div className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="text-primary hover:underline font-medium transition-colors"
        >
          Sign in
        </button>
      </div>
    </form>
  )
}