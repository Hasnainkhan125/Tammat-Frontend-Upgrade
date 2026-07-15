import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  ArrowRight,
  Check,
  TrendingUp,
  Search,
  X as XIcon,
  Users,
  Heart,
  Briefcase,
  Award,
  Baby,
  RefreshCw,
  XCircle,
  Building2,
  Plane,
  IdCard,
  FileEdit,
  ShieldCheck,
  Stamp,
  FileText,
  Star,
  Sparkles,
  Grid,
  Home,
  Briefcase as BriefcaseIcon,
  Crown,
  RefreshCw as RefreshIcon,
  XCircle as XCircleIcon,
  Building,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { FlowService } from '../ApplicationFlow'

interface ServiceStepProps {
  services: FlowService[]
  loading:  boolean
  onSelect: (service: FlowService) => void
}

// ─── Sub-tagline + icon per service keyword ──────────────────────────────────
const SERVICE_META: [string, string, typeof Users][] = [
  ['spouse',    'Fast-track approval, handled for you', Heart],
  ['parent',    'Simple process, no paperwork stress',  Users],
  ['investor',  'Get your residency with ease',         TrendingUp],
  ['partner',   'Partner visa, done correctly',          Heart],
  ['employ',    'Fast, compliant, zero hassle',          Briefcase],
  ['golden',    'Long-term residency for top talent',    Award],
  ['child',     'Family residency, all steps covered',   Users],
  ['son',       'Family residency, all steps covered',   Users],
  ['daughter',  'Family residency, all steps covered',   Users],
  ['newborn',   'First-step residency for your baby',    Baby],
  ['new born',  'First-step residency for your baby',    Baby],
  ['family',    'One process for the whole family',      Users],
  ['renew',     'No expiry stress, we handle everything', RefreshCw],
  ['cancel',    'Properly handled, no complications',     XCircle],
  ['change',    'Smooth transition, no delays',           FileEdit],
  ['holding',   'Temporary status while processing',      Clock],
  ['travel',    'Issued fast, approved correctly',        Plane],
  ['pro card',  'Business liaison made simple',           IdCard],
  ['pro',       'Business liaison made simple',           IdCard],
  ['data mod',  'Quick correction, no stress',             FileEdit],
  ['establish', 'Company immigration card sorted',         Building2],
  ['security',  'Handled securely and correctly',          ShieldCheck],
  ['stamp',     'Final step handled for you',              Stamp],
]

const getMeta = (name: string): { sub: string; Icon: typeof Users } => {
  const n = name?.toLowerCase()
  for (const [key, sub, Icon] of SERVICE_META) {
    if (n?.includes(key)) return { sub, Icon }
  }
  return { sub: 'Full service, expertly handled', Icon: FileText }
}

const MOST_CHOSEN_KEYS = ['spouse', 'family', 'golden', 'employ', 'change', 'renew']
const isMostChosen = (name: string) =>
  MOST_CHOSEN_KEYS?.some(k => name?.toLowerCase()?.includes(k))

// ─── All categories ────────────────────────────────────────
const ALL_CATEGORIES = [
  { key: '',          label: 'All', icon: Grid },
  { key: 'family',    label: 'Family', icon: Users },
  { key: 'employ',    label: 'Employment', icon: BriefcaseIcon },
  { key: 'golden',    label: 'Golden Visa', icon: Crown },
  { key: 'renew',     label: 'Renewal', icon: RefreshIcon },
  { key: 'cancel',    label: 'Cancellation', icon: XCircleIcon },
  { key: 'establish', label: 'Business', icon: Building },
]

// ─── Mobile categories (only 4) ────────────────────────────────────────
const MOBILE_CATEGORIES = [
  { key: '',          label: 'All', icon: Grid },
  { key: 'family',    label: 'Family', icon: Users },
  { key: 'golden',    label: 'Golden Visa', icon: Crown },
  { key: 'renew',     label: 'Renewal', icon: RefreshIcon },
]

