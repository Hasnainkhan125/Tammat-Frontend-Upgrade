"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { SignInForm } from "@/components/auth/SignInForm"
import { SignUpForm } from "@/components/auth/SignUpForm"
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"
import { useTranslation } from "react-i18next"
import { LanguageSelector } from "@/components/ui/LanguageSelector"
import DigitalChannels from "@/assets/digital-channels.png"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  ArrowLeft,
  Shield,
  Globe,
  Star,
  Users,
  CheckCircle,
  Building2,
  Smartphone,
  Apple,
  Phone,
  Mail,
  MessageSquare,
  Zap,
} from "lucide-react"
import { ThemeContext } from "@/contexts/ThemeContext"
import TMMTLogo from "@/assets/TMMTLogo.png"
type AuthMode = "signin" | "signup" | "forgot-password"


export const useTheme = () => {
  const context = useContext(ThemeContext)
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
const AuthPage: React.FC = () => {
  const { user, loading } = useAuth()
  const { t } = useTranslation()
  const [authMode, setAuthMode] = useState<AuthMode>("signin")



  
  useEffect(() => {
    if (user && !loading) {
      if (user.role === "amer") {
        window.location.href = "/amer-dashboard"
      } else {
        window.location.href = "/user/dashboard"
      }
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-secondary font-medium">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  const handleSwitchMode = (mode: AuthMode) => {
    setAuthMode(mode)
  }

  return (
    <div className="h-screen overflow-hidden bg-background relative">
      <div className="absolute inset-0 bg-background">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23334155' fillOpacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      {/* <div className="absolute top-6 left-6 z-20">
        <Button
          variant="ghost"
          onClick={() => (window.location.href = "/")}
          className="flex items-center space-x-2 rtl:space-x-reverse text-text-secondary hover:text-foreground bg-surface/90 backdrop-blur-sm border border-border hover:bg-surface shadow-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </Button>
      </div> */}

      {/* <div className="absolute top-6 right-6 z-20">
        <LanguageSelector compact />
      </div> */}

      <div className="flex md:h-screen relative z-10 overflow-hidden" >
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-primary relative overflow-hidden">
        <div className="w-full h-full relative"> 
            
        <img
          src="https://assets.entrepreneur.com/content/3x2/2000/1667488923-shutterstock-1769644805.jpg?format=pjeg&auto=webp&crop=16:9"
            title="Digital Channels"
          className="w-full h-full object-cover"
          />
          </div>
          {/* <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M20 20c0-2.2-1.8-4-4-4s-4 1.8-4 4 1.8 4 4 4 4-1.8 4-4zm20 0c0-2.2-1.8-4-4-4s-4 1.8-4 4 1.8 4 4 4 4-1.8 4-4z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div> */}

          {/* <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
            <div>
              <div className="flex items-center space-x-4 rtl:space-x-reverse mb-12">
                <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-primary">T</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">{t('auth.tammat')}</h1>
                  <p className="text-primary-foreground/80 font-medium">{t('landing.hero.title')}</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-start space-x-5">
                  <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Shield className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">Secure & Compliant</h3>
                    <p className="text-slate-300 leading-relaxed">
                      Bank-level security with UAE government compliance standards
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-5">
                  <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Zap className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">Lightning Fast</h3>
                    <p className="text-slate-300 leading-relaxed">AI-powered workflows reduce processing time by 70%</p>
                  </div>
                </div>

                <div className="flex items-start space-x-5">
                  <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Globe className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">Multi-Language</h3>
                    <p className="text-slate-300 leading-relaxed">Available in Arabic, English, Urdu, Hindi & more</p>
                  </div>
                </div>

                <div className="flex items-start space-x-5">
                  <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Smartphone className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">Mobile First</h3>
                    <p className="text-slate-300 leading-relaxed">Complete visa services from your smartphone</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">50K+</div>
                  <div className="text-text-muted text-sm font-medium mt-1">Applications Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">98%</div>
                  <div className="text-text-muted text-sm font-medium mt-1">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">24/7</div>
                  <div className="text-text-muted text-sm font-medium mt-1">Support Available</div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <Card className="bg-background/5 backdrop-blur-sm border-white/10 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-white text-white" />
                    ))}
                  </div>
                  <blockquote className="text-base mb-6 italic leading-relaxed">
                    "TAMMAT revolutionized our visa process. What used to take weeks now takes days. The AI assistance
                    is incredible!"
                  </blockquote>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold">Sarah Al-Mansouri</div>
                      <div className="text-slate-300 text-sm">HR Director, Emirates Group</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div> */}
          
        </div>

        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-start justify-center p-8 bg-background">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-10">
              <div className="mx-auto w-26 h-26 rounded-full flex items-center justify-center mb-4 shadow-lg">
                {/* <span className="text-white text-2xl font-bold">T</span> */}
              <img src={TMMTLogo} alt="Tammat" className="w-full h-full" />
              </div>
              {/* <h1 className="text-3xl font-bold text-foreground mb-2">{t('auth.tammat')}</h1> */}
              <p className="text-text-secondary font-medium">{t('auth.nextGenUaeSmartServices')}</p>
            </div>

            {/* <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                {authMode === "signin" && "Welcome back"}
                {authMode === "signup" && "Create account"}
                {authMode === "forgot-password" && "Reset password"}
              </h2>
              {authMode === "signin" && (
                <p className="text-text-secondary text-lg">Access your visa applications and services</p>
              )}
            </div> */}

            {authMode === "signin" && (
              <div className="space-y-4 mb-8">
                {/* <Button
                  variant="outline"
                  className="w-full py-4 text-base font-medium border-2 hover:border-slate-900 hover:bg-slate-50 transition-all duration-200 bg-transparent"
                  onClick={() => {

                  }}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button> */}

                {/* <div className="grid grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="p-4 border-2 hover:border-slate-900 hover:bg-slate-50 transition-all duration-200 bg-transparent"
                  >
                    <Building2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="p-4 border-2 hover:border-slate-900 hover:bg-slate-50 transition-all duration-200 bg-transparent"
                  >
                    <Apple className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="p-4 border-2 hover:border-slate-900 hover:bg-slate-50 transition-all duration-200 bg-transparent"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="p-4 border-2 hover:border-slate-900 hover:bg-slate-50 transition-all duration-200 bg-transparent"
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
                </div> */}

                {/* <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-sm uppercase">
                    <span className="bg-background px-4 text-text-secondary font-medium">or</span>
                  </div>
                </div> */}

                {/* <Button
                  variant="outline"
                  className="w-full py-4 border-2 hover:border-slate-900 hover:bg-slate-50 transition-all duration-200 bg-transparent"
                  onClick={() => {

                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Continue with email address
                  <span className="ml-auto text-text-secondary">→</span>
                </Button> */}
              </div>
            )}

            {/* Auth Forms */}
            <AnimatePresence mode="wait">
              {authMode === "signin" && (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SignInForm
                    onSwitchToSignUp={() => handleSwitchMode("signup")}
                    onForgotPassword={() => handleSwitchMode("forgot-password")}
                  />
                </motion.div>
              )}

              {authMode === "signup" && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SignUpForm onSwitchToSignIn={() => handleSwitchMode("signin")} />
                </motion.div>
              )}

              {authMode === "forgot-password" && (
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ForgotPasswordForm onBackToSignIn={() => handleSwitchMode("signin")} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-center mt-10">
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                {t('auth.termsAgreement')}
              </p>

              <div className="flex items-center justify-center space-x-4 text-xs text-text-secondary mb-6">
                <a href="#" className="hover:text-foreground font-medium transition-colors">
                  {t('auth.privacyPolicy')}
                </a>
                <span>•</span>
                <a href="#" className="hover:text-foreground font-medium transition-colors">
                  {t('auth.termsOfService')}
                </a>
                <span>•</span>
                <a href="#" className="hover:text-foreground font-medium transition-colors">
                  {t('auth.support')}
                </a>
              </div>

              <div className="flex items-center justify-center space-x-3">
                <Badge variant="secondary" className="text-xs bg-slate-50 text-foreground border-border">
                  <Shield className="w-3 h-3 mr-1" />
                  {t('auth.uaeGovernmentApproved')}
                </Badge>
                <Badge variant="secondary" className="text-xs bg-slate-50 text-foreground border-border">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {t('auth.soc2Compliant')}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage