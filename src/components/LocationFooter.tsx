import { Clock, MapPin, MessageCircle, Moon, Sun } from 'lucide-react';
import { PARLOUR_INFO } from '../utils/parlour';
import type { ThemeMode } from './HeroSection';

interface LocationFooterProps {
  whatsappDisplayNumber: string;
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onOpenDesk: () => void;
  onOpenInquiry: () => void;
}

export function LocationFooter({
  whatsappDisplayNumber,
  theme,
  onThemeChange,
  onOpenDesk,
  onOpenInquiry,
}: LocationFooterProps) {
  return (
    <footer className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-6">
      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl font-semibold text-[#1f1418] dark:text-[#f7eff2]">
              {PARLOUR_INFO.name}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#524048] dark:text-[#cbb9c1]">
              Bridal makeup, botanical skin care, hair rituals, and organic mehndi studio serving
              Lawar and Meerut families.
            </p>
          </div>

          <div className="space-y-2 text-sm text-[#524048] dark:text-[#cbb9c1]">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#7a1f3d] dark:text-[#e06d91]" aria-hidden="true" />
              <span>{PARLOUR_INFO.address}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#7a1f3d] dark:text-[#e06d91]" aria-hidden="true" />
              <span>{PARLOUR_INFO.hours}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#128c7e] dark:text-[#2ec4b6]" aria-hidden="true" />
              <span className="tabular-nums">WhatsApp Desk: {whatsappDisplayNumber}</span>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 md:items-end">
            <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-[#524048] dark:text-[#cbb9c1]">
              <a href="#services" className="hover:text-[#1f1418] dark:hover:text-white hover:underline underline-offset-4">
                Services
              </a>
              <button
                type="button"
                onClick={onOpenInquiry}
                className="hover:text-[#1f1418] dark:hover:text-white hover:underline underline-offset-4 cursor-pointer"
              >
                WhatsApp Inquiry
              </button>
              <button
                type="button"
                onClick={onOpenDesk}
                className="hover:text-[#1f1418] dark:hover:text-white hover:underline underline-offset-4 cursor-pointer"
              >
                Admin Desk
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#1f1418]/12 dark:border-white/15 bg-white/70 dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-white dark:hover:bg-white/15 cursor-pointer"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Light Mode</span>
                  </>
                )}
              </button>
              <p className="text-xs text-[#524048] dark:text-[#cbb9c1]">
                © {new Date().getFullYear()} {PARLOUR_INFO.name}, Lawar, Meerut.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
