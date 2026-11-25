import { useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, Lock, LogOut, ShieldCheck, X } from 'lucide-react';
import {
  buildWhatsAppUrl,
  formatDisplayPhone,
  formatInr,
  summarizeDeskStats,
  type BookingRecord,
  type BookingStatus,
  type InquiryRecord,
  type InquiryStatus,
} from '../utils/parlour';

interface ParlourDeskProps {
  open: boolean;
  onClose: () => void;
}

type AuthStatus = {
  configured: boolean;
  source: 'environment' | 'claimed' | 'unclaimed';
};

export function ParlourDesk({ open, onClose }: ParlourDeskProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [deskTab, setDeskTab] = useState<'bookings' | 'inquiries'>('bookings');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!open) return;

    const loadAuthStatus = async () => {
      try {
        const res = await fetch('/api/admin/auth-status');
        if (res.ok) {
          const data = (await res.json()) as AuthStatus;
          setAuthStatus(data);
        }
      } catch {
        setAuthError('Unable to reach the Admin Desk server.');
      }
    };

    void loadAuthStatus();
  }, [open]);

  const fetchRecords = async (bearerToken: string) => {
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const res = await fetch('/api/admin/records', {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
      if (res.status === 401) {
        setToken(null);
        setAuthError('Your session expired. Please sign in again.');
        return;
      }
      if (!res.ok) {
        setRecordsError('Failed to load client records.');
        return;
      }
      const data = (await res.json()) as {
        bookings: BookingRecord[];
        inquiries: InquiryRecord[];
      };
      setBookings(data.bookings);
      setInquiries(data.inquiries);
    } catch {
      setRecordsError('Network error loading records.');
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    if (open && token) {
      void fetchRecords(token);
    }
  }, [open, token]);

  if (!open) return null;

  const handleClaimOrLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const isSetup = authStatus?.source === 'unclaimed';
    if (isSetup) {
      if (passcode.trim().length < 6) {
        setAuthError('Choose a passcode of at least 6 characters.');
        return;
      }
      if (passcode !== confirmPasscode) {
        setAuthError('Passcodes do not match.');
        return;
      }
    } else if (!passcode.trim()) {
      setAuthError('Please enter your Admin Desk passcode.');
      return;
    }

    setAuthBusy(true);
    try {
      const endpoint = isSetup ? '/api/admin/claim-passcode' : '/api/admin/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Authentication failed.');
        return;
      }

      setToken(data.token);
      setPasscode('');
      setConfirmPasscode('');
      if (isSetup) {
        setAuthStatus({ configured: true, source: 'claimed' });
      }
    } catch {
      setAuthError('Network error during sign in.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleBookingStatusUpdate = async (id: string, status: BookingStatus) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = (await res.json()) as { booking: BookingRecord };
        setBookings((prev) => prev.map((b) => (b.id === id ? data.booking : b)));
      }
    } catch {
      setRecordsError('Could not update booking status.');
    }
  };

  const handleInquiryStatusUpdate = async (id: string, status: InquiryStatus) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = (await res.json()) as { inquiry: InquiryRecord };
        setInquiries((prev) => prev.map((i) => (i.id === id ? data.inquiry : i)));
      }
    } catch {
      setRecordsError('Could not update inquiry status.');
    }
  };

  const stats = summarizeDeskStats(bookings, inquiries);
  const filteredBookings =
    statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter);
  const filteredInquiries =
    statusFilter === 'all' ? inquiries : inquiries.filter((i) => i.status === statusFilter);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="parlour-desk-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1418]/45 dark:bg-black/70 p-4 backdrop-blur-md"
    >
      <div className="glass-panel max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-[#fbf8f9]/95 dark:bg-[#171014]/95 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-[#1f1418]/10 dark:border-white/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7a1f3d] dark:text-[#e06d91]">
              Protected Client Management
            </p>
            <h2 id="parlour-desk-title" className="font-display mt-1 text-3xl font-semibold text-[#1f1418] dark:text-[#f7eff2]">
              Admin &amp; Parlour Desk
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {token && (
              <button
                type="button"
                onClick={() => {
                  setToken(null);
                  setBookings([]);
                  setInquiries([]);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#1f1418]/15 dark:border-white/15 bg-white dark:bg-white/10 px-3.5 py-2 text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2] hover:bg-[#f6eef1] dark:hover:bg-white/15 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Parlour Desk"
              className="rounded-xl border border-[#1f1418]/15 dark:border-white/15 bg-white dark:bg-white/10 p-2 text-[#1f1418] dark:text-[#f7eff2] hover:bg-[#f6eef1] dark:hover:bg-white/15 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {!token ? (
          <div className="mx-auto my-6 max-w-md rounded-2xl border border-[#1f1418]/10 dark:border-white/12 bg-white/80 dark:bg-[#22171d]/90 p-6">
            <div className="flex items-center gap-2.5 text-[#7a1f3d] dark:text-[#e06d91]">
              <Lock className="h-5 w-5" aria-hidden="true" />
              <h3 className="text-base font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                {authStatus?.source === 'unclaimed'
                  ? 'First-Time Admin Setup (Create Passcode)'
                  : 'Admin Sign In'}
              </h3>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-[#524048] dark:text-[#cbb9c1]">
              {authStatus?.source === 'unclaimed'
                ? 'There is no default password. Create your own private staff passcode (6+ characters) right here to unlock bookings and WhatsApp inquiries.'
                : authStatus?.source === 'environment'
                  ? 'An ADMIN_PASSCODE secret is configured in Settings → Secrets. Enter that passcode below to view and manage client bookings and WhatsApp inquiries.'
                  : 'Sign in with the staff passcode you created for this Parlour Desk.'}
            </p>

            <form onSubmit={handleClaimOrLogin} className="mt-5 space-y-4">
              <div>
                <label htmlFor="desk-passcode" className="block text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                  {authStatus?.source === 'unclaimed' ? 'New Staff Passcode' : 'Staff Passcode'}
                </label>
                <input
                  id="desk-passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="glass-input mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm text-[#1f1418] dark:text-[#f7eff2]"
                />
              </div>

              {authStatus?.source === 'unclaimed' && (
                <div>
                  <label htmlFor="desk-passcode-confirm" className="block text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                    Confirm Staff Passcode
                  </label>
                  <input
                    id="desk-passcode-confirm"
                    type="password"
                    value={confirmPasscode}
                    onChange={(e) => setConfirmPasscode(e.target.value)}
                    placeholder="Re-enter passcode"
                    className="glass-input mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm text-[#1f1418] dark:text-[#f7eff2]"
                  />
                </div>
              )}

              {authError && (
                <p role="alert" className="text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authBusy}
                className="w-full rounded-xl bg-[#7a1f3d] dark:bg-[#9e2a4f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#611630] dark:hover:bg-[#b3345d] disabled:opacity-60 cursor-pointer"
              >
                {authBusy
                  ? 'Verifying...'
                  : authStatus?.source === 'unclaimed'
                    ? 'Claim Parlour Desk Access'
                    : 'Sign In'}
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
                <p className="text-xs text-[#524048] dark:text-[#cbb9c1]">Total Bookings</p>
                <p className="mt-1 tabular-nums text-2xl font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                  {stats.totalBookings}
                </p>
              </div>
              <div className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
                <p className="text-xs text-[#524048] dark:text-[#cbb9c1]">Pending Slots</p>
                <p className="mt-1 tabular-nums text-2xl font-semibold text-[#7a1f3d] dark:text-[#e06d91]">
                  {stats.pendingBookings}
                </p>
              </div>
              <div className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
                <p className="text-xs text-[#524048] dark:text-[#cbb9c1]">Confirmed</p>
                <p className="mt-1 tabular-nums text-2xl font-semibold text-[#128c7e] dark:text-[#2ec4b6]">
                  {stats.confirmedBookings}
                </p>
              </div>
              <div className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
                <p className="text-xs text-[#524048] dark:text-[#cbb9c1]">Open Inquiries</p>
                <p className="mt-1 tabular-nums text-2xl font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                  {stats.openInquiries}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 rounded-xl border border-[#1f1418]/10 dark:border-white/10 bg-white/75 dark:bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setDeskTab('bookings');
                    setStatusFilter('all');
                  }}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                    deskTab === 'bookings'
                      ? 'bg-[#7a1f3d] dark:bg-[#9e2a4f] text-white'
                      : 'text-[#524048] dark:text-[#cbb9c1]'
                  }`}
                >
                  Bookings ({bookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeskTab('inquiries');
                    setStatusFilter('all');
                  }}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                    deskTab === 'inquiries'
                      ? 'bg-[#7a1f3d] dark:bg-[#9e2a4f] text-white'
                      : 'text-[#524048] dark:text-[#cbb9c1]'
                  }`}
                >
                  WhatsApp Inquiries ({inquiries.length})
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(deskTab === 'bookings'
                  ? ['all', 'pending', 'confirmed', 'completed']
                  : ['all', 'new', 'replied', 'closed']
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#1f1418] dark:bg-[#f7eff2] text-white dark:text-[#140d11]'
                        : 'border border-[#1f1418]/10 dark:border-white/15 bg-white dark:bg-white/5 text-[#524048] dark:text-[#cbb9c1]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {recordsError && (
              <p role="alert" className="text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                {recordsError}
              </p>
            )}

            {recordsLoading ? (
              <p className="py-8 text-center text-sm text-[#524048] dark:text-[#cbb9c1]">Loading client records...</p>
            ) : deskTab === 'bookings' ? (
              filteredBookings.length === 0 ? (
                <p className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/70 dark:bg-white/5 py-8 text-center text-sm text-[#524048] dark:text-[#cbb9c1]">
                  No bookings match this filter yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/85 dark:bg-white/5 p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#524048] dark:text-[#cbb9c1]">
                            <span className="tabular-nums font-semibold text-[#1f1418] dark:text-[#f7eff2]">{booking.id}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize font-semibold text-[#7a1f3d] dark:text-[#e06d91]">
                              Status: {booking.status}
                            </span>
                          </div>
                          <h4 className="mt-1 text-base font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                            {booking.customerName} — {booking.serviceName}
                          </h4>
                          <p className="mt-1 tabular-nums text-xs text-[#524048] dark:text-[#cbb9c1]">
                            {formatDisplayPhone(booking.phone)} · {booking.preferredDate} at{' '}
                            {booking.preferredTime} · {formatInr(booking.priceInr)}
                          </p>
                          {booking.notes && (
                            <p className="mt-1.5 text-xs text-[#524048] dark:text-[#cbb9c1]">Notes: {booking.notes}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <a
                            href={buildWhatsAppUrl(
                              booking.phone,
                              `Namaste ${booking.customerName}, your appointment (${booking.id}) at Sweety Beauty Parlour, Lawar on ${booking.preferredDate} at ${booking.preferredTime} is confirmed.`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-[#128c7e] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0e7367]"
                          >
                            <span>WhatsApp Client</span>
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>

                          {booking.status !== 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleBookingStatusUpdate(booking.id, 'confirmed')}
                              className="rounded-lg border border-[#1f1418]/15 dark:border-white/15 bg-white dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-[#f6eef1] dark:hover:bg-white/15 cursor-pointer"
                            >
                              Confirm Booking
                            </button>
                          )}
                          {booking.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleBookingStatusUpdate(booking.id, 'completed')}
                              className="rounded-lg border border-[#1f1418]/15 dark:border-white/15 bg-white dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-[#f6eef1] dark:hover:bg-white/15 cursor-pointer"
                            >
                              Mark Completed
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : filteredInquiries.length === 0 ? (
              <p className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/70 dark:bg-white/5 py-8 text-center text-sm text-[#524048] dark:text-[#cbb9c1]">
                No inquiries match this filter yet.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredInquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/85 dark:bg-white/5 p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#524048] dark:text-[#cbb9c1]">
                          <span className="tabular-nums font-semibold text-[#1f1418] dark:text-[#f7eff2]">{inquiry.id}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize font-semibold text-[#7a1f3d] dark:text-[#e06d91]">
                            Status: {inquiry.status}
                          </span>
                        </div>
                        <h4 className="mt-1 text-base font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                          {inquiry.customerName} — {inquiry.topic}
                        </h4>
                        <p className="mt-1 tabular-nums text-xs text-[#524048] dark:text-[#cbb9c1]">
                          {formatDisplayPhone(inquiry.phone)}
                        </p>
                        <p className="mt-2 text-sm text-[#1f1418] dark:text-[#f7eff2]">{inquiry.message}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <a
                          href={buildWhatsAppUrl(
                            inquiry.phone,
                            `Namaste ${inquiry.customerName}, thank you for contacting Sweety Beauty Parlour (Lawar, Meerut) regarding ${inquiry.topic}.`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-[#128c7e] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0e7367]"
                        >
                          <span>Reply on WhatsApp</span>
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>

                        {inquiry.status !== 'replied' && (
                          <button
                            type="button"
                            onClick={() => handleInquiryStatusUpdate(inquiry.id, 'replied')}
                            className="rounded-lg border border-[#1f1418]/15 dark:border-white/15 bg-white dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-[#f6eef1] dark:hover:bg-white/15 cursor-pointer"
                          >
                            Mark Replied
                          </button>
                        )}
                        {inquiry.status !== 'closed' && (
                          <button
                            type="button"
                            onClick={() => handleInquiryStatusUpdate(inquiry.id, 'closed')}
                            className="rounded-lg border border-[#1f1418]/15 dark:border-white/15 bg-white dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-[#f6eef1] dark:hover:bg-white/15 cursor-pointer"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 border-t border-[#1f1418]/10 dark:border-white/10 pt-4 text-xs text-[#524048] dark:text-[#cbb9c1]">
              <ShieldCheck className="h-4 w-4 text-[#128c7e] dark:text-[#2ec4b6]" aria-hidden="true" />
              <span>Session token is held strictly in memory and cleared when you sign out.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
