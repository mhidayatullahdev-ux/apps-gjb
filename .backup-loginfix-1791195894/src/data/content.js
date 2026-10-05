// Data demo. Isinya mengikuti struktur konten situs dispora.jakarta.go.id
// supaya tampilan mobile terasa sama, tanpa perlu backend.
// Nanti tinggal ganti dengan hasil fetch API kalau sudah siap.

export const heroQuotes = [
  {
    id: 'q1',
    quote:
      'Bapak Ibu, ketika saya menyerahkan bendera, pesan saya cuma satu, juara umum. Termasuk nanti di PON, Jakarta harus tetap juara umum.',
    name: 'Pramono Anung',
    role: 'Gubernur DKI Jakarta',
  },
  {
    id: 'q2',
    quote:
      'Saya percaya, masa depan Jakarta dan Indonesia ada di tangan kita yang tak takut bermimpi, tak lelah mencoba, dan tak berhenti mencintai negeri ini.',
    name: 'Rano Karno',
    role: 'Wakil Gubernur DKI Jakarta',
  },
];

export const programs = [
  {
    id: 'jkt-sport',
    title: 'JKT Sport',
    tag: 'Pembinaan',
    description:
      'Program pembinaan olahraga DKI Jakarta yang disusun berjenjang, mulai dari usia dini, tingkat pelajar, hingga mahasiswa.',
    image:
      'https://rtvxfqsqysnldhgpppyy.supabase.co/storage/v1/object/public/rakomtekpadel/programs/program-1776188560102.jpeg',
    accent: 'primary',
    children: [
      { code: 'POPB', label: 'Pembibitan atlet usia dini' },
      { code: 'PPOP', label: 'Pembinaan atlet pelajar' },
      { code: 'PPLM', label: 'Pembinaan atlet mahasiswa' },
    ],
  },
  {
    id: 'sidasi',
    title: 'Sidasi V2.0',
    tag: 'Layanan',
    description:
      'Sistem Informasi dan Distribusi untuk pengajuan permohonan peralatan olahraga di DKI Jakarta, bagi masyarakat maupun organisasi.',
    image:
      'https://rtvxfqsqysnldhgpppyy.supabase.co/storage/v1/object/public/rakomtekpadel/programs/program-1776230977179.png',
    accent: 'blue',
    children: [],
  },
  {
    id: 'rekomtek',
    title: 'Rekomtek',
    tag: 'Layanan',
    description:
      'Rekomendasi teknis untuk pembangunan sarana dan prasarana olahraga, dipakai sebagai acuan perencanaan dan pelaksanaan pembangunan.',
    image:
      'https://rtvxfqsqysnldhgpppyy.supabase.co/storage/v1/object/public/rakomtekpadel/programs/program-1776188721037.png',
    accent: 'gold',
    children: [],
  },
  {
    id: 'e-booking',
    title: 'E-Booking',
    tag: 'Reservasi',
    description:
      'Pemesanan fasilitas olahraga milik Dispora DKI Jakarta secara online, mudah dan transparan.',
    image:
      'https://rtvxfqsqysnldhgpppyy.supabase.co/storage/v1/object/public/rakomtekpadel/programs/program-1780321658073.png',
    accent: 'primary',
    children: [],
  },
  {
    id: 'jktmuda',
    title: 'JKT Muda',
    tag: 'Kepemudaan',
    description:
      'Lima program unggulan untuk mengembangkan, memberdayakan, dan membawa pemuda Jakarta ke panggung dunia.',
    image:
      'https://rtvxfqsqysnldhgpppyy.supabase.co/storage/v1/object/public/rakomtekpadel/programs/program-1787203688928.png',
    accent: 'blue',
    children: [],
  },
];

