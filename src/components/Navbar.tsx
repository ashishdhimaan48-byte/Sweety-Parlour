import { useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import type { ThemeMode } from '../App';

interface NavbarProps {
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onBookNow: () => void;
  onOpenDesk: () => void;
}

export function Navbar({ theme, onThemeChange, onBookNow, onOpenDesk }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileAction = (action: () => void) => {
    setMobileOpen(false);
    action();
  };

  const toggleTheme = () => {
    onThemeChange(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-40 glass-header">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <a
          href="#top"
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7a1f3d] dark:focus-visible:outline-[#e06d91]"
        >
          <BrandLogo className="h-9 w-9 shrink-0" />
          <span className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#1f1418] dark:text-[#f7eff2]">
            Sweety Beauty Parlour
          </span>
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#524048] dark:text-[#cbb9c1]"
        >
          <a
            href="#services"
            className="hover:text-[#1f1418] dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Services
          </a>
          <a
            href="#bridal"
            className="hover:text-[#1f1418] dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Bridal
          </a>
          <a
            href="#book-inquire"
            className="hover:text-[#1f1418] dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Book &amp; Inquire
          </a>
          <button
            type="button"
            onClick={onOpenDesk}
            className="hover:text-[#1f1418] dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Admin Desk
          </button>
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#1f1418]/15 dark:border-white/15 bg-white/75 dark:bg-white/10 px-3 text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2] hover:bg-white dark:hover:bg-white/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a1f3d]"
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-4 w-4 text-[#7a1f3d]" aria-hidden="true" />
                <span className="hidden lg:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 text-[#e4b887]" aria-hidden="true" />
                <span className="hidden lg:inline">Light</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onBookNow}
            className="hidden sm:inline-flex h-10 items-center justify-center rounded-xl bg-[#7a1f3d] dark:bg-[#9e2a4f] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#611630] dark:hover:bg-[#b3345d] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a1f3d]"
          >
            Book on WhatsApp
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-[#1f1418]/15 dark:border-white/15 bg-white/75 dark:bg-white/10 text-[#1f1418] dark:text-[#f7eff2] cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#1f1418]/10 dark:border-white/10 bg-[#fbf8f9]/95 dark:bg-[#140d11]/95 backdrop-blur-xl px-4 py-4">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
            <a
              href="#services"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-white/70 dark:hover:bg-white/10"
            >
              Services
            </a>
            <a
              href="#bridal"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-white/70 dark:hover:bg-white/10"
            >
              Bridal
            </a>
            <a
              href="#book-inquire"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-white/70 dark:hover:bg-white/10"
            >
              Book &amp; Inquire
            </a>
            <button
              type="button"
              onClick={() => handleMobileAction(onOpenDesk)}
              className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-white/70 dark:hover:bg-white/10 cursor-pointer"
            >
              Admin Desk
            </button>
            <button
              type="button"
              onClick={() => handleMobileAction(onBookNow)}
              className="mt-1 w-full rounded-xl bg-[#7a1f3d] dark:bg-[#9e2a4f] px-4 py-3 text-sm font-medium text-white hover:bg-[#611630] dark:hover:bg-[#b3345d] cursor-pointer"
            >
              Book on WhatsApp
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
