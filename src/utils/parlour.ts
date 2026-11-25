export type ServiceCategory =
  | 'All Services'
  | 'Bridal'
  | 'Skin & Facial'
  | 'Hair & Styling'
  | 'Mehndi & Nails';

export interface ParlourService {
  id: string;
  name: string;
  category: Exclude<ServiceCategory, 'All Services'>;
  durationMinutes: number;
  priceInr: number;
  summary: string;
  includes: string[];
  imageUrl: string;
  imageAlt: string;
  featured?: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type InquiryStatus = 'new' | 'replied' | 'closed';
export type WhatsAppDispatchMode = 'cloud_api' | 'whatsapp_deeplink';

export interface BookingInput {
  customerName: string;
  phone: string;
  serviceId: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

export interface InquiryInput {
  customerName: string;
  phone: string;
  topic: string;
  message: string;
}

export interface BookingRecord {
  id: string;
  customerName: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  priceInr: number;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: BookingStatus;
  whatsappDispatchMode: WhatsAppDispatchMode;
  whatsappMessage: string;
  whatsappUrl: string;
  createdAt: string;
}

export interface InquiryRecord {
  id: string;
  customerName: string;
  phone: string;
  topic: string;
  message: string;
  status: InquiryStatus;
  whatsappDispatchMode: WhatsAppDispatchMode;
  whatsappMessage: string;
  whatsappUrl: string;
  createdAt: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  errors: Record<string, string>;
  data?: T;
}

export const PARLOUR_INFO = {
  name: 'Sweety Beauty Parlour',
  locality: 'Lawar, Meerut',
  address: 'Main Market Road, Near Lawar Bus Stand, Lawar, Meerut, Uttar Pradesh 250222',
  hours: '10:00 AM – 8:00 PM · Open All 7 Days',
  defaultWhatsAppNumber: '919876543210',
} as const;

export const HERO_IMAGE = {
  url: '/src/assets/images/hero_bridal_studio_1795582984724.jpg',
  alt: 'Sunlit interior of Sweety Beauty Parlour in Lawar, Meerut featuring arched brass mirrors and fresh florals',
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'All Services',
  'Bridal',
  'Skin & Facial',
  'Hair & Styling',
  'Mehndi & Nails',
];

export const TIME_SLOTS: string[] = [
  '10:00 AM',
  '11:30 AM',
  '01:00 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
  '07:00 PM',
];

export const INQUIRY_TOPICS: string[] = [
  'Bridal Package & Trial',
  'Party & Engagement Makeup',
  'Skin & Facial Consultation',
  'Hair Spa & Smoothening',
  'Bridal Mehndi & Home Visit',
];

export const SERVICES: ParlourService[] = [
  {
    id: 'royal-bridal-hd',
    name: 'Royal HD Bridal Artistry',
    category: 'Bridal',
    durationMinutes: 180,
    priceInr: 14500,
    summary:
      'Long-wear luminous HD bridal makeup tailored for North Indian wedding lighting, paired with traditional dupatta and jewellery draping.',
    includes: ['Pre-bridal skin prep', 'HD airbrush base', 'Hair styling & floral setting', 'Saree or lehenga draping'],
    imageUrl: '/src/assets/images/service_bridal_glam_1795582985595.jpg',
    imageAlt: 'Indian bride with luminous natural glass-skin bridal makeup and gold maang tikka',
    featured: true,
  },
  {
    id: 'engagement-cocktail-glam',
    name: 'Engagement & Reception Glam',
    category: 'Bridal',
    durationMinutes: 120,
    priceInr: 6500,
    summary:
      'Soft sculpted glow or shimmer evening eye look designed for ring ceremonies, sangeet nights, and reception photography.',
    includes: ['Glass-skin hydration', 'Custom lash placement', 'Waves or textured bun', 'Outfit pinning'],
    imageUrl: '/src/assets/images/service_bridal_glam_1795582985595.jpg',
    imageAlt: 'Soft sculpted engagement makeup look with warm rose tones',
  },
  {
    id: 'party-family-makeup',
    name: 'Bridesmaid & Family Party Makeup',
    category: 'Bridal',
    durationMinutes: 90,
    priceInr: 3200,
    summary:
      'Radiant natural glam, soft curls or bun, and crisp saree draping tailored for sisters, mothers, and wedding guests.',
    includes: ['Skin prep & primer', 'Waterproof eye & lip look', 'Hair styling', 'Dupatta or saree drape'],
    imageUrl: '/src/assets/images/service_bridal_glam_1795582985595.jpg',
    imageAlt: 'Natural radiant party makeup for wedding guests and bridesmaids',
  },
  {
    id: 'botanical-rose-facial',
    name: 'Rose Quartz Botanical Glow Facial',
    category: 'Skin & Facial',
    durationMinutes: 75,
    priceInr: 1850,
    summary:
      'Gentle enzyme exfoliation, rosewater hydration, and lymphatic rose-quartz sculpting massage for calm, radiant wedding-ready skin.',
    includes: ['Ultrasonic pore cleanse', 'Rose & saffron serum', 'Gua sha lymphatic massage', 'Soothing pearl mask'],
    imageUrl: '/src/assets/images/service_facial_botanical_1795582986390.jpg',
    imageAlt: 'Botanical skincare facial setup with amber serum bottle and rose quartz gua sha',
    featured: true,
  },
  {
    id: 'o3-bridal-detan',
    name: 'Pre-Bridal Radiance & De-Tan Ritual',
    category: 'Skin & Facial',
    durationMinutes: 90,
    priceInr: 2600,
    summary:
      'Brightening multi-step facial and upper-body polish that evens skin tone and boosts moisture before festive occasions.',
    includes: ['Vitamin C brightening peel', 'Neck & back de-tan pack', 'Oxygen hydration mist', 'SPF finish'],
    imageUrl: '/src/assets/images/service_facial_botanical_1795582986390.jpg',
    imageAlt: 'Luxury botanical skincare tray on travertine stone',
  },
  {
    id: 'keratin-silk-spa',
    name: 'Camellia Keratin & Hair Spa',
    category: 'Hair & Styling',
    durationMinutes: 90,
    priceInr: 2200,
    summary:
      'Deep protein restoration and warm camellia oil scalp therapy that tames frizz and restores mirror-like shine.',
    includes: ['Aromatherapy scalp massage', 'Micro-mist steam infusion', 'Keratin repair mask', 'Smooth blowout'],
    imageUrl: '/src/assets/images/service_hair_botanical_1795582986454.jpg',
    imageAlt: 'Luxury hair elixir bottle, tortoiseshell comb, and botanical mask bowl',
    featured: true,
  },
  {
    id: 'festive-hair-drape',
    name: 'Festive Hair Styling & Saree Drape',
    category: 'Hair & Styling',
    durationMinutes: 60,
    priceInr: 1200,
    summary:
      'Structured low buns with fresh mogra gajra or soft Hollywood waves paired with crisp, comfortable saree pleating.',
    includes: ['Heat-protectant prep', 'Pinned floral bun or curls', 'Precision saree pleating', 'Dupatta setting'],
    imageUrl: '/src/assets/images/service_hair_botanical_1795582986454.jpg',
    imageAlt: 'Curated salon styling tools and botanical hair elixir on marble counter',
  },
  {
    id: 'bridal-organic-mehndi',
    name: 'Organic Bridal Henna Mehndi',
    category: 'Mehndi & Nails',
    durationMinutes: 150,
    priceInr: 3500,
    summary:
      'Fine-line Rajasthani and floral bridal mehndi mixed fresh with organic Sojat henna and clove oil for a rich deep stain.',
    includes: ['Both hands up to elbows', 'Feet mandala detailing', 'Organic eucalyptus seal', 'Aftercare balm'],
    imageUrl: '/src/assets/images/service_mehndi_hands_1795582986747.jpg',
    imageAlt: 'Intricate fine-line Indian bridal mehndi on graceful hands with gold bangles',
    featured: true,
  },
  {
    id: 'gel-nail-manicure',
    name: 'Pearl French Gel Manicure & Pedicure',
    category: 'Mehndi & Nails',
    durationMinutes: 75,
    priceInr: 1400,
    summary:
      'Cuticle care, rose-salt soak, and chip-resistant pearlescent gel polish suited for bridal rings and festive wear.',
    includes: ['Cuticle & nail shaping', 'Rose petal foot soak', 'UV gel colour or French tip', 'Hand massage'],
    imageUrl: '/src/assets/images/service_mehndi_hands_1795582986747.jpg',
    imageAlt: 'Manicured hands with intricate bridal mehndi and delicate ring',
  },
];

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function filterServicesByCategory(
  services: ParlourService[],
  category: ServiceCategory,
): ParlourService[] {
  if (category === 'All Services') {
    return services;
  }
  return services.filter((service) => service.category === category);
}

export function findServiceById(serviceId: string): ParlourService | undefined {
  return SERVICES.find((item) => item.id === serviceId);
}

/**
 * Normalizes an Indian mobile number to 12-digit E.164 digits without '+' (e.g. "919876543210").
 * Returns null if the input is not a valid 10-digit Indian mobile number (starting with 6-9).
 */
export function normalizeIndianPhone(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    return digits;
  }
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1))) {
    return `91${digits.slice(1)}`;
  }
  return null;
}

