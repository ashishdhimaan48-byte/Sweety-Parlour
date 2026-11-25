import { useState } from 'react';
import { ArrowRight, CalendarCheck2, MessageCircle, Moon, Sparkles, Sun } from 'lucide-react';
import { HERO_IMAGE } from '../utils/parlour';

export type ThemeMode = 'light' | 'dark';

interface HeroSectionProps {
  whatsappDisplayNumber: string;
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onStartBooking: () => void;
  onStartInquiry: () => void;
}

export function HeroSection({
  whatsappDisplayNumber,
  theme,
  onThemeChange,
  onStartBooking,
  onStartInquiry,
}: HeroSectionProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section id="top" className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:px-6 lg:pt-12 lg:pb-16">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          <div className="flex flex-col justify-between lg:col-span-6 lg:pr-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold tracking-widest uppercase text-[#7a1f3d] dark:text-[#e06d91]">
                  Lawar, Meerut · Main Market Road
                </p>

                <div
                  role="group"
                  aria-label="Color theme switcher"
                  className="inline-flex items-center gap-1 rounded-xl border border-[#1f1418]/12 dark:border-white/15 bg-white/70 dark:bg-white/5 p-1"
                >
                  <button
                    type="button"
                    aria-pressed={theme === 'light'}
                    onClick={() => onThemeChange('light')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      theme === 'light'
                        ? 'bg-[#7a1f3d] text-white shadow-sm'
                        : 'text-[#524048] dark:text-[#cbb9c1] hover:text-[#1f1418] dark:hover:text-white'
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={theme === 'dark'}
                    onClick={() => onThemeChange('dark')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-[#9e2a4f] text-white shadow-sm'
                        : 'text-[#524048] dark:text-[#cbb9c1] hover:text-[#1f1418] dark:hover:text-white'
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              <h1
                className="font-display mt-4 font-semibold tracking-tight text-[#1f1418] dark:text-[#f7eff2] leading-[1.06]"
                style={{ fontSize: 'clamp(2.35rem, 4.2vw, 3.85rem)', textWrap: 'balance' }}
              >
                Bridal artistry and calm skin rituals in Lawar.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#524048] dark:text-[#cbb9c1]">
                Sweety Beauty Parlour brings bespoke North Indian bridal makeup, botanical facials,
                keratin hair care, and organic mehndi to Meerut—with instant appointment booking and
                consultation directly on WhatsApp.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onStartBooking}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7a1f3d] dark:bg-[#9e2a4f] px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#611630] dark:hover:bg-[#b3345d] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a1f3d]"
                >
                  <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
                  <span>Book Appointment</span>
                </button>

                <button
                  type="button"
                  onClick={onStartInquiry}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#1f1418]/15 dark:border-white/15 bg-white/70 dark:bg-white/10 px-5 py-3.5 text-sm font-semibold text-[#1f1418] dark:text-[#f7eff2] hover:bg-white dark:hover:bg-white/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 text-[#128c7e] dark:text-[#2ec4b6]" aria-hidden="true" />
                  <span>Quick WhatsApp Inquiry</span>
                </button>
              </div>
            </div>

            <div className="mt-10 border-t border-[#1f1418]/10 dark:border-white/10 pt-5 flex flex-wrap items-center justify-between gap-4 text-sm text-[#524048] dark:text-[#cbb9c1]">
              <div>
                <span className="font-medium text-[#1f1418] dark:text-[#f7eff2]">WhatsApp Desk</span>
                <span className="mx-2 text-[#524048]/60 dark:text-[#cbb9c1]/60" aria-hidden="true">
                  ·
                </span>
                <span className="tabular-nums">{whatsappDisplayNumber}</span>
              </div>
              <a
                href="#services"
                className="inline-flex items-center gap-1.5 font-medium text-[#7a1f3d] dark:text-[#e06d91] hover:underline underline-offset-4 whitespace-nowrap"
              >
                <span>Explore rate card</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] w-full overflow-hidden rounded-2xl border border-white/80 dark:border-white/15 bg-[#eee4e8] dark:bg-[#23171d]">
              {!imgFailed ? (
                <img
                  src={HERO_IMAGE.url}
                  alt={HERO_IMAGE.alt}
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#f4e7ec] via-[#efe5df] to-[#e7d4dc] dark:from-[#2c1a22] dark:via-[#22151b] dark:to-[#180f13] p-8 text-center">
                  <Sparkles className="h-10 w-10 text-[#7a1f3d] dark:text-[#e06d91]" aria-hidden="true" />
                  <p className="font-display mt-3 text-2xl font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                    Sweety Beauty Parlour
                  </p>
                  <p className="mt-1 text-sm text-[#524048] dark:text-[#cbb9c1]">Lawar, Meerut Bridal Studio</p>
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-6">
                <p className="text-xs font-medium tracking-wide uppercase text-white/85">
                  Private Bridal Suite · Lawar, Meerut
                </p>
                <p className="mt-1 font-display text-xl font-medium text-white">
                  Hygienic studio care with tailored skin &amp; bridal trials
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-[#1f1418]/10 dark:border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="px-1">
            <p className="text-xs font-medium text-[#7a1f3d] dark:text-[#e06d91]">01. Bridal Artistry</p>
            <p className="mt-1 text-sm font-semibold text-[#1f1418] dark:text-[#f7eff2]">HD &amp; Airbrush Makeup</p>
            <p className="mt-0.5 text-xs text-[#524048] dark:text-[#cbb9c1]">Includes trial &amp; lehenga draping</p>
          </div>
          <div className="px-1">
            <p className="text-xs font-medium text-[#7a1f3d] dark:text-[#e06d91]">02. Skin Rituals</p>
            <p className="mt-1 text-sm font-semibold text-[#1f1418] dark:text-[#f7eff2]">Botanical Rose Facials</p>
            <p className="mt-0.5 text-xs text-[#524048] dark:text-[#cbb9c1]">Pre-bridal glow &amp; de-tan care</p>
          </div>
          <div className="px-1">
            <p className="text-xs font-medium text-[#7a1f3d] dark:text-[#e06d91]">03. Henna &amp; Nails</p>
            <p className="mt-1 text-sm font-semibold text-[#1f1418] dark:text-[#f7eff2]">Organic Sojat Mehndi</p>
            <p className="mt-0.5 text-xs text-[#524048] dark:text-[#cbb9c1]">Bridal hands, feet &amp; gel nails</p>
          </div>
          <div className="px-1">
            <p className="text-xs font-medium text-[#7a1f3d] dark:text-[#e06d91]">04. WhatsApp Workflow</p>
            <p className="mt-1 text-sm font-semibold text-[#1f1418] dark:text-[#f7eff2]">Instant Slot Confirmation</p>
            <p className="mt-0.5 text-xs text-[#524048] dark:text-[#cbb9c1]">Direct chat &amp; inquiry tracking</p>
          </div>
        </div>
      </div>
    </section>
  );
}
