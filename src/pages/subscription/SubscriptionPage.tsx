"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  ArrowLeft,
  Crown,
  AlertCircle,
  CreditCard,
  Shield,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import {
  PLANS,
  getEffectivePlan,
  getPerMonthAmount,
  isEidOfferActive,
  EID_OFFER_END,
  type Plan,
} from '@/lib/plans';

const PAYMENT_MODE: 'checkout' | 'elements' = 'checkout';

const stripePromise: Promise<Stripe | null> = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

import {
  Check, Loader2, Sparkles, ArrowRight, Gift,
  Lock, ExternalLink, ShieldCheck, Clock, Zap, Gem,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Value-anchored feature data ────────────────────────────────────────────
const PLAN_FEATURES: Record<string, {
  tagline: string;
  highlight: string;
  highlightSub: string;
  bullets: { label: string; value?: string; }[];
  badge?: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}> = {
  monthly: {
    tagline: 'Trying us out',
    highlight: '5 checks',
    highlightSub: 'every month',
    Icon: Zap,
    bullets: [
      { label: 'Document checks', value: 'AED 15 each after' },
      { label: 'Applications', value: 'Member price AED 79' },
      { label: 'WhatsApp + email alerts' },
      { label: 'Cancel anytime' },
    ],
  },
  yearly: {
    tagline: 'For the whole family',
    highlight: '60 checks',
    highlightSub: '+ 1 application included',
    badge: 'Best value',
    Icon: Crown,
    bullets: [
      { label: '1 letter included', value: 'Nawakas, fine reduction, or absconding' },
      { label: 'Fast-track', value: '4-hour turnaround' },
      { label: 'Up to 4 family members' },
      { label: 'Extra applications', value: 'AED 69 each' },
    ],
  },
  two_year: {
    tagline: 'Set & forget',
    highlight: '3 applications',
    highlightSub: 'included — worth AED 297',
    Icon: Gem,
    bullets: [
      { label: '120 checks', value: 'across 2 years' },
      { label: 'Fast-track 4-hour turnaround' },
      { label: 'Up to 6 family members' },
      { label: 'Extra applications', value: 'AED 59 each' },
    ],
  },
};

const featuresFor = (planId: string) =>
  PLAN_FEATURES[planId] ??
  PLAN_FEATURES[planId.includes('2') ? 'two_year' : planId.includes('year') ? 'yearly' : 'monthly'];

// ═══════════════════════════════════════════════════════════════════════════
// PLAN SELECTION BLOCK
// ═══════════════════════════════════════════════════════════════════════════

export function PlanSelectionSection({
  PLANS,
  selectedPlan,
  setSelectedPlan,
  getEffectivePlan,
  getPerMonthAmount,
  isEidOfferActive,
  EID_OFFER_END,
  handleSubscribe,
  isRedirecting,
  effectivePlan,
  PAYMENT_MODE,
}: any) {
  const eidActive = isEidOfferActive();

  return (
    <div
      className="relative isolate overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* Ambient glow backdrop — works on both surfaces */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      </div>

      <div className="mx-auto px-6 py-16 md:py-20 space-y-12 max-w-6xl">

        {/* ─── Headline ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center space-y-5 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.06] backdrop-blur-xl border border-black/10 dark:border-white/10">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] dark:bg-[var(--primary)] animate-pulse" />
            <span className="text-xs font-medium tracking-wide text-black/70 dark:text-white/70">
              Submitted by Amer — Professional Typist, Dubai
            </span>
          </div>

          <h1
            className="text-5xl md:text-6xl font-medium tracking-tight text-black dark:text-white leading-[1.05]"
            style={{ fontFamily: "'Fraunces', serif", fontVariationSettings: "'opsz' 144" }}
          >
            Your visa typist,
            <br />
            <span className="italic relative text-[var(--primary)] dark:text-[var(--primary)]">
              on call all year.
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" preserveAspectRatio="none">
                <path d="M0,6 Q75,1 150,4 T300,3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-base md:text-lg text-black/55 dark:text-white/50 leading-relaxed">
            Visas, fines, Nawakas, Emirates ID — every government headache,<br className="hidden md:block" />
            handled by your typist for less than the cost of one fine letter.
          </p>
        </motion.div>

        {/* ─── Eid banner ──────────────────────────────────────────────── */}
        {eidActive && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-[var(--primary)]/30 dark:border-[var(--primary)]/20 bg-[var(--primary)]/[0.06] dark:bg-white/[0.03] backdrop-blur-xl max-w-3xl mx-auto"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--primary)]/20 dark:bg-[var(--primary)]/10 blur-[60px]" />

            <div className="relative p-5 flex items-center gap-4">
              <div className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/20 border border-[var(--primary)]/30">
                <Gift className="h-6 w-6 text-[var(--primary)] dark:text-[var(--primary)]" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] text-black dark:text-white" style={{ fontFamily: "'Fraunces', serif" }}>
                  Eid Special — Save up to AED 50
                </p>
                <p className="text-xs text-black/50 dark:text-white/50 mt-0.5 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Offer ends {EID_OFFER_END.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <Badge className="bg-black text-[var(--primary)] dark:bg-[var(--primary)] dark:text-black hover:bg-black dark:hover:bg-[var(--primary)] border-0 px-3 py-1 text-[10px] tracking-widest uppercase font-bold">
                Limited time
              </Badge>
            </div>
          </motion.div>
        )}

        {/* ─── Pricing cards ──────────────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-6 pt-6 items-stretch">
          {PLANS.map((plan: any, idx: number) => {
            const eff = getEffectivePlan(plan);
            const perMonth = getPerMonthAmount(plan);
            const isSelected = selectedPlan.id === plan.id;
            const f = featuresFor(plan.id);
            const isPopular = plan.popular;
            const PlanIcon = f.Icon;

            return (
              <motion.button
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setSelectedPlan(plan)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.985 }}
                className={cn(
                  'relative flex flex-col text-left rounded-[26px] p-7 md:p-8 transition-all duration-300',
                  'border h-full bg-white dark:bg-black',
                  isPopular
                    ? [
                        'border-[var(--primary)]/60 dark:border-[var(--primary)]/40',
                        'shadow-[0_24px_60px_-16px_rgba(0,0,0,0.16)] dark:shadow-[0_24px_60px_-16px_rgba(0,0,0,0.7)]',
                        'md:-translate-y-3 z-10',
                      ]
                    : [
                        'border-black/10 dark:border-white/10',
                        'hover:border-black/20 dark:hover:border-white/20',
                      ],
                  isSelected && !isPopular && 'ring-2 ring-[var(--primary)]/60 dark:ring-[var(--primary)]/50 border-transparent'
                )}
              >
                {/* "Most popular" ribbon, overlapping the top edge */}
                {isPopular && (
                  <div className="absolute -top-3.5 right-7 flex items-center gap-1 rounded-full bg-[var(--primary)] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_6px_16px_-4px_rgba(10,50,105,0.7)]">
                    <Sparkles className="h-2.5 w-2.5" strokeWidth={3} />
                    Most popular
                  </div>
                )}

                {/* Header: icon + title */}
                <div className="relative flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                      isPopular
                        ? 'bg-[var(--primary)]/15 border-[var(--primary)]/30'
                        : 'bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10'
                    )}
                  >
                    <PlanIcon
                      className={cn('h-5 w-5', isPopular ? 'text-[var(--primary)] dark:text-[var(--primary)]' : 'text-black/55 dark:text-white/55')}
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3
                    className="text-xl md:text-[22px] font-semibold text-black dark:text-white leading-tight"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    {plan.label}
                  </h3>
                </div>

                <p className="relative mt-3 text-sm italic text-black/50 dark:text-white/40">
                  {f.tagline}
                </p>

                {/* Price */}
                <div className="relative mt-6 mb-1">
                  {eff.isOffer && (
                    <span className="block text-sm line-through text-black/30 dark:text-white/30 [font-variant-numeric:tabular-nums]">
                      AED {eff.regularAmount}
                    </span>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-4xl md:text-[42px] font-bold text-black dark:text-white tracking-tight [font-variant-numeric:tabular-nums]"
                      style={{ fontFamily: "'Fraunces', serif" }}
                    >
                      AED {eff.amount}
                    </span>
                    <span className="text-sm font-medium text-black/40 dark:text-white/40">
                      /{plan.intervalLabel}
                    </span>
                  </div>

                  {eff.isOffer && (
                    <span className="inline-block mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] dark:text-[var(--primary)] border border-[var(--primary)]/30 tracking-wide">
                      SAVE {eff.savings}
                    </span>
                  )}

                  {plan.interval !== 'month' && (
                    <p className="text-xs mt-2 font-medium text-[var(--primary)] dark:text-[var(--primary)]/80 [font-variant-numeric:tabular-nums]">
                      ≈ AED {perMonth}/month
                    </p>
                  )}
                </div>

                <p className="relative mt-3 text-xs font-medium text-black/45 dark:text-white/40">
                  {f.highlight} · {f.highlightSub}
                </p>

                {/* Divider label: "What's included" */}
                <div className="relative flex items-center gap-3 my-6">
                  <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-black/35 dark:text-white/30">
                    What's included
                  </span>
                  <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                </div>

                {/* Feature list */}
                <ul className="relative space-y-3 flex-1">
                  {f.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px]">
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-[1px]',
                          isPopular ? 'bg-[var(--primary)]' : 'bg-black/[0.06] dark:bg-white/[0.08]'
                        )}
                      >
                        <Check
                          className={cn(
                            'h-3 w-3',
                            isPopular ? 'text-white' : 'text-black/45 dark:text-white/45'
                          )}
                          strokeWidth={3}
                        />
                      </span>
                      <span className="text-black/75 dark:text-white/70 leading-snug pt-[1px]">
                        {bullet.label}
                        {bullet.value && (
                          <span className="text-black/40 dark:text-white/35"> — {bullet.value}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Button pinned to bottom */}
                <div
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan);
                    handleSubscribe();
                  }}
                  className={cn(
                    'relative mt-7 flex items-center justify-center gap-2 h-12 rounded-full text-sm font-semibold',
                    'transition-all duration-300 cursor-pointer select-none overflow-hidden group/btn',
                    isPopular
                      ? 'bg-[var(--primary)] text-white shadow-[0_8px_25px_-6px_rgba(10,50,105,0.55)] hover:shadow-[0_10px_32px_-6px_rgba(10,50,105,0.7)] hover:-translate-y-0.5'
                      : 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white hover:bg-black/85 dark:hover:bg-white/90'
                  )}
                >
                  <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  <span className="relative">Start with {plan.label}</span>
                  <ArrowRight className="relative h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* ─── CTA ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col items-center gap-4 pt-4 "
        >

   <motion.button
  onClick={handleSubscribe}
  disabled={isRedirecting}
  whileHover={{ y: -3 }}
  whileTap={{ scale: 0.985 }}
  className={cn(
    "group relative flex items-center justify-center gap-4",
    "h-14 min-w-[320px] rounded-full",
    "text-sm font-semibold overflow-hidden",
    "transition-all duration-300 cursor-pointer select-none",

    // ☀️ Light Mode
    "bg-white text-black",
    "border border-black/10",
    "shadow-[0_12px_30px_-10px_rgba(0,0,0,0.18)]",

    // 🌙 Dark Mode
    "dark:bg-black dark:text-white",
    "dark:border-white/10",
    "dark:shadow-[0_12px_35px_-10px_rgba(255,255,255,0.18)]",

    // Hover
    "hover:-translate-y-0.5",
    "hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.25)]",
    "dark:hover:shadow-[0_18px_45px_-12px_rgba(255,255,255,0.25)]",

    // Disabled
    "disabled:opacity-60",
    "disabled:cursor-not-allowed",
    "disabled:hover:translate-y-0"
  )}
