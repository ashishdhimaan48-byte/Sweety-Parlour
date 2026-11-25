import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  SERVICE_CATEGORIES,
  SERVICES,
  filterServicesByCategory,
  formatInr,
  type ParlourService,
  type ServiceCategory,
} from '../utils/parlour';

interface ServicesShowcaseProps {
  selectedServiceId: string;
  onSelectService: (service: ParlourService) => void;
}

function ServiceCard({
  service,
  isSelected,
  onSelect,
}: {
  service: ParlourService;
  isSelected: boolean;
  onSelect: (service: ParlourService) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article className="glass-card flex flex-col overflow-hidden rounded-2xl transition-transform duration-200 hover:-translate-y-0.5">
      <div className="aspect-[4/3] w-full overflow-hidden bg-[#efe4e8] dark:bg-[#281b21]">
        {!imgFailed ? (
          <img
            src={service.imageUrl}
            alt={service.imageAlt}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#f3e6eb] to-[#ead9df] dark:from-[#2b1a21] dark:to-[#1d1217] p-6 text-center">
            <Sparkles className="h-8 w-8 text-[#7a1f3d] dark:text-[#e06d91]" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-[#1f1418] dark:text-[#f7eff2]">{service.name}</p>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#7a1f3d] dark:text-[#e06d91]">
            <span>{service.category}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums text-[#524048] dark:text-[#cbb9c1]">{service.durationMinutes} min</span>
          </div>

          <h3 className="mt-2 font-display text-2xl font-semibold leading-snug text-[#1f1418] dark:text-[#f7eff2]">
            {service.name}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-[#524048] dark:text-[#cbb9c1]">{service.summary}</p>

          <ul className="mt-4 space-y-1.5 border-t border-[#1f1418]/10 dark:border-white/10 pt-4 text-xs text-[#524048] dark:text-[#cbb9c1]">
            {service.includes.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden="true" className="text-[#7a1f3d] dark:text-[#e06d91]">
                  —
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#1f1418]/10 dark:border-white/10 pt-4">
          <div>
            <p className="text-xs text-[#524048] dark:text-[#cbb9c1]">Starting price</p>
            <p className="tabular-nums text-lg font-semibold text-[#1f1418] dark:text-[#f7eff2]">
              {formatInr(service.priceInr)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelect(service)}
            aria-label={`Select ${service.name} for WhatsApp booking`}
            className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a1f3d] ${
              isSelected
                ? 'bg-[#128c7e] text-white hover:bg-[#0e7367]'
                : 'bg-[#7a1f3d] dark:bg-[#9e2a4f] text-white hover:bg-[#611630] dark:hover:bg-[#b3345d]'
            }`}
          >
            {isSelected ? 'Selected' : 'Select for Booking'}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ServicesShowcase({ selectedServiceId, onSelectService }: ServicesShowcaseProps) {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('All Services');
  const visibleServices = filterServicesByCategory(SERVICES, activeCategory);

  return (
    <section id="services" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#7a1f3d] dark:text-[#e06d91]">
            Curated Rate Card
          </p>
          <h2
            className="font-display mt-2 text-3xl font-semibold tracking-tight text-[#1f1418] dark:text-[#f7eff2] sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            Treatments crafted for weddings, festivals, and everyday radiance.
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Filter parlour services by category"
          className="flex flex-wrap lg:flex-nowrap items-center gap-1 rounded-2xl border border-white/80 dark:border-white/10 bg-white/55 dark:bg-white/5 p-1.5 backdrop-blur-md shrink-0"
        >
          {SERVICE_CATEGORIES.map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setActiveCategory(category)}
                className={`min-h-[40px] rounded-xl px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#7a1f3d] dark:bg-[#9e2a4f] text-white shadow-sm'
                    : 'text-[#524048] dark:text-[#cbb9c1] hover:bg-white/80 dark:hover:bg-white/10 hover:text-[#1f1418] dark:hover:text-white'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div id="bridal" className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedServiceId === service.id}
            onSelect={onSelectService}
          />
        ))}
      </div>
    </section>
  );
}