export const events = [
  {
    id: 4,
    category: 'Kegiatan',
    title: 'Pekan Paralimpik Pelajar Nasional (PEPARPENAS) 2025',
    location: 'Jakarta',
    date: '18 - 24 Nov 2025',
    status: 'Selesai',
    description:
      'Ajang multi-cabang bagi pelajar penyandang disabilitas dari seluruh provinsi. DKI Jakarta menurunkan kontingen dari hasil pembinaan PPOP dan klub disabilitas binaan Dispora.',
  },
  {
    id: 7,
    category: 'Kegiatan',
    title: 'Kejuaraan Panjat Tebing Pelajar Provinsi DKI Jakarta Tahun 2026',
    location: 'Jakarta International Climbing Wall Park, Jakarta Utara',
    date: '12 - 15 Sep 2026',
    status: 'Pendaftaran dibuka',
    description:
      'Kejuaraan panjat tebing tingkat pelajar untuk menjaring atlet muda ke pemusatan latihan provinsi. Nomor yang dipertandingkan: lead, speed, dan boulder.',
  },
  {
    id: 6,
    category: 'Kegiatan',
    title: 'Pelatihan SDM Pembina Olahraga Disabilitas Provinsi DKI Jakarta Tahun 2026',
    location: 'Tavia Heritage Hotel, Jakarta Pusat',
    date: '22 - 24 Sep 2026',
    status: 'Akan datang',
    description:
      'Pelatihan bagi pelatih dan pembina olahraga disabilitas se-DKI Jakarta, mencakup klasifikasi atlet, metode latihan adaptif, dan penanganan cedera.',
  },
  {
    id: 5,
    category: 'Kegiatan',
    title: 'Pekan Olahraga Pelajar Nasional (POPNAS) 2025',
    location: 'Jakarta',
    date: '01 - 10 Des 2025',
    status: 'Selesai',
    description:
      'Kompetisi olahraga pelajar tingkat nasional. Kontingen DKI Jakarta diperkuat atlet hasil binaan PPOP dan sekolah-sekolah pembinaan olahraga.',
  },
  {
    id: 8,
    category: 'Sport',
    title: 'Pendaftaran Pembinaan Olahraga Prestasi Berkelanjutan (POPB)',
    location: 'Pusat Pelatihan Olahraga Pelajar',
    date: 'Dibuka s.d. 30 Sep 2026',
    status: 'Pendaftaran dibuka',
    description:
      'Seleksi masuk program pembibitan atlet usia dini. Terbuka untuk pelajar Jakarta usia 9-13 tahun dengan tahapan seleksi administrasi, tes fisik, dan tes cabang olahraga.',
  },
];

export const news = [
  {
    id: 146,
    category: 'Berita',
    title: 'Pendaftaran Pembinaan Aktivitas Pemuda (PAP) 2026 resmi dibuka',
    date: '21 Agustus 2026',
    excerpt:
      'Program ini menjadi wadah bagi pemuda-pemudi Jakarta untuk mengasah potensi, membangun jejaring, dan berperan aktif dalam kegiatan kepemudaan.',
    body:
      'Pendaftaran Pembinaan Aktivitas Pemuda (PAP) 2026 resmi dibuka. Program ini menjadi wadah bagi pemuda-pemudi Jakarta untuk mengasah potensi, membangun jejaring, dan berperan aktif dalam kegiatan kepemudaan di Jakarta.\n\nInformasi lengkap mengenai bidang program, timeline pendaftaran, dan narahubung tersedia di halaman JKT Muda. Pendaftaran dilakukan secara daring melalui laman resmi Dispora DKI Jakarta.\n\nPeserta terpilih akan mengikuti rangkaian pembinaan selama satu semester, mencakup pelatihan kepemimpinan, pengelolaan komunitas, dan penyusunan proyek sosial di wilayah masing-masing.',
  },
  {
    id: 142,
    category: 'Berita',
    title: 'Kenalan dulu dengan empat jenis sampah sebelum membuang',
    date: '31 Agustus 2026',
    excerpt:
      'Organik, anorganik, B3, dan residu. Memilah sejak dari rumah membuat pengolahan sampah di hilir jauh lebih ringan.',
    body:
      'Biar tidak salah tempat, kenalan dulu dengan empat jenis sampah: organik berupa sisa makanan dan daun, anorganik seperti plastik dan kaleng, B3 alias bahan berbahaya dan beracun seperti baterai, serta residu yang sudah tidak bisa didaur ulang.\n\nMemilah sejak dari rumah membuat pengolahan di TPS dan TPA jauh lebih ringan, sekaligus menaikkan nilai jual sampah yang masih bisa didaur ulang.\n\nDispora DKI Jakarta mengajak komunitas pemuda ikut menggerakkan kebiasaan memilah lewat kegiatan kampung dan konten kreatif di media sosial.',
  },
  {
    id: 143,
    category: 'Berita',
    title: 'Hasil seleksi administrasi Wirausaha Muda Pemula 2026 diumumkan',
    date: '31 Agustus 2026',
    excerpt:
      'Pengumuman hasil seleksi administrasi WMP 2026 sudah dapat dilihat melalui pengumuman resmi Dispora DKI Jakarta.',
    body:
      'Hasil seleksi administrasi Wirausaha Muda Pemula (WMP) 2026 telah diumumkan berdasarkan pengumuman resmi Dispora DKI Jakarta.\n\nPeserta yang lolos tahap administrasi melanjutkan ke tahap presentasi rencana usaha. Jadwal dan lokasi presentasi disampaikan melalui kontak yang didaftarkan peserta.\n\nPeserta diminta menyiapkan profil usaha, rencana penggunaan dana, serta bukti aktivitas usaha yang sedang berjalan.',
  },
  {
    id: 141,
    category: 'Berita',
    title: 'Selamat Hari Pramuka',
    date: '31 Agustus 2026',
    excerpt:
      'Terus tumbuh menjadi generasi muda yang tangguh, mandiri, disiplin, dan siap memberi manfaat bagi sesama.',
    body:
      'Selamat Hari Pramuka. Terus tumbuh menjadi generasi muda yang tangguh, mandiri, disiplin, dan siap memberi manfaat bagi sesama.\n\nNilai kepramukaan sejalan dengan arah pembinaan kepemudaan Jakarta: kemandirian, kerja sama, dan kepedulian pada lingkungan sekitar.',
  },
];