export function formatDisplayPhone(normalizedPhone: string): string {
  const digits = normalizedPhone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return normalizedPhone;
}

export function sanitizeSingleLine(value: string, maxLength = 120): string {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function sanitizeMultiline(value: string, maxLength = 500): string {
  return value.replace(/\r\n/g, '\n').trim().slice(0, maxLength);
}

export function validateBookingInput(input: BookingInput): ValidationResult<BookingInput & { normalizedPhone: string; service: ParlourService }> {
  const errors: Record<string, string> = {};
  const customerName = sanitizeSingleLine(input.customerName || '', 80);
  const normalizedPhone = normalizeIndianPhone(input.phone || '');
  const service = findServiceById(input.serviceId);
  const preferredDate = (input.preferredDate || '').trim();
  const preferredTime = sanitizeSingleLine(input.preferredTime || '', 30);
  const notes = sanitizeMultiline(input.notes || '', 350);

  if (customerName.length < 2) {
    errors.customerName = 'Please enter your full name (at least 2 characters).';
  }
  if (!normalizedPhone) {
    errors.phone = 'Enter a valid 10-digit Indian WhatsApp mobile number (starting with 6–9).';
  }
  if (!service) {
    errors.serviceId = 'Please choose a service from the menu.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    errors.preferredDate = 'Please select a preferred appointment date.';
  }
  if (!preferredTime) {
    errors.preferredTime = 'Please choose an appointment time slot.';
  }

  if (Object.keys(errors).length > 0 || !normalizedPhone || !service) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    data: {
      customerName,
      phone: normalizedPhone,
      normalizedPhone,
      serviceId: service.id,
      service,
      preferredDate,
      preferredTime,
      notes,
    },
  };
}

