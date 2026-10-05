import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text } from 'react-native';

export function FadeInUp({ children, delay = 0, distance = 18, duration = 420, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    t.start();
    return () => t.stop();
  }, [anim, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function PressableScale({
  children,
  onPress,
  onLongPress,
  disabled,
  style,
  scaleTo = 0.97,
  hitSlop,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 45,
      bounciness: 5,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => animate(scaleTo)}
      onPressOut={() => animate(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// Angka yang menghitung naik dari 0. Dipakai untuk statistik.
export function AnimatedCounter({
  value,
  duration = 1400,
  delay = 0,
  style,
  locale = 'id-ID',
}) {
  const [display, setDisplay] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = Number(value) || 0;
    anim.setValue(0);
    const listener = anim.addListener(({ value: v }) => setDisplay(Math.floor(v)));

    const t = Animated.timing(anim, {
      toValue: target,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    t.start();

    return () => {
      t.stop();
      anim.removeListener(listener);
    };
  }, [anim, value, duration, delay]);

  return <Text style={style}>{display.toLocaleString(locale)}</Text>;
}

export function LiveDot({ size = 8, color = '#22C55E', style }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
          transform: [
            { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.25] }) },
          ],
        },
        style,
      ]}
    />
  );
}

export function useScrollY() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
  });
  return { scrollY, onScroll };
}

export function stagger(index, step = 55, max = 400) {
  return Math.min(index * step, max);
}

export default { FadeInUp, PressableScale, AnimatedCounter, LiveDot, useScrollY, stagger };
