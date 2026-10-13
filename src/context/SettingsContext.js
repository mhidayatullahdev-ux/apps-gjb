import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { settingsApi } from '../api/settings';

const FALLBACK = {
  settings: {
    general: { tagline: 'Gelanggang Olahraga merupakan fasilitas Olahraga Multifungsi' },
    contact: { address: null, phone: null, whatsapp: null, email: null },
    social: { instagram: null, facebook: null, x: null, youtube: null, tiktok: null },
    payment: { deadline_hours: 2, bank_name: null, account_number: null, account_name: null, instructions: null },
    pricing: { holiday_as_weekend: true },
    retribution: { content: null },
    booking: { history_days: 30 },
    reschedule: { min_days_before: 1, max_times: 1, terms: '' },
  },
  options: {
    sport_types: [
      { value: 'badminton', label: 'Badminton' },
      { value: 'basket', label: 'Basket' },
      { value: 'voli', label: 'Voli' },
      { value: 'futsal', label: 'Futsal' },
      { value: 'takraw', label: 'Sepak Takraw' },
      { value: 'aula', label: 'Aula' },
    ],
    purposes: ['Latihan', 'Kompetisi'],
    booking_statuses: {
      pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak',
      cancelled: 'Dibatalkan', expired: 'Kedaluwarsa', completed: 'Selesai',
    },
    payment_statuses: {
      unpaid: 'Belum Bayar', waiting_verification: 'Menunggu Verifikasi',
      paid: 'Lunas', rejected: 'Bukti Ditolak', refunded: 'Refund',
    },
  },
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [data, setData] = useState(FALLBACK);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await settingsApi.get();
      if (res && res.settings) setData(res);
    } catch {} finally { setReady(true); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const value = useMemo(() => {
    const s = data.settings || FALLBACK.settings;
    const o = data.options || FALLBACK.options;

    const sportLabel = (value) => {
      const found = (o.sport_types || []).find((x) => x.value === value);
      return found ? found.label : value;
    };
    const bookingStatusLabel = (key) => (o.booking_statuses || {})[key] || key;
    const paymentStatusLabel = (key) => (o.payment_statuses || {})[key] || key;
    const whatsappUrl = s.contact.whatsapp
      ? `https://wa.me/${String(s.contact.whatsapp).replace(/\D/g, '')}` : null;

    return {
      ready, reload: load, raw: data,
      tagline: s.general.tagline,
      contact: s.contact, whatsappUrl,
      social: s.social, payment: s.payment,
      pricing: s.pricing, booking: s.booking, reschedule: s.reschedule,
      retribution: s.retribution || { content: null },
      sportTypes: o.sport_types || [], purposes: o.purposes || [],
      bookingStatuses: o.booking_statuses || {}, paymentStatuses: o.payment_statuses || {},
      sportLabel, bookingStatusLabel, paymentStatusLabel,
    };
  }, [data, ready, load]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings harus dipakai di dalam SettingsProvider');
  return ctx;
}

export default { SettingsProvider, useSettings };