import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { articlesApi } from '../api/articles';
import { NewsCard } from '../components/cards';
import { EmptyState, Loader } from '../components/common';
import { FadeInUp, stagger } from '../components/anim';

export default function NewsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);

  const [query, setQuery] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await articlesApi.list();
      const items = (res.data || []).map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        content: a.content,
        body: a.content,
        category: 'Berita',
        date: a.published_at
          ? new Date(a.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
          : '',
        image: a.thumbnail_url || a.thumbnail,
        thumbnail: a.thumbnail_url || a.thumbnail,
        published_at: a.published_at,
        author: a.author,
      }));
      setList(items);
    } catch { setList([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  // Auto reload tiap kali tab difokuskan
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = list.filter((n) =>
    !query.trim() || n.title.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <Loader />;

  const header = (
    <View style={s.headerWrap}>
      <Text style={s.title}>Berita</Text>
      <View style={s.searchBox}>
        <Ionicons name="search" size={17} color={colors.textFaint} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Cari berita..."
          placeholderTextColor={colors.textFaint} style={s.searchInput} />
      </View>
    </View>
  );

  return (
    <View style={[s.screen, { paddingTop: insets.top + spacing.sm }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
        renderItem={({ item, index }) => (
          <FadeInUp delay={stagger(index)}>
            <NewsCard item={item} readLabel="Baca selengkapnya"
              onPress={() => navigation.navigate('NewsDetail', { article: item })} />
          </FadeInUp>
        )}
        ListEmptyComponent={<EmptyState icon="newspaper-outline" title="Tidak ada berita" />}
      />
    </View>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  headerWrap: { gap: spacing.md, marginBottom: spacing.lg },
  title: { ...t.display, fontSize: 28 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, height: 46, backgroundColor: c.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line },
  searchInput: { flex: 1, color: c.text, fontSize: 14, padding: 0 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2 },
});