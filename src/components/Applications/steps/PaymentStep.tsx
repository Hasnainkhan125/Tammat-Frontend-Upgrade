/**
 * PaymentStep — two-column desktop layout
 *
 * Left  col (desktop): service summary, price breakdown by location, trust signals
 * Right col (desktop): Pay Now (Stripe card) OR Pay Later (Stripe payment link)
 * Mobile: single column, summary on top, payment below
 *
 * Pay Now  → direct Stripe card payment via PaymentIntent
 * Pay Later → generates a Stripe Payment Link and opens it / copies URL
 *
 * Re-render fix: SummaryPanel and PaymentPanel are extracted as top-level
 * memo'd components so the 1-second countdown timer doesn't recreate them
 * and cause Stripe Elements to unmount/remount.
 */
import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Lock, Clock, CreditCard, Link as LinkIcon,
  CheckCircle2, ArrowRight, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import StripePaymentForm from '@/components/Payment/StripePaymentForm'
import type { FlowService } from '../ApplicationFlow'

interface PaymentStepProps {
  amount:         number
  applicationId?: string
  service?:       FlowService
  location?:      string
  onSuccess:      (result: unknown) => void
  onError:        (err: string) => void
}

const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5001'
const apiUrl  = `${apiBase}/api/v1`

type PayMode = 'now' | 'later'

// ── SummaryPanel (top-level, memo'd — immune to timer re-renders) ───────────
interface SummaryPanelProps {
  service?:       FlowService
  location:       string
  displayFee:     number
  otherFee:       number
  otherLabel:     string
  processingFee:  number
  vatAmount:      number
  grandTotal:     number
  timerStr:       string
  expired:        boolean
  showBreakdown:  boolean
  onToggleBreakdown: () => void
}