export function validateInquiryInput(input: InquiryInput): ValidationResult<InquiryInput & { normalizedPhone: string }> {
  const errors: Record<string, string> = {};
  const customerName = sanitizeSingleLine(input.customerName || '', 80);
  const normalizedPhone = normalizeIndianPhone(input.phone || '');
  const topic = sanitizeSingleLine(input.topic || '', 100);
  const message = sanitizeMultiline(input.message || '', 500);

  if (customerName.length < 2) {
    errors.customerName = 'Please enter your name (at least 2 characters).';
  }
  if (!normalizedPhone) {
    errors.phone = 'Enter a valid 10-digit Indian WhatsApp mobile number (starting with 6–9).';
  }
  if (!topic) {
    errors.topic = 'Please select an inquiry topic.';
  }
  if (message.length < 8) {
    errors.message = 'Please write a short inquiry (at least 8 characters).';
  }

  if (Object.keys(errors).length > 0 || !normalizedPhone) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    data: {
      customerName,
      phone: normalizedPhone,
      normalizedPhone,
      topic,
      message,
    },
  };
}

export function buildWhatsAppBookingMessage(params: {
  referenceId?: string;
  customerName: string;
  phone: string;
  serviceName: string;
  priceInr: number;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}): string {
  const lines = [
    'Namaste Sweety Beauty Parlour (Lawar, Meerut)!',
    '',
    'New Appointment Request:',
    params.referenceId ? `Ref ID: ${params.referenceId}` : null,
    `Name: ${params.customerName}`,
    `WhatsApp: ${formatDisplayPhone(params.phone)}`,
    `Service: ${params.serviceName} (${formatInr(params.priceInr)})`,
    `Preferred Slot: ${params.preferredDate} at ${params.preferredTime}`,
    params.notes ? `Notes: ${params.notes}` : null,
    '',
    'Please confirm availability. Thank you!',
  ].filter((line): line is string => line !== null);

  return lines.join('\n');
}

export function buildWhatsAppInquiryMessage(params: {
  referenceId?: string;
  customerName: string;
  phone: string;
  topic: string;
  message: string;
}): string {
  const lines = [
    'Namaste Sweety Beauty Parlour (Lawar, Meerut)!',
    '',
    'New Parlour Inquiry:',
    params.referenceId ? `Ref ID: ${params.referenceId}` : null,
    `Name: ${params.customerName}`,
    `WhatsApp: ${formatDisplayPhone(params.phone)}`,
    `Topic: ${params.topic}`,
    `Question: ${params.message}`,
  ].filter((line): line is string => line !== null);

  return lines.join('\n');
}

export function buildWhatsAppUrl(parlourPhoneDigits: string, message: string): string {
  const safeDigits = parlourPhoneDigits.replace(/\D/g, '') || PARLOUR_INFO.defaultWhatsAppNumber;
  const url = new URL(`https://wa.me/${safeDigits}`);
  url.searchParams.set('text', message);
  return url.toString();
}

export function summarizeDeskStats(bookings: BookingRecord[], inquiries: InquiryRecord[]) {
  return {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === 'pending').length,
    confirmedBookings: bookings.filter((b) => b.status === 'confirmed').length,
    totalInquiries: inquiries.length,
    openInquiries: inquiries.filter((i) => i.status === 'new').length,
  };
}
