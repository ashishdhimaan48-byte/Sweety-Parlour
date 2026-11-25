import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  PARLOUR_INFO,
  buildRobotsTxt,
  buildSitemapXml,
  buildWhatsAppBookingMessage,
  buildWhatsAppInquiryMessage,
  buildWhatsAppUrl,
  formatDisplayPhone,
  normalizeIndianPhone,
  sanitizeMultiline,
  sanitizeSingleLine,
  validateBookingInput,
  validateInquiryInput,
  type BookingRecord,
  type BookingStatus,
  type InquiryRecord,
  type InquiryStatus,
  type WhatsAppDispatchMode,
} from './src/utils/parlour';

interface AdminCredential {
  salt: string;
  hash: string;
  claimedAt: string;
}

interface StoreData {
  bookings: BookingRecord[];
  inquiries: InquiryRecord[];
  adminCredential: AdminCredential | null;
}

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = process.cwd();
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const STORE_PATH = path.resolve(DATA_DIR, 'parlour-store.json');

if (!STORE_PATH.startsWith(DATA_DIR + path.sep)) {
  throw new Error('Invalid store path configuration');
}

const SESSION_SECRET = process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');
const RAW_PARLOUR_NUMBER = process.env.PARLOUR_WHATSAPP_NUMBER?.trim() || PARLOUR_INFO.defaultWhatsAppNumber;
const PARLOUR_WHATSAPP_NUMBER =
  normalizeIndianPhone(RAW_PARLOUR_NUMBER) ||
  RAW_PARLOUR_NUMBER.replace(/\D/g, '') ||
  PARLOUR_INFO.defaultWhatsAppNumber;

function createSeedStore(): StoreData {
  const sampleBookingMessage = buildWhatsAppBookingMessage({
    referenceId: 'SBP-BK-1001',
    customerName: 'Neha Choudhary',
    phone: '919897112233',
    serviceName: 'Royal HD Bridal Artistry',
    priceInr: 14500,
    preferredDate: '2026-12-08',
    preferredTime: '11:30 AM',
    notes: 'Bridal trial & lehenga draping consultation',
  });

  const sampleInquiryMessage = buildWhatsAppInquiryMessage({
    referenceId: 'SBP-INQ-2001',
    customerName: 'Pooja Malik',
    phone: '919719445566',
    topic: 'Bridal Package & Trial',
    message: 'Looking for pre-bridal facial and bridal makeup availability near Lawar market.',
  });

  return {
    bookings: [
      {
        id: 'SBP-BK-1001',
        customerName: 'Neha Choudhary',
        phone: '919897112233',
        serviceId: 'royal-bridal-hd',
        serviceName: 'Royal HD Bridal Artistry',
        priceInr: 14500,
        preferredDate: '2026-12-08',
        preferredTime: '11:30 AM',
        notes: 'Bridal trial & lehenga draping consultation',
        status: 'confirmed',
        staffAssigned: 'Sweety Ji (Lead Bridal Artist)',
        advancePaidInr: 4000,
        staffNotes: 'Trial scheduled 3 days prior at studio.',
        source: 'website',
        whatsappDispatchMode: 'whatsapp_deeplink',
        whatsappMessage: sampleBookingMessage,
        whatsappUrl: buildWhatsAppUrl(PARLOUR_WHATSAPP_NUMBER, sampleBookingMessage),
        createdAt: '2026-11-24T09:15:00.000Z',
      },
    ],
    inquiries: [
      {
        id: 'SBP-INQ-2001',
        customerName: 'Pooja Malik',
        phone: '919719445566',
        topic: 'Bridal Package & Trial',
        message: 'Looking for pre-bridal facial and bridal makeup availability near Lawar market.',
        status: 'new',
        whatsappDispatchMode: 'whatsapp_deeplink',
        whatsappMessage: sampleInquiryMessage,
        whatsappUrl: buildWhatsAppUrl(PARLOUR_WHATSAPP_NUMBER, sampleInquiryMessage),
        createdAt: '2026-11-24T10:30:00.000Z',
      },
    ],
    adminCredential: null,
  };
}