>
  {/* Shine */}
  <span
    className="
      absolute inset-0
      -translate-x-full
      bg-gradient-to-r
      from-transparent
      via-black/10
      to-transparent
      transition-transform duration-700
      group-hover:translate-x-full
      dark:via-white/20
    "
  />

  {/* Glow */}
  <span
    className="
      absolute inset-0 rounded-full
      opacity-0
      bg-black/5
      blur-xl
      transition-opacity duration-300
      group-hover:opacity-100
      dark:bg-white/10
    "
  />

  {isRedirecting ? (
    <span className="relative z-10 flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />

      {PAYMENT_MODE === "checkout"
        ? "Opening secure checkout..."
        : "Loading..."}
    </span>
  ) : (
    <span className="relative z-10 flex items-center gap-3">

      <span>
        Start with {effectivePlan.label || "Membership"}
      </span>

<span
  className="
    relative overflow-hidden
    flex items-center
    rounded-full
    px-3 py-1.5
    text-[11px]

    bg-black/[0.06]
    text-black
    border border-black/10
    backdrop-blur-md

    dark:bg-white/[0.08]
    dark:text-white
    dark:border-white/10

    shadow-sm
    transition-all duration-300

    group-hover:scale-105
  "
>
  {/* Shine */}
  <span
    className="
      absolute inset-0
      -translate-x-full
      bg-gradient-to-r
      from-transparent
      via-white/30
      to-transparent
      transition-transform duration-700
      group-hover:translate-x-full
    "
  />

  <span className="relative z-10">
    AED {effectivePlan.amount}
  </span>
</span>

      <ArrowRight
        className="
          h-4 w-4
          transition-transform duration-300
          group-hover:translate-x-1
        "
      />

    </span>
  )}
