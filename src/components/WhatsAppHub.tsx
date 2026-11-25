import { useMemo, useState, type FormEvent } from 'react';
import { CalendarCheck2, CheckCircle2, Copy, ExternalLink, MessageCircle } from 'lucide-react';
import {
  INQUIRY_TOPICS,
  PARLOUR_INFO,
  SERVICES,
  TIME_SLOTS,
  buildWhatsAppBookingMessage,
  buildWhatsAppInquiryMessage,
  findServiceById,
  formatInr,
  normalizeIndianPhone,
  validateBookingInput,
  validateInquiryInput,
  type BookingRecord,
  type InquiryRecord,
} from '../utils/parlour';

export type HubMode = 'booking' | 'inquiry';

interface WhatsAppHubProps {
  mode: HubMode;
  onModeChange: (mode: HubMode) => void;
  selectedServiceId: string;
  onServiceIdChange: (serviceId: string) => void;
  whatsappDisplayNumber: string;
  cloudApiConfigured: boolean;
}

export function WhatsAppHub({
  mode,
  onModeChange,
  selectedServiceId,
  onServiceIdChange,
  whatsappDisplayNumber,
  cloudApiConfigured,
}: WhatsAppHubProps) {
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('11:30 AM');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSubmitError, setBookingSubmitError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);

  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryTopic, setInquiryTopic] = useState(INQUIRY_TOPICS[0]);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryErrors, setInquiryErrors] = useState<Record<string, string>>({});
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySubmitError, setInquirySubmitError] = useState<string | null>(null);
  const [confirmedInquiry, setConfirmedInquiry] = useState<InquiryRecord | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedService = useMemo(
    () => findServiceById(selectedServiceId) ?? SERVICES[0],
    [selectedServiceId],
  );

  const livePreviewMessage = useMemo(() => {
    if (mode === 'booking') {
      if (confirmedBooking) return confirmedBooking.whatsappMessage;
      const phone = normalizeIndianPhone(bookingPhone) ?? '91XXXXXXXXXX';
      return buildWhatsAppBookingMessage({
        customerName: bookingName.trim() || 'Your Name',
        phone,
        serviceName: selectedService.name,
        priceInr: selectedService.priceInr,
        preferredDate: preferredDate || 'YYYY-MM-DD',
        preferredTime: preferredTime || 'Select Slot',
        notes: bookingNotes.trim() || undefined,
      });
    }

    if (confirmedInquiry) return confirmedInquiry.whatsappMessage;
    const phone = normalizeIndianPhone(inquiryPhone) ?? '91XXXXXXXXXX';
    return buildWhatsAppInquiryMessage({
      customerName: inquiryName.trim() || 'Your Name',
      phone,
      topic: inquiryTopic,
      message: inquiryMessage.trim() || 'Write your question or bridal package inquiry here...',
    });
  }, [
    mode,
    confirmedBooking,
    confirmedInquiry,
    bookingName,
    bookingPhone,
    selectedService,
    preferredDate,
    preferredTime,
    bookingNotes,
    inquiryName,
    inquiryPhone,
    inquiryTopic,
    inquiryMessage,
  ]);

  const handleBookingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBookingSubmitError(null);

    const validation = validateBookingInput({
      customerName: bookingName,
      phone: bookingPhone,
      serviceId: selectedServiceId,
      preferredDate,
      preferredTime,
      notes: bookingNotes,
    });

    if (!validation.valid) {
      setBookingErrors(validation.errors);
      return;
    }

    setBookingErrors({});
    setBookingSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: bookingName,
          phone: bookingPhone,
          serviceId: selectedServiceId,
          preferredDate,
          preferredTime,
          notes: bookingNotes,
        }),
      });

      const payload = (await response.json()) as {
        booking?: BookingRecord;
        error?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok || !payload.booking) {
        if (payload.errors) setBookingErrors(payload.errors);
        setBookingSubmitError(payload.error || 'Could not submit your booking. Please try again.');
        return;
      }

      setConfirmedBooking(payload.booking);
    } catch {
      setBookingSubmitError('Network error while connecting to the booking desk.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleInquirySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setInquirySubmitError(null);

    const validation = validateInquiryInput({
      customerName: inquiryName,
      phone: inquiryPhone,
      topic: inquiryTopic,
      message: inquiryMessage,
    });

    if (!validation.valid) {
      setInquiryErrors(validation.errors);
      return;
    }

    setInquiryErrors({});
    setInquirySubmitting(true);

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: inquiryName,
          phone: inquiryPhone,
          topic: inquiryTopic,
          message: inquiryMessage,
        }),
      });

      const payload = (await response.json()) as {
        inquiry?: InquiryRecord;
        error?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok || !payload.inquiry) {
        if (payload.errors) setInquiryErrors(payload.errors);
        setInquirySubmitError(payload.error || 'Could not submit your inquiry. Please try again.');
        return;
      }

      setConfirmedInquiry(payload.inquiry);
    } catch {
      setInquirySubmitError('Network error while connecting to the inquiry desk.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  const handleCopyMessage = async (text: string, refId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(refId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  };

  const activeConfirmation = mode === 'booking' ? confirmedBooking : confirmedInquiry;

  return (
    <section id="book-inquire" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 border-b border-[#1f1418]/10 dark:border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-[#7a1f3d] dark:text-[#e06d91]">
              Automated WhatsApp Desk
            </p>
            <h2
              className="font-display mt-2 text-3xl font-semibold tracking-tight text-[#1f1418] dark:text-[#f7eff2] sm:text-4xl"
              style={{ textWrap: 'balance' }}
            >
              Book your appointment or send an inquiry on WhatsApp.
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Choose booking or inquiry workflow"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-white/80 dark:border-white/10 bg-white/65 dark:bg-white/5 p-1.5 self-start"
          >
            <button
              role="tab"
              type="button"
              aria-selected={mode === 'booking'}
              onClick={() => onModeChange('booking')}
              className={`min-h-[40px] rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'booking'
                  ? 'bg-[#7a1f3d] dark:bg-[#9e2a4f] text-white shadow-sm'
                  : 'text-[#524048] dark:text-[#cbb9c1] hover:text-[#1f1418] dark:hover:text-white'
              }`}
            >
              Book Appointment
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={mode === 'inquiry'}
              onClick={() => onModeChange('inquiry')}
              className={`min-h-[40px] rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'inquiry'
                  ? 'bg-[#7a1f3d] dark:bg-[#9e2a4f] text-white shadow-sm'
                  : 'text-[#524048] dark:text-[#cbb9c1] hover:text-[#1f1418] dark:hover:text-white'
              }`}
            >
              Quick Inquiry
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {mode === 'booking' ? (
              confirmedBooking ? (
                <div
                  data-testid="booking-confirmation"
                  className="glass-card rounded-2xl p-6 sm:p-8"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#128c7e] dark:text-[#2ec4b6]" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#128c7e] dark:text-[#2ec4b6]">
                        Appointment Request Logged
                      </p>
                      <h3 className="mt-1 font-display text-2xl font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                        Reference {confirmedBooking.id}
                      </h3>
                      <p className="mt-2 text-sm text-[#524048] dark:text-[#cbb9c1]">
                        {confirmedBooking.whatsappDispatchMode === 'cloud_api'
                          ? 'Your appointment summary was sent automatically via the Sweety Beauty Parlour WhatsApp API. You can also open the chat directly below.'
                          : 'Your appointment is saved at our Lawar desk. Tap below to send the pre-filled confirmation message directly on WhatsApp.'}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-6 grid grid-cols-1 gap-3 border-t border-[#1f1418]/10 dark:border-white/10 pt-5 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-[#524048] dark:text-[#cbb9c1]">Client</dt>
                      <dd className="font-medium text-[#1f1418] dark:text-[#f7eff2]">{confirmedBooking.customerName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#524048] dark:text-[#cbb9c1]">Service</dt>
                      <dd className="font-medium text-[#1f1418] dark:text-[#f7eff2]">
                        {confirmedBooking.serviceName} ({formatInr(confirmedBooking.priceInr)})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#524048] dark:text-[#cbb9c1]">Requested Slot</dt>
                      <dd className="tabular-nums font-medium text-[#1f1418] dark:text-[#f7eff2]">
                        {confirmedBooking.preferredDate} · {confirmedBooking.preferredTime}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#524048] dark:text-[#cbb9c1]">Status</dt>
                      <dd className="font-medium text-[#7a1f3d] dark:text-[#e06d91]">Pending Parlour Confirmation</dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <a
                      href={confirmedBooking.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#128c7e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0e7367] transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      <span>Open in WhatsApp</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopyMessage(confirmedBooking.whatsappMessage, confirmedBooking.id)
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-[#1f1418]/15 dark:border-white/15 bg-white/80 dark:bg-white/10 px-4 py-3 text-sm font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-white dark:hover:bg-white/15 cursor-pointer"
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      <span>{copiedId === confirmedBooking.id ? 'Copied' : 'Copy Message'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setConfirmedBooking(null);
                        setBookingName('');
                        setBookingPhone('');
                        setPreferredDate('');
                        setBookingNotes('');
                      }}
                      className="rounded-xl px-4 py-3 text-sm font-medium text-[#524048] dark:text-[#cbb9c1] hover:text-[#1f1418] dark:hover:text-white cursor-pointer"
                    >
                      Book Another Slot
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="booking-name" className="block text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                        Full Name
                      </label>
                      <input
                        id="booking-name"
                        type="text"
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        placeholder="e.g., Ananya Sharma"
                        className="glass-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-[#1f1418] dark:text-[#f7eff2] placeholder:text-[#524048]/60 dark:placeholder:text-[#cbb9c1]/55"
                      />
                      {bookingErrors.customerName && (
                        <p role="alert" className="mt-1.5 text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                          {bookingErrors.customerName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="booking-phone" className="block text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                        WhatsApp Mobile Number
                      </label>
                      <input
                        id="booking-phone"
                        type="tel"
                        inputMode="numeric"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        placeholder="10-digit mobile (e.g., 9876543210)"
                        className="glass-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm tabular-nums text-[#1f1418] dark:text-[#f7eff2] placeholder:text-[#524048]/60 dark:placeholder:text-[#cbb9c1]/55"
                      />
                      {bookingErrors.phone && (
                        <p role="alert" className="mt-1.5 text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                          {bookingErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="booking-service" className="block text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                      Selected Service
                    </label>
                    <select
                      id="booking-service"
                      value={selectedServiceId}
                      onChange={(e) => onServiceIdChange(e.target.value)}
                      className="glass-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-[#1f1418] dark:text-[#f7eff2]"
                    >
                      {SERVICES.map((service) => (
                        <option key={service.id} value={service.id} className="bg-white dark:bg-[#1b1217] text-[#1f1418] dark:text-[#f7eff2]">
                          {service.name} — {formatInr(service.priceInr)} ({service.durationMinutes} min)
                        </option>
                      ))}
                    </select>
                    {bookingErrors.serviceId && (
                      <p role="alert" className="mt-1.5 text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                        {bookingErrors.serviceId}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="booking-date" className="block text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                        Preferred Date
                      </label>
                      <input
                        id="booking-date"
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="glass-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm tabular-nums text-[#1f1418] dark:text-[#f7eff2]"
                      />
                      {bookingErrors.preferredDate && (
                        <p role="alert" className="mt-1.5 text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                          {bookingErrors.preferredDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="booking-time" className="block text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                        Preferred Time Slot
                      </label>
                      <select
                        id="booking-time"
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="glass-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm tabular-nums text-[#1f1418] dark:text-[#f7eff2]"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot} className="bg-white dark:bg-[#1b1217] text-[#1f1418] dark:text-[#f7eff2]">
                            {slot}
                          </option>
                        ))}
                      </select>
                      {bookingErrors.preferredTime && (
                        <p role="alert" className="mt-1.5 text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                          {bookingErrors.preferredTime}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="booking-notes" className="block text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                      Special Notes (Optional)
                    </label>
                    <textarea
                      id="booking-notes"
                      rows={3}
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="Bridal venue timing, home-visit request in Lawar/Meerut, or skin sensitivity notes"
                      className="glass-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-[#1f1418] dark:text-[#f7eff2] placeholder:text-[#524048]/60 dark:placeholder:text-[#cbb9c1]/55"
                    />
                  </div>

                  {bookingSubmitError && (
                    <p role="alert" className="rounded-xl border border-[#9f1239]/25 dark:border-[#fda4af]/30 bg-[#fff1f2] dark:bg-[#4c0519]/40 px-4 py-3 text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                      {bookingSubmitError}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <p className="text-xs text-[#524048] dark:text-[#cbb9c1]">
                      Estimated total:{' '}
                      <span className="tabular-nums font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                        {formatInr(selectedService.priceInr)}
                      </span>
                    </p>

                    <button
                      type="submit"
                      disabled={bookingSubmitting}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#7a1f3d] dark:bg-[#9e2a4f] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#611630] dark:hover:bg-[#b3345d] disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {bookingSubmitting ? 'Saving Booking...' : 'Confirm & Send to WhatsApp'}
                      </span>
                    </button>
                  </div>
                </form>
              )
            ) : confirmedInquiry ? (
              <div
                data-testid="inquiry-confirmation"
                className="glass-card rounded-2xl p-6 sm:p-8"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#128c7e] dark:text-[#2ec4b6]" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#128c7e] dark:text-[#2ec4b6]">
                      Inquiry Logged
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                      Reference {confirmedInquiry.id}
                    </h3>
                    <p className="mt-2 text-sm text-[#524048] dark:text-[#cbb9c1]">
                      {confirmedInquiry.whatsappDispatchMode === 'cloud_api'
                        ? 'Your inquiry was sent to Sweety Beauty Parlour via the WhatsApp Business API.'
                        : 'Your question is saved for our team in Lawar, Meerut. Tap below to send it directly on WhatsApp.'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#1f1418]/10 dark:border-white/10 pt-5">
                  <a
                    href={confirmedInquiry.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#128c7e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0e7367] transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Open WhatsApp Chat</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyMessage(confirmedInquiry.whatsappMessage, confirmedInquiry.id)
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-[#1f1418]/15 dark:border-white/15 bg-white/80 dark:bg-white/10 px-4 py-3 text-sm font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-white dark:hover:bg-white/15 cursor-pointer"
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    <span>{copiedId === confirmedInquiry.id ? 'Copied' : 'Copy Message'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedInquiry(null);
                      setInquiryName('');
                      setInquiryPhone('');
                      setInquiryMessage('');
                    }}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-[#524048] dark:text-[#cbb9c1] hover:text-[#1f1418] dark:hover:text-white cursor-pointer"
                  >
                    Ask Another Question
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="inquiry-name" className="block text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                      Your Name
                    </label>
                    <input
                      id="inquiry-name"
                      type="text"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="e.g., Priya Verma"
                      className="glass-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-[#1f1418] dark:text-[#f7eff2] placeholder:text-[#524048]/60 dark:placeholder:text-[#cbb9c1]/55"
                    />
                    {inquiryErrors.customerName && (
                      <p role="alert" className="mt-1.5 text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                        {inquiryErrors.customerName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="inquiry-phone" className="block text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                      WhatsApp Mobile Number
                    </label>
                    <input
                      id="inquiry-phone"
                      type="tel"
                      inputMode="numeric"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="10-digit mobile (e.g., 9812345678)"
                      className="glass-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm tabular-nums text-[#1f1418] dark:text-[#f7eff2] placeholder:text-[#524048]/60 dark:placeholder:text-[#cbb9c1]/55"
                    />
                    {inquiryErrors.phone && (
                      <p role="alert" className="mt-1.5 text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                        {inquiryErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="inquiry-topic" className="block text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                    Inquiry Topic
                  </label>
                  <select
                    id="inquiry-topic"
                    value={inquiryTopic}
                    onChange={(e) => setInquiryTopic(e.target.value)}
                    className="glass-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-[#1f1418] dark:text-[#f7eff2]"
                  >
                    {INQUIRY_TOPICS.map((topic) => (
                      <option key={topic} value={topic} className="bg-white dark:bg-[#1b1217] text-[#1f1418] dark:text-[#f7eff2]">
                        {topic}
                      </option>
                    ))}
                  </select>
                  {inquiryErrors.topic && (
                    <p role="alert" className="mt-1.5 text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                      {inquiryErrors.topic}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="inquiry-message" className="block text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                    Your Question or Package Details
                  </label>
                  <textarea
                    id="inquiry-message"
                    rows={4}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Ask about wedding dates, group party makeup, or home-visit mehndi in Lawar and Meerut..."
                    className="glass-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-[#1f1418] dark:text-[#f7eff2] placeholder:text-[#524048]/60 dark:placeholder:text-[#cbb9c1]/55"
                  />
                  {inquiryErrors.message && (
                    <p role="alert" className="mt-1.5 text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                      {inquiryErrors.message}
                    </p>
                  )}
                </div>

                {inquirySubmitError && (
                  <p role="alert" className="rounded-xl border border-[#9f1239]/25 dark:border-[#fda4af]/30 bg-[#fff1f2] dark:bg-[#4c0519]/40 px-4 py-3 text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                    {inquirySubmitError}
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={inquirySubmitting}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#128c7e] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0e7367] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {inquirySubmitting ? 'Preparing WhatsApp...' : 'Send Inquiry via WhatsApp'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>

          <aside className="lg:col-span-5">
            <div className="glass-card flex h-full flex-col justify-between rounded-2xl p-6">
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-[#1f1418]/10 dark:border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#128c7e] dark:text-[#2ec4b6]">
                      WhatsApp Message Preview
                    </p>
                    <p className="mt-0.5 text-xs text-[#524048] dark:text-[#cbb9c1]">
                      To {PARLOUR_INFO.name} · {whatsappDisplayNumber}
                    </p>
                  </div>
                  <MessageCircle className="h-5 w-5 text-[#128c7e] dark:text-[#2ec4b6]" aria-hidden="true" />
                </div>

                <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-[#1f1418]/10 dark:border-white/10 bg-white/75 dark:bg-[#140d11]/85 p-4 font-sans text-xs leading-relaxed text-[#1f1418] dark:text-[#f7eff2]">
                  {livePreviewMessage}
                </pre>
              </div>

              <div className="mt-6 border-t border-[#1f1418]/10 dark:border-white/10 pt-4 text-xs text-[#524048] dark:text-[#cbb9c1]">
                <p className="font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                  {cloudApiConfigured
                    ? 'Automated WhatsApp Business API Active'
                    : 'Direct WhatsApp Hand-Off Ready'}
                </p>
                <p className="mt-1 leading-relaxed">
                  {activeConfirmation
                    ? 'Your request is stored securely and ready to continue on WhatsApp.'
                    : 'Every submission validates your mobile number, logs a reference ID for our Lawar desk, and prepares your WhatsApp message.'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
