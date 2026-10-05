// src/screens/FavoritesScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, RefreshControl, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { facilitiesApi } from '../api/facilities';
import { useFavorites } from '../context/FavoritesContext';
import { EmptyState, Loader, Tag } from '../components/common';
import { FadeInUp, stagger } from '../components/anim';
import SmartImage from '../components/SmartImage';

export default function FavoritesScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { favorites, toggleFavorite } = useFavorites();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await facilitiesApi.list();
      const all = res.facilities || [];
      const favs = all.filter((f) => favorites.includes(String(f.id)));
      setList(favs);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [favorites]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loader />;

  return (
    <FlatList
      style={s.screen}
      data={list}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={s.list}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={colors.primary}
        />
      }
      renderItem={({ item, index }) => {
        const courts = item.courts || [];
        const lowestPrice = courts.length
          ? Math.min(...courts.map((c) => Number(c.price_per_2h) || 0))
          : 0;

        return (
          <FadeInUp delay={stagger(index)}>
            <Pressable
              style={s.card}
              onPress={() => navigation.navigate('FacilityDetail', { facilityId: item.id })}
            >
              <SmartImage
                uri={item.image_url}
                style={s.image}
                icon="business-outline"
                showLoader={false}
              />
              <View style={s.cardBody}>
                <View style={s.cardTop}>
                  <Text style={s.name} numberOfLines={2}>{item.name}</Text>
                  <Pressable
                    onPress={() => toggleFavorite(item.id)}
                    hitSlop={8}
                  >
                    <Ionicons name="heart" size={22} color={colors.primary} />
                  </Pressable>
                </View>
                <Text style={s.address} numberOfLines={1}>{item.address}</Text>
                <View style={s.cardFooter}>
                  <Text style={s.price}>
                    Mulai Rp {lowestPrice.toLocaleString('id-ID')}
                  </Text>
                  <Tag label={`${courts.length} lapangan`} tone="neutral" />
                </View>
              </View>
            </Pressable>
          </FadeInUp>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          icon="heart-outline"
          title="Belum ada favorit"
          hint="Tap ikon hati di halaman detail GOR untuk menambahkan ke favorit."
        />
      }
    />
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.line,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 140, backgroundColor: c.surfaceAlt },
  cardBody: { padding: spacing.lg, gap: 6 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  name: { ...t.subtitle, fontSize: 16, flex: 1 },
  address: { ...t.small, fontSize: 12 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  price: { color: c.gold, fontSize: 14, fontWeight: '900' },
});