</motion.button>

  {/* Trust & Security */}
<div className="mt-3 grid grid-cols-3 gap-2">

  {/* Badge */}
  <div
    className="group flex flex-col sm:flex-row items-center justify-center
               gap-1 sm:gap-2
               rounded-2xl
               border border-black/10 dark:border-white/10
               bg-black/[0.03] dark:bg-white/[0.04]
               backdrop-blur-xl
               px-2 py-3 sm:px-4 sm:py-2.5
               transition-all duration-300
               hover:-translate-y-0.5
               hover:border-[var(--primary)]/40
               hover:bg-[var(--primary)]/5"
  >
    <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--primary)] dark:text-[var(--primary)]" />
    <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-center text-black/70 dark:text-white/70 leading-tight">
      PCI-DSS Secure
    </span>
  </div>

  {/* Badge */}
  <div
    className="group flex flex-col sm:flex-row items-center justify-center
               gap-1 sm:gap-2
               rounded-2xl
               border border-black/10 dark:border-white/10
               bg-black/[0.03] dark:bg-white/[0.04]
               backdrop-blur-xl
               px-2 py-3 sm:px-4 sm:py-2.5
               transition-all duration-300
               hover:-translate-y-0.5
               hover:border-[var(--primary)]/40
               hover:bg-[var(--primary)]/5"
  >
    <Lock className="h-4 w-4 shrink-0 text-[var(--primary)] dark:text-[var(--primary)]" />
    <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-center text-black/70 dark:text-white/70 leading-tight">
      256-bit Encryption
    </span>
  </div>

  {/* Badge */}
  <div
    className="group flex flex-col sm:flex-row items-center justify-center
               gap-1 sm:gap-2
               rounded-2xl
               border border-black/10 dark:border-white/10
               bg-black/[0.03] dark:bg-white/[0.04]
               backdrop-blur-xl
               px-2 py-3 sm:px-4 sm:py-2.5
               transition-all duration-300
               hover:-translate-y-0.5
               hover:border-[var(--primary)]/40
               hover:bg-[var(--primary)]/5"
  >
    <ExternalLink className="h-4 w-4 shrink-0 text-[var(--primary)] dark:text-[var(--primary)]" />
    <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-center text-black/70 dark:text-white/70 leading-tight">
      Cancel Anytime
    </span>
  </div>