export const athletes = [
  {
    id: 'a1',
    name: 'Siti Aminah',
    achievement: 'Peraih emas POPNAS 2023',
    quote: 'Disiplin adalah jalan yang mengantar pada kemenangan.',
    image:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop',
  },
  {
    id: 'a2',
    name: 'Rizky Ramadhan',
    achievement: 'Bintang muda panahan putra',
    quote: 'Tidak ada jalan instan menuju juara. Semua dibangun dari latihan yang tidak terlihat.',
    image: 'https://cdn.corenexis.com/files/c/2775252720.png',
  },
];

export const facilities = [
  {
    id: 'f1',
    name: 'Jakarta International Climbing Wall Park',
    area: 'Jakarta Utara',
    type: 'Panjat Tebing',
    open: '08.00 - 21.00',
    price: 'Rp 35.000 / sesi',
  },
  {
    id: 'f2',
    name: 'Gelanggang Remaja Jakarta Timur',
    area: 'Jakarta Timur',
    type: 'Serbaguna',
    open: '07.00 - 22.00',
    price: 'Rp 120.000 / jam',
  },
  {
    id: 'f3',
    name: 'Gelanggang Olahraga Ciracas',
    area: 'Jakarta Timur',
    type: 'Futsal & Basket',
    open: '06.00 - 23.00',
    price: 'Rp 150.000 / jam',
  },
  {
    id: 'f4',
    name: 'Gelanggang Remaja Jakarta Selatan',
    area: 'Jakarta Selatan',
    type: 'Bulutangkis',
    open: '07.00 - 22.00',
    price: 'Rp 90.000 / jam',
  },
  {
    id: 'f5',
    name: 'Lapangan Atletik Rawamangun',
    area: 'Jakarta Timur',
    type: 'Atletik',
    open: '05.30 - 20.00',
    price: 'Rp 25.000 / orang',
  },
  {
    id: 'f6',
    name: 'Kolam Renang Gelanggang Jakarta Pusat',
    area: 'Jakarta Pusat',
    type: 'Renang',
    open: '06.00 - 20.00',
    price: 'Rp 30.000 / orang',
  },
];

export const facilityAreas = [
  'Semua',
  'Jakarta Pusat',
  'Jakarta Utara',
  'Jakarta Selatan',
  'Jakarta Timur',
  'Jakarta Barat',
];

export const stats = [
  { id: 's1', label: 'Aktif saat ini', value: '128', unit: 'pax' },
  { id: 's2', label: 'Kunjungan hari ini', value: '4.312', unit: 'hits' },
  { id: 's3', label: 'Minggu ini', value: '27.940', unit: 'hits' },
  { id: 's4', label: 'Bulan ini', value: '118.502', unit: 'hits' },
];

export const helpdesk = {
  openTicket: 12,
  avgSla: '34 menit',
  channels: ['WhatsApp', 'Email', 'Datang langsung'],
};

export const quickLinks = [
  { id: 'l1', label: 'Informasi Publik', icon: 'document-text-outline' },
  { id: 'l2', label: 'Struktur Organisasi', icon: 'git-network-outline' },
  { id: 'l3', label: 'JKT Muda', icon: 'sparkles-outline' },
  { id: 'l4', label: 'Rekomtek', icon: 'construct-outline' },
  { id: 'l5', label: 'Leaderboard', icon: 'trophy-outline' },
  { id: 'l6', label: 'Galeri', icon: 'images-outline' },
];

export const contact = {
  office: 'Dinas Pemuda dan Olahraga Provinsi DKI Jakarta',
  address: 'Jl. Jatinegara Timur No. 55, RT.11/RW.3, Jakarta Timur',
  email: 'dispora@jakarta.go.id',
  socials: [
    { id: 'ig', label: '@disporadkijkt', platform: 'Instagram', icon: 'logo-instagram' },
    { id: 'tt', label: '@disporadkijkt', platform: 'TikTok', icon: 'musical-notes-outline' },
    { id: 'yt', label: '@disporadkijakarta', platform: 'YouTube', icon: 'logo-youtube' },
  ],
};

export const marqueeWords = ['PULSE', 'RHYTHM', 'SPEED', 'GRIT', 'FLOW', 'FOCUS', 'POWER'];
