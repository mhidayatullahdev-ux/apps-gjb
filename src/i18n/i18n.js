import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setApiLanguage } from '../api/client';

const STORAGE_KEY = 'dispora.lang';

const dict = {
  id: {
    // ============ HEADER ============
    'header.search': 'Cari fasilitas atau berita...',

    // ============ MENU PROFILE MODAL ============
    'menu.editProfile': 'Edit Profil',
    'menu.editProfileDesc': 'Nama, email, foto, password',
    'menu.transactions': 'Transaksi Saya',
    'menu.transactionsDesc': 'Status pemesanan & pembayaran',
    'menu.helpdesk': 'Helpdesk',
    'menu.chat': 'Live Chat',
    'menu.accountSettings': 'Pengaturan Akun',

    // ============ WIDGET MENU CEPAT ============
    'widget.sectionLabel': 'MENU CEPAT',
    'widget.facilities': 'Fasilitas',
    'widget.booking': 'Booking',
    'widget.transactions': 'Transaksi',
    'widget.chat': 'Chat',
    'widget.helpdesk': 'Helpdesk',
    'widget.news': 'Berita',
    'widget.profile': 'Profil',
    'widget.more': 'Lainnya',

    // ============ TAB ============
    'tab.home': 'Beranda',
    'tab.facilities': 'Fasilitas',
    'tab.events': 'Acara',
    'tab.news': 'Berita',
    'tab.more': 'Lainnya',
    'tab.helpdesk': 'Helpdesk',

    // ============ AUTH ============
    'auth.or': 'atau',
    'auth.googleLogin': 'Masuk dengan Google',
    'auth.googleRegister': 'Daftar dengan Google',
    'auth.loginTitle': 'Masuk',
    'auth.loginSubtitle': 'Masuk untuk memesan fasilitas dan melacak tiket.',
    'auth.registerTitle': 'Daftar',
    'auth.registerSubtitle': 'Buat akun untuk mulai memakai layanan Dispora.',
    'auth.name': 'Nama lengkap',
    'auth.email': 'Email',
    'auth.phone': 'Nomor HP',
    'auth.password': 'Kata sandi',
    'auth.confirmPassword': 'Ulangi kata sandi',
    'auth.noAccount': 'Belum punya akun? Daftar',
    'auth.haveAccount': 'Sudah punya akun? Masuk',
    'auth.errRequired': 'Semua kolom wajib diisi.',
    'auth.errEmail': 'Format email tidak valid.',
    'auth.errPassword': 'Kata sandi minimal 6 karakter.',
    'auth.errMatch': 'Kata sandi tidak sama.',
    'auth.errNotFound': 'Email atau kata sandi salah.',
    'auth.errExists': 'Email sudah terdaftar.',
    'auth.localOnly': 'Akun disimpan di perangkat ini saja (mode demo).',

    // ============ PROFILE ============
    'profile.title': 'Lengkapi Profil',
    'profile.subtitle': 'Hai {name}, lengkapi data diri Anda untuk mulai memesan lapangan.',
    'profile.nik': 'NIK (16 digit)',
    'profile.phone': 'Nomor HP',
    'profile.gender': 'Jenis Kelamin',
    'profile.male': 'Laki-laki',
    'profile.female': 'Perempuan',
    'profile.birthDate': 'Tanggal Lahir',
    'profile.save': 'Simpan & Lanjutkan',
    'profile.errNik': 'NIK harus 16 digit angka.',
    'profile.errPhone': 'Nomor HP wajib diisi.',
    'profile.errGender': 'Pilih jenis kelamin.',
    'profile.errDate': 'Format tanggal: YYYY-MM-DD.',

    // ============ HOME ============
    'home.eyebrow': 'PEMBERDAYAAN PEMUDA & OLAHRAGA',
    'home.heroFallbackTitle': 'Membangun masa depan Jakarta melalui pemuda & olahraga',
    'home.heroFallbackBody':
      'Memberdayakan generasi atlet dan pemimpin masa depan melalui fasilitas kelas dunia dan program olahraga terintegrasi.',
    'home.ctaEvents': 'Lihat event',
    'home.ctaRegister': 'Daftar sekarang',
    'home.programs': 'PROGRAM ',
    'home.programsAccent': 'UNGGULAN',
    'home.programsCaption':
      'Program pembinaan dan layanan kepemudaan serta olahraga di DKI Jakarta yang dapat diakses masyarakat.',
    'home.activities': 'KEGIATAN',
    'home.athletes': 'PROFIL ',
    'home.athletesAccent': 'INSPIRASI',
    'home.athletesCaption': 'Wajah-wajah bertalenta dan semangat keunggulan dari Jakarta.',
    'home.latest': 'DISPORA TERKINI',
    'home.stats': 'TRAFIK REALTIME',
    'home.statsCaption': 'Dispora active stats',
    'home.helpdesk': 'Helpdesk Dispora',
    'home.helpdeskBody':
      'Lihat alur tiket layanan, SLA penanganan, dan pusat bantuan digital Dispora DKI Jakarta.',
    'home.openHelpdesk': 'Buka helpdesk',
    'home.allPrograms': 'Semua program',
    'home.schedule': 'Lihat jadwal',
    'home.allNews': 'Semua berita',

    // ============ COMMON ============
    'common.more': 'Selengkapnya',
    'common.readMore': 'Baca selengkapnya',
    'common.retry': 'Coba lagi',
    'common.loading': 'Memuat...',
    'common.search': 'Cari',
    'common.all': 'Semua',
    'common.cancel': 'Batal',
    'common.save': 'Simpan',
    'common.close': 'Tutup',
    'common.offline': 'Gagal memuat data. Menampilkan data contoh.',

    // ============ FACILITIES ============
    'facilities.title': 'Fasilitas',
    'facilities.caption': 'Fasilitas olahraga yang bisa dipesan.',
    'facilities.searchPlaceholder': 'Cari fasilitas...',
    'facilities.empty': 'Fasilitas tidak ditemukan',
    'facilities.emptyHint': 'Coba kata kunci lain atau pilih wilayah yang berbeda.',
    'facilities.book': 'Pesan',

    // ============ EVENTS ============
    'events.title': 'Acara',
    'events.caption': 'Jadwal kegiatan, kejuaraan, dan pelatihan Dispora DKI Jakarta.',
    'events.empty': 'Belum ada acara di kategori ini',
    'events.detail': 'Detail acara',
    'events.about': 'Tentang kegiatan',
    'events.date': 'Tanggal',
    'events.location': 'Lokasi',
    'events.category': 'Kategori',

    // ============ NEWS ============
    'news.title': 'Berita',
    'news.caption': 'Kabar terbaru dari Dispora DKI Jakarta.',
    'news.searchPlaceholder': 'Cari berita...',
    'news.empty': 'Berita tidak ditemukan',
    'news.detail': 'Detail berita',
    'news.share': 'Bagikan berita ini',

    // ============ MORE ============
    'more.title': 'Lainnya',
    'more.caption': 'Layanan, pengaturan, dan kontak resmi.',
    'more.appearance': 'Tampilan',
    'more.darkMode': 'Mode gelap',
    'more.followSystem': 'Ikuti sistem',
    'more.language': 'Bahasa',
    'more.account': 'Akun',
    'more.login': 'Masuk',
    'more.register': 'Daftar',
    'more.logout': 'Keluar',
    'more.logoutConfirm': 'Yakin ingin keluar dari akun?',
    'more.loggedInAs': 'Masuk sebagai',
    'more.services': 'Layanan',
    'more.chat': 'Live chat',
    'more.chatDesc': 'Tanya Min Dispora',
    'more.helpdesk': 'Helpdesk',
    'more.helpdeskDesc': 'Tiket layanan',
    'more.payment': 'Pembayaran',
    'more.paymentDesc': 'Bank DKI (simulasi)',
    'more.contact': 'Kontak',
    'more.social': 'Media sosial',
    'more.demoNote': 'Demo aplikasi — sebagian data adalah contoh',
    'more.office': 'Dinas Pemuda dan Olahraga Provinsi DKI Jakarta',

    // ============ CHAT ============
    'chat.title': 'Live chat',
    'chat.placeholder': 'Tulis pesan...',
    'chat.greeting': 'Halo! Ada yang bisa dibantu seputar layanan Dispora DKI Jakarta?',
    'chat.error': 'Gagal mengirim pesan. Periksa koneksi lalu coba lagi.',
    'chat.typing': 'Sedang mengetik...',

    // ============ HELPDESK ============
    'helpdesk.title': 'Helpdesk',
    'helpdesk.caption': 'Daftar tiket layanan.',
    'helpdesk.empty': 'Belum ada tiket',
    'helpdesk.authError': 'Endpoint helpdesk butuh akses admin. Menampilkan data contoh.',
    'helpdesk.open': 'Terbuka',
    'helpdesk.closed': 'Selesai',
    'helpdesk.pending': 'Diproses',

    // ============ PAYMENT ============
    'pay.title': 'Pembayaran',
    'pay.simulation': 'SIMULASI — tidak ada transaksi nyata',
    'pay.item': 'Rincian',
    'pay.method': 'Metode pembayaran',
    'pay.vaBankDki': 'Virtual Account Bank DKI',
    'pay.transferBankDki': 'Transfer Bank DKI',
    'pay.qris': 'QRIS',
    'pay.pay': 'Bayar sekarang',
    'pay.vaNumber': 'Nomor Virtual Account',
    'pay.amount': 'Total tagihan',
    'pay.expiry': 'Bayar sebelum',
    'pay.checkStatus': 'Cek status pembayaran',
    'pay.checking': 'Memeriksa...',
    'pay.pendingMsg': 'Menunggu pembayaran',
    'pay.successTitle': 'Pembayaran berhasil',
    'pay.successMsg': 'Bukti pemesanan sudah dikirim ke email kamu.',
    'pay.done': 'Selesai',
    'pay.copy': 'Salin',
    'pay.copied': 'Tersalin',
    'pay.needLogin': 'Masuk dulu untuk melanjutkan pembayaran.',

    // ===== RESCHEDULE =====
    'reschedule.title': 'Ubah Jadwal',
    'reschedule.submit': 'Ajukan Reschedule',
    'reschedule.terms': 'Syarat & Ketentuan',
    'reschedule.accept': 'Saya setuju dengan ketentuan',
    'reschedule.newDate': 'Tanggal Baru',
    'reschedule.slots': 'Slot Tersedia',
    'reschedule.currentSchedule': 'Jadwal Saat Ini',
    'reschedule.court': 'Lapangan',
    'reschedule.facility': 'Fasilitas',
    'reschedule.minDays': 'Reschedule minimal H-{days} sebelum jadwal.',
    'reschedule.maxTimes': 'Maksimal {times}x reschedule.',

    // ===== CANCEL =====
    'cancel.title': 'Batalkan Booking',
    'cancel.confirm': 'Yakin ingin membatalkan booking ini?',
    'cancel.yes': 'Ya, Batalkan',
    'cancel.no': 'Tidak',
    'cancel.cancelling': 'Membatalkan...',

    // ===== INVOICE =====
    'invoice.download': 'Download Invoice',
    'invoice.downloading': 'Mengunduh...',
    'invoice.success': 'Invoice berhasil diunduh.',
    'invoice.failed': 'Gagal mengunduh invoice.',

    // ===== AVAILABILITY =====
    'availability.pickDate': 'PILIH TANGGAL',
    'availability.availableSlots': 'SLOT TERSEDIA',
    'availability.noSchedule': 'Jadwal belum tersedia.',
    'availability.loading': 'Memuat jadwal...',
    'availability.findOther': 'Cari GOR Lain',
    'availability.suggestions': 'SARAN GOR LAIN',
    'availability.noSuggestions': 'Tidak ada GOR lain yang tersedia di jam ini.',

  },

  en: {
    // ============ HEADER ============
    'header.search': 'Search facilities or news...',

    // ============ MENU PROFILE MODAL ============
    'menu.editProfile': 'Edit Profile',
    'menu.editProfileDesc': 'Name, email, photo, password',
    'menu.transactions': 'My Transactions',
    'menu.transactionsDesc': 'Booking & payment status',
    'menu.helpdesk': 'Helpdesk',
    'menu.chat': 'Live Chat',
    'menu.accountSettings': 'Account Settings',

    // ============ WIDGET MENU CEPAT ============
    'widget.sectionLabel': 'QUICK MENU',
    'widget.facilities': 'Facilities',
    'widget.booking': 'Booking',
    'widget.transactions': 'Transactions',
    'widget.chat': 'Chat',
    'widget.helpdesk': 'Helpdesk',
    'widget.news': 'News',
    'widget.profile': 'Profile',
    'widget.more': 'More',

    // ============ TAB ============
    'tab.home': 'Home',
    'tab.facilities': 'Facilities',
    'tab.events': 'Events',
    'tab.news': 'News',
    'tab.more': 'More',
    'tab.helpdesk': 'Helpdesk',

    // ============ AUTH ============
    'auth.or': 'or',
    'auth.googleLogin': 'Sign in with Google',
    'auth.googleRegister': 'Sign up with Google',
    'auth.loginTitle': 'Sign in',
    'auth.loginSubtitle': 'Sign in to book facilities and track tickets.',
    'auth.registerTitle': 'Sign up',
    'auth.registerSubtitle': 'Create an account to start using Dispora services.',
    'auth.name': 'Full name',
    'auth.email': 'Email',
    'auth.phone': 'Phone number',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Repeat password',
    'auth.noAccount': "Don't have an account? Sign up",
    'auth.haveAccount': 'Already have an account? Sign in',
    'auth.errRequired': 'All fields are required.',
    'auth.errEmail': 'Invalid email format.',
    'auth.errPassword': 'Password must be at least 6 characters.',
    'auth.errMatch': 'Passwords do not match.',
    'auth.errNotFound': 'Wrong email or password.',
    'auth.errExists': 'Email is already registered.',
    'auth.localOnly': 'Accounts are stored on this device only (demo mode).',

    // ============ PROFILE ============
    'profile.title': 'Complete Your Profile',
    'profile.subtitle': 'Hi {name}, complete your details to start booking.',
    'profile.nik': 'National ID (16 digits)',
    'profile.phone': 'Phone number',
    'profile.gender': 'Gender',
    'profile.male': 'Male',
    'profile.female': 'Female',
    'profile.birthDate': 'Date of Birth',
    'profile.save': 'Save & Continue',
    'profile.errNik': 'National ID must be 16 digits.',
    'profile.errPhone': 'Phone number is required.',
    'profile.errGender': 'Please select a gender.',
    'profile.errDate': 'Date format: YYYY-MM-DD.',

    // ============ HOME ============
    'home.eyebrow': 'YOUTH & SPORTS EMPOWERMENT',
    'home.heroFallbackTitle': "Building Jakarta's future through youth & sports",
    'home.heroFallbackBody':
      'Empowering future athletes and leaders through world-class facilities and integrated sports programmes.',
    'home.ctaEvents': 'View events',
    'home.ctaRegister': 'Register now',
    'home.programs': 'FEATURED ',
    'home.programsAccent': 'PROGRAMMES',
    'home.programsCaption':
      'Youth and sports development programmes and public services across DKI Jakarta.',
    'home.activities': 'ACTIVITIES',
    'home.athletes': 'INSPIRING ',
    'home.athletesAccent': 'PROFILES',
    'home.athletesCaption': 'Talented faces and the spirit of excellence from Jakarta.',
    'home.latest': 'LATEST FROM DISPORA',
    'home.stats': 'REALTIME TRAFFIC',
    'home.statsCaption': 'Dispora active stats',
    'home.helpdesk': 'Dispora Helpdesk',
    'home.helpdeskBody': 'Service ticket flow, handling SLA, and the digital help centre.',
    'home.openHelpdesk': 'Open helpdesk',
    'home.allPrograms': 'All programmes',
    'home.schedule': 'View schedule',
    'home.allNews': 'All news',

    // ============ COMMON ============
    'common.more': 'Learn more',
    'common.readMore': 'Read more',
    'common.retry': 'Try again',
    'common.loading': 'Loading...',
    'common.search': 'Search',
    'common.all': 'All',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.close': 'Close',
    'common.offline': 'Failed to load. Showing sample data.',

    // ============ FACILITIES ============
    'facilities.title': 'Facilities',
    'facilities.caption': 'Dispora-owned sports facilities available for booking.',
    'facilities.searchPlaceholder': 'Search facilities...',
    'facilities.empty': 'No facilities found',
    'facilities.emptyHint': 'Try another keyword or pick a different area.',
    'facilities.book': 'Book',

    // ============ EVENTS ============
    'events.title': 'Events',
    'events.caption': 'Activities, championships, and training by Dispora DKI Jakarta.',
    'events.empty': 'No events in this category yet',
    'events.detail': 'Event detail',
    'events.about': 'About this event',
    'events.date': 'Date',
    'events.location': 'Location',
    'events.category': 'Category',

    // ============ NEWS ============
    'news.title': 'News',
    'news.caption': 'Latest updates from Dispora DKI Jakarta.',
    'news.searchPlaceholder': 'Search news...',
    'news.empty': 'No news found',
    'news.detail': 'News detail',
    'news.share': 'Share this article',

    // ============ MORE ============
    'more.title': 'More',
    'more.caption': 'Services, settings, and official contacts.',
    'more.appearance': 'Appearance',
    'more.darkMode': 'Dark mode',
    'more.followSystem': 'Follow system',
    'more.language': 'Language',
    'more.account': 'Account',
    'more.login': 'Sign in',
    'more.register': 'Sign up',
    'more.logout': 'Sign out',
    'more.logoutConfirm': 'Are you sure you want to sign out?',
    'more.loggedInAs': 'Signed in as',
    'more.services': 'Services',
    'more.chat': 'Live chat',
    'more.chatDesc': 'Ask Min Dispora',
    'more.helpdesk': 'Helpdesk',
    'more.helpdeskDesc': 'Service tickets',
    'more.payment': 'Payment',
    'more.paymentDesc': 'Bank DKI (simulated)',
    'more.contact': 'Contact',
    'more.social': 'Social media',
    'more.demoNote': 'Demo app — some data is sample content',
    'more.office': 'Youth and Sports Agency of DKI Jakarta',

    // ============ CHAT ============
    'chat.title': 'Live chat',
    'chat.placeholder': 'Type a message...',
    'chat.greeting': 'Hi! How can I help you with Dispora DKI Jakarta services?',
    'chat.error': 'Failed to send. Check your connection and try again.',
    'chat.typing': 'Typing...',

    // ============ HELPDESK ============
    'helpdesk.title': 'Helpdesk',
    'helpdesk.caption': 'Service ticket list.',
    'helpdesk.empty': 'No tickets yet',
    'helpdesk.authError': 'The helpdesk endpoint needs admin access. Showing sample data.',
    'helpdesk.open': 'Open',
    'helpdesk.closed': 'Closed',
    'helpdesk.pending': 'In progress',

    // ============ PAYMENT ============
    'pay.title': 'Payment',
    'pay.simulation': 'SIMULATION — no real transaction',
    'pay.item': 'Details',
    'pay.method': 'Payment method',
    'pay.vaBankDki': 'Bank DKI Virtual Account',
    'pay.transferBankDki': 'Bank DKI Transfer',
    'pay.qris': 'QRIS',
    'pay.pay': 'Pay now',
    'pay.vaNumber': 'Virtual Account number',
    'pay.amount': 'Total due',
    'pay.expiry': 'Pay before',
    'pay.checkStatus': 'Check payment status',
    'pay.checking': 'Checking...',
    'pay.pendingMsg': 'Waiting for payment',
    'pay.successTitle': 'Payment successful',
    'pay.successMsg': 'The booking receipt has been sent to your email.',
    'pay.done': 'Done',
    'pay.copy': 'Copy',
    'pay.copied': 'Copied',
    'pay.needLogin': 'Sign in first to continue with payment.',

    // ===== RESCHEDULE =====
    'reschedule.title': 'Reschedule',
    'reschedule.submit': 'Submit Reschedule',
    'reschedule.terms': 'Terms & Conditions',
    'reschedule.accept': 'I agree to the terms',
    'reschedule.newDate': 'New Date',
    'reschedule.slots': 'Available Slots',
    'reschedule.currentSchedule': 'Current Schedule',
    'reschedule.court': 'Court',
    'reschedule.facility': 'Facility',
    'reschedule.minDays': 'Reschedule at least H-{days} before schedule.',
    'reschedule.maxTimes': 'Maximum {times} reschedules.',

    // ===== CANCEL =====
    'cancel.title': 'Cancel Booking',
    'cancel.confirm': 'Are you sure you want to cancel this booking?',
    'cancel.yes': 'Yes, Cancel',
    'cancel.no': 'No',
    'cancel.cancelling': 'Cancelling...',

    // ===== INVOICE =====
    'invoice.download': 'Download Invoice',
    'invoice.downloading': 'Downloading...',
    'invoice.success': 'Invoice downloaded successfully.',
    'invoice.failed': 'Failed to download invoice.',

    // ===== AVAILABILITY =====
    'availability.pickDate': 'PICK A DATE',
    'availability.availableSlots': 'AVAILABLE SLOTS',
    'availability.noSchedule': 'No schedule available.',
    'availability.loading': 'Loading schedule...',
    'availability.findOther': 'Find Other GOR',
    'availability.suggestions': 'OTHER GOR SUGGESTIONS',
    'availability.noSuggestions': 'No other GOR available at this hour.',

  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('id');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'id' || v === 'en') setLang(v);
      })
      .catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang: (l) => {
        setLang(l);
        setApiLanguage(l);
        AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
      },
      t: (key) => (dict[lang] && dict[lang][key]) || dict.id[key] || key,
    }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n harus dipakai di dalam I18nProvider');
  return ctx;
}

export default { I18nProvider, useI18n };