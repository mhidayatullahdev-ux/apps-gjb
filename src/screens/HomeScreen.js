// src/screens/HomeScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, FlatList, useWindowDimensions, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { articlesApi } from '../api/articles';
import { faqsApi } from '../api/faqs';
import { heroQuotes as fallbackQuotes } from '../data/content';

import { SectionHeading, PrimaryButton, Tag, Skeleton } from '../components/common';
import { HeroCard, NewsCard } from '../components/cards';
import FaqSection from '../components/FaqSection';
import QuickWidget from '../components/QuickWidget';
import HomeHeader from '../components/HomeHeader';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const settings = useSettings();
  const { bookingQuota } = useAuth();
  const { isOnline } = useNetwork();
  const s = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();

  const [articles, setArticles] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [autoRetryCount, setAutoRetryCount] = useState(0);

  // ============================================================
  // LOAD DATA — request dipisah, satu gagal tidak ganggu yang lain
  // ============================================================
  const load = useCallback(async () => {
    console.log('[Home] load start. isOnline:', isOnline);

    // ---- ARTICLES ----
    try {
      const artRes = await articlesApi.list();
      const rawArticles = artRes?.data || [];
      const items = rawArticles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        content: a.content,
        body: a.content,
        thumbnail: a.thumbnail_url || a.thumbnail,
        image: a.thumbnail_url || a.thumbnail,
        category: 'Berita',
        date: a.published_at
          ? new Date(a.published_at).toLocaleDateString(
              lang === 'en' ? 'en-GB' : 'id-ID',
              { day: 'numeric', month: 'long', year: 'numeric' }
            )
          : '',
        published_at: a.published_at,
      }));
      console.log('[Home] ✅ articles loaded:', items.length);
      setArticles(items);
    } catch (err) {
      console.warn('[Home] ❌ articles FAILED:', err?.message, '| status:', err?.status);
      // JANGAN setArticles([]) — biar data lama (kalau ada) tidak ketimpa
    }

    // ---- FAQS ----
    try {
      const faqRes = await faqsApi.list();
      const faqItems = faqRes?.data || [];
      console.log('[Home] ✅ faqs loaded:', faqItems.length);
      setFaqs(faqItems);
    } catch (err) {
      console.warn('[Home] ❌ faqs FAILED:', err?.message, '| status:', err?.status);
      // JANGAN setFaqs([]) juga
    }

    setHasLoadedOnce(true);
    setLoading(false);
    setRefreshing(false);
  }, [lang, isOnline]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================
  useEffect(() => {
    load();
  }, [load]);

  // ============================================================
  // AUTO RETRY — maksimal 2x, hindari infinite loop
  // ============================================================
  useEffect(() => {
    if (!hasLoadedOnce) return;
    if (articles.length > 0 && faqs.length > 0) return;
    if (!isOnline) return;
    if (autoRetryCount >= 2) return;

    console.log('[Home] auto-retry', autoRetryCount + 1, 'of 2 in 3s');
    const timer = setTimeout(() => {
      setAutoRetryCount((c) => c + 1);
      load();
    }, 3000);
    return () => clearTimeout(timer);
  }, [hasLoadedOnce, articles.length, faqs.length, isOnline, load, autoRetryCount]);

  // ============================================================
  // FOCUS REFETCH — tiap balik ke Beranda, kalau data kosong retry
  // ============================================================
  useFocusEffect(
    useCallback(() => {
      if (articles.length === 0 || faqs.length === 0) {
        console.log('[Home] focus refetch (data empty)');
        load();
      }
    }, [articles.length, faqs.length, load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // ============================================================
  // DERIVED DATA
  // ============================================================
  const heroArticles = articles.slice(0, 3).map((a) => ({
    id: a.id,
    type: 'NEWS',
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    date: a.date,
    image: a.image,
    bannerImage: a.image,
    heroBadge: 'BERITA',
    heroCtaText: t('common.readMore'),
    registrationUrl: null,
  }));

  const quotes = settings.whatsappUrl ? [] : fallbackQuotes;

  const openHero = (item) => {
    navigation.navigate('NewsDetail', {
      article: {
        id: item.id,
        category: item.type || 'INFO',
        title: item.title,
        date: item.date,
        excerpt: item.excerpt,
        content: item.content,
        body: item.content,
        image: item.image,
      },
    });
  };

  const onQuoteScroll = (e) => {
    const cardWidth = width - spacing.lg * 2;
    const i = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + spacing.md));
    if (i !== quoteIndex) setQuoteIndex(i);
  };

  // Guard: kalau width 0 (belum ready), jangan render hero
  const isWidthReady = width > 0;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ paddingBottom: spacing.xxl * 2 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <HomeHeader
        navigation={navigation}
        onOpenNotifications={() => navigation.navigate('Notifications')}
      />

      {/* ✅ Banner Quota Booking */}
      {bookingQuota && bookingQuota.can_book === false ? (
        <View style={s.quotaBanner}>
          <View style={s.quotaIconBox}>
            <Ionicons name="lock-closed" size={20} color="#8B6914" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.quotaTitle}>
              {lang === 'en' ? 'Booking Unavailable' : 'Booking Tidak Tersedia'}
            </Text>
            <Text style={s.quotaBody}>
              {bookingQuota.message ||
                (lang === 'en'
                  ? 'You can only book once every 7 days.'
                  : 'Anda hanya bisa booking 1x setiap 7 hari.')}
            </Text>
            {bookingQuota.next_available_at ? (
              <Text style={s.quotaDate}>
                {lang === 'en' ? 'Available again: ' : 'Bisa booking lagi: '}
                {new Date(bookingQuota.next_available_at).toLocaleDateString(
                  lang === 'en' ? 'en-GB' : 'id-ID',
                  { day: 'numeric', month: 'long', year: 'numeric' }
                )}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {!isOnline ? (
        <View style={s.offlineWrap}>
          <Ionicons name="cloud-offline-outline" size={18} color={colors.danger} />
          <Text style={s.offlineText}>
            Tidak ada koneksi internet. Tarik ke bawah untuk refresh.
          </Text>
        </View>
      ) : null}

      {settings.tagline ? (
        <View style={s.taglineBox}>
          <Ionicons name="sparkles" size={14} color={colors.gold} />
          <Text style={s.taglineText} numberOfLines={2}>
            {settings.tagline}
          </Text>
        </View>
      ) : null}

      {/* Hero Banner */}
      <View style={s.heroSection}>
        <Text style={s.heroEyebrow}>{t('home.eyebrow')}</Text>
        {loading ? (
          <View style={s.heroSkeleton}>
            <Skeleton height={200} style={{ borderRadius: radius.lg }} />
          </View>
        ) : heroArticles.length > 0 && isWidthReady ? (
          <FlatList
            horizontal
            pagingEnabled
            data={heroArticles}
            keyExtractor={(item) => String(item.id)}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{ width }}>
                <HeroCard
                  item={item}
                  ctaLabel={t('common.readMore')}
                  onPress={() => openHero(item)}
                />
              </View>
            )}
          />
        ) : (
          <View style={s.heroFallback}>
            <Text style={s.heroFallbackTitle}>{t('home.heroFallbackTitle')}</Text>
            <Text style={s.heroFallbackBody}>{t('home.heroFallbackBody')}</Text>
          </View>
        )}
      </View>

      {/* Menu Cepat */}
      <QuickWidget navigation={navigation} />

      {/* Kutipan */}
      {false ? (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onQuoteScroll}
            contentContainerStyle={s.quoteScroll}
            style={{ marginTop: spacing.xl }}
          >
            {quotes.map((q) => (
              <View key={q.id} style={[s.quoteCard, { width: width - spacing.lg * 2 }]}>
                <Ionicons name="chatbox-ellipses" size={18} color={colors.gold} />
                <Text style={s.quoteText}>{q.quote}</Text>
                <Text style={s.quoteName}>{q.name}</Text>
                {q.role ? <Text style={s.quoteRole}>{q.role}</Text> : null}
              </View>
            ))}
          </ScrollView>
          <View style={s.dots}>
            {quotes.map((q, i) => (
              <View key={q.id} style={[s.dot, i === quoteIndex && s.dotActive]} />
            ))}
          </View>
        </>
      ) : null}

      {/* Helpdesk */}
      <View style={[s.section, s.helpdesk]}>
        <Tag label="Helpdesk" tone="blue" />
        <Text style={s.helpdeskTitle}>{t('home.helpdesk')}</Text>
        <Text style={s.helpdeskBody}>{t('home.helpdeskBody')}</Text>
        <PrimaryButton
          label={t('home.openHelpdesk')}
          icon="arrow-forward"
          onPress={() => navigation.navigate('Helpdesk')}
        />
      </View>

      {/* Berita Terkini */}
      <View style={s.section}>
        <SectionHeading
          title={lang === 'en' ? 'LATEST ' : 'BERITA '}
          accentWord={lang === 'en' ? 'NEWS' : 'TERKINI'}
          actionLabel={t('home.allNews')}
          onAction={() => navigation.navigate('Berita')}
        />
        {loading ? (
          <View style={s.newsList}>
            <Skeleton height={120} style={{ borderRadius: radius.md }} />
          </View>
        ) : articles.length > 0 ? (
          <View style={s.newsList}>
            {articles.slice(0, 5).map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                readLabel={t('common.readMore')}
                onPress={() => navigation.navigate('NewsDetail', { article: item })}
              />
            ))}
          </View>
        ) : (
          <View style={s.emptyBox}>
            <Ionicons name="newspaper-outline" size={28} color={colors.textFaint} />
            <Text style={s.emptyText}>
              {lang === 'en' ? 'No news yet' : 'Belum ada berita'}
            </Text>
          </View>
        )}
      </View>

      {/* FAQ */}
      {faqs.length > 0 ? (
        <FaqSection
          faqs={faqs}
          title={lang === 'en' ? 'Frequently Asked Questions' : 'Pertanyaan Umum'}
        />
      ) : null}
    </ScrollView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  quotaBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: '#F2B705' + '15',
    borderRadius: radius.md,
    borderWidth: 1, borderColor: '#F2B705',
  },
  quotaIconBox: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F2B705' + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  quotaTitle: {
    color: '#8B6914', fontSize: 13, fontWeight: '900',
  },
  quotaBody: {
    color: '#8B6914', fontSize: 12, lineHeight: 18, marginTop: 3,
  },
  quotaDate: {
    color: '#8B6914', fontSize: 11, fontWeight: '700',
    marginTop: 4, fontStyle: 'italic',
  },

  offlineWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderRadius: radius.md, borderWidth: 1,
    backgroundColor: c.danger + '15', borderColor: c.danger,
  },
  offlineText: { flex: 1, color: c.danger, fontSize: 12, fontWeight: '600' },
  taglineBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderRadius: radius.md, backgroundColor: c.goldSoft,
  },
  taglineText: { flex: 1, color: c.gold, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  heroSection: { paddingTop: spacing.sm },
  heroEyebrow: { ...t.eyebrow, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  heroSkeleton: { paddingHorizontal: spacing.lg },
  heroFallback: { paddingHorizontal: spacing.lg, gap: spacing.md },
  heroFallbackTitle: { ...t.display, fontSize: 28, lineHeight: 34 },
  heroFallbackBody: { ...t.body },
  quoteScroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
  quoteCard: {
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line, padding: spacing.lg, gap: spacing.sm,
  },
  quoteText: { ...t.body, fontStyle: 'italic' },
  quoteName: { ...t.subtitle, fontSize: 15, marginTop: spacing.xs },
  quoteRole: { ...t.small },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.line },
  dotActive: { width: 18, backgroundColor: c.primary },
  section: { marginTop: spacing.xxl },
  helpdesk: {
    marginHorizontal: spacing.lg, backgroundColor: c.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: c.line,
    padding: spacing.lg, gap: spacing.md,
  },
  helpdeskTitle: { ...t.title, fontSize: 20 },
  helpdeskBody: { ...t.body, fontSize: 13 },
  newsList: { paddingHorizontal: spacing.lg, gap: spacing.md },
  emptyBox: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { ...t.small, fontSize: 12 },
});