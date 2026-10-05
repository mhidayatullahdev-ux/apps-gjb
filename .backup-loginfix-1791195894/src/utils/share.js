import { Share } from 'react-native';

export async function shareBookingToWhatsApp(booking, user) {
  try {
    const code = booking.booking_code || booking.bookingCode;
    const date = booking.booking_date;
    const time = `${booking.start_time}-${booking.end_time}`;
    const court = booking.court?.name || '';
    const facility = booking.court?.facility?.name || '';
    const amount = booking.total_amount
      ? `Rp ${Number(booking.total_amount).toLocaleString('id-ID')}`
      : '';

    const message = `🏸 *Detail Booking GOR Jakbar*

📋 Kode: ${code}
🏟️ ${facility} - ${court}
📅 ${date}
⏰ ${time}
💰 ${amount}
👤 ${user?.name || ''}

Terima kasih sudah booking di *Gelanggang Jakbar*!`;

    const result = await Share.share({
      title: `Booking ${code}`,
      message,
    });
    return result;
  } catch (e) {
    throw e;
  }
}

export default { shareBookingToWhatsApp };