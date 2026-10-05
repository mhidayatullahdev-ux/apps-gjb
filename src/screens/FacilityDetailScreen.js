import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, Linking, ActivityIndicator,
} from 'react-native';
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
import analytics from '../utils/analytics';

export default function FacilityDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const { isLoggedIn } = useAuth();
  const settings = useSettings();
  const { isFavorite, toggleFavorite } = useFavorites();
  const s = useThemedStyles(makeStyles);
  const isEn = lang === 'en';

  const facilityId = route.params?.facilityId;
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default besok
    return d;
  });
  const [courtsAvailability, setCourtsAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const favorite = isFavorite(facilityId);

  // Load detail facility
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

  // Load availability saat tanggal dipilih
  useEffect(() => {
    if (!selectedDate || !facilityId) return;
    (async () => {
      setAvailabilityLoading(true);
      try {
        const res = await facilitiesApi.availability(
          facilityId,
          selectedDate.toISOString().slice(0, 10)
        );
        setCourtsAvailability(res.courts || []);
      } catch (e) {
        console.warn('[FacilityDetail] Availability error:', e.message);
        setCourtsAvailability([]);
      } finally {
        setAvailabilityLoading(false);
      }
    })();
  }, [selectedDate, facilityId]);

  // Load suggestions
  const loadSuggestions = async () => {
    if (!selectedDate || !facility) return;
    const sportType = facility.courts?.[0]?.sport_type;
    if (!sportType) return;

    haptic.light();
    try {
      const res = await facilitiesApi.suggestions({
        date: selectedDate.toISOString().slice(0, 10),
        start_time: '08:00',
        end_time: '10:00',
        sport_type: sportType,
        exclude_facility_id: facility.id,
      });

      // ✅ DEDUPE — buang duplikat berdasarkan court.id
      const raw = res.suggestions || [];
      const seen = new Set();
      const unique = raw.filter((item) => {
        const key = item.court?.id
          ? `court-${item.court.id}`
          : `${item.court?.name || ''}-${item.court?.facility_id || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setSuggestions(unique);
      setShowSuggestions(true);
      analytics.logEvent('suggestions_viewed', {
        facility_id: facility.id,
        total: unique.length,
      });
    } catch (e) {
      Alert.alert('Gagal', e.message || 'Tidak bisa memuat saran GOR.');
    }
  };

  const nextDays = (count) => {
    const out = [];
    const now = new Date();
    for (let i = 1; i <= count; i++) {
      out.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
    }
    return out;
  };

  const openBooking = (court, slot) => {
    const bookingParams = {
      facility: { id: facility.id, name: facility.name },
      court: {
        id: court.id,
        name: court.name,
        sport_type: court.sport_type,
        facility: { id: facility.id, name: facility.name },
      },
      defaultDate: selectedDate.toISOString().slice(0, 10),
      defaultStart: slot?.start_time,
      defaultEnd: slot?.end_time,
      purpose: 'Latihan',
    };

    if (!isLoggedIn) {
      return navigation.navigate('Login', {
        returnTo: 'BookingForm',
        returnParams: bookingParams,
      });
    }
    haptic.light();
    navigation.navigate('BookingForm', bookingParams);
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
        <SmartImage
          uri={facility.image_url}
          style={s.bannerImage}
          icon="business-outline"
          label={facility.name}
        />
        <LinearGradient
          colors={['rgba(11,12,16,0.15)', 'rgba(11,12,16,0.55)', 'rgba(11,12,16,0.92)']}
          style={{ position: 'absolute', inset: 0 }}
        />

        {/* ✅ Favorite button */}
        <Pressable onPress={onToggleFavorite} style={s.favBtn} hitSlop={8}>
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={22}
            color={favorite ? colors.primary : '#FFFFFF'}
          />
        </Pressable>

        <View style={s.bannerBody}>
          <Text style={s.bannerBadge}>
            {facility.status === 'coming_soon' ? 'SEGERA HADIR' : 'E-BOOKING'}
          </Text>
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

      {/* Pilih tanggal */}
      <Text style={s.sectionTitle}>{isEn ? 'PICK A DATE' : 'PILIH TANGGAL'}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
      >
        {nextDays(14).map((d) => {
          const active = selectedDate && d.toDateString() === selectedDate.toDateString();
          return (
            <Pressable
              key={d.toISOString()}
              onPress={() => {
                haptic.selection();
                setSelectedDate(d);
              }}
              style={[s.dateCell, active && s.dateCellActive]}
            >
              <Text style={[s.dateDow, active && { color: colors.onPrimary }]}>
                {d.toLocaleDateString('id-ID', { weekday: 'short' })}
              </Text>
              <Text style={[s.dateNum, active && { color: colors.onPrimary }]}>
                {d.getDate()}
              </Text>
              <Text style={[s.dateMon, active && { color: colors.onPrimary }]}>
                {d.toLocaleDateString('id-ID', { month: 'short' })}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Availability Grid */}
      {selectedDate ? (
        <>
          <Text style={[s.sectionTitle, { marginTop: spacing.xl }]}>
            {isEn ? 'AVAILABLE SLOTS' : 'SLOT TERSEDIA'}
          </Text>

          {availabilityLoading ? (
            <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : courtsAvailability.length === 0 ? (
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Notice
                text={isEn ? 'No schedule available.' : 'Jadwal belum tersedia.'}
                tone="primary"
                icon="information-circle-outline"
              />
            </View>
          ) : (
            courtsAvailability.map((item) => (
              <View key={item.court?.id} style={s.courtBlock}>
                <View style={s.courtHeader}>
                  <Ionicons name="football-outline" size={16} color={colors.primary} />
                  <Text style={s.courtName}>{item.court?.name}</Text>
                  <Text style={s.courtSport}>{item.court?.sport_type}</Text>
                </View>
                <View style={s.slotsGrid}>
                  {(item.slots || []).map((slot) => {
                    const available = slot.available && slot.status === 'available';
                    return (
                      <Pressable
                        key={slot.start_time}
                        disabled={!available}
                        onPress={() => openBooking(item.court, slot)}
                        style={[s.slot, !available && s.slotDisabled]}
                      >
                        <Text style={[s.slotText, !available && s.slotTextDisabled]}>
                          {slot.start_time}
                        </Text>
                        <Text
                          style={[s.slotSub, !available && s.slotTextDisabled]}
                          numberOfLines={1}
                        >
                          {available
                            ? `Rp ${Number(slot.price || 0).toLocaleString('id-ID')}`
                            : (slot.status === 'booked' ? (isEn ? 'Booked' : 'Terisi')
                              : slot.status === 'area_in_use' ? (isEn ? 'In Use' : 'Dipakai')
                              : slot.status === 'past' ? (isEn ? 'Past' : 'Lewat')
                              : (isEn ? 'Blocked' : 'Diblok'))}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          )}

          {/* Tombol cari GOR lain */}
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
            <PrimaryButton
              label={isEn ? 'Find Other GOR' : 'Cari GOR Lain'}
              variant="ghost"
              icon="search-outline"
              onPress={loadSuggestions}
            />
          </View>
        </>
      ) : null}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 ? (
        <>
          <Text style={[s.sectionTitle, { marginTop: spacing.xl }]}>
            {isEn ? 'OTHER GOR SUGGESTIONS' : 'SARAN GOR LAIN'}
          </Text>
          {suggestions.map((item, idx) => (
            <FadeInUp key={idx} delay={idx * 60}>
              <PressableScale
                onPress={() =>
                  navigation.navigate('FacilityDetail', {
                    facilityId: item.court?.facility_id,
                  })
                }
                style={s.suggestionCard}
                scaleTo={0.96}
              >
                <View style={s.suggestionIcon}>
                  <Ionicons name="business-outline" size={20} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.suggestionName} numberOfLines={1}>
                    {item.court?.name}
                  </Text>
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

      {/* Kontak */}
      <View style={s.contactCard}>
        <Text style={s.sectionTitle}>{isEn ? 'CONTACT & LOCATION' : 'KONTAK & LOKASI'}</Text>
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
      </View>
    </ScrollView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: spacing.xxl * 2 },

  banner: {
    height: 220, marginHorizontal: spacing.lg, marginTop: spacing.md,
    borderRadius: radius.lg, overflow: 'hidden',
    backgroundColor: c.surfaceAlt, justifyContent: 'flex-end',
  },
  bannerImage: { position: 'absolute', width: '100%', height: '100%' },
  favBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bannerBody: { padding: spacing.lg, gap: 6 },
  bannerBadge: {
    alignSelf: 'flex-start', backgroundColor: c.primary,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.sm, color: c.onPrimary,
    fontSize: 10, fontWeight: '900', letterSpacing: 0.8, overflow: 'hidden',
  },
  bannerTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
  bannerAddrRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bannerAddr: { fontSize: 12, color: '#D5D9E4', flex: 1 },

  infoCard: {
    margin: spacing.lg, backgroundColor: c.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: c.line,
    padding: spacing.lg,
  },
  infoTitle: { ...t.title, fontSize: 20 },
  infoDesc: { ...t.body, marginTop: spacing.sm, fontSize: 13 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { ...t.body, fontSize: 13 },

  sectionTitle: {
    ...t.subtitle, fontSize: 14, fontWeight: '900',
    letterSpacing: 0.6, paddingHorizontal: spacing.lg,
    marginTop: spacing.lg, marginBottom: spacing.md,
  },

  dateCell: {
    width: 58, paddingVertical: spacing.md, alignItems: 'center',
    borderRadius: radius.md, borderWidth: 1,
    borderColor: c.line, backgroundColor: c.base,
  },
  dateCellActive: { backgroundColor: c.primary, borderColor: c.primary },
  dateDow: { ...t.small, fontSize: 10, textTransform: 'uppercase' },
  dateNum: { color: c.text, fontSize: 18, fontWeight: '900' },
  dateMon: { ...t.small, fontSize: 10 },

  courtBlock: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line, padding: spacing.lg,
  },
  courtHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.md,
  },
  courtName: { ...t.subtitle, fontSize: 14, flex: 1 },
  courtSport: { ...t.small, fontSize: 11, textTransform: 'capitalize' },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    width: '31%', paddingVertical: spacing.md,
    alignItems: 'center', borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line,
    backgroundColor: c.base, gap: 2,
  },
  slotDisabled: { backgroundColor: c.surfaceAlt, opacity: 0.5 },
  slotText: { ...t.subtitle, fontSize: 13, fontWeight: '900' },
  slotTextDisabled: { textDecorationLine: 'line-through' },
  slotSub: { ...t.small, fontSize: 9 },

  suggestionCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line, padding: spacing.md,
  },
  suggestionIcon: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: c.goldSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionName: { ...t.subtitle, fontSize: 14 },
  suggestionMeta: { ...t.small, fontSize: 11, marginTop: 2 },
  suggestionFacility: {
    fontSize: 11,
    fontWeight: '700',
    color: c.primary,
    marginTop: 2,
  },

  contactCard: {
    margin: spacing.lg, backgroundColor: c.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: c.line,
    padding: spacing.lg, gap: spacing.sm,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  contactText: { ...t.body, flex: 1, fontSize: 13 },
});