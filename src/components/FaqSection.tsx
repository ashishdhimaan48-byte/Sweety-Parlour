import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PARLOUR_FAQS } from '../utils/parlour';

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(PARLOUR_FAQS[0].id);

  return (
    <section id="faq" aria-labelledby="faq-heading" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 lg:p-10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#7a1f3d] dark:text-[#e06d91]">
            Common Questions
          </p>
          <h2
            id="faq-heading"
            className="font-display mt-2 text-3xl font-semibold tracking-tight text-[#1f1418] dark:text-[#f7eff2] sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            Visiting Sweety Beauty Parlour in Lawar, Meerut.
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          {PARLOUR_FAQS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className="glass-card rounded-2xl overflow-hidden">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${item.id}`}
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[#1f1418] dark:text-[#f7eff2] hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#7a1f3d] dark:text-[#e06d91] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                {isOpen && (
                  <div
                    id={`faq-panel-${item.id}`}
                    className="border-t border-[#1f1418]/10 dark:border-white/10 px-5 py-4 text-sm leading-relaxed text-[#524048] dark:text-[#cbb9c1]"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
