"use client";

import {
  CalendarClock,
  Plane,
  BriefcaseBusiness,
  MapPin,
  FileSearch,
  FileWarning,
  Building2,
  Clock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Service } from '@/lib/services';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'calendar-clock': CalendarClock,
  'plane-off': Plane,
  'briefcase-off': BriefcaseBusiness,
  'map-pin': MapPin,
  'file-search': FileSearch,
  'file-warning': FileWarning,
  'building-2': Building2,
  'clock-alert': Clock,
};

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
  index: number;
}

export function ServiceCard({ service, onSelect, index }: ServiceCardProps) {
  const Icon = iconMap[service.icon] || FileSearch;

  return (
    <button
      onClick={() => onSelect(service)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-card",
        "border border-border/60 isolate",
        "transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
        "hover:-translate-y-2.5 hover:shadow-[0_20px_60px_-15px_rgba(10,50,105,0.35)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
        "text-left w-full"
      )}
      style={{
        animationDelay: `${index * 90}ms`,
        animation: 'fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        opacity: 0,
      }}
    >

      {service.popular && (
        <div className="absolute top-4 right-4 z-20">
          <Badge className="bg-accent text-accent-foreground shadow-lg gap-1 backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            Popular
          </Badge>
        </div>
      )}

      {/* image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        <img
          src={service.image}
          alt={service.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
        />
        {/* subtle shine sweep */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 -translate-x-full",
            "bg-gradient-to-r from-transparent via-white/20 to-transparent",
            "group-hover:translate-x-full transition-transform duration-[1100ms] ease-out"
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/25 to-transparent" />

        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
              "bg-card/90 backdrop-blur-md ",
              "transition-all duration-400 ease-out",
              "group-hover:bg-[var(--primary)] group-hover:text-white group-hover:scale-110 group-hover:rotate-[-6deg]",
              "group-hover:shadow-[0_8px_24px_-4px_rgba(10,50,105,0.5)]"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span
            className={cn(
              "translate-x-[-6px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
              "transition-all duration-300 ease-out delay-75",
              "text-[0.65rem] font-semibold uppercase tracking-wider text-white",
              "bg-[var(--primary)] backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-lg"
            )}
          >
            {service.authority}
          </span>
        </div>
      </div>

      {/* content */}
      <div className="relative flex flex-col flex-1 p-5">
        <div className="mb-2">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 mb-1 transition-colors duration-300 group-hover:text-[var(--primary)]">
            {service.authority}
          </p>
          <h3 className="text-[1.1rem] font-bold tracking-tight text-foreground leading-snug transition-colors duration-300 group-hover:text-[var(--primary)]">
            {service.title}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground/90 mb-4 line-clamp-2 flex-1 leading-relaxed">
          {service.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-border/60 relative">
          <span className="pointer-events-none absolute -top-px left-0 h-px w-0 bg-[var(--primary)] transition-all duration-500 ease-out group-hover:w-full" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground/60">
              Starting from
            </span>
            <div className="flex items-baseline gap-1">
              <img src="/images/aed-symbol.png" width={14} height={14} alt="AED" className="opacity-60 translate-y-[1px] transition-opacity duration-300 group-hover:opacity-100" />
              <p
                className={cn(
                  "text-2xl font-extrabold tracking-tight tabular-nums bg-clip-text text-transparent transition-all duration-300",
                  "bg-gradient-to-br from-foreground to-foreground/70",
                  "group-hover:from-[var(--primary)] group-hover:to-[var(--primary)]"
                )}
              >
                {service.priceStandard}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              "bg-muted text-muted-foreground",
              "transition-all duration-300 ease-out",
              "group-hover:bg-[var(--primary)] group-hover:text-white",
              "group-hover:shadow-[0_0_0_6px_rgba(10,50,105,0.18)]",
              "group-hover:-rotate-45"
            )}
          >
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </button>
  );
}