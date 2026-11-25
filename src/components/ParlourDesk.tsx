import { useEffect, useState, type FormEvent } from 'react';
import {
  Download,
  ExternalLink,
  Lock,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  SERVICES,
  STAFF_ARTISTS,
  TIME_SLOTS,
  bookingsToCsv,
  buildWhatsAppUrl,
  calculateBookingBalance,
  filterAdminBookings,
  filterAdminInquiries,
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
  const [searchQuery, setSearchQuery] = useState('');

  // Walk-in / Phone Booking form state
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServiceId, setWalkInServiceId] = useState(SERVICES[0].id);
  const [walkInDate, setWalkInDate] = useState('');
  const [walkInTime, setWalkInTime] = useState('11:30 AM');
  const [walkInStylist, setWalkInStylist] = useState(STAFF_ARTISTS[0]);
  const [walkInAdvance, setWalkInAdvance] = useState('0');
  const [walkInNotes, setWalkInNotes] = useState('');
  const [walkInSaving, setWalkInSaving] = useState(false);

  // Expanded Booking Editor state
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editStatus, setEditStatus] = useState<BookingStatus>('pending');
  const [editStylist, setEditStylist] = useState('');
  const [editAdvance, setEditAdvance] = useState('0');
  const [editStaffNotes, setEditStaffNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Expanded Inquiry Editor state
  const [editingInquiryId, setEditingInquiryId] = useState<string | null>(null);
  const [editInquiryStatus, setEditInquiryStatus] = useState<InquiryStatus>('new');
  const [editInquiryNotes, setEditInquiryNotes] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const handleWalkInSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setRecordsError(null);
    setWalkInSaving(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName: walkInName,
          phone: walkInPhone,
          serviceId: walkInServiceId,
          preferredDate: walkInDate,
          preferredTime: walkInTime,
          staffAssigned: walkInStylist,
          advancePaidInr: Number(walkInAdvance) || 0,
          staffNotes: walkInNotes,
          status: 'confirmed',
        }),
      });
      const data = (await res.json()) as { booking?: BookingRecord; error?: string };
      if (!res.ok || !data.booking) {
        setRecordsError(data.error || 'Check client name, 10-digit phone, and date.');
        return;
      }
      setBookings((prev) => [data.booking!, ...prev]);
      setWalkInOpen(false);
      setWalkInName('');
      setWalkInPhone('');
      setWalkInDate('');
      setWalkInAdvance('0');
      setWalkInNotes('');
    } catch {
      setRecordsError('Network error saving walk-in booking.');
    } finally {
      setWalkInSaving(false);
    }
  };

  const openBookingEditor = (booking: BookingRecord) => {
    if (editingBookingId === booking.id) {
      setEditingBookingId(null);
      return;
    }
    setEditingBookingId(booking.id);
    setEditDate(booking.preferredDate);
    setEditTime(booking.preferredTime);
    setEditStatus(booking.status);
    setEditStylist(booking.staffAssigned || '');
    setEditAdvance(String(booking.advancePaidInr ?? 0));
    setEditStaffNotes(booking.staffNotes || '');
  };

  const handleSaveBookingDetails = async (id: string) => {
    if (!token) return;
    setEditSaving(true);
    setRecordsError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: editStatus,
          preferredDate: editDate,
          preferredTime: editTime,
          staffAssigned: editStylist,
          advancePaidInr: Number(editAdvance) || 0,
          staffNotes: editStaffNotes,
        }),
      });
      const data = (await res.json()) as { booking?: BookingRecord; error?: string };
      if (!res.ok || !data.booking) {
        setRecordsError(data.error || 'Could not update booking details.');
        return;
      }
      setBookings((prev) => prev.map((b) => (b.id === id ? data.booking! : b)));
      setEditingBookingId(null);
    } catch {
      setRecordsError('Could not update booking details.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleQuickBookingStatus = async (id: string, status: BookingStatus) => {
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

  const handleDeleteBooking = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
        setConfirmDeleteId(null);
        if (editingBookingId === id) setEditingBookingId(null);
      }
    } catch {
      setRecordsError('Could not delete booking.');
    }
  };

  const openInquiryEditor = (inquiry: InquiryRecord) => {
    if (editingInquiryId === inquiry.id) {
      setEditingInquiryId(null);
      return;
    }
    setEditingInquiryId(inquiry.id);
    setEditInquiryStatus(inquiry.status);
    setEditInquiryNotes(inquiry.staffNotes || '');
  };

  const handleSaveInquiryDetails = async (id: string) => {
    if (!token) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: editInquiryStatus,
          staffNotes: editInquiryNotes,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { inquiry: InquiryRecord };
        setInquiries((prev) => prev.map((i) => (i.id === id ? data.inquiry : i)));
        setEditingInquiryId(null);
      }
    } catch {
      setRecordsError('Could not save inquiry details.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setInquiries((prev) => prev.filter((i) => i.id !== id));
        setConfirmDeleteId(null);
        if (editingInquiryId === id) setEditingInquiryId(null);
      }
    } catch {
      setRecordsError('Could not delete inquiry.');
    }
  };

  const handleExportCsv = () => {
    const csv = bookingsToCsv(bookings);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sweety-parlour-bookings-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const stats = summarizeDeskStats(bookings, inquiries);
  const filteredBookings = filterAdminBookings(bookings, statusFilter, searchQuery);
  const filteredInquiries = filterAdminInquiries(inquiries, statusFilter, searchQuery);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="parlour-desk-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1418]/45 dark:bg-black/75 p-4 backdrop-blur-md"
    >
      <div className="glass-panel max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-[#fbf8f9]/95 dark:bg-[#171014]/95 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-[#1f1418]/10 dark:border-white/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7a1f3d] dark:text-[#e06d91]">
              Protected Client Management · Lawar Desk
            </p>
            <h2
              id="parlour-desk-title"
              className="font-display mt-1 text-3xl font-semibold text-[#1f1418] dark:text-[#f7eff2]"
            >
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
                  ? 'An ADMIN_PASSCODE secret is configured in Settings → Secrets. Enter that passcode below to view and manage client bookings, stylist assignments, and payments.'
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
            {/* Detailed KPI Summary */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
                <p className="text-xs text-[#524048] dark:text-[#cbb9c1]">Total Bookings</p>
                <p className="mt-1 tabular-nums text-2xl font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                  {stats.totalBookings}
                </p>
                <p className="mt-0.5 tabular-nums text-xs text-[#524048] dark:text-[#cbb9c1]">
                  {stats.confirmedBookings} confirmed · {stats.completedBookings} completed
                </p>
              </div>
              <div className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
                <p className="text-xs text-[#524048] dark:text-[#cbb9c1]">Booking Value &amp; Advance</p>
                <p className="mt-1 tabular-nums text-2xl font-semibold text-[#128c7e] dark:text-[#2ec4b6]">
                  {formatInr(stats.expectedRevenueInr)}
                </p>
                <p className="mt-0.5 tabular-nums text-xs text-[#524048] dark:text-[#cbb9c1]">
                  Advance received: {formatInr(stats.collectedAdvanceInr)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
                <p className="text-xs text-[#524048] dark:text-[#cbb9c1]">Pending Slots</p>
                <p className="mt-1 tabular-nums text-2xl font-semibold text-[#7a1f3d] dark:text-[#e06d91]">
                  {stats.pendingBookings}
                </p>
                <p className="mt-0.5 text-xs text-[#524048] dark:text-[#cbb9c1]">Awaiting confirmation</p>
              </div>
              <div className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
                <p className="text-xs text-[#524048] dark:text-[#cbb9c1]">WhatsApp Inquiries</p>
                <p className="mt-1 tabular-nums text-2xl font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                  {stats.openInquiries}
                </p>
                <p className="mt-0.5 tabular-nums text-xs text-[#524048] dark:text-[#cbb9c1]">
                  {stats.totalInquiries} total logged
                </p>
              </div>
            </div>

            {/* Toolbar: Tabs, Search, Walk-in & CSV Export */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl border border-[#1f1418]/10 dark:border-white/10 bg-white/75 dark:bg-white/5 p-1">
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

                <button
                  type="button"
                  onClick={() => setWalkInOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#7a1f3d] dark:bg-[#9e2a4f] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#611630] dark:hover:bg-[#b3345d] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{walkInOpen ? 'Close Walk-In Form' : 'Add Walk-In Booking'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#1f1418]/15 dark:border-white/15 bg-white dark:bg-white/10 px-3.5 py-2 text-xs font-semibold text-[#1f1418] dark:text-[#f7eff2] hover:bg-[#f6eef1] dark:hover:bg-white/15 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="relative w-full lg:w-64">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#524048] dark:text-[#cbb9c1]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Search client name, mobile, or reference ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search client, phone, ID..."
                  className="glass-input w-full rounded-xl pl-9 pr-3 py-2 text-xs text-[#1f1418] dark:text-[#f7eff2] placeholder:text-[#524048]/65 dark:placeholder:text-[#cbb9c1]/55"
                />
              </div>
            </div>

            {/* Walk-in Booking Drawer */}
            {walkInOpen && (
              <form
                onSubmit={handleWalkInSubmit}
                className="rounded-2xl border border-[#7a1f3d]/25 dark:border-[#e06d91]/25 bg-white/85 dark:bg-[#22171d]/90 p-5 space-y-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7a1f3d] dark:text-[#e06d91]">
                  New Walk-In / Phone Booking
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="walkin-name" className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                      Client Name
                    </label>
                    <input
                      id="walkin-name"
                      type="text"
                      required
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      placeholder="Full name"
                      className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-xs text-[#1f1418] dark:text-[#f7eff2]"
                    />
                  </div>
                  <div>
                    <label htmlFor="walkin-phone" className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                      Mobile Number
                    </label>
                    <input
                      id="walkin-phone"
                      type="tel"
                      required
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-xs tabular-nums text-[#1f1418] dark:text-[#f7eff2]"
                    />
                  </div>
                  <div>
                    <label htmlFor="walkin-service" className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                      Service
                    </label>
                    <select
                      id="walkin-service"
                      value={walkInServiceId}
                      onChange={(e) => setWalkInServiceId(e.target.value)}
                      className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-xs text-[#1f1418] dark:text-[#f7eff2]"
                    >
                      {SERVICES.map((s) => (
                        <option key={s.id} value={s.id} className="bg-white dark:bg-[#1b1217]">
                          {s.name} ({formatInr(s.priceInr)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label htmlFor="walkin-date" className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                      Date
                    </label>
                    <input
                      id="walkin-date"
                      type="date"
                      required
                      value={walkInDate}
                      onChange={(e) => setWalkInDate(e.target.value)}
                      className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-xs tabular-nums text-[#1f1418] dark:text-[#f7eff2]"
                    />
                  </div>
                  <div>
                    <label htmlFor="walkin-time" className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                      Time Slot
                    </label>
                    <select
                      id="walkin-time"
                      value={walkInTime}
                      onChange={(e) => setWalkInTime(e.target.value)}
                      className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-xs text-[#1f1418] dark:text-[#f7eff2]"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot} className="bg-white dark:bg-[#1b1217]">
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="walkin-stylist" className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                      Assign Stylist
                    </label>
                    <select
                      id="walkin-stylist"
                      value={walkInStylist}
                      onChange={(e) => setWalkInStylist(e.target.value)}
                      className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-xs text-[#1f1418] dark:text-[#f7eff2]"
                    >
                      {STAFF_ARTISTS.map((artist) => (
                        <option key={artist} value={artist} className="bg-white dark:bg-[#1b1217]">
                          {artist}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="walkin-advance" className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                      Advance Paid (₹)
                    </label>
                    <input
                      id="walkin-advance"
                      type="number"
                      min="0"
                      value={walkInAdvance}
                      onChange={(e) => setWalkInAdvance(e.target.value)}
                      className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-xs tabular-nums text-[#1f1418] dark:text-[#f7eff2]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label htmlFor="walkin-notes" className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                      Staff Notes
                    </label>
                    <input
                      id="walkin-notes"
                      type="text"
                      value={walkInNotes}
                      onChange={(e) => setWalkInNotes(e.target.value)}
                      placeholder="Skin prep instructions, saree draping, or trial notes"
                      className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-xs text-[#1f1418] dark:text-[#f7eff2]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={walkInSaving}
                    className="rounded-xl bg-[#128c7e] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0e7367] cursor-pointer"
                  >
                    {walkInSaving ? 'Saving...' : 'Save Walk-In Booking'}
                  </button>
                </div>
              </form>
            )}

            {/* Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(deskTab === 'bookings'
                ? ['all', 'pending', 'confirmed', 'completed', 'cancelled']
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

            {recordsError && (
              <p role="alert" className="rounded-xl border border-[#9f1239]/25 bg-[#fff1f2] dark:bg-[#4c0519]/40 px-4 py-2.5 text-xs font-medium text-[#9f1239] dark:text-[#fda4af]">
                {recordsError}
              </p>
            )}

            {recordsLoading ? (
              <p className="py-8 text-center text-sm text-[#524048] dark:text-[#cbb9c1]">Loading client records...</p>
            ) : deskTab === 'bookings' ? (
              filteredBookings.length === 0 ? (
                <p className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/70 dark:bg-white/5 py-8 text-center text-sm text-[#524048] dark:text-[#cbb9c1]">
                  No bookings match your search or filter.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((booking) => {
                    const advance = booking.advancePaidInr || 0;
                    const balance = calculateBookingBalance(booking.priceInr, advance);
                    const isEditing = editingBookingId === booking.id;

                    return (
                      <div
                        key={booking.id}
                        className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/85 dark:bg-white/5 p-4 sm:p-5"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#524048] dark:text-[#cbb9c1]">
                              <span className="tabular-nums font-semibold text-[#1f1418] dark:text-[#f7eff2]">{booking.id}</span>
                              <span aria-hidden="true">·</span>
                              <span className="capitalize font-semibold text-[#7a1f3d] dark:text-[#e06d91]">
                                Status: {booking.status}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="capitalize">{booking.source || 'website'}</span>
                            </div>

                            <h4 className="text-base font-semibold text-[#1f1418] dark:text-[#f7eff2]">
                              {booking.customerName} — {booking.serviceName}
                            </h4>

                            <p className="tabular-nums text-xs text-[#524048] dark:text-[#cbb9c1]">
                              {formatDisplayPhone(booking.phone)} · {booking.preferredDate} at {booking.preferredTime}
                            </p>

                            <p className="tabular-nums text-xs text-[#1f1418] dark:text-[#f7eff2]">
                              Total: {formatInr(booking.priceInr)} · Advance: {formatInr(advance)} ·{' '}
                              <span className="font-semibold text-[#7a1f3d] dark:text-[#e06d91]">
                                Balance Due: {formatInr(balance)}
                              </span>
                              {booking.staffAssigned ? ` · Stylist: ${booking.staffAssigned}` : ''}
                            </p>

                            {booking.notes && (
                              <p className="text-xs text-[#524048] dark:text-[#cbb9c1]">
                                Client Notes: {booking.notes}
                              </p>
                            )}
                            {booking.staffNotes && (
                              <p className="text-xs text-[#128c7e] dark:text-[#2ec4b6]">
                                Staff Notes: {booking.staffNotes}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <a
                              href={buildWhatsAppUrl(
                                booking.phone,
                                `Namaste ${booking.customerName}, your appointment (${booking.id}) at Sweety Beauty Parlour, Lawar on ${booking.preferredDate} at ${booking.preferredTime} is confirmed. Balance due: ${formatInr(balance)}.`,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-[#128c7e] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0e7367]"
                            >
                              <span>WhatsApp Client</span>
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>

                            {booking.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleQuickBookingStatus(booking.id, 'confirmed')}
                                className="rounded-lg border border-[#1f1418]/15 dark:border-white/15 bg-white dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-[#f6eef1] dark:hover:bg-white/15 cursor-pointer"
                              >
                                Confirm Booking
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openBookingEditor(booking)}
                              className="rounded-lg border border-[#1f1418]/15 dark:border-white/15 bg-white dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-[#f6eef1] dark:hover:bg-white/15 cursor-pointer"
                            >
                              {isEditing ? 'Close Details' : 'Edit Details'}
                            </button>

                            {confirmDeleteId === booking.id ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteBooking(booking.id)}
                                className="rounded-lg bg-[#9f1239] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                              >
                                Confirm Delete
                              </button>
                            ) : (
                              <button
                                type="button"
                                aria-label={`Delete booking ${booking.id}`}
                                onClick={() => setConfirmDeleteId(booking.id)}
                                className="rounded-lg border border-[#1f1418]/15 dark:border-white/15 bg-white dark:bg-white/10 p-1.5 text-[#9f1239] dark:text-[#fda4af] hover:bg-[#fff1f2] dark:hover:bg-[#4c0519]/40 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {isEditing && (
                          <div className="mt-4 border-t border-[#1f1418]/10 dark:border-white/10 pt-4 space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                              <div>
                                <label className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                                  Status
                                </label>
                                <select
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value as BookingStatus)}
                                  className="glass-input mt-1 w-full rounded-lg px-2.5 py-2 text-xs text-[#1f1418] dark:text-[#f7eff2]"
                                >
                                  <option value="pending" className="bg-white dark:bg-[#1b1217]">Pending</option>
                                  <option value="confirmed" className="bg-white dark:bg-[#1b1217]">Confirmed</option>
                                  <option value="completed" className="bg-white dark:bg-[#1b1217]">Completed</option>
                                  <option value="cancelled" className="bg-white dark:bg-[#1b1217]">Cancelled</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                                  Appointment Date
                                </label>
                                <input
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                  className="glass-input mt-1 w-full rounded-lg px-2.5 py-2 text-xs tabular-nums text-[#1f1418] dark:text-[#f7eff2]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                                  Time Slot
                                </label>
                                <select
                                  value={editTime}
                                  onChange={(e) => setEditTime(e.target.value)}
                                  className="glass-input mt-1 w-full rounded-lg px-2.5 py-2 text-xs text-[#1f1418] dark:text-[#f7eff2]"
                                >
                                  {TIME_SLOTS.map((slot) => (
                                    <option key={slot} value={slot} className="bg-white dark:bg-[#1b1217]">
                                      {slot}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                                  Stylist Assigned
                                </label>
                                <select
                                  value={editStylist}
                                  onChange={(e) => setEditStylist(e.target.value)}
                                  className="glass-input mt-1 w-full rounded-lg px-2.5 py-2 text-xs text-[#1f1418] dark:text-[#f7eff2]"
                                >
                                  <option value="" className="bg-white dark:bg-[#1b1217]">Unassigned</option>
                                  {STAFF_ARTISTS.map((artist) => (
                                    <option key={artist} value={artist} className="bg-white dark:bg-[#1b1217]">
                                      {artist}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                                  Advance Paid (₹)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={booking.priceInr}
                                  value={editAdvance}
                                  onChange={(e) => setEditAdvance(e.target.value)}
                                  className="glass-input mt-1 w-full rounded-lg px-2.5 py-2 text-xs tabular-nums text-[#1f1418] dark:text-[#f7eff2]"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                                  Internal Staff Notes
                                </label>
                                <input
                                  type="text"
                                  value={editStaffNotes}
                                  onChange={(e) => setEditStaffNotes(e.target.value)}
                                  placeholder="Trial feedback, shade match, or home visit details"
                                  className="glass-input mt-1 w-full rounded-lg px-3 py-2 text-xs text-[#1f1418] dark:text-[#f7eff2]"
                                />
                              </div>
                              <button
                                type="button"
                                disabled={editSaving}
                                onClick={() => handleSaveBookingDetails(booking.id)}
                                className="rounded-xl bg-[#7a1f3d] dark:bg-[#9e2a4f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#611630] dark:hover:bg-[#b3345d] cursor-pointer"
                              >
                                {editSaving ? 'Saving...' : 'Save Changes'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : filteredInquiries.length === 0 ? (
              <p className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/70 dark:bg-white/5 py-8 text-center text-sm text-[#524048] dark:text-[#cbb9c1]">
                No inquiries match your search or filter.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredInquiries.map((inquiry) => {
                  const isEditing = editingInquiryId === inquiry.id;
                  return (
                    <div
                      key={inquiry.id}
                      className="rounded-2xl border border-[#1f1418]/10 dark:border-white/10 bg-white/85 dark:bg-white/5 p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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
                          {inquiry.staffNotes && (
                            <p className="mt-1.5 text-xs text-[#128c7e] dark:text-[#2ec4b6]">
                              Staff Notes: {inquiry.staffNotes}
                            </p>
                          )}
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

                          <button
                            type="button"
                            onClick={() => openInquiryEditor(inquiry)}
                            className="rounded-lg border border-[#1f1418]/15 dark:border-white/15 bg-white dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-[#1f1418] dark:text-[#f7eff2] hover:bg-[#f6eef1] dark:hover:bg-white/15 cursor-pointer"
                          >
                            {isEditing ? 'Close Notes' : 'Edit Notes'}
                          </button>

                          {confirmDeleteId === inquiry.id ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteInquiry(inquiry.id)}
                              className="rounded-lg bg-[#9f1239] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                          ) : (
                            <button
                              type="button"
                              aria-label={`Delete inquiry ${inquiry.id}`}
                              onClick={() => setConfirmDeleteId(inquiry.id)}
                              className="rounded-lg border border-[#1f1418]/15 dark:border-white/15 bg-white dark:bg-white/10 p-1.5 text-[#9f1239] dark:text-[#fda4af] hover:bg-[#fff1f2] dark:hover:bg-[#4c0519]/40 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-4 border-t border-[#1f1418]/10 dark:border-white/10 pt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="w-full sm:w-40">
                            <label className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                              Status
                            </label>
                            <select
                              value={editInquiryStatus}
                              onChange={(e) => setEditInquiryStatus(e.target.value as InquiryStatus)}
                              className="glass-input mt-1 w-full rounded-lg px-2.5 py-2 text-xs text-[#1f1418] dark:text-[#f7eff2]"
                            >
                              <option value="new" className="bg-white dark:bg-[#1b1217]">New</option>
                              <option value="replied" className="bg-white dark:bg-[#1b1217]">Replied</option>
                              <option value="closed" className="bg-white dark:bg-[#1b1217]">Closed</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-[#1f1418] dark:text-[#f7eff2]">
                              Staff Follow-Up Notes
                            </label>
                            <input
                              type="text"
                              value={editInquiryNotes}
                              onChange={(e) => setEditInquiryNotes(e.target.value)}
                              placeholder="Shared bridal quote, trial date offered, etc."
                              className="glass-input mt-1 w-full rounded-lg px-3 py-2 text-xs text-[#1f1418] dark:text-[#f7eff2]"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={editSaving}
                            onClick={() => handleSaveInquiryDetails(inquiry.id)}
                            className="rounded-xl bg-[#7a1f3d] dark:bg-[#9e2a4f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#611630] dark:hover:bg-[#b3345d] cursor-pointer"
                          >
                            {editSaving ? 'Saving...' : 'Save Notes'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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
