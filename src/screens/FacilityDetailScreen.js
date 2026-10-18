import React, { useEffect, useState } from 'react';
import {View, Text, ScrollView, Pressable, Alert, Linking, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useFavorites } from '../context/FavoritesContext';
import { facilitiesApi } from '../api/facilities';
import { PrimaryButton, Divider, Loader, Notice } from '../components/common';
import { FadeInUp, PressableScale } from '../components/anim';
import SmartImage from '../components/SmartImage';
import haptic from '../utils/haptics';
import { formatDateLocal, getTomorrowLocal } from '../utils/dateLocal';
import analytics from '../utils/analytics';

// Group consecutive slots → ranges
function groupRanges(slots) {
  if (!slots || slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));
  const ranges = [];
  let cur = { start: sorted[0].start_time, end: sorted[0].end_time, price: Number(sorted[0].price || 0) };

  for (let i = 1; i < sorted.length; i++) {
    const sl = sorted[i];
    if (sl.start_time === cur.end) {
      cur.end = sl.end_time;
      cur.price += Number(sl.price || 0);
    } else {
      ranges.push(cur);
      cur = { start: sl.start_time, end: sl.end_time, price: Number(sl.price || 0) };
    }
  }
  ranges.push(cur);
  return ranges;
}

export default function FacilityDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const { isLoggedIn, user } = useAuth();
  const settings = useSettings();
  const { isFavorite, toggleFavorite } = useFavorites();
  const s = useThemedStyles(makeStyles);
  const isEn = lang === 'en';

  const facilityId = route.params?.facilityId;
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [courtsAvailability, setCourtsAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const purposes = settings.purposes || ['Latihan', 'Kompetisi'];
  const [purpose, setPurpose] = useState('Latihan');
  const isCompetition = purpose === 'Kompetisi';

  const [endDate, setEndDate] = useState(null);
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedSlotsByCourt, setSelectedSlotsByCourt] = useState({});

  const dayCount = (() => {
    if (!isCompetition) return 1;
    if (!endDate) return 1;
    const diff = Math.ceil((endDate.getTime() - selectedDate.getTime()) / 86400000) + 1;
    return diff > 0 ? diff : 1;
  })();

  const favorite = isFavorite(facilityId);

  useEffect(() => {
    (async () => {
      try {
        const res = await facilitiesApi.detail(facilityId);
        setFacility(res.facility);
        analytics.logEvent('facility_view', { facility_id: facilityId, name: res.facility?.name });
      } catch (e) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [facilityId]);

  useEffect(() => {
    if (isCompetition) return;
    if (!selectedDate || !facilityId) return;

    // ✅ Cancelled guard — hindari race condition
    let cancelled = false;

    (async () => {
      setAvailabilityLoading(true);
      try {
        const dateStr = formatDateLocal(selectedDate);
        console.log('[Availability] Fetch:', facilityId, dateStr);

        const res = await facilitiesApi.availability(facilityId, dateStr);

        if (cancelled) {
          console.log('[Availability] Ignored stale:', dateStr);
          return;
        }

        setCourtsAvailability(res.courts || []);
        setSelectedSlotsByCourt({});
      } catch (e) {
        if (cancelled) return;
        console.warn('[FacilityDetail] Availability error:', e.message);
        setCourtsAvailability([]);
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, facilityId, isCompetition]);

  useEffect(() => {
    if (isCompetition) {
      setSelectedSlotsByCourt({});
    } else {
      setEndDate(null);
      setSelectedSports([]);
    }
  }, [purpose]);

  useEffect(() => {
    if (isCompetition && selectedSports.length === 0) {
      const firstSport = facility?.courts?.[0]?.sport_type;
      if (firstSport) setSelectedSports([firstSport]);
    }
  }, [isCompetition, facility?.courts]);

  const toggleSport = (value) => {
    haptic.selection();
    setSelectedSports((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const loadSuggestions = async () => {
    if (!selectedDate || !facility) return;
    const sportType = facility.courts?.[0]?.sport_type;
    if (!sportType) return;

    haptic.light();
    try {
      const res = await facilitiesApi.suggestions({
        date: formatDateLocal(selectedDate),
        start_time: '08:00',
        end_time: '10:00',
        sport_type: sportType,
        exclude_facility_id: facility.id,
      });
      const raw = res.suggestions || [];
      const seen = new Set();
      const unique = raw.filter((item) => {
        const key = item.court?.id ? `court-${item.court.id}` : `${item.court?.name}-${item.court?.facility_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setSuggestions(unique);
      setShowSuggestions(true);
    } catch (e) {
      Alert.alert('Gagal', e.message || 'Tidak bisa memuat saran GOR.');
    }
  };

  const nextDays = (count) => {
    const out = [];
    const now = new Date();
    // i = 0 artinya mulai dari HARI INI
    for (let i = 0; i < count; i++) {
      out.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
    }
    return out;
  };

  const toggleSlot = (courtId, slot) => {
    if (!slot.available) return;
    haptic.selection();
    setSelectedSlotsByCourt((prev) => {
      const list = prev[courtId] || [];
      const exists = list.find((sl) => sl.start_time === slot.start_time);
      let next;
      if (exists) {
        // Kalau klik slot yang sama, batal pilih
        next = [];
      } else {
        // Hanya boleh 1 slot: replace list dengan slot baru
        next = [{ start_time: slot.start_time, end_time: slot.end_time, price: Number(slot.price || 0) }];
      }
      return { ...prev, [courtId]: next };
    });
  };

  const isSlotSelected = (courtId, slot) => {
    const list = selectedSlotsByCourt[courtId] || [];
    return list.some((sl) => sl.start_time === slot.start_time);
  };

  const getCourtData = (courtId) => {
    const list = selectedSlotsByCourt[courtId] || [];
    if (list.length === 0) return null;
    const ranges = groupRanges(list);
    const totalPrice = ranges.reduce((sum, r) => sum + r.price, 0);
    const totalHours = ranges.reduce((sum, r) => {
      const parse = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
      return sum + (parse(r.end) - parse(r.start)) / 60;
    }, 0);
    return { ranges, totalPrice, totalHours, slotCount: list.length };
  };

  const goToBooking = (court) => {
    const data = getCourtData(court.id);
    if (!data) return;

    const bookingParams = {
      facility: { id: facility.id, name: facility.name },
      court: {
        id: court.id, name: court.name, sport_type: court.sport_type,
        open_time: court.open_time, close_time: court.close_time,
        facility: { id: facility.id, name: facility.name },
      },
      defaultDate: formatDateLocal(selectedDate),
      selectedSlots: selectedSlotsByCourt[court.id] || [],
      ranges: data.ranges,
      totalPrice: data.totalPrice,
      totalHours: data.totalHours,
      slotCount: data.slotCount,
      purpose: 'Latihan',
    };

    if (!isLoggedIn) {
      return navigation.navigate('Login', { returnTo: 'BookingForm', returnParams: bookingParams });
    }
    haptic.light();
    navigation.navigate('BookingForm', bookingParams);
  };

  const goToHelpdeskKompetisi = () => {
    if (selectedSports.length === 0) {
      return Alert.alert(
        isEn ? 'Select Sport' : 'Pilih Cabor',
        isEn ? 'Please select at least 1 sport.' : 'Pilih minimal 1 cabor untuk kompetisi.'
      );
    }
    if (!endDate) {
      return Alert.alert(
        isEn ? 'Select End Date' : 'Pilih Tanggal Selesai',
        isEn ? 'Please select end date first.' : 'Silakan pilih tanggal selesai dulu.'
      );
    }

    const caborLabels = selectedSports
      .map((v) => (settings.sportLabel ? settings.sportLabel(v) : v))
      .join(', ') || '-';

    const message = isEn
      ? `Hello Helpdesk,\n\nI want to consult about a competition booking:\n\n• Facility: ${facility.name}\n• Address: ${facility.address || '-'}\n• Sports: ${caborLabels}\n• Start Date: ${formatDateLocal(selectedDate)}\n• End Date: ${endDate.toISOString().slice(0, 10)}\n• Total Days: ${dayCount} days\n• Name: ${user?.name || '-'}\n\nPlease assist.`
      : `Halo Helpdesk,\n\nSaya ingin konsultasi pemesanan kompetisi:\n\n• Fasilitas: ${facility.name}\n• Alamat: ${facility.address || '-'}\n• Cabor: ${caborLabels}\n• Tanggal Mulai: ${formatDateLocal(selectedDate)}\n• Tanggal Selesai: ${endDate.toISOString().slice(0, 10)}\n• Total Hari: ${dayCount} hari\n• Nama: ${user?.name || '-'}\n\nMohon dibantu. Terima kasih.`;

    if (!isLoggedIn) {
      return navigation.navigate('Login', { returnTo: 'Chat', returnParams: { prefill: message } });
    }
    haptic.light();
    navigation.navigate('Chat', { prefill: message });
  };

  const goToWhatsAppKompetisi = () => {
    if (selectedSports.length === 0) {
      return Alert.alert(
        isEn ? 'Select Sport' : 'Pilih Cabor',
        isEn ? 'Please select at least 1 sport.' : 'Pilih minimal 1 cabor untuk kompetisi.'
      );
    }
    if (!endDate) {
      return Alert.alert(
        isEn ? 'Select End Date' : 'Pilih Tanggal Selesai',
        isEn ? 'Please select end date first.' : 'Silakan pilih tanggal selesai dulu.'
      );
    }

    const caborLabels = selectedSports
      .map((v) => (settings.sportLabel ? settings.sportLabel(v) : v))
      .join(', ') || '-';

    const message = isEn
      ? `Hello GJB Helpdesk,\n\nI want to consult about a competition booking:\n\n• Facility: ${facility.name}\n• Address: ${facility.address || '-'}\n• Sports: ${caborLabels}\n• Start Date: ${formatDateLocal(selectedDate)}\n• End Date: ${endDate.toISOString().slice(0, 10)}\n• Total Days: ${dayCount} days\n• Name: ${user?.name || '-'}\n\nPlease assist.`
      : `Halo Helpdesk GJB,\n\nSaya ingin konsultasi pemesanan kompetisi:\n\n• Fasilitas: ${facility.name}\n• Alamat: ${facility.address || '-'}\n• Cabor: ${caborLabels}\n• Tanggal Mulai: ${formatDateLocal(selectedDate)}\n• Tanggal Selesai: ${endDate.toISOString().slice(0, 10)}\n• Total Hari: ${dayCount} hari\n• Nama: ${user?.name || '-'}\n\nMohon dibantu. Terima kasih.`;

    // ✅ Pakai facility.whatsapp_url dulu, fallback ke settings
    let waUrl = facility?.whatsapp_url;

    if (!waUrl) {
      const waNumber = settings.whatsappUrl
        ? String(settings.whatsappUrl).replace(/\D/g, '')
        : (settings.contact?.whatsapp ? String(settings.contact.whatsapp).replace(/\D/g, '') : null);
      if (!waNumber) {
        Alert.alert('WhatsApp belum tersedia', 'Admin belum mengisi nomor WhatsApp untuk GOR ini.');
        return;
      }
      waUrl = `https://wa.me/${waNumber}`;
    }

    const url = `${waUrl}?text=${encodeURIComponent(message)}`;
    haptic.light();
    Linking.openURL(url).catch(() => {});
  };

  const onToggleFavorite = () => {
    haptic.light();
    toggleFavorite(facilityId);
  };

  if (loading) return <Loader />;
  if (!facility) {
    return (
      <View style={s.screen}>
        <Text style={{ color: colors.text }}>Fasilitas tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* Banner */}
      <View style={s.banner}>
        <SmartImage uri={facility.image_url} style={s.bannerImage} icon="business-outline" label={facility.name} />
        <LinearGradient
          colors={['rgba(11,12,16,0.15)', 'rgba(11,12,16,0.55)', 'rgba(11,12,16,0.92)']}
          style={{ position: 'absolute', inset: 0 }}
        />
        <Pressable onPress={onToggleFavorite} style={s.favBtn} hitSlop={8}>
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={22} color={favorite ? colors.primary : '#FFFFFF'} />
        </Pressable>
        <View style={s.bannerBody}>
          <Text style={s.bannerBadge}>{facility.status === 'coming_soon' ? 'SEGERA HADIR' : 'E-BOOKING'}</Text>
          <Text style={s.bannerTitle}>{facility.name}</Text>
          <View style={s.bannerAddrRow}>
            <Ionicons name="location" size={13} color="#D5D9E4" />
            <Text style={s.bannerAddr}>{facility.address}</Text>
          </View>
        </View>
      </View>

      {/* Info */}
      <View style={s.infoCard}>
        <Text style={s.infoTitle}>{facility.name}</Text>
        <Text style={s.infoDesc}>{facility.description || '-'}</Text>
        <Divider style={{ marginVertical: spacing.md }} />
        <View style={s.infoRow}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={s.infoText}>{facility.operational_hours || 'Setiap hari, 08:00-22:00'}</Text>
        </View>
      </View>

      {/* ✅ Galeri Foto */}
      {facility.gallery_urls && facility.gallery_urls.length > 0 ? (
        <>
          <Text style={s.sectionTitle}>
            {isEn ? 'PHOTO GALLERY' : 'GALERI FOTO'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
          >
            {facility.gallery_urls.map((url, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  haptic.light();
                  setSelectedImage(url);
                }}
                style={s.galleryItem}
              >
                <SmartImage
                  uri={url}
                  style={s.galleryImage}
                  icon="image-outline"
                  showLoader={false}
                />
                <View style={s.galleryIndexBadge}>
                  <Text style={s.galleryIndexText}>
                    {idx + 1}/{facility.gallery_urls.length}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}


      {/* PURPOSE */}
      <Text style={s.sectionTitle}>{isEn ? 'PURPOSE' : 'TUJUAN PENGGUNAAN'}</Text>
      <View style={s.purposeRow}>
        {purposes.map((p) => {
          const active = purpose === p;
          return (
            <Pressable
              key={p}
              onPress={() => { haptic.selection(); setPurpose(p); }}
              style={[s.purposeChip, active && s.purposeChipActive]}
            >
              <Ionicons
                name={p === 'Kompetisi' ? 'trophy-outline' : 'barbell-outline'}
                size={16}
                color={active ? colors.onPrimary : colors.textMuted}
              />
              <Text style={[s.purposeText, active && s.purposeTextActive]}>{p}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* TANGGAL MULAI */}
      <Text style={[s.sectionTitle, { marginTop: spacing.xl }]}>
        {isCompetition
          ? (isEn ? 'START DATE' : 'TANGGAL MULAI')
          : (isEn ? 'PICK A DATE' : 'PILIH TANGGAL')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}>
        {nextDays(14).map((d) => {
          const active = selectedDate && d.toDateString() === selectedDate.toDateString();
          return (
            <Pressable
              key={d.toISOString()}
              onPress={() => {
                haptic.selection();
                setSelectedDate(d);
                if (endDate && endDate <= d) setEndDate(null);
              }}
              style={[s.dateCell, active && s.dateCellActive]}
            >
              <Text style={[s.dateDow, active && { color: colors.onPrimary }]}>
                {d.toLocaleDateString('id-ID', { weekday: 'short' })}
              </Text>
              <Text style={[s.dateNum, active && { color: colors.onPrimary }]}>{d.getDate()}</Text>
              <Text style={[s.dateMon, active && { color: colors.onPrimary }]}>
                {d.toLocaleDateString('id-ID', { month: 'short' })}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isCompetition ? (
        <>
          <Text style={[s.sectionTitle, { marginTop: spacing.xl }]}>
            {isEn ? 'SPORTS (MULTI-SELECT)' : 'CABOR (BISA PILIH BANYAK)'}
          </Text>
          <View style={s.sportGrid}>
            {(settings.sportTypes || []).map((sp) => {
              const active = selectedSports.includes(sp.value);
              return (
                <Pressable
                  key={sp.value}
                  onPress={() => toggleSport(sp.value)}
                  style={[s.sportChip, active && s.sportChipActive]}
                >
                  <Ionicons name={active ? 'checkbox' : 'square-outline'} size={18} color={active ? colors.onPrimary : colors.textMuted} />
                  <Text style={[s.sportChipText, active && s.sportChipTextActive]}>{sp.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[s.sectionTitle, { marginTop: spacing.xl }]}>
            {isEn ? 'END DATE' : 'TANGGAL SELESAI'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}>
            {nextDays(30).filter((d) => d > selectedDate).map((d) => {
              const active = endDate && endDate.toDateString() === d.toDateString();
              return (
                <Pressable
                  key={d.toISOString()}
                  onPress={() => { haptic.selection(); setEndDate(d); }}
                  style={[s.dateCell, active && s.dateCellActive]}
                >
                  <Text style={[s.dateDow, active && { color: colors.onPrimary }]}>
                    {d.toLocaleDateString('id-ID', { weekday: 'short' })}
                  </Text>
                  <Text style={[s.dateNum, active && { color: colors.onPrimary }]}>{d.getDate()}</Text>
                  <Text style={[s.dateMon, active && { color: colors.onPrimary }]}>
                    {d.toLocaleDateString('id-ID', { month: 'short' })}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {endDate ? (
            <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
              <Notice
                text={isEn ? `Total: ${dayCount} day(s)` : `Total: ${dayCount} hari`}
                tone="gold"
                icon="information-circle-outline"
              />
            </View>
          ) : null}

          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
            <PrimaryButton
              label={isEn ? 'Consult with Helpdesk GJB' : 'Konsultasi dengan Helpdesk GJB'}
              icon="chatbubble-ellipses-outline"
              onPress={goToHelpdeskKompetisi}
            />
            <PrimaryButton
              label={isEn ? 'Chat via WhatsApp' : 'Chat via WhatsApp'}
              variant="ghost"
              icon="logo-whatsapp"
              onPress={goToWhatsAppKompetisi}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </>
      ) : (
        <>
          <Text style={[s.sectionTitle, { marginTop: spacing.xl }]}>
            {isEn ? 'AVAILABLE SLOTS' : 'SLOT TERSEDIA'}
          </Text>
          <Text style={[s.hint, { paddingHorizontal: spacing.lg, marginBottom: spacing.sm }]}>
            {isEn
              ? 'Tap to select 1 slot.'
              : 'Tap untuk pilih 1 slot.'}
          </Text>

          {availabilityLoading ? (
            <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : courtsAvailability.length === 0 ? (
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Notice text={isEn ? 'No schedule available.' : 'Jadwal belum tersedia.'} tone="primary" icon="information-circle-outline" />
            </View>
          ) : (
            courtsAvailability.map((item) => {
              const data = getCourtData(item.court?.id);
              return (
                <View key={item.court?.id} style={s.courtBlock}>
                  <View style={s.courtHeader}>
                    <Ionicons name="football-outline" size={16} color={colors.primary} />
                    <Text style={s.courtName}>{item.court?.name}</Text>
                    <Text style={s.courtSport}>{item.court?.sport_type}</Text>
                  </View>
                  <View style={s.slotsGrid}>
                    {(item.slots || []).map((slot) => {
                      const active = isSlotSelected(item.court?.id, slot);
                      const isAreaInUse = slot.status === 'area_in_use';
                      const disabled = !slot.available;
                      // ✅ area_in_use tetap bisa di-tap (buat kasih info)
                      const trulyDisabled = disabled && !isAreaInUse;
                      return (
                        <Pressable
                          key={slot.start_time}
                          disabled={trulyDisabled}
                          onPress={() => {
                            if (isAreaInUse) {
                              Alert.alert(
                                isEn ? 'Area In Use' : 'Area Sedang Dipakai',
                                slot.message ||
                                  (isEn
                                    ? 'This area is used by another sport at the same hour. Please choose another time or court.'
                                    : 'Area ini sedang dipakai cabor lain di jam yang sama. Silakan pilih jam atau lapangan lain.'),
                                [{ text: 'OK' }]
                              );
                              return;
                            }
                            toggleSlot(item.court?.id, slot);
                          }}
                          style={[s.slot, active && s.slotActive, disabled && s.slotDisabled]}
                        >
                          {active ? (
                            <Ionicons name="checkmark-circle" size={14} color={colors.onPrimary} style={{ marginBottom: 2 }} />
                          ) : null}
                          <Text style={[s.slotText, active && { color: colors.onPrimary }, disabled && s.slotTextDisabled]}>
                            {slot.start_time}
                          </Text>
                          <Text style={[s.slotSub, active && { color: colors.onPrimary }, disabled && s.slotTextDisabled]} numberOfLines={1}>
                            {disabled
                              ? (slot.status === 'booked' ? (isEn ? 'Booked' : 'Terisi')
                                : slot.status === 'area_in_use' ? (isEn ? 'In Use' : 'Dipakai')
                                : slot.status === 'past' ? (isEn ? 'Past' : 'Lewat')
                                : (isEn ? 'Blocked' : 'Diblok'))
                              : `Rp ${Number(slot.price || 0).toLocaleString('id-ID')}`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {data ? (
                    <>
                      <View style={s.summaryBox}>
                        <Ionicons name="list-outline" size={20} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                          {data.ranges.map((r, i) => (
                            <Text key={i} style={s.summaryRange}>
                              • {r.start} - {r.end}
                            </Text>
                          ))}
                          <Text style={s.summaryHint}>
                            {data.slotCount} slot · {data.totalHours} jam · {data.ranges.length} sesi
                          </Text>
                          <Text style={s.summaryPrice}>
                            Rp {Number(data.totalPrice).toLocaleString('id-ID')}
                          </Text>
                        </View>
                      </View>

                      <PrimaryButton
                        label={isEn ? 'Book Now' : 'Buat Booking'}
                        icon="arrow-forward"
                        onPress={() => goToBooking(item.court)}
                        style={{ marginTop: spacing.md }}
                      />
                    </>
                  ) : null}
                </View>
              );
            })
          )}

          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
            <PrimaryButton
              label={isEn ? 'Find Other GOR' : 'Cari GOR Lain'}
              variant="ghost"
              icon="search-outline"
              onPress={loadSuggestions}
            />
          </View>
        </>
      )}

      {showSuggestions && suggestions.length > 0 ? (
        <>
          <Text style={[s.sectionTitle, { marginTop: spacing.xl }]}>
            {isEn ? 'OTHER GOR SUGGESTIONS' : 'SARAN GOR LAIN'}
          </Text>
          {suggestions.map((item, idx) => (
            <FadeInUp key={idx} delay={idx * 60}>
              <PressableScale
                onPress={() => navigation.navigate('FacilityDetail', { facilityId: item.court?.facility_id })}
                style={s.suggestionCard}
                scaleTo={0.96}
              >
                <View style={s.suggestionIcon}>
                  <Ionicons name="business-outline" size={20} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.suggestionName} numberOfLines={1}>{item.court?.name}</Text>
                  <Text style={s.suggestionFacility} numberOfLines={1}>
                    {item.court?.facility?.name || item.facility?.name || '-'}
                  </Text>
                  <Text style={s.suggestionMeta} numberOfLines={1}>
                    {item.court?.sport_type} · Rp {Number(item.total_amount || 0).toLocaleString('id-ID')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </PressableScale>
            </FadeInUp>
          ))}
        </>
      ) : null}

      <View style={s.contactCard}>
      {/* ✅ Fasilitas Pendukung */}
      {facility.amenities && facility.amenities.length > 0 ? (
        <>
          <Text style={[s.sectionTitle, { marginTop: spacing.xl }]}>
            {isEn ? 'FACILITIES & AMENITIES' : 'FASILITAS PENDUKUNG'}
          </Text>
          <View style={s.amenitiesGrid}>
            {facility.amenities.map((am, idx) => (
              <View key={idx} style={s.amenityCard}>
                <View style={s.amenityIconBox}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.amenityName}>{am.name}</Text>
                  {am.description ? (
                    <Text style={s.amenityDesc}>{am.description}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}


        <Text style={s.sectionTitle}>{isEn ? 'LOCATION' : 'LOKASI'}</Text>

        {/* ✅ WA Fasilitas */}
        {(facility.whatsapp_url || facility.whatsapp) ? (
          <View style={s.contactRow}>
            <Ionicons name="logo-whatsapp" size={16} color={colors.success} />
            <Text style={s.contactText}>
              {facility.whatsapp || (isEn ? 'WhatsApp Available' : 'WhatsApp Tersedia')}
            </Text>
          </View>
        ) : null}
        {settings.contact?.phone ? (
          <View style={s.contactRow}>
            <Ionicons name="call-outline" size={16} color={colors.primary} />
            <Text style={s.contactText}>{settings.contact.phone}</Text>
          </View>
        ) : null}
        <View style={s.contactRow}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={s.contactText}>{facility.address}</Text>
        </View>
        {facility.maps_url ? (
          <PrimaryButton
            label={isEn ? 'Open in Maps' : 'Buka di Maps'}
            variant="ghost"
            icon="open-outline"
            onPress={() => Linking.openURL(facility.maps_url).catch(() => {})}
            style={{ marginTop: spacing.md }}
          />
        ) : null}

        {/* ✅ Tombol Hubungi via WhatsApp Fasilitas */}
        {facility.whatsapp_url ? (
          <PrimaryButton
            label={isEn ? 'Contact via WhatsApp' : 'Hubungi via WhatsApp'}
            icon="logo-whatsapp"
            onPress={() => {
              haptic.light();
              const msg = isEn
                ? `Hello ${facility.name},\n\nI want to ask about facilities/booking.\n\nName: ${user?.name || '-'}`
                : `Halo ${facility.name},\n\nSaya ingin tanya tentang fasilitas/booking.\n\nNama: ${user?.name || '-'}`;
              const url = `${facility.whatsapp_url}?text=${encodeURIComponent(msg)}`;
              Linking.openURL(url).catch(() => {});
            }}
            style={{ marginTop: spacing.sm }}
          />
        ) : null}
      </View>
      {/* ✅ Modal Full Screen Gallery */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={s.modalBg}>
          <Pressable
            onPress={() => setSelectedImage(null)}
            style={s.modalClose}
            hitSlop={12}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>
          {selectedImage ? (
            <SmartImage
              uri={selectedImage}
              style={s.modalImage}
              icon="image-outline"
              showLoader={true}
            />
          ) : null}
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: spacing.xxl * 2 },
  banner: { height: 220, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.surfaceAlt, justifyContent: 'flex-end' },
  bannerImage: { position: 'absolute', width: '100%', height: '100%' },
  favBtn: { position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  bannerBody: { padding: spacing.lg, gap: 6 },
  bannerBadge: { alignSelf: 'flex-start', backgroundColor: c.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, color: c.onPrimary, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, overflow: 'hidden' },
  bannerTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
  bannerAddrRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bannerAddr: { fontSize: 12, color: '#D5D9E4', flex: 1 },
  infoCard: { margin: spacing.lg, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, padding: spacing.lg },

  amenitiesGrid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  amenityCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line,
  },
  amenityIconBox: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: (c.success || '#22C55E') + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  amenityName: { ...t.subtitle, fontSize: 13, fontWeight: '800' },
  amenityDesc: { ...t.small, fontSize: 11, marginTop: 2, lineHeight: 16 },
  galleryIndexBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
  },
  galleryIndexText: {
    color: '#FFFFFF', fontSize: 10, fontWeight: '900',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalClose: {
    position: 'absolute', top: 40, right: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  modalImage: {
    width: '90%', height: '70%',
    borderRadius: radius.md,
  },
  galleryItem: {
    width: 180, height: 120, borderRadius: radius.md,
    overflow: 'hidden', backgroundColor: c.surfaceAlt,
    borderWidth: 1, borderColor: c.line,
  },
  galleryImage: { width: '100%', height: '100%' },
  infoTitle: { ...t.title, fontSize: 20 },
  infoDesc: { ...t.body, marginTop: spacing.sm, fontSize: 13 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { ...t.body, fontSize: 13 },
  sectionTitle: { ...t.subtitle, fontSize: 14, fontWeight: '900', letterSpacing: 0.6, paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.md },
  hint: { ...t.small, fontSize: 11 },
  purposeRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  purposeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  purposeChipActive: { backgroundColor: c.primary, borderColor: c.primary },
  purposeText: { color: c.textMuted, fontSize: 13, fontWeight: '700' },
  purposeTextActive: { color: c.onPrimary, fontWeight: '800' },
  sportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg },
  sportChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  sportChipActive: { backgroundColor: c.primary, borderColor: c.primary },
  sportChipText: { color: c.text, fontSize: 13, fontWeight: '700' },
  sportChipTextActive: { color: c.onPrimary, fontWeight: '800' },
  dateCell: { width: 58, paddingVertical: spacing.md, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.base },
  dateCellActive: { backgroundColor: c.primary, borderColor: c.primary },
  dateDow: { ...t.small, fontSize: 10, textTransform: 'uppercase' },
  dateNum: { color: c.text, fontSize: 18, fontWeight: '900' },
  dateMon: { ...t.small, fontSize: 10 },
  courtBlock: { marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: spacing.lg },
  courtHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  courtName: { ...t.subtitle, fontSize: 14, flex: 1 },
  courtSport: { ...t.small, fontSize: 11, textTransform: 'capitalize' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: { width: '31%', paddingVertical: spacing.md, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.base, gap: 2 },
  slotActive: { backgroundColor: c.primary, borderColor: c.primary },
  slotDisabled: { backgroundColor: c.surfaceAlt, opacity: 0.5 },
  slotText: { ...t.subtitle, fontSize: 13, fontWeight: '900' },
  slotTextDisabled: { textDecorationLine: 'line-through' },
  slotSub: { ...t.small, fontSize: 9 },
  summaryBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md, backgroundColor: c.primarySoft, borderRadius: radius.md, borderWidth: 2, borderColor: c.primary, marginTop: spacing.md },
  summaryRange: { ...t.body, fontSize: 13, fontWeight: '700', color: c.primary, lineHeight: 19 },
  summaryHint: { ...t.small, fontSize: 11, marginTop: 4 },
  summaryPrice: { ...t.subtitle, fontSize: 14, fontWeight: '900', color: c.primary, marginTop: 4 },
  suggestionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: spacing.md },
  suggestionIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: c.goldSoft, alignItems: 'center', justifyContent: 'center' },
  suggestionName: { ...t.subtitle, fontSize: 14 },
  suggestionMeta: { ...t.small, fontSize: 11, marginTop: 2 },
  suggestionFacility: { fontSize: 11, fontWeight: '700', color: c.primary, marginTop: 2 },
  contactCard: { margin: spacing.lg, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, padding: spacing.lg, gap: spacing.sm },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  contactText: { ...t.body, flex: 1, fontSize: 13 },
});
