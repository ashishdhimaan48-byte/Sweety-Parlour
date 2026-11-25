import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onBookNow: () => void;
  onOpenDesk: () => void;
}

export function Navbar({ onBookNow, onOpenDesk }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileAction = (action: () => void) => {
    setMobileOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-40 glass-header">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        <a
          href="#top"
          className="font-display text-2xl font-semibold tracking-tight text-[#1f1418] dark:text-[#f7eff2] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7a1f3d] dark:focus-visible:outline-[#e06d91]"
        >
          Sweety Beauty Parlour
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#524048] dark:text-[#cbb9c1]"
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

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBookNow}
            className="hidden sm:inline-flex items-center justify-center rounded-xl bg-[#7a1f3d] dark:bg-[#9e2a4f] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#611630] dark:hover:bg-[#b3345d] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a1f3d]"
          >
            Book on WhatsApp
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden items-center justify-center rounded-xl border border-[#1f1418]/15 dark:border-white/15 bg-white/75 dark:bg-white/10 p-2.5 text-[#1f1418] dark:text-[#f7eff2] cursor-pointer"
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
