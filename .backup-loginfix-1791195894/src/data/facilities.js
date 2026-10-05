// Fasilitas olahraga wilayah Jakarta Barat.
//
// Nama, alamat, dan koordinat diambil dari data Google Maps venue nyata.
// Jam operasional, tarif, dan daftar sub-fasilitas adalah data demo yang
// disusun mengikuti Perda Retribusi Nomor 1 Tahun 2024, karena Dispora
// belum menyediakan endpoint publik untuk detail fasilitas.

export const facilityList = [
  {
    id: 701,
    name: 'GOR Gelanggang Jakarta Barat Grogol',
    category: 'GELANGGANG',
    area: 'Grogol Petamburan',
    sport: 'Serbaguna',
    address: 'Jl. Semeru Raya No.1, RT.7/RW.7, Grogol, Kota Jakarta Barat 11450',
    lat: -6.1603492,
    lng: 106.7967747,
    image: null,
    operationalHours: '06:00 – 22:00',
    ebooking: true,
    subCount: 6,
    priceFrom: 20000,
    rating: 4.3,
  },
  {
    id: 702,
    name: 'GOR Cendrawasih',
    category: 'STADION',
    area: 'Cengkareng',
    sport: 'Serbaguna',
    address: 'Jl. Cendrawasih Raya, Cengkareng Barat, Kota Jakarta Barat 11730',
    lat: -6.1428952,
    lng: 106.7221828,
    image: null,
    operationalHours: '09:00 – 22:00',
    ebooking: true,
    subCount: 6,
    priceFrom: 25000,
    rating: 4.6,
  },
  {
    id: 703,
    name: 'GOR Bulutangkis Cendrawasih',
    category: 'ARENA',
    area: 'Cengkareng',
    sport: 'Bulu Tangkis',
    address: 'Jl. Cendrawasih Raya, RT.6/RW.7, Cengkareng Barat, Kota Jakarta Barat 11730',
    lat: -6.1429517,
    lng: 106.7221932,
    image: null,
    operationalHours: '06:00 – 22:00',
    ebooking: true,
    subCount: 4,
    priceFrom: 30000,
    rating: 4.5,
  },
  {
    id: 704,
    name: 'Gelanggang Remaja Kecamatan Cengkareng',
    category: 'GELANGGANG',
    area: 'Cengkareng',
    sport: 'Serbaguna',
    address: 'Jl. Utama Raya No.2, RT.9/RW.2, Cengkareng Barat, Kota Jakarta Barat 11730',
    lat: -6.150242,
    lng: 106.7218369,
    image: null,
    operationalHours: '07:00 – 22:00',
    ebooking: true,
    subCount: 3,
    priceFrom: 20000,
    rating: 4.6,
  },
  {
    id: 705,
    name: 'Gelanggang Kecamatan Grogol Petamburan',
    category: 'GELANGGANG',
    area: 'Grogol Petamburan',
    sport: 'Bulu Tangkis',
    address: 'Jl. Tanjung Duren Barat IV No.10, RT.9/RW.5, Kota Jakarta Barat 11470',
    lat: -6.1778436,
    lng: 106.7810496,
    image: null,
    operationalHours: '07:00 – 22:00',
    ebooking: true,
    subCount: 3,
    priceFrom: 20000,
    rating: 4.3,
    phone: '02155669734',
  },
  {
    id: 706,
    name: 'Gelanggang Remaja Kecamatan Kembangan',
    category: 'GELANGGANG',
    area: 'Kembangan',
    sport: 'Serbaguna',
    address: 'Kawasan Kembangan, Kota Jakarta Barat',
    lat: -6.1889,
    lng: 106.7418,
    image: null,
    operationalHours: '07:00 – 22:00',
    ebooking: false,
    subCount: 3,
    priceFrom: 20000,
    rating: null,
  },
  {
    id: 707,
    name: 'Gelanggang Remaja Kecamatan Palmerah',
    category: 'GELANGGANG',
    area: 'Palmerah',
    sport: 'Serbaguna',
    address: 'Kawasan Palmerah, Kota Jakarta Barat',
    lat: -6.1936,
    lng: 106.7896,
    image: null,
    operationalHours: '07:00 – 22:00',
    ebooking: false,
    subCount: 3,
    priceFrom: 20000,
    rating: null,
  },
  {
    id: 708,
    name: 'Gelanggang Remaja Kecamatan Kalideres',
    category: 'GELANGGANG',
    area: 'Kalideres',
    sport: 'Serbaguna',
    address: 'Kawasan Kalideres, Kota Jakarta Barat',
    lat: -6.1345,
    lng: 106.7053,
    image: null,
    operationalHours: '07:00 – 22:00',
    ebooking: false,
    subCount: 3,
    priceFrom: 20000,
    rating: null,
  },
];

