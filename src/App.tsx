import { useEffect, useState } from 'react';
import { HeroSection, type ThemeMode } from './components/HeroSection';
import { LocationFooter } from './components/LocationFooter';
import { Navbar } from './components/Navbar';
import { ParlourDesk } from './components/ParlourDesk';
import { ServicesShowcase } from './components/ServicesShowcase';
import { WhatsAppHub, type HubMode } from './components/WhatsAppHub';
import { PARLOUR_INFO, SERVICES, type ParlourService } from './utils/parlour';

interface PublicConfig {
  whatsappDisplayNumber: string;
  cloudApiConfigured: boolean;
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem('sbp-theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore storage errors
  }
  return 'light';
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [hubMode, setHubMode] = useState<HubMode>('booking');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(SERVICES[0].id);
  const [deskOpen, setDeskOpen] = useState(false);
  const [publicConfig, setPublicConfig] = useState<PublicConfig>({
    whatsappDisplayNumber: '+91 98765 43210',
    cloudApiConfigured: false,
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem('sbp-theme', theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config/public');
        if (res.ok) {
          const data = (await res.json()) as Partial<PublicConfig>;
          setPublicConfig({
            whatsappDisplayNumber: data.whatsappDisplayNumber || '+91 98765 43210',
            cloudApiConfigured: Boolean(data.cloudApiConfigured),
          });
        }
      } catch {
        // Keep default display config when offline
      }
    };
    void loadConfig();
  }, []);

  const scrollToHub = (targetMode: HubMode) => {
    setHubMode(targetMode);
    const el = document.getElementById('book-inquire');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectService = (service: ParlourService) => {
    setSelectedServiceId(service.id);
    scrollToHub('booking');
  };

  return (
    <div className="min-h-screen text-[#1f1418] dark:text-[#f7eff2]">
      <Navbar
        onBookNow={() => scrollToHub('booking')}
        onOpenDesk={() => setDeskOpen(true)}
      />

      <main aria-label={PARLOUR_INFO.name}>
        <HeroSection
          whatsappDisplayNumber={publicConfig.whatsappDisplayNumber}
          theme={theme}
          onThemeChange={setTheme}
          onStartBooking={() => scrollToHub('booking')}
          onStartInquiry={() => scrollToHub('inquiry')}
        />

        <ServicesShowcase
          selectedServiceId={selectedServiceId}
          onSelectService={handleSelectService}
        />

        <WhatsAppHub
          mode={hubMode}
          onModeChange={setHubMode}
          selectedServiceId={selectedServiceId}
          onServiceIdChange={setSelectedServiceId}
          whatsappDisplayNumber={publicConfig.whatsappDisplayNumber}
          cloudApiConfigured={publicConfig.cloudApiConfigured}
        />
      </main>

      <LocationFooter
        whatsappDisplayNumber={publicConfig.whatsappDisplayNumber}
        theme={theme}
        onThemeChange={setTheme}
        onOpenDesk={() => setDeskOpen(true)}
        onOpenInquiry={() => scrollToHub('inquiry')}
      />

      <ParlourDesk open={deskOpen} onClose={() => setDeskOpen(false)} />
    </div>
  );
}
