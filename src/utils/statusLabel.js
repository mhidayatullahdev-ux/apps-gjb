export function getBookingStatusLabel(status, isEn = false) {
  const map = {
    pending: isEn ? 'Pending Verification' : 'Menunggu Verifikasi',
    approved: isEn ? 'Verified' : 'Terverifikasi',
    rejected: isEn ? 'Rejected' : 'Ditolak',
    cancelled: isEn ? 'Cancelled' : 'Dibatalkan',
    expired: isEn ? 'Expired' : 'Kedaluwarsa',
    completed: isEn ? 'Completed' : 'Selesai',
  };
  return map[status] || status || '-';
}

/**
 * Tone untuk Tag berdasarkan status.
 */
export function getBookingStatusTone(status) {
  switch (status) {
    case 'approved':
    case 'completed':
      return 'success';
    case 'pending':
      return 'gold';
    case 'rejected':
    case 'cancelled':
    case 'expired':
      return 'neutral';
    default:
      return 'primary';
  }
}
