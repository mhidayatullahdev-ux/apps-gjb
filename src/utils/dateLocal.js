// src/utils/dateLocal.js

/**
 * Format Date ke YYYY-MM-DD dalam LOCAL timezone.
 * BEDA dengan toISOString().slice(0,10) yang pakai UTC.
 *
 * Kalau user Jakarta (GMT+7) buka jam 02:00 tanggal 11,
 * toISOString() akan return tanggal 10 (salah).
 * Fungsi ini return tanggal 11 (benar).
 */
export function formatDateLocal(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Ambil tanggal besok dalam local timezone.
 */
export function getTomorrowLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Cek apakah date1 sama dengan date2 (per hari, local).
 */
export function isSameDayLocal(a, b) {
  if (!a || !b) return false;
  const da = a instanceof Date ? a : new Date(a);
  const db = b instanceof Date ? b : new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}