// Filter berdasarkan kecamatan, karena semua venue ada di Jakarta Barat.
export const facilityAreas = [
  'Semua',
  'Cengkareng',
  'Grogol Petamburan',
  'Kalideres',
  'Kembangan',
  'Palmerah',
];

// Tarif mengikuti Perda Retribusi Nomor 1 Tahun 2024.
const TARIFF_TEMPLATE = (sportLabel, base) => [
  {
    id: 'p1',
    label: `Latihan Olahraga, Sekolah/Perguruan Tinggi, ${sportLabel}`,
    group: 'PELAJAR',
    duration: '2 Jam',
    price: base,
  },
  {
    id: 'p2',
    label: `Pertandingan Olahraga, Sekolah/Perguruan Tinggi, ${sportLabel}`,
    group: 'PELAJAR',
    duration: '2 Jam',
    price: Math.round(base * 1.75),
  },
  {
    id: 'p3',
    label: `Latihan Olahraga, Masyarakat/Instansi/Umum, ${sportLabel}`,
    group: 'MASYARAKAT',
    duration: '2 Jam',
    price: base * 3,
  },
  {
    id: 'p4',
    label: `Pertandingan Olahraga, Masyarakat/Instansi/Umum, ${sportLabel}`,
    group: 'MASYARAKAT',
    duration: '2 Jam',
    price: base * 6,
  },
  {
    id: 'p5',
    label: `Masyarakat/Instansi/Umum, Latihan hari libur, ${sportLabel}`,
    group: 'MASYARAKAT',
    duration: '2 Jam',
    price: Math.round(base * 4.5),
  },
];

const USAGE_PURPOSES = [
  'Latihan Olahraga',
  'Pertandingan Olahraga',
  'Kegiatan Sekolah',
  'Kegiatan Instansi',
  'Kegiatan Umum',
];

function sub(id, name, sport, hours) {
  return {
    id,
    name,
    sport,
    status: 'Tersedia',
    image: null,
    operationalHours: hours,
    bookingServiceHours: 'Senin – Sabtu (07:00 – 17:00)',
    playHours: 'Sesuai Jadwal Arena',
    maxCapacity: 'STANDAR',
  };
}

