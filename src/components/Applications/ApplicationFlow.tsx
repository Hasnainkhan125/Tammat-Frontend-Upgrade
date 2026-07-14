
  import { useState, useEffect, useCallback, useRef, memo } from 'react'
  import { motion, AnimatePresence } from 'framer-motion'
  import { useNavigate } from 'react-router'
  import { useTranslation } from 'react-i18next'
  import {
    ChevronLeft, X, MessageCircle, Send, LogIn, UserPlus, Bot, XCircle,
  } from 'lucide-react'
  import { Button } from '@/components/ui/button'
  import { Progress } from '@/components/ui/progress'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { toast } from 'sonner'
  import { useAuth } from '@/contexts/AuthContext'
  import { getAllServices as getLocalServices } from '@/config/services'

  import ServiceStep from './steps/ServiceStep'
  import InputStep   from './steps/InputStep'
  import UploadStep  from './steps/UploadStep'
  import ReviewStep  from './steps/ReviewStep'
  import PaymentStep from './steps/PaymentStep'
  import SuccessStep from './steps/SuccessStep'

  // ─────────────────────────────────────────  
  // Types
  // ─────────────────────────────────────────
  export interface ServicePrice {
    priceType:   'Inside' | 'Outside' | string
    priceAmount: number
    currency:    string
  }

  export interface FlowService {
    id: string
    name: string
    description: string
    category?: string
    categorySlug?: string
    subcategoryName?: string
    requirements?: string[]
    requiredDocuments?: string[]
    formDescription?: string
    processingTime?: string
    process?: any[]
    fee?: number
    prices?: ServicePrice[]
    image?: string
    noOfApplications?: string
  }

  type StepId =
    | 'service' | 'email' | 'phone' | 'sponsorType'
    | 'location' | 'upload' | 'review' | 'payment' | 'success'

  export interface FlowData {
    service?:       FlowService
    email?:         string
    phone?:         string
    sponsorType?:   'employee' | 'investor' | 'partner'
    location?:      'inside' | 'outside'
    files?:         Record<string, File[]>
    applicationId?: string
  }

  interface ApplicationFlowProps {
    open?:           boolean
    onOpenChange?:   (v: boolean) => void
    queryParams?:    string
    initialService?: string
  }

  // ─────────────────────────────────────────
  // Constants
  // ─────────────────────────────────────────
  const STEPS: StepId[] = [
    'service', 'email', 'phone', 'sponsorType', 'location',
    'upload', 'review', 'payment', 'success',
  ]

  const STEP_GROUP: Record<StepId, string> = {
    service:     'flow.group.choose',
    email:       'flow.group.info',
    phone:       'flow.group.info',
    sponsorType: 'flow.group.info',
    location:    'flow.group.info',
    upload:      'flow.group.upload',
    review:      'flow.group.review',
    payment:     'flow.group.payment',
    success:     'flow.group.done',
  }

  const LS_KEY = 'tammat_flow_data'

  // ─────────────────────────────────────────
  // API helpers
  // ─────────────────────────────────────────
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5001'
  const apiUrl  = `${apiBase}/api/v1`

  // Maps every numeric Recordid → backend enum string
  const SERVICE_ID_TO_ENUM: Record<string, string> = {
    '4':   'spouse_residence_visa',
    '9':   'parents_residence_visa',
    '12':  'investor_partner_visa',
    '13':  'entry_permit_short_term_visit_parents_siblings_inlaws',
    '14':  'entry_permit_short_term_visit_spouse_kids',
    '15':  'entry_permit_long_term_visit_parents_siblings_inlaws',
    '243': 'entry_permit_long_term_visit_spouse_kids',
    '50':  'change_status_family',
    '51':  'change_status_employee',
    '52':  'change_status_visit_visa',
    '23':  'spouse_children_visa_stamping',
    '26':  'parents_visa_stamping',
    '22':  'employee_visa_stamping',
    '32':  'son_daughter_visa_stamping',
    '35':  'partner_investor_visa_stamping_2_years',
    '227': 'spouse_children_visa_renewal',
    '229': 'son_above_18_visa_renewal',
    '236': 'partner_investor_visa_renewal_2_years',
    '239': 'parents_visa_renewal_1_year',
    '38':  'family_residence_visa_cancellation',
    '40':  'employment_visa_cancellation',
    '42':  'partner_investor_visa_cancellation',
    '293': 'cancellation_entry_permit_before_entry_company',
    '36':  'cancellation_entry_permit_after_entry_family',
    '37':  'cancellation_entry_permit_after_entry_company',
    '17':  'new_born_residence_visa',
    '16':  'employment_visa',
    '54':  'golden_visa_commercial_investor',
    '55':  'golden_visa_director_manager',
    '56':  'golden_visa_doctors',
    '57':  'golden_visa_engineers',
    '58':  'golden_visa_new_born_baby',
    '59':  'golden_visa_phd_holder',
    '60':  'golden_visa_scientists',
    '61':  'golden_visa_family_members',
    '63':  'golden_visa_commercial_investor_2m_deposit',
    '64':  'golden_visa_outstanding_student_highschool',
    '65':  'golden_visa_outstanding_student_university',
    '66':  'golden_visa_creative_people_culture_art',
    '44':  'new_establishment_card_with_online',
    '45':  'new_establishment_card_without_online',
    '46':  'renewal_establishment_card_with_online',
    '47':  'renewal_establishment_card_without_online',
    '218': 'immigration_employee_list',
    '220': 'modification_immigration_card',
    '53':  'holding_visa_family',
    '67':  'data_modification_family',
    '68':  'data_modification_company',
    '219': 'new_pro_card',
    '221': 'renewal_pro_card',
    '222': 'modify_pro_card',
    '223': 'reconsideration_rejected_visa_application',
    '20':  'family_visit_visa_extend',
    '48':  'travel_report_family',
    '49':  'travel_report_company',
    '69':  'security_deposit',
    // legacy slugs
    'family-visa-spouse':  'family_visa_spouse',
    'family-visa-child':   'family_visa_child',
    'residence-visa':      'residence_visa',
    'entry-permit':        'entry_permit',
    'emirates-id':         'emirates_id',
    'visa-renewal':        'visa_renewal',
    'medical':             'medical',
    'change-status':       'change_status',
    'visa-stamping':       'visa_stamping',
  }

  const toApplicationType = (id?: string): string => {
    if (!id) return 'residence_visa'
    const key = String(id)
    if (SERVICE_ID_TO_ENUM[key]) return SERVICE_ID_TO_ENUM[key]
    return key?.replace(/-/g, '_')?.toLowerCase() || 'residence_visa'
  }

  const DOC_FIELD_MAP: Record<string, string> = {
    'emirates-id':         'sponsor_emirates_id',
    'residency-visa':      'sponsor_visa',
    'passport':            'sponsor_passport',
    'salary-certificate':  'sponsor_salary_certificate',
    'trade-license':       'sponsor_trade_license',
    'establishment-card':  'sponsor_establishment_card',
    'spouse-passport':     'sponsored_passport_front',
    'spouse-photos':       'sponsored_photo',
    'marriage-certificate':'marriage_certificate',
    'birth-certificate':   'birth_certificate',
    'child-passport':      'sponsored_passport_front',
    'parents-passports':   'sponsored_passport_front',
    'parents-photos':      'sponsored_photo',
  }
  const mapDocField = (id: string) => DOC_FIELD_MAP[id] || id

  // ─────────────────────────────────────────
  // Slide animation
  // ─────────────────────────────────────────
  const slide = {
    enter:  (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
  }

  // ─────────────────────────────────────────
  // localStorage helpers (Files not persisted — can't JSON-serialize)
  // ─────────────────────────────────────────
  function persistData(d: FlowData) {
    try {
      const { files: _files, ...rest } = d   // exclude File objects
      localStorage.setItem(LS_KEY, JSON.stringify(rest))
    } catch { /* quota exceeded — silently ignore */ }
  }

  function loadPersistedData(): Partial<FlowData> {
    try {
      const raw = localStorage.getItem(LS_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  }

  // ─────────────────────────────────────────
  // AI Chat panel (memoised — never remounts)
  // ─────────────────────────────────────────
  interface ChatMessage { role: 'user' | 'assistant'; text: string }

  const AIChatPanel = memo(function AIChatPanel({
    open,
    onClose,
    service,
    stepIndex,
  }: {
    open: boolean
    onClose: () => void
    service?: FlowService
    stepIndex?: number
  }) {
    const { t } = useTranslation()
    const [msgs, setMsgs]     = useState<ChatMessage[]>([
      { role: 'assistant', text: t('flow.chat.welcome') },
    ])
    const [input, setInput]   = useState('')
    const [busy, setBusy]     = useState(false)
    const bottomRef           = useRef<HTMLDivElement>(null)
    const API_CHAT = `${apiUrl}/chat/process`

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [msgs])

    const send = async () => {
      const text = input.trim()
      if (!text || busy) return
      setInput('')
      setMsgs(prev => [...prev, { role: 'user', text }])
      setBusy(true)
      try {
        const token = localStorage.getItem('authToken') || ''
        const chatHistory = msgs.map(m => ({
          type: m.role === 'user' ? 'user' : 'bot',
          content: m.text,
        }))
        const res = await fetch(API_CHAT, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            message: text,
            context: {
              step: stepIndex ?? 0,
              service: service ? { id: service.id, name: service.name } : undefined,
              chatHistory,
            },
          }),
        })
        const d = await res.json()
        const reply = d?.response || d?.data?.response || d?.data?.reply || t('flow.chat.thinking')
        setMsgs(prev => [...prev, { role: 'assistant', text: reply }])
      } catch {
        setMsgs(prev => [...prev, { role: 'assistant', text: t('flow.chat.thinking') }])
      } finally {
        setBusy(false)
      }
    }

    return (
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed bottom-20 right-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-[#E2E8F0] dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'min(520px, calc(100dvh - 8rem))' }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9] dark:border-neutral-800 bg-[var(--primary)] dark:bg-black">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white text-[14px] flex-1">{t('flow.chat.title')}</span>
              <button
                onClick={onClose}
                aria-label={t('flow.chat.close')}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[var(--primary)] dark:bg-[var(--primary)] text-white dark:text-white rounded-br-sm'
                      : 'bg-[#F8FAFC] dark:bg-neutral-800 border border-[#F1F5F9] dark:border-neutral-700 text-[var(--primary)] dark:text-neutral-100 rounded-bl-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="bg-[#F8FAFC] dark:bg-neutral-800 border border-[#F1F5F9] dark:border-neutral-700 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] dark:bg-neutral-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 flex items-center gap-2 px-3 py-3 border-t border-[#F1F5F9] dark:border-neutral-800">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={t('flow.chat.placeholder')}
                className="flex-1 text-[14px] bg-[#F8FAFC] dark:bg-neutral-800 border border-[#E2E8F0] dark:border-neutral-700 text-[var(--primary)] dark:text-white rounded-xl px-3 py-2 outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[#94A3B8] dark:placeholder:text-neutral-500"
              />
              <button
                onClick={send}
                disabled={!input.trim() || busy}
                className="w-9 h-9 rounded-xl bg-[var(--primary)] dark:bg-[var(--primary)] flex items-center justify-center text-white dark:text-white disabled:opacity-40 hover:bg-[var(--primary)]/90 dark:hover:bg-[var(--primary)]/90 transition-colors shrink-0"
                aria-label={t('flow.chat.send')}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  })

  // ─────────────────────────────────────────
  // Login Gate (shown inline when not authed)
  // ─────────────────────────────────────────
  const LoginGate = memo(function LoginGate({ onDismiss }: { onDismiss: () => void }) {
    const { t }      = useTranslation()
    const navigate   = useNavigate()

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm px-4 pb-6 sm:pb-0"
      >
        <motion.div
          initial={{ y: 32 }}
          animate={{ y: 0 }}
          className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl p-7 shadow-2xl space-y-5 border border-transparent dark:border-neutral-700"
        >
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center mx-auto">
              <LogIn className="w-5 h-5 text-[var(--primary)] dark:text-white" />
            </div>
            <h3 className="font-bold text-[var(--primary)] dark:text-white text-[20px]">{t('flow.loginRequired')}</h3>
            <p className="text-[#64748B] dark:text-neutral-400 text-[14px] leading-relaxed">{t('flow.loginDesc')}</p>
          </div>

          <div className="space-y-2.5">
            <Button
              onClick={() => navigate('/auth?redirect=/apply')}
              className="w-full h-12 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 dark:bg-[var(--primary)] dark:text-white dark:hover:bg-[var(--primary)]/90 text-white font-semibold flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {t('flow.loginBtn')}
            </Button>
            <Button
              onClick={() => navigate('/auth?mode=signup&redirect=/apply')}
              variant="outline"
              className="w-full h-12 rounded-2xl border-[#E2E8F0] dark:border-neutral-700 text-[var(--primary)] dark:text-white dark:bg-transparent dark:hover:bg-neutral-800 font-semibold flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {t('flow.signUpBtn')}
            </Button>
            <button
              onClick={onDismiss}
              className="w-full text-[13px] text-[#94A3B8] dark:text-neutral-500 hover:text-[#64748B] dark:hover:text-slate-300 py-1 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  })

  // ─────────────────────────────────────────
  // Main component
  // ─────────────────────────────────────────
  export default function ApplicationFlow({
    open,
    onOpenChange,
    queryParams,
    initialService,
  }: ApplicationFlowProps) {
    const { t }    = useTranslation()
    const { user } = useAuth()
    const navigate = useNavigate()
    const token    = typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''
    const isModal  = open !== undefined

    // ── Step state ──────────────────────────
    const [stepIndex, setStepIndex] = useState(0)
    const [direction, setDirection] = useState(1)

    // ── Form data — hydrated from localStorage on mount ──
    const [data, setData] = useState<FlowData>(() => {
      const saved = loadPersistedData()
      return saved as FlowData
    })

    // ── Other state ─────────────────────────
    const [services, setServices] = useState<FlowService[]>([])
    const [loading,  setLoading]  = useState(true)
    const [creating, setCreating] = useState(false)
    const [chatOpen, setChatOpen] = useState(false)
    const [showLogin, setShowLogin] = useState(false)

    const step   = STEPS[stepIndex]
    const isDone = step === 'success'
    const progress = Math.round((stepIndex / (STEPS.length - 1)) * 100)

    // ── Persist data whenever it changes ────
    useEffect(() => {
      persistData(data)
    }, [data])

    // ── Load services ────────────────────────
    useEffect(() => {
      setLoading(true)
      const q = queryParams || initialService || 'visa'
      fetch(`${apiUrl}/services/search?q=${encodeURIComponent(q)}&limit=60`, { credentials: 'include' })
        .then(r => r.json())
        .then(d => {
          console.log(d,"the fact stuff")
          const list: FlowService[] = (d?.data?.services || []).map((s: any) => {
            const rawPrices: any[] = Array.isArray(s.prices) ? s.prices : []
            const prices: ServicePrice[] = rawPrices.map((p: any) => ({
              priceType:   p.PriceType   || p.priceType   || 'Inside',
              priceAmount: Number(p.PriceAmount || p.priceAmount || 0),
              currency:    p.PriceCurrency || p.currency || 'AED',
            }))
            return {
              id:                s.id || s.serviceId || s.slug || String(s.name),
              name:              s.serviceName || s.name,
              description:       s.outsideDescription || s.description || '',
              category:          s.categoryName || s.category || '',
              categorySlug:      s.categorySlug || '',
              subcategoryName:   s.subcategoryName || '',
              requirements:      Array.isArray(s.requirements) ? s.requirements : [],
              requiredDocuments: Array.isArray(s.requiredDocuments) ? s.requiredDocuments : [],
              formDescription:   s.formDescription || '',
              processingTime:    s.processingTime || '',
              process:           s.process || [],
              prices,
              fee:               prices[0]?.priceAmount || s.fee || s.cost || 1500,
              image:             s.image || s.imageSrc || '',
              noOfApplications:  s.noOfApplications || s.noOfApplication || '',
            }
          })
          setServices(list.length ? list : fallback())
        })
        .catch(() => setServices(fallback()))
        .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams, initialService])

    const fallback = (): FlowService[] =>
      getLocalServices().map((ls: any) => ({
        id:           ls.id,
        name:         ls.name,
        description:  ls.description,
        category:     ls.category,
        requirements: (ls.requirements || []).map((r: any) => (typeof r === 'string' ? r : r.id)),
        process:      ls.process || [],
        fee:          ls.cost || 1500,
      }))

    // ── Reset when modal closes ──────────────
    useEffect(() => {
      if (isModal && !open) {
        const t = setTimeout(() => { setStepIndex(0); setData({}); setDirection(1) }, 350)
        return () => clearTimeout(t)
      }
    }, [open, isModal])

    // ── Navigation ───────────────────────────
    const advance = useCallback((patch?: Partial<FlowData>) => {
      setDirection(1)
      setData(prev => {
        const next = { ...prev, ...patch }
        return next
      })
      setStepIndex(i => Math.min(i + 1, STEPS.length - 1))
    }, [])

    const back = useCallback(() => {
      if (stepIndex === 0) {
        isModal ? onOpenChange?.(false) : navigate(-1)
        return
      }
      setDirection(-1)
      setStepIndex(i => Math.max(i - 1, 0))
    }, [stepIndex, isModal, navigate, onOpenChange])

    const close = useCallback(() => {
      // Clear persisted data when user explicitly closes the flow
      localStorage.removeItem(LS_KEY)
      isModal ? onOpenChange?.(false) : navigate('/')
    }, [isModal, navigate, onOpenChange])

    // ── Create application ───────────────────
    const createApplication = useCallback(async (merged: FlowData): Promise<string | undefined> => {
      if (!token) {
        setShowLogin(true)
        return undefined
      }
      if (!merged.service) return undefined
      setCreating(true)
      try {
        const res = await fetch(`${apiUrl}/visa`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            applicationType: toApplicationType(String(merged.service.id)),
            serviceData: {
              id:           merged.service.id,
              name:         merged.service.name,
              description:  merged.service.description,
              requirements: merged.service.requirements || [],
            },
            sponsor: {
              email:     merged.email || user?.email || '',
              phone:     merged.phone || '',
              firstName: user?.name?.split(' ')[0] || '',
              lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
            },
            metadata: {
              sponsorType: merged.sponsorType || '',
              location:    merged.location || '',
            },
          }),
        })
        const d = await res.json()
        if (!res.ok) { toast.error(d?.message || 'Failed to create application'); return undefined }

        const appId: string = d?.data?.application?._id
        if (!appId) return undefined

        // Upload staged documents
        if (merged.files) {
          const form = new FormData()
          Object.entries(merged.files).forEach(([docId, files]) =>
            files.forEach(f => form.append(mapDocField(docId), f))
          )
          if ([...form.keys()].length) {
            await fetch(`${apiUrl}/visa/${appId}/documents`, {
              method:  'POST',
              headers: { Authorization: `Bearer ${token}` },
              body:    form,
            })
          }
        }
        return appId
      } catch {
        toast.error('Network error — please try again')
        return undefined
      } finally {
        setCreating(false)
      }
    }, [token, user])

    // ── Doc defs from selected service ───────
    const docDefs = (() => {
      const svc = data.service
      if (!svc) return []
      const humanDocs = svc.requiredDocuments || []
      if (humanDocs.length) {
        return humanDocs.map((label: string, i: number) => ({
          id:          `doc_${i}`,
          label,
          required:    true,
          description: '',
          fileTypes:   ['image/*', 'application/pdf'],
          maxSize:     10 * 1024 * 1024,
          category:    'personal' as const,
          priority:    'high' as const,
        }))
      }
      return (svc.requirements || []).map((id: string) => ({
        id,
        label:       id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        required:    true,
        description: '',
        fileTypes:   ['image/*', 'application/pdf'],
        maxSize:     10 * 1024 * 1024,
        category:    'personal' as const,
        priority:    'high' as const,
      }))
    })()

    // ── Derive fee from location ─────────────
    const applicationFee = (() => {
      const svc = data.service
      if (!svc) return 1500
      const loc    = data.location || 'inside'
      const prices = svc.prices || []
      const match  = prices?.find(p => p?.priceType?.toLowerCase() === (loc === 'inside' ? 'inside' : 'outside')) || {priceAmount: 1500, priceType: 'Inside'}
      if (match?.priceAmount) return match.priceAmount
      return prices[0]?.priceAmount || svc.fee || 1500
    })()

    // ── Render step ──────────────────────────
    const renderStep = () => {
      if (creating) {
        return (
          <div className="flex flex-col items-center justify-center gap-5 h-64">
            <div className="w-14 h-14 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
            <p className="text-[#64748B] dark:text-neutral-400 text-sm">{t('flow.creating')}</p>
          </div>
        )
      }

      switch (step) {
        case 'service':
          return <ServiceStep services={services} loading={loading} onSelect={svc => advance({ service: svc })} />

        case 'email':
          return (
            <InputStep
              label={t('flow.emailLabel', 'Where should we send your updates?')}
              sublabel={t('flow.emailSub', "We'll keep you informed at every step")}
              fieldKey="email"
              type="email"
              placeholder="your@email.com"
              defaultValue={user?.email || data.email || ''}
              onNext={d => advance(d)}
            />
          )

        case 'phone':
          return (
            <InputStep
              label={t('flow.phoneLabel', 'Where can we reach you on WhatsApp?')}
              sublabel={t('flow.phoneSub', 'For real-time updates and quick support')}
              fieldKey="phone"
              type="tel"
              placeholder="+971 50 123 4567"
              defaultValue={user?.phone || data.phone || ''}
              onNext={d => advance(d)}
            />
          )

        case 'sponsorType':
          return (
            <InputStep
              label={t('flow.sponsorLabel', 'Who will sponsor this visa?')}
              fieldKey="sponsorType"
              type="options"
              options={[
                { value: 'employee', label: t('flow.sponsor.employee', 'I work for a company'),      description: t('flow.sponsor.employeeDesc', 'Your employer is sponsoring you') },
                { value: 'investor', label: t('flow.sponsor.investor', 'I own a business'),          description: t('flow.sponsor.investorDesc', 'You are an investor or owner') },
                { value: 'partner',  label: t('flow.sponsor.partner',  'I am a business partner'),   description: t('flow.sponsor.partnerDesc',  'You co-own a business') },
              ]}
              onNext={d => advance(d)}
            />
          )

          

        case 'location':
          return (
            <InputStep
              label={t('flow.locationLabel', 'Where are you applying from?')}
              fieldKey="location"
              type="options"
              options={[
                { value: 'inside',  label: t('flow.location.inside',  'Inside UAE'),  description: t('flow.location.insideDesc',  'Already in the country') },
                { value: 'outside', label: t('flow.location.outside', 'Outside UAE'), description: t('flow.location.outsideDesc', 'Applying from abroad') },
              ]}
              onNext={d => advance(d)}
            />
          )

        case 'upload':
          return <UploadStep docDefs={docDefs} onNext={files => advance({ files })} />

        case 'review':
          return (
            <ReviewStep
              data={data}
              applicationFee={applicationFee}
              onNext={async () => {
                // Login gate — block submission if not authenticated
                if (!token && !user) {
                  setShowLogin(true)
                  return
                }
                const appId = await createApplication(data)
                if (appId !== undefined) advance({ applicationId: appId })
              }}
            />
          )

        case 'payment':
          return (
            <PaymentStep
              amount={applicationFee}
              applicationId={data.applicationId}
              service={data.service}
              location={data.location}
              onSuccess={() => {
                // Clear localStorage on successful payment
                localStorage.removeItem(LS_KEY)
                toast.success(t('payment.success', 'Payment successful!'))
                advance()
              }}
              onError={err => toast.error(`${t('payment.failed', 'Payment failed')}: ${err}`)}
            />
          )

        case 'success':
          return (
            <SuccessStep
              serviceName={data.service?.name || 'Visa Service'}
              applicationId={data.applicationId}
              onClose={() => {
                localStorage.removeItem(LS_KEY)
                close()
              }}
            />
          )

        default:
          return null
      }
    }

    // ── Shell ────────────────────────────────
    return (
      <div className="flex flex-col bg-white dark:bg-black transition-colors duration-200" style={{ minHeight: '100dvh' }}>

        {/* ── Top bar ── */}
        <div className="shrink-0 flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[#F1F5F9] dark:border-neutral-800">
          <Button
            variant="ghost"
            size="icon"
            onClick={back}
            disabled={isDone}
            aria-label={t('flow.back')}
            className="w-9 h-9 rounded-full text-[#94A3B8] dark:text-neutral-500 hover:text-[var(--primary)] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-neutral-800 disabled:opacity-0 disabled:pointer-events-none shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] dark:text-neutral-500">
              <span className="font-semibold uppercase tracking-widest">{t(STEP_GROUP[step], STEP_GROUP[step])}</span>
              <span className="tabular-nums">{t('flow.step', '{{current}} of {{total}}', { current: stepIndex + 1, total: STEPS.length })}</span>
            </div>
            <Progress
              value={progress}
              className="h-1 bg-[#F1F5F9] dark:bg-neutral-800 [&>[data-slot=progress-indicator]]:bg-[var(--primary)] [&>[data-slot=progress-indicator]]:transition-all [&>[data-slot=progress-indicator]]:duration-500"
            />
          </div>

          {!isDone && (
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              aria-label={t('flow.close')}
              className="w-9 h-9 rounded-full text-[#94A3B8] dark:text-neutral-500 hover:text-[var(--primary)] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-neutral-800 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* ── Step content ── */}
        <ScrollArea className="flex-1">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`min-h-[calc(100dvh-72px)] flex flex-col justify-center px-5 py-8 mx-auto w-full ${
                step === 'upload' || step === 'payment' || step === 'service'
                  ? 'max-w-4xl'
                  : step === 'review'
                  ? 'max-w-2xl'
                  : 'max-w-lg'
              }`}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        {/* ── AI Chat panel (always mounted, toggled open) ── */}
        <AIChatPanel
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          service={data.service ?? undefined}
          stepIndex={stepIndex}
        />

        {/* ── Floating help bubble ── */}
        {!isDone && (
          <motion.button
            onClick={() => setChatOpen(v => !v)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2, type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed bottom-6 right-4 z-50 flex items-center gap-2 pl-4 pr-5 h-12 rounded-full bg-[var(--primary)] dark:bg-[var(--primary)] text-white dark:text-white text-[13px] font-medium shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-all"
            aria-label={t('flow.chat.helpBtn')}
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            {t('flow.chat.helpBtn', 'Need help?')}
          </motion.button>
        )}

        {/* ── Login gate overlay ── */}
        <AnimatePresence>
          {showLogin && <LoginGate onDismiss={() => setShowLogin(false)} />}
        </AnimatePresence>
      </div>
    )
  }