</div>
{/* Small Responsive Footer */}
<div
  className="
    relative mt-2 overflow-hidden
    rounded-2xl lg:rounded-3xl
    border border-black/10 dark:border-white/10
    bg-white/70 dark:bg-white/[0.03]
    backdrop-blur-2xl

    px-4 py-4
    sm:px-5 sm:py-5
    lg:px-6 lg:py-5

    max-w-2xl
    mx-auto
  "
>
  {/* Glow */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--primary)]/5 to-transparent opacity-70" />

  <div className="relative flex flex-col items-center text-center">

    {/* Brand */}
    <div className="flex flex-wrap items-center justify-center gap-2">

      <div className="h-2 w-2 rounded-full bg-[var(--primary)] shadow-[0_0_14px_var(--primary)]" />

      <span
        className="
          text-[9px]
          sm:text-[10px]
          lg:text-[11px]
          uppercase
          tracking-[0.22em]
          font-semibold
          text-black/45
          dark:text-white/45
        "
      >
        Powered By
      </span>

      <span
        className="
          text-xs
          sm:text-sm
          lg:text-[15px]
          font-semibold
          text-black
          dark:text-white
        "
      >
        Amer Professional Typist
      </span>

    </div>

    {/* Divider */}
    <div className="my-3 h-px w-24 bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent" />

    {/* Description */}
    <p
      className="
        max-w-lg
        text-[11px]
        sm:text-[12px]
        lg:text-[13px]
        leading-6
        text-black/55
        dark:text-white/50
      "
    >
      Licensed by{" "}
      <span className="font-semibold text-black dark:text-white">
        RAKEZ
      </span>

      <span className="mx-2 text-[var(--primary)]">•</span>

      End-to-end encrypted payments

      <span className="mx-2 text-[var(--primary)]">•</span>

      <span className="font-medium">
        7-day refund guarantee
      </span>{" "}
      when no service has been used.
    </p>

  </div>

  {/* Bottom Glow */}
  <div className="absolute bottom-0 left-1/2 h-20 w-44 -translate-x-1/2 rounded-full bg-[var(--primary)]/10 blur-3xl" />
