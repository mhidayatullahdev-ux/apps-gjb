// src/utils/nik.js

/**
 * Extract tanggal lahir dari NIK 16 digit.
 * Format NIK: PPKKCC-DDMMYY-NNNN
 *   - Digit 1-6   : kode wilayah
 *   - Digit 7-8   : tanggal lahir (perempuan +40)
 *   - Digit 9-10  : bulan lahir
 *   - Digit 11-12 : tahun lahir (2 digit)
 *   - Digit 13-16 : nomor urut
 */
export function extractBirthDateFromNik(nik) {
  if (!nik) return null;
  const clean = String(nik).replace(/\D/g, '');
  if (clean.length < 12) return null;

  const day = parseInt(clean.substring(6, 8), 10);
  const month = parseInt(clean.substring(8, 10), 10);
  const year2 = parseInt(clean.substring(10, 12), 10);

  if (isNaN(day) || isNaN(month) || isNaN(year2)) return null;
  if (month < 1 || month > 12) return null;

  // Perempuan: tanggal > 40 → kurangi 40
  const actualDay = day > 40 ? day - 40 : day;
  if (actualDay < 1 || actualDay > 31) return null;

  const currentYear2 = new Date().getFullYear() % 100;
  const fullYear = year2 <= currentYear2 + 1 ? 2000 + year2 : 1900 + year2;

  const mm = String(month).padStart(2, '0');
  const dd = String(actualDay).padStart(2, '0');
  return `${fullYear}-${mm}-${dd}`;
}

export function validatePhone(phone) {
  const clean = String(phone || '').replace(/\D/g, '');
  if (clean.length < 10) return { valid: false, message: 'Nomor HP minimal 10 digit.' };
  if (clean.length > 13) return { valid: false, message: 'Nomor HP maksimal 13 digit.' };
  return { valid: true };
}