const SummaryPanel = memo(function SummaryPanel({
  service, location, displayFee, otherFee, otherLabel,
  processingFee, vatAmount, grandTotal,
  timerStr, expired, showBreakdown, onToggleBreakdown,
}: SummaryPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[#F1F5F9] bg-[#F8FAFC] p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-0.5">{t('payment.applyingFor', 'Applying for')}</p>
            <p className="font-bold text-[#0F2A44] text-[17px] leading-snug">{service?.name || 'Visa Service'}</p>
          </div>
          {service?.processingTime && (
            <Badge className="shrink-0 flex items-center gap-1 bg-white border border-[#F1F5F9] text-[#64748B] text-[11px] rounded-full px-2.5 py-1">
              <Clock className="w-3 h-3" />
              {service.processingTime}
            </Badge>
          )}
        </div>

        <Separator className="bg-[#F1F5F9]" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#475569]">
              {t('payment.serviceFee', 'Service fee')} <span className="text-[11px] text-[#94A3B8]">({location === 'inside' ? t('payment.insideUae', 'Inside UAE') : t('payment.outsideUae', 'Outside UAE')})</span>
            </span>
            <span className="font-bold text-[#0F2A44] tabular-nums text-[17px]">
              AED {displayFee.toLocaleString()}
            </span>
          </div>

          <button
            onClick={onToggleBreakdown}
            className="flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-[#64748B] transition-colors"
          >
            {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {otherLabel} price: AED {otherFee.toLocaleString()}
          </button>

          <AnimatePresence>
            {showBreakdown && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] px-3 py-2.5 text-[12px] text-[#0C4A6E]">
                  Prices vary based on whether you are currently inside or outside the UAE when applying.
                  Your location was recorded as <strong>{location === 'inside' ? t('payment.insideUae', 'Inside UAE') : t('payment.outsideUae', 'Outside UAE')}</strong>.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#475569]">{t('payment.processingFeeLabel', 'Processing fee')}</span>
            <span className="text-[13px] font-semibold text-[#0F2A44] tabular-nums">
              AED {processingFee.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#475569]">{t('payment.vatLabel', 'VAT (5%)')}</span>
            <span className="text-[13px] font-semibold text-[#0F2A44] tabular-nums">
              AED {vatAmount.toLocaleString()}
            </span>
          </div>

          <Separator className="bg-[#F1F5F9]" />

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[13px] font-semibold text-[#0F2A44]">{t(' .total', 'Total')}</span>
            <span className="text-2xl font-bold text-[#0F2A44] tabular-nums">AED {grandTotal.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-[#94A3B8]">{t('payment.govFeesNote', 'Government fees are billed separately after approval')}</p>
        </div>
      </div>

      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-[13px] ${
        expired ? 'bg-red-50 border-red-200 text-red-600' : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
      }`}>
        <Clock className="w-4 h-4 shrink-0" />
        {expired
          ? t('payment.slotExpired', 'Your slot has expired — please restart your application.')
          : <span>{t('payment.slotReserved', 'Slot reserved for')} <strong className="tabular-nums">{timerStr}</strong></span>
        }
      </div>

      <div className="rounded-2xl border border-[#F1F5F9] bg-white p-4 space-y-2">
        {[
          { icon: Shield, color: 'text-[#BBF451]', text: t('payment.pciDss', 'Powered by Stripe — PCI DSS Level 1') },
          { icon: Lock,   color: 'text-[#64748B]', text: t('payment.ssl256', '256-bit SSL encryption') },
          { icon: CheckCircle2, color: 'text-[#4D7C0F]', text: t('payment.approvalRate', '97% approval rate on applications') },
        ].map(({ icon: Icon, color, text }) => (
          <div key={text} className="flex items-center gap-2.5 text-[12px] text-[#64748B]">
            <Icon className={`w-4 h-4 shrink-0 ${color}`} />
            {text}
          </div>
        ))}
      </div>
    </div>
  )
})

// ── PaymentPanel (top-level, memo'd — Stripe Elements stay mounted) ─────────
interface PaymentPanelProps {
  mode:            PayMode
  setMode:         (m: PayMode) => void
  grandTotal:      number
  applicationId?:  string
  serviceName:     string
  linkUrl:         string | null
  setLinkUrl:      (u: string | null) => void
  linkLoading:     boolean
  onGenerateLink:  () => void
  onSuccess:       (result: unknown) => void
  onError:         (err: string) => void
}

const PaymentPanel = memo(function PaymentPanel({
  mode, setMode, grandTotal, applicationId,
  linkUrl, setLinkUrl, linkLoading, onGenerateLink,
  onSuccess, onError,
}: PaymentPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[#F1F5F9] bg-white p-1.5 grid grid-cols-2 gap-1">
        {(['now', 'later'] as PayMode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setLinkUrl(null) }}
            className={`
              flex items-center justify-center gap-2 h-11 rounded-xl text-[14px] font-semibold
              transition-all duration-150
              ${mode === m
                ? 'bg-[#0F2A44] text-white shadow-sm'
                : 'text-[#64748B] hover:bg-[#F8FAFC]'
              }
            `}
          >
            {m === 'now'
              ? <><CreditCard className="w-4 h-4" /> {t('payment.payNow', 'Pay Now')}</>
              : <><LinkIcon className="w-4 h-4" /> {t('payment.payLater', 'Pay Later')}</>
            }
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'now' ? (
          <motion.div
            key="now"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <StripePaymentForm
              amount={grandTotal}
              currency="aed"
              applicationId={applicationId}
              onSuccess={onSuccess}
              onError={onError}
            />
          </motion.div>
        ) : (
          <motion.div
            key="later"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="rounded-2xl border border-[#F1F5F9] bg-[#F8FAFC] p-5 space-y-3">
              <div className="flex items-start gap-3">
                <LinkIcon className="w-5 h-5 text-[#BBF451] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#0F2A44] text-[15px]">{t('payment.payViaLink', 'Pay via secure link')}</p>
                  <p className="text-[13px] text-[#64748B] mt-0.5 leading-relaxed">
                    {t('payment.payViaLinkDesc', "We'll generate a Stripe payment link. Use it from any browser or device — Apple Pay, Google Pay, or card.")}
                  </p>
                </div>
              </div>

              <ul className="space-y-1.5">
                {[
                  t('payment.linkValid24h', 'Link valid for 24 hours'),
                  t('payment.supportsAppleGooglePay', 'Supports Apple Pay and Google Pay'),
                  t('payment.applicationSaved', 'Your application is already saved'),
                  t('payment.payFromAnyDevice', 'Pay from any device or share with someone else'),
                ].map(txt => (
                  <li key={txt} className="flex items-center gap-2 text-[12px] text-[#475569]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#BBF451] shrink-0" />
                    {txt}
                  </li>
                ))}
              </ul>
            </div>

            {linkUrl ? (
              <div className="rounded-2xl border border-[#BBF451]/40 bg-[#F7FEE7] p-4 space-y-3">
                <p className="font-semibold text-[#4D7C0F] text-[14px]">{t('payment.linkReady', 'Your payment link is ready')}</p>
                <div className="rounded-xl border border-[#BBF451]/30 bg-white px-3 py-2.5 flex items-center gap-2">
                  <span className="text-[12px] text-[#475569] flex-1 truncate">{linkUrl}</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(linkUrl)}
                    className="text-[11px] font-semibold text-[#4D7C0F] hover:underline shrink-0"
                  >
                    {t('payment.copy', 'Copy')}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 rounded-2xl bg-[#0F2A44] text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#1a3a5c] transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {t('payment.openLink', 'Open link')}
                  </a>
                  <button
                    onClick={() => { setLinkUrl(null) }}
                    className="h-12 rounded-2xl border border-[#F1F5F9] text-[#64748B] text-[14px] font-medium hover:bg-[#F8FAFC] transition-colors"
                  >
                    {t('payment.generateNew', 'Generate new')}
                  </button>
                </div>
              </div>
            ) : (
              <Button
                onClick={onGenerateLink}
                disabled={linkLoading}
                className="w-full h-14 rounded-2xl font-semibold bg-[#0F2A44] hover:bg-[#1a3a5c] text-white active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                style={{ fontSize: '17px' }}
              >
                {linkLoading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('payment.generating', 'Generating…')}</>
                  : <><LinkIcon className="w-4 h-4" /> {t('payment.generateLinkBtn', 'Generate payment link — AED {{amount}}', { amount: grandTotal.toLocaleString() })}</>
                }
              </Button>
            )}

            <p className="text-center text-[11px] text-[#CBD5E1]">
              {t('payment.savedPayAnytime', 'Your application is saved. Pay anytime within 24 hours to keep your slot.')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-[11px] text-[#CBD5E1]">
        {t('payment.termsNote', 'By paying you agree to our Terms of Service. Government fees are billed separately.')}
      </p>
    </div>
  )
})

// ── Main PaymentStep ────────────────────────────────────────────────────────
export default function PaymentStep({
  amount,
  applicationId,
  service,
  location = 'inside',
  onSuccess,
  onError,
}: PaymentStepProps) {
  const { t } = useTranslation()
  const [mode,        setMode]        = useState<PayMode>('now')
  const [secondsLeft, setSecondsLeft] = useState(600)
  const [linkUrl,     setLinkUrl]     = useState<string | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  // 10-minute slot countdown
  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [secondsLeft])

  const minutes  = Math.floor(secondsLeft / 60)
  const seconds  = secondsLeft % 60
  const timerStr = `${minutes}:${String(seconds).padStart(2, '0')}`
  const expired  = secondsLeft <= 0

  const insidePrice  = service?.prices?.find(p => p.priceType?.toLowerCase() === 'inside')?.priceAmount  ?? amount
  const outsidePrice = service?.prices?.find(p => p.priceType?.toLowerCase() === 'outside')?.priceAmount ?? amount
  const displayFee   = location === 'inside' ? insidePrice : outsidePrice
  const otherFee     = location === 'inside' ? outsidePrice : insidePrice
  const otherLabel   = location === 'inside' ? 'Outside UAE' : 'Inside UAE'

  const PROCESSING_FEE = 70
  const subtotal   = displayFee + PROCESSING_FEE
  const vatAmount  = Math.round(subtotal * 0.05)
  const grandTotal = subtotal + vatAmount

  // Stable callback refs so memo'd children never get stale closures
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  const stableOnSuccess = useCallback((result: unknown) => onSuccessRef.current(result), [])
  const stableOnError   = useCallback((err: string) => onErrorRef.current(err), [])

  const handleGenerateLink = useCallback(async () => {
    setLinkLoading(true)
    try {
      const token = localStorage.getItem('authToken') || ''
      const res   = await fetch(`${apiUrl}/services/payments/create-link`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount:         grandTotal,
          currency:       'aed',
          service_name:   service?.name || 'TAMMAT Visa Service',
          application_id: applicationId || '',
        }),
      })
      const d = await res.json()
      if (!res.ok || !d?.data?.url) throw new Error(d?.message || 'Could not generate payment link')
      setLinkUrl(d.data.url)
    } catch (e: any) {
      onErrorRef.current(e.message || 'Failed to generate payment link')
    } finally {
      setLinkLoading(false)
    }
  }, [grandTotal, service?.name, applicationId])

  const toggleBreakdown = useCallback(() => setShowBreakdown(b => !b), [])

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -32 }}
      transition={{ duration: 0.26 }}
      className="w-full"
    >
      <div className="space-y-1.5 mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#BBF451]">{t('flow.group.payment', 'Payment')}</p>
        <h2
          className="font-bold text-[#0F2A44] leading-tight"
          style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}
        >
          {t('payment.completeApplication', 'Complete your application')}
        </h2>
        <p className="text-[#64748B] text-[14px]">{t('payment.securePayment', 'Secure payment — protected by Stripe')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 items-start">
        <SummaryPanel
          service={service}
          location={location}
          displayFee={displayFee}
          otherFee={otherFee}
          otherLabel={otherLabel}
          processingFee={PROCESSING_FEE}
          vatAmount={vatAmount}
          grandTotal={grandTotal}
          timerStr={timerStr}
          expired={expired}
          showBreakdown={showBreakdown}
          onToggleBreakdown={toggleBreakdown}
        />
        <PaymentPanel
          mode={mode}
          setMode={setMode}
          grandTotal={grandTotal}
          applicationId={applicationId}
          serviceName={service?.name || 'Visa Service'}
          linkUrl={linkUrl}
          setLinkUrl={setLinkUrl}
          linkLoading={linkLoading}
          onGenerateLink={handleGenerateLink}
          onSuccess={stableOnSuccess}
          onError={stableOnError}
        />
      </div>
    </motion.div>
  )
}