function readStore(): StoreData {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const initial = createSeedStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
      adminCredential: parsed.adminCredential ?? null,
    };
  } catch {
    const fallback = createSeedStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

function writeStore(store: StoreData): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tempPath = path.resolve(DATA_DIR, `parlour-store.${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(tempPath, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tempPath, STORE_PATH);
}

function hashPasscode(passcode: string, salt = crypto.randomBytes(16).toString('hex')): { salt: string; hash: string } {
  const derived = crypto.scryptSync(passcode, salt, 64).toString('hex');
  return { salt, hash: derived };
}

function verifyPasscodeAgainstHash(passcode: string, credential: AdminCredential): boolean {
  const expected = Buffer.from(credential.hash, 'hex');
  const actual = crypto.scryptSync(passcode, credential.salt, 64);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function safeStringCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function signAdminToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 8; // 8 hours
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: expiresAt })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return { token: `${payload}.${sig}`, expiresAt };
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!payload || !sig) return false;

  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (!safeStringCompare(sig, expectedSig)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return decoded.role === 'admin' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required for Parlour Desk access.' });
    return;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }
  next();
}

async function dispatchWhatsAppCloudMessage(messageText: string): Promise<WhatsAppDispatchMode> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!accessToken || !phoneNumberId || !/^\d+$/.test(phoneNumberId)) {
    return 'whatsapp_deeplink';
  }

  try {
    const endpoint = new URL(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: PARLOUR_WHATSAPP_NUMBER,
        type: 'text',
        text: { body: messageText },
      }),
    });

    if (!response.ok) {
      return 'whatsapp_deeplink';
    }
    return 'cloud_api';
  } catch {
    return 'whatsapp_deeplink';
  }
}

function generateReferenceId(prefix: 'SBP-BK' | 'SBP-INQ'): string {
  const suffix = crypto.randomInt(1000, 9999);
  return `${prefix}-${suffix}`;
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  const resolvePublicBaseUrl = (req: Request): string => {
    const configured = process.env.APP_URL?.trim();
    if (configured && /^https?:\/\//i.test(configured)) {
      return configured.replace(/\/+$/, '');
    }
    const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
    const host = req.get('host') || `localhost:${PORT}`;
    return `${proto}://${host}`;
  };

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(buildRobotsTxt(resolvePublicBaseUrl(req)));
  });

  app.get('/sitemap.xml', (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    res.type('application/xml').send(buildSitemapXml(resolvePublicBaseUrl(req), today));
  });

  app.get('/api/config/public', (_req, res) => {
    const cloudApiConfigured = Boolean(
      process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
    );
    res.json({
      parlourName: PARLOUR_INFO.name,
      locality: PARLOUR_INFO.locality,
      address: PARLOUR_INFO.address,
      hours: PARLOUR_INFO.hours,
      whatsappDisplayNumber: formatDisplayPhone(PARLOUR_WHATSAPP_NUMBER),
      cloudApiConfigured,
    });
  });

  app.post('/api/bookings', async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const validation = validateBookingInput({
      customerName: typeof body?.customerName === 'string' ? body.customerName : '',
      phone: typeof body?.phone === 'string' ? body.phone : '',
      serviceId: typeof body?.serviceId === 'string' ? body.serviceId : '',
      preferredDate: typeof body?.preferredDate === 'string' ? body.preferredDate : '',
      preferredTime: typeof body?.preferredTime === 'string' ? body.preferredTime : '',
      notes: typeof body?.notes === 'string' ? body.notes : '',
    });

    if (!validation.valid || !validation.data) {
      res.status(400).json({ error: 'Please check the booking details.', errors: validation.errors });
      return;
    }

    const validData = validation.data;
    const referenceId = generateReferenceId('SBP-BK');
    const whatsappMessage = buildWhatsAppBookingMessage({
      referenceId,
      customerName: validData.customerName,
      phone: validData.normalizedPhone,
      serviceName: validData.service.name,
      priceInr: validData.service.priceInr,
      preferredDate: validData.preferredDate,
      preferredTime: validData.preferredTime,
      notes: validData.notes,
    });

    const whatsappDispatchMode = await dispatchWhatsAppCloudMessage(whatsappMessage);
    const whatsappUrl = buildWhatsAppUrl(PARLOUR_WHATSAPP_NUMBER, whatsappMessage);

    const record: BookingRecord = {
      id: referenceId,
      customerName: validData.customerName,
      phone: validData.normalizedPhone,
      serviceId: validData.service.id,
      serviceName: validData.service.name,
      priceInr: validData.service.priceInr,
      preferredDate: validData.preferredDate,
      preferredTime: validData.preferredTime,
      notes: validData.notes || '',
      status: 'pending',
      whatsappDispatchMode,
      whatsappMessage,
      whatsappUrl,
      createdAt: new Date().toISOString(),
    };

    const store = readStore();
    store.bookings.unshift(record);
    writeStore(store);

    res.status(201).json({ booking: record });
  });

  app.post('/api/inquiries', async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const validation = validateInquiryInput({
      customerName: typeof body?.customerName === 'string' ? body.customerName : '',
      phone: typeof body?.phone === 'string' ? body.phone : '',
      topic: typeof body?.topic === 'string' ? body.topic : '',
      message: typeof body?.message === 'string' ? body.message : '',
    });

    if (!validation.valid || !validation.data) {
      res.status(400).json({ error: 'Please check the inquiry details.', errors: validation.errors });
      return;
    }

    const validData = validation.data;
    const referenceId = generateReferenceId('SBP-INQ');
    const whatsappMessage = buildWhatsAppInquiryMessage({
      referenceId,
      customerName: validData.customerName,
      phone: validData.normalizedPhone,
      topic: validData.topic,
      message: validData.message,
    });

    const whatsappDispatchMode = await dispatchWhatsAppCloudMessage(whatsappMessage);
    const whatsappUrl = buildWhatsAppUrl(PARLOUR_WHATSAPP_NUMBER, whatsappMessage);

    const record: InquiryRecord = {
      id: referenceId,
      customerName: validData.customerName,
      phone: validData.normalizedPhone,
      topic: validData.topic,
      message: validData.message,
      status: 'new',
      whatsappDispatchMode,
      whatsappMessage,
      whatsappUrl,
      createdAt: new Date().toISOString(),
    };

    const store = readStore();
    store.inquiries.unshift(record);
    writeStore(store);

    res.status(201).json({ inquiry: record });
  });

  app.get('/api/admin/auth-status', (_req, res) => {
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    const store = readStore();
    res.json({
      configured: Boolean(envPasscode || store.adminCredential),
      source: envPasscode ? 'environment' : store.adminCredential ? 'claimed' : 'unclaimed',
    });
  });

  app.post('/api/admin/claim-passcode', (req, res) => {
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      res.status(409).json({ error: 'Admin passcode is managed by environment secrets.' });
      return;
    }

    const store = readStore();
    if (store.adminCredential) {
      res.status(409).json({ error: 'Parlour Desk passcode has already been claimed. Please sign in.' });
      return;
    }

    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (passcode.length < 6 || passcode.length > 64) {
      res.status(400).json({ error: 'Passcode must be between 6 and 64 characters.' });
      return;
    }

    const { salt, hash } = hashPasscode(passcode);
    store.adminCredential = {
      salt,
      hash,
      claimedAt: new Date().toISOString(),
    };
    writeStore(store);

    const session = signAdminToken();
    res.status(201).json(session);
  });

  app.post('/api/admin/login', (req, res) => {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (!passcode) {
      res.status(400).json({ error: 'Please enter your Parlour Desk passcode.' });
      return;
    }

    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      if (!safeStringCompare(passcode, envPasscode)) {
        res.status(401).json({ error: 'Incorrect passcode.' });
        return;
      }
      res.json(signAdminToken());
      return;
    }

    const store = readStore();
    if (!store.adminCredential) {
      res.status(409).json({ error: 'No admin passcode configured yet. Create your Parlour Desk passcode first.' });
      return;
    }

    if (!verifyPasscodeAgainstHash(passcode, store.adminCredential)) {
      res.status(401).json({ error: 'Incorrect passcode.' });
      return;
    }

    res.json(signAdminToken());
  });

  app.get('/api/admin/records', requireAdminAuth, (_req, res) => {
    const store = readStore();
    res.json({
      bookings: store.bookings,
      inquiries: store.inquiries,
    });
  });

  app.post('/api/admin/bookings', requireAdminAuth, (req, res) => {
    const body = req.body as Record<string, unknown>;
    const validation = validateBookingInput({
      customerName: typeof body?.customerName === 'string' ? body.customerName : '',
      phone: typeof body?.phone === 'string' ? body.phone : '',
      serviceId: typeof body?.serviceId === 'string' ? body.serviceId : '',
      preferredDate: typeof body?.preferredDate === 'string' ? body.preferredDate : '',
      preferredTime: typeof body?.preferredTime === 'string' ? body.preferredTime : '',
      notes: typeof body?.notes === 'string' ? body.notes : '',
    });

    if (!validation.valid || !validation.data) {
      res.status(400).json({ error: 'Please check the client booking details.', errors: validation.errors });
      return;
    }

    const validData = validation.data;
    const referenceId = generateReferenceId('SBP-BK');
    const allowedStatuses: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
    const requestedStatus = typeof body?.status === 'string' && allowedStatuses.includes(body.status as BookingStatus)
      ? (body.status as BookingStatus)
      : 'confirmed';

    const staffAssigned = typeof body?.staffAssigned === 'string' ? sanitizeSingleLine(body.staffAssigned, 80) : '';
    const staffNotes = typeof body?.staffNotes === 'string' ? sanitizeMultiline(body.staffNotes, 400) : '';
    const rawAdvance = typeof body?.advancePaidInr === 'number' ? body.advancePaidInr : Number(body?.advancePaidInr);
    const advancePaidInr = Number.isFinite(rawAdvance) && rawAdvance >= 0
      ? Math.min(validData.service.priceInr, Math.round(rawAdvance))
      : 0;

    const whatsappMessage = buildWhatsAppBookingMessage({
      referenceId,
      customerName: validData.customerName,
      phone: validData.normalizedPhone,
      serviceName: validData.service.name,
      priceInr: validData.service.priceInr,
      preferredDate: validData.preferredDate,
      preferredTime: validData.preferredTime,
      notes: validData.notes,
    });

    const record: BookingRecord = {
      id: referenceId,
      customerName: validData.customerName,
      phone: validData.normalizedPhone,
      serviceId: validData.service.id,
      serviceName: validData.service.name,
      priceInr: validData.service.priceInr,
      preferredDate: validData.preferredDate,
      preferredTime: validData.preferredTime,
      notes: validData.notes || '',
      status: requestedStatus,
      staffAssigned,
      advancePaidInr,
      staffNotes,
      source: 'walk-in',
      whatsappDispatchMode: 'whatsapp_deeplink',
      whatsappMessage,
      whatsappUrl: buildWhatsAppUrl(PARLOUR_WHATSAPP_NUMBER, whatsappMessage),
      createdAt: new Date().toISOString(),
    };

    const store = readStore();
    store.bookings.unshift(record);
    writeStore(store);
    res.status(201).json({ booking: record });
  });

  app.patch('/api/admin/bookings/:id', requireAdminAuth, (req, res) => {
    const id = req.params.id;
    const body = req.body as Record<string, unknown>;
    const allowed: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];

    const store = readStore();
    const target = store.bookings.find((item) => item.id === id);
    if (!target) {
      res.status(404).json({ error: 'Booking record not found.' });
      return;
    }

    if (body?.status !== undefined) {
      if (typeof body.status !== 'string' || !allowed.includes(body.status as BookingStatus)) {
        res.status(400).json({ error: 'Invalid booking status.' });
        return;
      }
      target.status = body.status as BookingStatus;
    }

    if (typeof body?.preferredDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.preferredDate.trim())) {
      target.preferredDate = body.preferredDate.trim();
    }
    if (typeof body?.preferredTime === 'string' && body.preferredTime.trim()) {
      target.preferredTime = sanitizeSingleLine(body.preferredTime, 30);
    }
    if (typeof body?.staffAssigned === 'string') {
      target.staffAssigned = sanitizeSingleLine(body.staffAssigned, 80);
    }
    if (typeof body?.staffNotes === 'string') {
      target.staffNotes = sanitizeMultiline(body.staffNotes, 400);
    }
    if (body?.advancePaidInr !== undefined) {
      const adv = Number(body.advancePaidInr);
      if (!Number.isFinite(adv) || adv < 0) {
        res.status(400).json({ error: 'Advance amount must be zero or positive.' });
        return;
      }
      target.advancePaidInr = Math.min(target.priceInr, Math.round(adv));
    }

    writeStore(store);
    res.json({ booking: target });
  });

  app.delete('/api/admin/bookings/:id', requireAdminAuth, (req, res) => {
    const id = req.params.id;
    const store = readStore();
    const index = store.bookings.findIndex((item) => item.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Booking record not found.' });
      return;
    }
    store.bookings.splice(index, 1);
    writeStore(store);
    res.json({ deleted: id });
  });

  app.patch('/api/admin/inquiries/:id', requireAdminAuth, (req, res) => {
    const id = req.params.id;
    const body = req.body as Record<string, unknown>;
    const allowed: InquiryStatus[] = ['new', 'replied', 'closed'];

    const store = readStore();
    const target = store.inquiries.find((item) => item.id === id);
    if (!target) {
      res.status(404).json({ error: 'Inquiry record not found.' });
      return;
    }

    if (body?.status !== undefined) {
      if (typeof body.status !== 'string' || !allowed.includes(body.status as InquiryStatus)) {
        res.status(400).json({ error: 'Invalid inquiry status.' });
        return;
      }
      target.status = body.status as InquiryStatus;
    }

    if (typeof body?.staffNotes === 'string') {
      target.staffNotes = sanitizeMultiline(body.staffNotes, 400);
    }

    writeStore(store);
    res.json({ inquiry: target });
  });

  app.delete('/api/admin/inquiries/:id', requireAdminAuth, (req, res) => {
    const id = req.params.id;
    const store = readStore();
    const index = store.inquiries.findIndex((item) => item.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Inquiry record not found.' });
      return;
    }
    store.inquiries.splice(index, 1);
    writeStore(store);
    res.json({ deleted: id });
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sweety Beauty Parlour server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
