import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ArrowRight, TrendingUp, Search, X as XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { FlowService } from '../ApplicationFlow'

interface ServiceStepProps {
  services: FlowService[]
  loading:  boolean
  onSelect: (service: FlowService) => void
}

// ─── Sub-tagline per service keyword ─────────────────────────────────────────
const SERVICE_SUB: [string, string][] = [
  ['spouse',    'Fast-track approval, handled for you'],
  ['parent',    'Simple process, no paperwork stress'],
  ['investor',  'Get your residency with ease'],
  ['partner',   'Partner visa, done correctly'],
  ['employ',    'Fast, compliant, zero hassle'],
  ['golden',    'Long-term residency for top talent'],
  ['child',     'Family residency, all steps covered'],
  ['son',       'Family residency, all steps covered'],
  ['daughter',  'Family residency, all steps covered'],
  ['newborn',   'First-step residency for your baby'],
  ['new born',  'First-step residency for your baby'],
  ['family',    'One process for the whole family'],
  ['renew',     'No expiry stress, we handle everything'],
  ['cancel',    'Properly handled, no complications'],
  ['change',    'Smooth transition, no delays'],
  ['holding',   'Temporary status while processing'],
  ['travel',    'Issued fast, approved correctly'],
  ['pro card',  'Business liaison made simple'],
  ['pro',       'Business liaison made simple'],
  ['data mod',  'Quick correction, no stress'],
  ['establish', 'Company immigration card sorted'],
  ['security',  'Handled securely and correctly'],
  ['stamp',     'Final step handled for you'],
]

const getSub = (name: string): string => {
  const n = name?.toLowerCase()
  for (const [key, sub] of SERVICE_SUB) {
    if (n?.includes(key)) return sub
  }
  return 'Full service, expertly handled'
}

// ─── Gradient palette — different per card index ─────────────────────────────
const GRADIENTS = [
  'from-[#0F2A44] via-[#1a3a5c] to-[#0F2A44]',
  'from-[#1a3a5c] via-[#163B5F] to-[#0A2237]',
  'from-[#0A2237] via-[#0F2A44] to-[#163B5F]',
  'from-[#163B5F] via-[#1E4976] to-[#0F2A44]',
  'from-[#0F2A44] via-[#0A2237] to-[#1a3a5c]',
]

const MOST_CHOSEN_KEYS = ['spouse', 'family', 'golden', 'employ', 'change', 'renew']
const isMostChosen = (name: string) =>
  MOST_CHOSEN_KEYS?.some(k => name?.toLowerCase()?.includes(k))

// ─── Categories derived from services ────────────────────────────────────────
const CATEGORY_QUICK = [
  { key: '',          label: 'All' },
  { key: 'family',    label: 'Family' },
  { key: 'employ',    label: 'Employment' },
  { key: 'golden',    label: 'Golden Visa' },
  { key: 'renew',     label: 'Renewal' },
  { key: 'cancel',    label: 'Cancellation' },
  { key: 'establish', label: 'Business' },
]

