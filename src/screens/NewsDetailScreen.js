// src/screens/NewsDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, Linking, Share, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { BASE_URL } from '../api/client';
import { articlesApi } from '../api/articles';
import { Tag, PrimaryButton } from '../components/common';
import { FadeInUp, PressableScale, stagger } from '../components/anim';

function decodeHtmlEntities(str) {
  if (!str) return '';
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#39;': "'", '&apos;': "'", '&nbsp;': ' ', '&mdash;': '—',
    '&ndash;': '–', '&hellip;': '…', '&copy;': '©', '&reg;': '®',
    '&trade;': '™',
  };
  return String(str).replace(/&[a-zA-Z#0-9]+;/g, (m) => entities[m] || m);
}

function cleanText(value) {
  if (!value) return '';
  let str = String(value);
  str = decodeHtmlEntities(str);
  str = str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<hr\s*\/?>/gi, '\n\n');
  str = str.replace(/<[^>]*>/g, '');
  str = str
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return str;
}

function resolveImageUrl(uri) {
  if (!uri) return null;
  const str = String(uri).trim();
  if (!str) return null;
  if (/^https?:\/\//i.test(str)) return str;
  if (str.startsWith('/')) return `${BASE_URL}${str}`;
  if (str.startsWith('storage/') || str.startsWith('articles/')) {
    return `${BASE_URL}/storage/${str.replace(/^storage\//, '')}`;
  }
  return `${BASE_URL}/storage/${str}`;
}

export default function NewsDetailScreen({ route }) {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const s = useThemedStyles(makeStyles);

  // ✅ Terima article dari params
  const [article, setArticle] = useState(route.params?.article || {});
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  // ✅ Fallback: kalau content kosong, fetch detail dari API
  useEffect(() => {
    const hasContent = !!(article?.content || article?.body);
    if (hasContent) return;
    if (!article?.id) return;

    (async () => {
      setLoading(true);
      try {
        const res = await articlesApi.detail(article.id);
        // API bisa balas { data: {...} } atau langsung {...}
        const detail = res?.data || res;
        if (detail && detail.id) {
          setArticle((prev) => ({
            ...prev,
            ...detail,
            // Normalisasi field
            content: detail.content || prev.content || '',
            body: detail.content || prev.body || '',
            image: detail.thumbnail_url || detail.thumbnail || prev.image,
            thumbnail: detail.thumbnail_url || detail.thumbnail || prev.thumbnail,
            date: detail.published_at
              ? new Date(detail.published_at).toLocaleDateString(
                  lang === 'en' ? 'en-GB' : 'id-ID',
                  { day: 'numeric', month: 'long', year: 'numeric' }
                )
              : prev.date,
          }));
        }
      } catch (e) {
        console.warn('[NewsDetail] Fetch detail error:', e?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [article?.id, article?.content, article?.body, lang]);

  const rawContent = article.content || article.body || article.excerpt || '';

  const paragraphs = cleanText(rawContent)
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  const imageUri = resolveImageUrl(
    article.image || article.thumbnail_url || article.thumbnail
  );

  const shareUrl =
    article.share_url ||
    article.url ||
    article.permalink ||
    (article.slug ? `${BASE_URL}/berita/${article.slug}` : BASE_URL);

  const onShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const url = article.registrationUrl || shareUrl;
      const intro = article.excerpt ? `\n\n${cleanText(article.excerpt)}` : '';
      const message = `${article.title}${intro}\n\n${url}`;

      await Share.share(
        { title: article.title, message },
        { dialogTitle: t('news.share'), subject: article.title }
      );
    } catch (e) {
      Alert.alert(
        t('news.share'),
        lang === 'en' ? 'Failed to open the share sheet.' : 'Gagal membuka menu berbagi.'
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {imageUri ? (
        <FadeInUp>
          <Image
            source={{ uri: imageUri }}
            style={s.cover}
            resizeMode="cover"
            onError={() => console.warn('[NewsDetail] Image error:', imageUri)}
          />
        </FadeInUp>
      ) : null}

      <FadeInUp delay={60}>
        <View style={s.metaTop}>
          <Tag label={article.category || 'Berita'} tone="primary" />
          {article.date ? <Text style={s.date}>{article.date}</Text> : null}
        </View>

        <Text style={s.title}>{article.title}</Text>
      </FadeInUp>

      {article.excerpt ? (
        <FadeInUp delay={110}>
          <View style={s.lead}>
            <View style={s.leadBar} />
            <Text style={s.leadText}>{cleanText(article.excerpt)}</Text>
          </View>
        </FadeInUp>
      ) : null}

      {loading ? (
        <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[s.paragraph, { marginTop: spacing.md, textAlign: 'center' }]}>
            {lang === 'en' ? 'Loading content...' : 'Memuat konten...'}
          </Text>
        </View>
      ) : paragraphs.length > 0 ? (
        paragraphs.map((p, i) => (
          <FadeInUp key={i} delay={stagger(i + 3, 45, 320)}>
            <Text style={s.paragraph}>{p}</Text>
          </FadeInUp>
        ))
      ) : (
        <FadeInUp delay={140}>
          <Text style={s.paragraph}>
            {lang === 'en' ? 'No content available.' : 'Konten belum tersedia.'}
          </Text>
        </FadeInUp>
      )}

      {article.registrationUrl ? (
        <PrimaryButton
          label={t('home.ctaRegister')}
          icon="open-outline"
          onPress={() => Linking.openURL(article.registrationUrl).catch(() => {})}
          style={{ marginTop: spacing.lg }}
        />
      ) : null}

      <PressableScale onPress={onShare} style={s.share} scaleTo={0.95}>
        <Ionicons name="share-social-outline" size={16} color={colors.gold} />
        <Text style={s.shareText}>{t('news.share')}</Text>
      </PressableScale>
    </ScrollView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  cover: {
    width: '100%', height: 220, borderRadius: radius.md,
    marginBottom: spacing.lg, backgroundColor: c.surfaceAlt,
  },
  metaTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  date: { ...t.small },
  title: { ...t.display, fontSize: 25, lineHeight: 32, marginTop: spacing.md },
  lead: {
    flexDirection: 'row', gap: spacing.md,
    marginTop: spacing.lg, marginBottom: spacing.lg,
  },
  leadBar: { width: 3, borderRadius: 2, backgroundColor: c.primary },
  leadText: { ...t.body, flex: 1, fontSize: 15, lineHeight: 23 },
  paragraph: { ...t.body, fontSize: 14, lineHeight: 23, marginBottom: spacing.md },
  share: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.lg, paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg, alignSelf: 'flex-start',
    borderRadius: radius.pill, borderWidth: 1, borderColor: c.line,
  },
  shareText: { color: c.text, fontSize: 13, fontWeight: '700' },
});