</div>
</motion.div>
</div>
    </div>
  );
}

export function SubscriptionPage() {
  if (PAYMENT_MODE === 'elements') {
    return (
      <div
        className="relative z-10 rounded-t-[2rem] bg-white dark:bg-black transition-colors duration-300"
        style={{ '--primary': '#0A3269' } as React.CSSProperties}
      >
        <img src="/images/tammat-membership.png" alt="Tammat Logo" className="rounded-t-[2rem] w-full h-full object-cover absolute top-0 left-0 z-20 opacity-[0.06] dark:opacity-10" />
        <Elements stripe={stripePromise}>
          <SubscriptionPageInner />
        </Elements>
      </div>
    );
  }
  return (
    <div
      className="relative rounded-t-[2rem] bg-white dark:bg-black transition-colors duration-300"
      style={{ '--primary': '#0A3269' } as React.CSSProperties}
    >
      <img src="/images/tammat-membership.png" alt="Tammat Logo" className="bg-center bg-no-repeat bg-contain rounded-t-[2rem] w-full h-full object-cover absolute top-0 left-0 z-5 opacity-[0.1] dark:opacity-20" />
      <SubscriptionPageInner />
    </div>
  );
}

export function SubscriptionPageInner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[1]);
  const [step, setStep] = useState<'select' | 'payment'>('select');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const eidActive = isEidOfferActive();

  const checkoutStatus = searchParams.get('status');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (PAYMENT_MODE !== 'checkout') return;

    if (checkoutStatus === 'cancelled') {
      toast.info('Checkout cancelled — no charges made.');
      setSearchParams({}, { replace: true });
      return;
    }

    if (checkoutStatus === 'success' && sessionId) {
      (async () => {
        try {
          const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
          const token = localStorage.getItem('authToken');
          const res = await fetch(
            `${apiBase}/api/v1/services/payments/checkout-session/${sessionId}/verify`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();

          if (data.success && data.paid) {
            toast.success('Subscription activated! Welcome to Tammat.');
            await fetchCurrentSub();
          } else {
            toast.error('Payment verification failed. Please contact support.');
          }
        } catch (err) {
          console.error('Verify session failed:', err);
          toast.error('Could not verify payment.');
        } finally {
          setSearchParams({}, { replace: true });
        }
      })();
    }
  }, [checkoutStatus, sessionId]);

  const fetchCurrentSub = async () => {
    if (!user) {
      setLoadingCurrent(false);
      return;
    }
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${apiBase}/api/v1/services/payments/subscriptions/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCurrentSub(data.subscription);
    } finally {
      setLoadingCurrent(false);
    }
  };

  useEffect(() => {
    fetchCurrentSub();
  }, [user]);

  const effectivePlan = getEffectivePlan(selectedPlan);

    const handleSubscribe = async () => {
      if (!user) {
        navigate('/auth?redirect=/subscribe');
        return;
      }

      if (PAYMENT_MODE === 'checkout') {
        setIsRedirecting(true);
        try {
          const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
          const token = localStorage.getItem('authToken');
          const res = await fetch(`${apiBase}/api/v1/services/payments/checkout-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ lookupKey: effectivePlan.lookupKey }),
          });
          const data = await res.json();
          if (!data.success || !data.url) {
            toast.error(data.message || 'Failed to start checkout');
            setIsRedirecting(false);
            return;
          }
          window.location.href = data.url;
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Something went wrong');
          setIsRedirecting(false);
        }
      } else {
        setStep('payment');
      }
    };

    const handleManageBilling = async () => {
      setIsRedirecting(true);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${apiBase}/api/v1/services/payments/portal-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ returnUrl: window.location.href }),
        });
        const data = await res.json();
        if (!data.success || !data.url) {
          toast.error(data.message || 'Failed to open billing portal');
          setIsRedirecting(false);
          return;
        }
        window.location.href = data.url;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong');
        setIsRedirecting(false);
      }
    };

    if (loadingCurrent) {
      return (
        <div className="flex items-center justify-center py-24 bg-white dark:bg-black text-black/50 dark:text-white/50 gap-2 transition-colors duration-300">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)] dark:text-[var(--primary)]" />
          <span>Loading…</span>
        </div>
      );
    }

    if (currentSub && (currentSub.status === 'active' || currentSub.status === 'trialing')) {
      return (
        <ManageSubscriptionView
          subscription={currentSub}
          onManageBilling={handleManageBilling}
          isRedirecting={isRedirecting}
        />
      );
    }

    if (PAYMENT_MODE === 'elements' && step === 'payment') {
      return (
        <ElementsPaymentForm
          plan={selectedPlan}
          effectivePlan={effectivePlan}
          onBack={() => setStep('select')}
          onSuccess={() => {
            fetchCurrentSub();
          }}
        />
      );
    }

  return (
    <div className="mx-auto p-6 space-y-8 relative z-10">
      <div className="flex justify-center items-center">
        <PlanSelectionSection
          PLANS={PLANS}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          getEffectivePlan={getEffectivePlan}
          getPerMonthAmount={getPerMonthAmount}
          isEidOfferActive={isEidOfferActive}
          EID_OFFER_END={EID_OFFER_END}
          handleSubscribe={handleSubscribe}
          isRedirecting={isRedirecting}
          effectivePlan={effectivePlan}
          PAYMENT_MODE={PAYMENT_MODE}
        />
      </div>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Check className="h-4 w-4 text-[var(--primary)] dark:text-[var(--primary)] mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ELEMENTS PAYMENT FORM
// ═══════════════════════════════════════════════════════════════════════════

function ElementsPaymentForm({
  plan,
  effectivePlan,
  onBack,
  onSuccess,
}: {
  plan: Plan;
  effectivePlan: ReturnType<typeof getEffectivePlan>;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState({ number: false, expiry: false, cvc: false });

  const handleSubscribe = async () => {
    if (!stripe || !elements) return;
    if (!cardholderName.trim()) {
      setPaymentError('Please enter cardholder name');
      return;
    }
    const cardNumberEl = elements.getElement(CardNumberElement);
    if (!cardNumberEl) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberEl,
        billing_details: { name: cardholderName, email: user?.email },
      });
      if (pmError) {
        setPaymentError(pmError.message || 'Card error');
        setIsProcessing(false);
        return;
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${apiBase}/api/v1/services/payments/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lookupKey: effectivePlan.lookupKey,
          paymentMethodId: paymentMethod.id,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setPaymentError(data.message || 'Subscription failed');
        setIsProcessing(false);
        return;
      }

      if (data.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);
        if (confirmError) {
          setPaymentError(confirmError.message || 'Payment confirmation failed');
          setIsProcessing(false);
          return;
        }
      }

      try {
        await fetch(
          `${apiBase}/api/v1/services/payments/subscriptions/${data.subscriptionId}/sync`,
          { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        console.warn('Sync failed (webhook should still handle it):', e);
      }

      toast.success('You are now subscribed!');
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setPaymentError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '15px',
        color: isDark ? '#ffffff' : '#000000',
        fontFamily: 'inherit',
        '::placeholder': { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' },
        iconColor: '#0A3269',
      },
      invalid: { color: '#ff6b6b', iconColor: '#ff6b6b' },
    },
  };

  const allFieldsValid =
    cardComplete.number && cardComplete.expiry && cardComplete.cvc && cardholderName.trim().length > 0;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6 bg-white dark:bg-black transition-colors duration-300">
      <button
        onClick={onBack}
        className="text-sm text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Change plan
      </button>

      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 text-black dark:text-white">
          <Lock className="h-5 w-5 text-[var(--primary)] dark:text-[var(--primary)]" />
          Complete subscription
        </h2>
        <p className="text-black/50 dark:text-white/50 mt-1 text-sm">
          You'll be charged AED {effectivePlan.amount} now, then every {plan.intervalLabel}.
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] backdrop-blur-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-black dark:text-white">Tammat {plan.label}</p>
            <p className="text-xs text-black/40 dark:text-white/40">Billed every {plan.intervalLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-black dark:text-white">AED {effectivePlan.amount}</p>
            {effectivePlan.isOffer && (
              <Badge className="bg-[var(--primary)]/15 text-[var(--primary)] dark:text-[var(--primary)] border-[var(--primary)]/30 text-xs mt-1">
                Eid offer
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="card-name" className="text-black/70 dark:text-white/70">Cardholder Name</Label>
          <Input
            id="card-name"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Name on card"
            className="h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus-visible:ring-[var(--primary)] dark:focus-visible:ring-[var(--primary)]"
            autoComplete="cc-name"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-black/70 dark:text-white/70">Card Number</Label>
          <div className="flex items-center h-11 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] focus-within:ring-2 focus-within:ring-[var(--primary)] dark:focus-within:ring-[var(--primary)] transition-shadow">
            <CreditCard className="h-4 w-4 text-black/40 dark:text-white/40 mr-2 shrink-0" />
            <div className="flex-1">
              <CardNumberElement
                options={{ ...cardElementOptions, showIcon: false, placeholder: '1234 1234 1234 1234' }}
                onChange={(e) => setCardComplete((p) => ({ ...p, number: e.complete }))}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-black/70 dark:text-white/70">Expiry</Label>
            <div className="flex items-center h-11 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] focus-within:ring-2 focus-within:ring-[var(--primary)] dark:focus-within:ring-[var(--primary)] transition-shadow">
              <div className="flex-1">
                <CardExpiryElement
                  options={{ ...cardElementOptions, placeholder: 'MM / YY' }}
                  onChange={(e) => setCardComplete((p) => ({ ...p, expiry: e.complete }))}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-black/70 dark:text-white/70">CVC</Label>
            <div className="flex items-center h-11 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] focus-within:ring-2 focus-within:ring-[var(--primary)] dark:focus-within:ring-[var(--primary)] transition-shadow">
              <div className="flex-1">
                <CardCvcElement
                  options={{ ...cardElementOptions, placeholder: 'CVC' }}
                  onChange={(e) => setCardComplete((p) => ({ ...p, cvc: e.complete }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {paymentError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-500 dark:text-red-400"
          >
            {paymentError}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={handleSubscribe}
        disabled={!stripe || isProcessing || !allFieldsValid}
        size="lg"
        className="w-full gap-2 rounded-2xl bg-[var(--primary)] text-white font-bold hover:brightness-110 shadow-lg shadow-[var(--primary)]/20 transition-shadow"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Subscribe — AED {effectivePlan.amount}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-3 pt-2 text-xs text-black/40 dark:text-white/40">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3" />SSL
        </div>
        <div className="h-3 w-px bg-black/15 dark:bg-white/15" />
        <div className="flex items-center gap-1.5">
          <Shield className="h-3 w-3" />PCI-DSS
        </div>
        <div className="h-3 w-px bg-black/15 dark:bg-white/15" />
        <span>Powered by Stripe</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MANAGE EXISTING SUBSCRIPTION
// ═══════════════════════════════════════════════════════════════════════════

function ManageSubscriptionView({
  subscription,
  onManageBilling,
  isRedirecting,
}: {
  subscription: any;
  onManageBilling: () => void;
  isRedirecting: boolean;
}) {
  const intervalLabel =
    subscription.intervalCount === 2 && subscription.interval === 'year'
      ? '2 years'
      : subscription.interval;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 bg-white dark:bg-black transition-colors duration-300">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 text-black dark:text-white">
          <Crown className="h-6 w-6 text-[var(--primary)] dark:text-[var(--primary)]" />
          Your Subscription
        </h2>
        <p className="text-black/50 dark:text-white/50 mt-1">Manage your Tammat membership</p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] backdrop-blur-xl p-6 space-y-4">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--primary)]/15 dark:bg-[var(--primary)]/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm text-black/50 dark:text-white/50">Current plan</p>
            <p className="text-2xl font-bold mt-0.5 text-black dark:text-white">{subscription.productName}</p>
          </div>
          {subscription.cancelAtPeriodEnd ? (
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
              Canceling
            </Badge>
          ) : (
            <Badge className="bg-[var(--primary)]/15 text-[var(--primary)] dark:text-[var(--primary)] border-[var(--primary)]/30">
              Active
            </Badge>
          )}
        </div>

        <div className="relative pt-4 border-t border-black/10 dark:border-white/10 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-black/50 dark:text-white/50">Amount</span>
            <span className="font-medium text-black dark:text-white">
              AED {(subscription.amount / 100).toFixed(0)} / {intervalLabel}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/50 dark:text-white/50">
              {subscription.cancelAtPeriodEnd ? 'Ends on' : 'Renews on'}
            </span>
            <span className="font-medium text-black dark:text-white">
              {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="relative flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-600 dark:text-amber-300/90">
              Your subscription will remain active until{' '}
              {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-GB')}, after
              which it will not renew.
            </p>
          </div>
        )}
      </div>

      <Button
        size="lg"
        onClick={onManageBilling}
        disabled={isRedirecting}
        className="w-full gap-2 rounded-2xl bg-[var(--primary)] text-white font-bold hover:brightness-110 shadow-lg shadow-[var(--primary)]/20"
      >
        {isRedirecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening billing portal…
          </>
        ) : (
          <>
            Manage Billing & Payment Methods
            <ExternalLink className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-xs text-black/35 dark:text-white/30 text-center">
        Update payment method, change plan, download invoices, cancel — all in Stripe.
      </p>
    </div>
  );
}

export default SubscriptionPage;