const stagger = { animate: { transition: { staggerChildren: 0.04 } } }
const cardV = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export default function ServiceStep({ services, loading, onSelect }: ServiceStepProps) {
  const { t } = useTranslation()
  const [tapped,    setTapped]    = useState<string | null>(null)
  const [query,     setQuery]     = useState('')
  const [catFilter, setCatFilter] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Focus search on mount for desktop keyboard UX
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
        className="space-y-1.5"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#BBF451]">
          {t('upload.step', 'Choose your service')}
        </p>
        <h1
          className="font-bold text-[#0F2A44] leading-tight"
          style={{ fontSize: 'clamp(1.5rem, 5vw, 2.1rem)' }}
        >
          {t('service.title', 'What do you want to get done today?')}
        </h1>
        <p className="text-[#64748B] text-[14px] leading-relaxed">
          {t('service.subtitle', 'Choose a service — we handle everything for you')}
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.08 }}
        className="relative"
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
        <Input
          ref={searchRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('service.search', 'Search services...')}
          className="pl-10 pr-9 h-11 rounded-xl border-[#F1F5F9] bg-[#F8FAFC] text-[#0F2A44] placeholder:text-[#94A3B8] focus-visible:ring-[#BBF451] focus-visible:border-[#BBF451] text-[15px]"
          style={{ fontSize: '16px' }}
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F2A44]"
            >
              <XIcon className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Category quick-select */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
        className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-5 px-5"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* {CATEGORY_QUICK.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCatFilter(cat.key)}
            className={`
              shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-150
              ${catFilter === cat.key
                ? 'bg-[#0F2A44] text-white border-[#0F2A44]'
                : 'bg-white text-[#64748B] border-[#F1F5F9] hover:border-[#BBF451]/60 hover:text-[#0F2A44]'
              }
            `}
          >
            {t(`service.cat.${cat.key || 'all'}`, cat.label)}
          </button>
        ))} */}
      </motion.div>

      {/* Skeleton */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-[100px] rounded-2xl bg-[#F1F5F9] animate-pulse"
              style={{ animationDelay: `${i * 0.06}s` }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-[#94A3B8] text-[14px]"
        >
          {t('service.noResults', 'No services found. Try a different search.')}
        </motion.div>
      ) : (
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {filtered?.map((svc, idx) => {
            const sub    = getSub(svc?.name)
            const active = tapped === String(svc?.id)
            const chosen = isMostChosen(svc?.name)
            const grad   = GRADIENTS[idx % GRADIENTS?.length]

            return (
              <motion.button
                key={svc?.id}
                variants={cardV}
                whileTap={{ scale: 0.985 }}
                onClick={() => handleSelect(svc)}
                disabled={tapped !== null}
                className={`
                  group relative w-full text-left rounded-2xl overflow-hidden cursor-pointer
                  transition-all duration-200
                  ${active
                    ? 'shadow-[0_0_0_2px_#BBF451,0_8px_32px_rgba(187,244,81,0.25)]'
                    : 'shadow-sm hover:shadow-[0_4px_24px_rgba(15,42,68,0.18)] hover:-translate-y-0.5'
                  }
                `}
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${grad} opacity-100`} />

                {/* Subtle texture overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(187,244,81,0.08),transparent_60%)]" />

                {/* Content */}
                <div className="relative flex items-center gap-4 px-4 py-4">
                  {/* Left accent line */}
                  <div
                    className={`
                      absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-[#BBF451]
                      transition-all duration-150
                      ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}
                    `}
                  />

                  {/* Text content */}
                  <div className="flex-1 min-w-0 pl-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-white leading-snug" style={{ fontSize: '15px' }}>
                        {svc.name}
                      </span>
                      {chosen && (
                        <Badge className="shrink-0 h-[17px] px-1.5 text-[10px] font-bold bg-[#BBF451]/20 text-[#BBF451] border border-[#BBF451]/30 rounded-full gap-1 leading-none">
                          <TrendingUp className="w-2.5 h-2.5" />
                          {t('service.mostChosen', 'Most chosen')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[12px] text-white/55 leading-snug">{sub}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/40">
                      {svc.processingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {svc.processingTime}
                        </span>
                      )}
                      {svc.noOfApplications && (
                        <span>{svc.noOfApplications}</span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <motion.div
                    animate={{ x: active ? 4 : 0 }}
                    transition={{ duration: 0.14 }}
                    className="shrink-0"
                  >
                    <ArrowRight
                      className={`w-4 h-4 transition-colors duration-150 ${
                        active ? 'text-[#BBF451]' : 'text-white/25 group-hover:text-[#BBF451]/70'
                      }`}
                    />
                  </motion.div>
                </div>

                {/* Bottom info strip for required docs count */}
                {(svc.requiredDocuments?.length ?? 0) > 0 && (
                  <div className="relative px-5 pb-3 pt-0 flex items-center gap-1.5 text-[11px] text-white/35">
                    <span>{svc.requiredDocuments!.length} {t('service.docsRequired', 'documents required')}</span>
                  </div>
                )}
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
            className="text-center text-[11px] text-[#CBD5E1] pb-1"
          >
            {t('service.trustFooter', '10,000+ applications processed · 97% approval rate')}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}