const DETAILS = {
  701: {
    supportFacilities: ['Parkir', 'Kantin', 'Toilet', 'Ruang Ganti'],
    contacts: [
      { label: 'Narahubung', name: 'Admin GOR Grogol', phone: 'Tidak Tersedia' },
      { label: 'Narahubung 2', name: 'Tidak Tersedia', phone: 'Tidak Tersedia' },
    ],
    subFacilities: [
      sub('bas1', 'Lapangan Bola Basket GOR Grogol', 'Bola Basket', '06:00 – 22:00'),
      sub('vol1', 'Lapangan Bola Voli GOR Grogol', 'Bola Voli', '06:00 – 22:00'),
      sub('bt1', 'Lapangan Bulu Tangkis 1 GOR Grogol', 'Bulu Tangkis', '06:00 – 22:00'),
      sub('bt2', 'Lapangan Bulu Tangkis 2 GOR Grogol', 'Bulu Tangkis', '06:00 – 22:00'),
      sub('gym1', 'Ruang Gym GOR Grogol', 'Kebugaran', '06:00 – 21:00'),
      sub('ren1', 'Kolam Renang GOR Grogol', 'Renang', '06:00 – 18:00'),
    ],
    tariffs: TARIFF_TEMPLATE('Lapangan Bola Basket', 20000),
  },
  702: {
    supportFacilities: ['Parkir', 'Kantin', 'R.Medis', 'Toilet'],
    contacts: [
      { label: 'Narahubung', name: 'Admin GOR Cendrawasih', phone: 'Tidak Tersedia' },
      { label: 'Narahubung 2', name: 'Tidak Tersedia', phone: 'Tidak Tersedia' },
    ],
    subFacilities: [
      sub('std', 'Stadion Sepak Bola Cendrawasih', 'Sepak Bola', '09:00 – 22:00'),
      sub('fut', 'Lapangan Futsal Cendrawasih', 'Futsal', '09:00 – 22:00'),
      sub('ten', 'Lapangan Tenis Cendrawasih', 'Tenis', '09:00 – 22:00'),
      sub('pan', 'Arena Panjat Dinding Cendrawasih', 'Panjat Tebing', '09:00 – 21:00'),
      sub('btc', 'GOR Bulu Tangkis Cendrawasih', 'Bulu Tangkis', '06:00 – 22:00'),
      sub('ser', 'Gedung Serbaguna Cendrawasih', 'Serbaguna', '09:00 – 22:00'),
    ],
    tariffs: TARIFF_TEMPLATE('Lapangan Futsal', 25000),
  },
  703: {
    supportFacilities: ['Parkir', 'Kantin', 'Toilet'],
    contacts: [
      { label: 'Narahubung', name: 'Admin GOR Bulutangkis', phone: '081286909079' },
      { label: 'Narahubung 2', name: 'Tidak Tersedia', phone: 'Tidak Tersedia' },
    ],
    subFacilities: [
      sub('c1', 'Lapangan Bulu Tangkis 1', 'Bulu Tangkis', '06:00 – 22:00'),
      sub('c2', 'Lapangan Bulu Tangkis 2', 'Bulu Tangkis', '06:00 – 22:00'),
      sub('c3', 'Lapangan Bulu Tangkis 3', 'Bulu Tangkis', '06:00 – 22:00'),
      sub('c4', 'Lapangan Bulu Tangkis 4', 'Bulu Tangkis', '06:00 – 22:00'),
    ],
    tariffs: TARIFF_TEMPLATE('Lapangan Bulu Tangkis', 30000),
  },
};

function buildDetail(base) {
  const extra = DETAILS[base.id] || {};
  const sportLabel = `Lapangan ${base.sport}`;

  return {
    ...base,
    banner: base.image,
    gallery: base.image ? [base.image] : [],
    bookingServiceHours: 'Senin – Sabtu (07:00 – 17:00)',
    playHours: 'Sesuai Jadwal Arena',
    maxCapacity: 'STANDAR',
    mapsQuery: `${base.name} ${base.address}`,
    supportFacilities: extra.supportFacilities || ['Parkir', 'Toilet'],
    contacts: extra.contacts || [
      { label: 'Narahubung', name: `Admin ${base.name}`, phone: base.phone || 'Tidak Tersedia' },
      { label: 'Narahubung 2', name: 'Tidak Tersedia', phone: 'Tidak Tersedia' },
    ],
    subFacilities:
      extra.subFacilities || [
        sub('a1', `Arena Utama ${base.name}`, base.sport, base.operationalHours),
        sub('a2', `Lapangan Serbaguna ${base.name}`, 'Serbaguna', base.operationalHours),
        sub('a3', `Aula ${base.name}`, 'Serbaguna', base.operationalHours),
      ],
    tariffs: extra.tariffs || TARIFF_TEMPLATE(sportLabel, base.priceFrom),
    tariffNote: 'Tarif di atas sesuai dengan Perda Retribusi Nomor 1 Tahun 2024',
    usagePurposes: USAGE_PURPOSES,
  };
}

export function getFacilityDetail(id) {
  const base = facilityList.find((f) => String(f.id) === String(id));
  return base ? buildDetail(base) : null;
}

export function formatRupiah(value) {
  return 'Rp ' + (Number(value) || 0).toLocaleString('id-ID');
}

export default { facilityList, facilityAreas, getFacilityDetail, formatRupiah };