const stagger = { animate: { transition: { staggerChildren: 0.035 } } }
const cardV = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } },
}

// Formats the service's price for display.
const getPriceLabel = (svc: FlowService): string | null => {
  const insidePrice = svc.prices?.find(p => p?.priceType?.toLowerCase() === 'inside')
  const anyPrice = insidePrice?.priceAmount ?? svc.prices?.[0]?.priceAmount
  const raw = anyPrice ?? svc.fee

  if (raw === null || raw === undefined) return null
  return Number(raw).toLocaleString()
}

export default function ServiceStep({ services, loading, onSelect }: ServiceStepProps) {
  const { t } = useTranslation()
  const [tapped,    setTapped]    = useState<string | null>(null)
  const [query,     setQuery]     = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 300)
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    let list = services
    if (catFilter) {
      list = list?.filter(s => s?.name?.toLowerCase()?.includes(catFilter))
    }
    if (query?.trim()) {
      const q = query.toLowerCase()
      list = list.filter(s =>
        s?.name?.toLowerCase()?.includes(q) ||
        s?.description?.toLowerCase()?.includes(q) ||
        s?.category?.toLowerCase()?.includes(q)
      )
    }
    return list
  }, [services, query, catFilter])

  const handleSelect = (svc: FlowService) => {
    setTapped(svc.id)
    setTimeout(() => onSelect(svc), 180)
  }

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26 }}
        className="space-y-1.5 sm:space-y-2 mt-1 sm:mt-2 mb-1 sm:mb-2"
      >
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--primary)]">
          {t('upload.step', 'Choose your service')}
        </p>
        <h1
          className="
            w-full max-w-4xl
            font-bold leading-tight tracking-tight
            break-words whitespace-normal
            text-black dark:text-white
            text-[1.6rem] sm:text-[2rem] md:text-[2.6rem] lg:text-[3.2rem] xl:text-[3.8rem]
          "
        >
          {t("service.title", "What do you want to get done today?")}
        </h1>
        <p className="text-[#64748B] dark:text-zinc-400 text-[13px] sm:text-[14px] leading-relaxed max-w-[95%] sm:max-w-none">
          {t('service.subtitle', 'Choose a service — we handle everything for you')}
        </p>
      </motion.div>

      {/* Search — modern pill, no browser focus outline */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.08 }}
        className="relative"
      >
        <div
          className={`
            relative flex items-center gap-2.5 h-12 rounded-2xl px-3.5 sm:px-4
            bg-[#F4F6F8] dark:bg-white/[0.06]
            transition-all duration-200
            ${inputFocused ? 'bg-white dark:bg-white/[0.09] shadow-[0_2px_14px_rgba(10,50,105,0.10)]' : ''}
          `}
        >
          <Search
            className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
              inputFocused ? 'text-[var(--primary)]' : 'text-[#94A3B8]'
            }`}
          />
          <input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={t('service.search', 'Search services...')}
            style={{ fontSize: '16px', outline: 'none', boxShadow: 'none' }}
            className="
              flex-1 min-w-0 bg-transparent border-0
              text-slate-900 dark:text-white
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              [appearance:none] focus:outline-none focus:ring-0 focus:shadow-none
              focus-visible:outline-none focus-visible:ring-0
            "
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setQuery('')}
                className="shrink-0 text-[#94A3B8] hover:text-[var(--primary)] dark:hover:text-white"
              >
                <XIcon className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* underline accent — grows in on focus instead of a boxed outline */}
          <motion.div
            initial={false}
            animate={{ width: inputFocused ? '100%' : '0%' }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute left-0 right-0 bottom-0 h-[2px] bg-[var(--primary)] rounded-full"
          />
        </div>
      </motion.div>

      {/* Category quick-select - scrollable on mobile */}
      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto overflow-y-hidden pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="flex gap-2"
          style={{ minWidth: 'max-content' }}
        >
          {/* Show all categories on desktop, only 4 on mobile */}
          {(() => {
            const categories = window.innerWidth < 640 ? MOBILE_CATEGORIES : ALL_CATEGORIES
            return categories.map(cat => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.key}
                  onClick={() => setCatFilter(cat.key)}
                  className={`
                    shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-150 whitespace-nowrap flex items-center gap-1.5
                    ${catFilter === cat.key
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] dark:bg-[var(--primary)] dark:text-white dark:border-[var(--primary)]'
                      : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[var(--primary)] hover:text-[var(--primary)] dark:bg-zinc-900 dark:text-zinc-400 dark:border-white/10 dark:hover:border-[var(--primary)]/60 dark:hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t(`service.cat.${cat.key || 'all'}`, cat.label)}
                </button>
              )
            })
          })()}
        </motion.div>
      </div>

      {/* Skeleton */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-[160px] rounded-[28px] bg-[#F1F5F9] dark:bg-white/5 animate-pulse"
              style={{ animationDelay: `${i * 0.06}s` }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-[#94A3B8] dark:text-zinc-500 text-[14px]"
        >
          {t('service.noResults', 'No services found. Try a different search.')}
        </motion.div>
      ) : (
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
        >
          {filtered?.map((svc) => {
            const { sub, Icon } = getMeta(svc?.name)
            const active = tapped === String(svc?.id)
            const chosen = isMostChosen(svc?.name)
            const priceLabel = getPriceLabel(svc)

            return (
              <motion.button
                key={svc?.id}
                variants={cardV}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => handleSelect(svc)}
                disabled={tapped !== null}
                className={`
                  group relative w-full text-left rounded-[28px] cursor-pointer
                  overflow-hidden transition-all duration-300
                  border border-transparent dark:border-white/10
                  ${active
                    ? 'bg-[var(--primary)]/[0.06] dark:bg-[var(--primary)]/10 shadow-[0_18px_40px_rgba(10,50,105,0.24)] dark:shadow-[0_18px_40px_rgba(10,50,105,0.16)]'
                    : 'bg-white dark:bg-black shadow-[0_2px_6px_rgba(10,50,105,0.06)] hover:shadow-[0_20px_40px_rgba(10,50,105,0.12)] dark:shadow-none dark:hover:border-white/20'
                  }
                `}
              >
                {/* Accent edge */}
                <div
                  className={`
                    absolute left-0 top-0 h-full w-[4px] transition-colors duration-300
                    ${active ? 'bg-[var(--primary)]' : 'bg-transparent group-hover:bg-[var(--primary)]/10 dark:group-hover:bg-white/10'}
                  `}
                />

                {/* Most-chosen ribbon */}
                {chosen && !active && (
                  <div className="absolute top-0 right-4 z-10">
                    <Badge className="h-[22px] px-2.5 text-[10px] font-bold bg-[var(--primary)] text-white border-0 rounded-full gap-1 leading-none shadow-sm">
                      <TrendingUp className="w-3 h-3" />
                      {t('service.mostChosen', 'Most chosen')}
                    </Badge>
                  </div>
                )}

                <div className="relative flex items-start gap-3.5 sm:gap-5 px-4 sm:px-6 pt-5 sm:pt-6">
                  {/* Icon chip — bigger, layered */}
                  <div
                    className={`
                      relative shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[20px] flex items-center justify-center
                      transition-all duration-300
                      ${active
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-white group-hover:scale-105 dark:from-[var(--primary)]/25 dark:to-[var(--primary)]/10 dark:text-white dark:border dark:border-[var(--primary)]/30'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={2} />
                    {/* Verified badge overlay */}
                    <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white dark:bg-black border-2 border-white dark:border-black flex items-center justify-center shadow-sm">
                      <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--primary)]" strokeWidth={2.5} />
                    </span>
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <span className="block font-bold text-[var(--primary)] leading-snug text-[15px] sm:text-[18px]">
                      {svc.name}
                    </span>

                    <div className="flex items-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-3 flex-wrap">
                      {svc.processingTime && (
                        <span className="flex items-center gap-1 text-[10px] sm:text-[11.5px] font-semibold text-[var(--primary)] bg-[#F0F4F8] dark:bg-white/10 rounded-full px-2 sm:px-2.5 py-1">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {svc.processingTime}
                        </span>
                      )}
                      {(svc.requiredDocuments?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-[10px] sm:text-[11.5px] font-medium text-[#64748B] bg-[#F8FAFC] dark:bg-white/5 dark:text-zinc-400 rounded-full px-2 sm:px-2.5 py-1">
                          <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {svc.requiredDocuments!.length} {t('service.docsRequired', 'documents')}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-[10px] sm:text-[11.5px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 rounded-full px-2 sm:px-2.5 py-1">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                        4.9
                      </span>
                    </div>
                  </div>

                </div>

                {/* Price footer — modern split layout with CTA pill */}
                <div className="relative flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 mt-4 sm:mt-5 border-t border-black/[0.05] dark:border-white/10 bg-gradient-to-b from-transparent to-black/[0.015] dark:to-white/[0.02]">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] dark:text-zinc-500">
                      <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {t('service.startingFrom', 'Starting from')}
                    </span>
                    {priceLabel ? (
                      <div className="flex items-baseline gap-1">
                        <img
                          src="/images/aed-symbol.png"
                          width={13}
                          height={13}
                          alt="AED"
                          className="opacity-60 translate-y-[1px] transition-opacity duration-300 group-hover:opacity-100"
                        />
                        <span
                          className={`
                            text-[19px] sm:text-[23px] font-extrabold tracking-tight tabular-nums
                            bg-clip-text text-transparent transition-all duration-300
                            bg-gradient-to-br from-slate-900 to-slate-900/70 dark:from-white dark:to-white/70
                            ${active ? 'from-[var(--primary)] to-[var(--primary)]' : 'group-hover:from-[var(--primary)] group-hover:to-[var(--primary)]'}
                          `}
                        >
                          {priceLabel}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] sm:text-[12px] font-medium text-[#CBD5E1] dark:text-zinc-600 italic">
                        {t('service.priceOnRequest', 'Price on request')}
                      </span>
                    )}
                  </div>

                  {/* CTA pill — premium: gradient fill, border glow, shimmer sweep on hover */}
                  <span
                    className={`
                      relative shrink-0 flex items-center overflow-hidden
                      text-[11px] sm:text-[12.5px] font-bold rounded-full px-4 sm:px-5 py-2 sm:py-2.5
                      border transition-all duration-300
                      ${active
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 text-white border-transparent shadow-[0_6px_18px_rgba(10,50,105,0.30)]'
                        : `
                          bg-white text-[var(--primary)] border-[var(--primary)]/15
                          group-hover:bg-gradient-to-r group-hover:from-[var(--primary)] group-hover:to-[var(--primary)]/80
                          group-hover:text-white group-hover:border-transparent
                          group-hover:shadow-[0_6px_18px_rgba(10,50,105,0.30)]
                          dark:bg-white/5 dark:text-white dark:border-white/10
                        `
                      }
                    `}
                  >
                    {/* shimmer sweep */}
                    <span
                      className="pointer-events-none absolute inset-0 -translate-x-[120%] group-hover:translate-x-[120%] transition-transform duration-[900ms] ease-out"
                      style={{
                        background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
                      }}
                    />
                    <span className="relative">{t('service.getStarted', 'Get started')}</span>
                  </span>
                </div>
              </motion.button>
            )
          })}
        </motion.div>
      )}

      {/* Trust footer */}
      <AnimatePresence>
        {!loading && filtered.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-[11px] text-[#94A3B8] pb-1"
          >
            {t('service.trustFooter', '10,000+ applications processed · 97% approval rate')}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}