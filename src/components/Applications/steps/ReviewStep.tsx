import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock, Shield, Star, Users, Zap, ArrowRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { FlowData } from '../ApplicationFlow'

interface ReviewStepProps {
  data:           FlowData
  applicationFee: number
  onNext:         () => void
}

const stagger = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28 } },
}

export default function ReviewStep({ data, applicationFee, onNext }: ReviewStepProps) {
  const { t } = useTranslation()

  const BENEFITS = [
    { text: t('review.benefit1', 'Expert document verification by licensed professionals') },
    { text: t('review.benefit2', 'Government submission handled entirely for you') },
    { text: t('review.benefit3', 'Dedicated visa officer assigned to your case') },
    { text: t('review.benefit4', 'Real-time WhatsApp updates at every stage') },
    { text: t('review.benefit5', 'Zero confusion, zero mistakes guaranteed') },
  ]

  const TRUST_BADGES = [
    { icon: Star,   value: '4.9',   label: t('review.rating', 'Rating'),              sub: t('review.fromReviews', 'from 2,400+ reviews') },
    { icon: Users,  value: '10K+',  label: t('review.applicationsLabel', 'Applications'), sub: t('review.processedLabel', 'processed') },
    { icon: Zap,    value: '2.3d',  label: t('review.avgApproval', 'Avg approval'),    sub: t('review.businessDays', 'business days') },
    { icon: Shield, value: '97%',   label: t('review.approvalRate', 'Approval rate'),  sub: t('review.withOurProcess', 'with our process') },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -32 }}
      transition={{ duration: 0.26 }}
      className="w-full flex flex-col gap-5"
    >
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#BBF451]" style={{ letterSpacing: '0.12em' }}>
          {t('review.step', 'Review your application')}
        </p>
        <h2
          className="font-bold leading-tight"
          style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)' }}
        >
          {t('review.title', "You're all set")}
        </h2>
        <p className="text-[#64748B] text-[15px] leading-relaxed">
          {t('review.subtitle', "Let's finalize your application")}
        </p>
      </div>

      {/* Service summary + what's included */}
      <div className="rounded-2xl border border-[#F1F5F9] bg-[#F8FAFC] p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] text-[#94A3B8] uppercase tracking-wide font-semibold">{t('review.applyingFor', 'Applying for')}</p>
            <p className="text-lg font-bold text-[#0F2A44] leading-tight">
              {data.service?.name || 'Visa Service'}
            </p>
          </div>
          {data.service?.processingTime && (
            <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#F1F5F9] text-[12px] text-[#64748B]">
              <Clock className="w-3 h-3" />
              {data.service.processingTime}
            </div>
          )}
        </div>

        <Separator className="bg-[#F1F5F9]" />

        {/* Benefits */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="space-y-2.5"
        >
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold">{t('review.whatWeHandle', "What we'll handle for you")}</p>
          {BENEFITS.map(b => (
            <motion.div key={b.text} variants={fadeUp} className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#BBF451] shrink-0 mt-0.5" />
              <span className="text-[#475569] leading-snug">{b.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-2 gap-2">
        {TRUST_BADGES.map(({ icon: Icon, value, label, sub }) => (
          <div
            key={label}
            className="rounded-xl border border-[#F1F5F9] bg-white p-3 text-center space-y-0.5"
          >
            <Icon className="w-4 h-4 text-[#BBF451] mx-auto mb-1.5" />
            <p className="text-base font-bold text-[#0F2A44] tabular-nums">{value}</p>
            <p className="text-[11px] text-[#475569] font-medium">{label}</p>
            <p className="text-[10px] text-[#94A3B8]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Urgency signal */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#F0FDF4] border border-[#BBF451]/30">
        <div className="w-2 h-2 rounded-full bg-[#BBF451] shrink-0 animate-pulse" />
        <p className="text-[13px] text-[#4D7C0F] leading-snug">
          {t('review.urgencyMsg', '92% of applications submitted today are processed within 3 days')}
        </p>
      </div>

      {/* Price + CTA */}
      <div className="rounded-2xl border border-[#F1F5F9] bg-white p-5 space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] text-[#94A3B8] font-medium">{t('review.serviceFee', 'Service fee')}</p>
            <p className="text-[11px] text-[#CBD5E1] mt-0.5">{t('review.govFees', 'Government fees billed separately')}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#94A3B8] font-medium mb-0.5">{t('payment.total', 'Total')}</p>
            <p className="text-3xl font-bold text-[#0F2A44] tabular-nums leading-none">
              AED {applicationFee.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
          <Lock className="w-3 h-3 text-[#BBF451]" />
          {t('review.securedByStripe', 'Secured by Stripe · 256-bit SSL')}
        </div>

        <Button
          onClick={onNext}
          className="
            w-full h-14 rounded-2xl font-bold
            bg-[#0F2A44] hover:bg-[#1a3a5c] text-white
            active:scale-[0.97] transition-all flex items-center justify-center gap-2
          "
          style={{ fontSize: '17px' }}
        >
          {t('review.secureBtn', 'Secure my application')}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}
