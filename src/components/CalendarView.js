// src/components/CalendarView.js
import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';

const DAYS_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function CalendarView({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const minD = minDate ? new Date(minDate) : today;
  const maxD = maxDate ? new Date(maxDate) : new Date(today.getTime() + 60 * 86400000);

  // Generate 30 hari ke depan
  const days = useMemo(() => {
    const out = [];
    const start = new Date(minD);
    while (out.length < 30 && start <= maxD) {
      out.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    return out;
  }, [minD, maxD]);

  // Group by month
  const grouped = useMemo(() => {
    const map = {};
    days.forEach((d) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
    return map;
  }, [days]);

  const isSameDay = (a, b) => {
    if (!a || !b) return false;
    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  };

  const formatMonth = (key) => {
    const [year, month] = key.split('-');
    return `${MONTHS_ID[parseInt(month)]} ${year}`;
  };

  return (
    <View style={s.wrap}>
      {Object.entries(grouped).map(([monthKey, daysList]) => (
        <View key={monthKey} style={s.monthBlock}>
          <Text style={s.monthLabel}>{formatMonth(monthKey)}</Text>

          <View style={s.daysGrid}>
            {daysList.map((d) => {
              const active = isSameDay(d, selectedDate);
              const isPast = d < today;
              const isToday = isSameDay(d, today);

              return (
                <Pressable
                  key={d.toISOString()}
                  disabled={isPast}
                  onPress={() => onSelectDate?.(d)}
                  style={[
                    s.dayCell,
                    active && s.dayCellActive,
                    isPast && s.dayCellPast,
                  ]}
                >
                  <Text
                    style={[
                      s.dayName,
                      active && { color: colors.onPrimary },
                    ]}
                  >
                    {DAYS_ID[(d.getDay() + 6) % 7]}
                  </Text>
                  <Text
                    style={[
                      s.dayNum,
                      active && { color: colors.onPrimary },
                      isPast && { opacity: 0.4 },
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                  {isToday && !active ? (
                    <View style={[s.dot, { backgroundColor: colors.primary }]} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c, t) => ({
  wrap: { paddingHorizontal: spacing.lg },
  monthBlock: { marginBottom: spacing.xl },
  monthLabel: {
    ...t.subtitle,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: spacing.md,
    color: c.gold,
    letterSpacing: 0.5,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayCell: {
    width: 52,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayCellActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  dayCellPast: { opacity: 0.4 },
  dayName: {
    ...t.small,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '900',
    color: c.text,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
