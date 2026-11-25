import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SERVICES,
  buildWhatsAppBookingMessage,
  buildWhatsAppInquiryMessage,
  buildWhatsAppUrl,
  filterServicesByCategory,
  normalizeIndianPhone,
  summarizeDeskStats,
  validateBookingInput,
  validateInquiryInput,
} from './parlour';

test('normalizeIndianPhone handles 10-digit, +91, and 0-prefixed Indian mobile numbers', () => {
  assert.equal(normalizeIndianPhone('9876543210'), '919876543210');
  assert.equal(normalizeIndianPhone('+91 98765-43210'), '919876543210');
  assert.equal(normalizeIndianPhone('09876543210'), '919876543210');
  assert.equal(normalizeIndianPhone('12345'), null);
  assert.equal(normalizeIndianPhone('5123456789'), null);
});

test('validateBookingInput rejects empty/invalid inputs and accepts valid booking', () => {
  const invalid = validateBookingInput({
    customerName: 'A',
    phone: '123',
    serviceId: 'missing-service',
    preferredDate: '',
    preferredTime: '',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.customerName);
  assert.ok(invalid.errors.phone);
  assert.ok(invalid.errors.serviceId);
  assert.ok(invalid.errors.preferredDate);
  assert.ok(invalid.errors.preferredTime);

  const valid = validateBookingInput({
    customerName: 'Ananya Sharma',
    phone: '9876543210',
    serviceId: 'royal-bridal-hd',
    preferredDate: '2026-12-12',
    preferredTime: '11:30 AM',
    notes: 'Haldi + Bridal trial inquiry',
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.data?.normalizedPhone, '919876543210');
  assert.equal(valid.data?.service.name, 'Royal HD Bridal Artistry');
});

test('validateInquiryInput rejects short messages and builds formatted WhatsApp inquiry URL', () => {
  const invalid = validateInquiryInput({
    customerName: '',
    phone: '98765',
    topic: '',
    message: 'Hi',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.customerName);
  assert.ok(invalid.errors.phone);
  assert.ok(invalid.errors.topic);
  assert.ok(invalid.errors.message);

  const valid = validateInquiryInput({
    customerName: 'Priya Verma',
    phone: '+91 9812345678',
    topic: 'Bridal Package & Trial',
    message: 'Please share December bridal package availability for Lawar.',
  });
  assert.equal(valid.valid, true);

  const msg = buildWhatsAppInquiryMessage({
    referenceId: 'SBP-INQ-101',
    customerName: 'Priya Verma',
    phone: '919812345678',
    topic: 'Bridal Package & Trial',
    message: 'Please share December bridal package availability for Lawar.',
  });
  assert.match(msg, /Sweety Beauty Parlour \(Lawar, Meerut\)/);
  assert.match(msg, /SBP-INQ-101/);

  const url = buildWhatsAppUrl('919876543210', msg);
  assert.ok(url.startsWith('https://wa.me/919876543210?text='));
});

test('buildWhatsAppBookingMessage includes service price and appointment slot', () => {
  const msg = buildWhatsAppBookingMessage({
    referenceId: 'SBP-BK-204',
    customerName: 'Meera Tyagi',
    phone: '919876543210',
    serviceName: 'Royal HD Bridal Artistry',
    priceInr: 14500,
    preferredDate: '2026-12-18',
    preferredTime: '10:00 AM',
  });
  assert.match(msg, /Royal HD Bridal Artistry/);
  assert.match(msg, /14,500/);
  assert.match(msg, /2026-12-18 at 10:00 AM/);
});

test('filterServicesByCategory and summarizeDeskStats return accurate subsets and counts', () => {
  const bridal = filterServicesByCategory(SERVICES, 'Bridal');
  assert.equal(bridal.length, 3);
  assert.equal(filterServicesByCategory(SERVICES, 'All Services').length, SERVICES.length);

  const stats = summarizeDeskStats(
    [
      {
        id: '1',
        customerName: 'Riya',
        phone: '919876543210',
        serviceId: 'royal-bridal-hd',
        serviceName: 'Royal HD Bridal Artistry',
        priceInr: 14500,
        preferredDate: '2026-12-10',
        preferredTime: '10:00 AM',
        notes: '',
        status: 'pending',
        whatsappDispatchMode: 'whatsapp_deeplink',
        whatsappMessage: 'msg',
        whatsappUrl: 'https://wa.me/919876543210',
        createdAt: '2026-11-24T10:00:00.000Z',
      },
    ],
    [],
  );
  assert.equal(stats.totalBookings, 1);
  assert.equal(stats.pendingBookings, 1);
  assert.equal(stats.confirmedBookings, 0);
});
