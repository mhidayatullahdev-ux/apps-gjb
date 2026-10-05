import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetwork } from '../context/NetworkContext';
import { toast } from '../utils/toast';

export default function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { isOnline, isSlow } = useNetwork();

  const [visible, setVisible] = useState(false);
  const wasOffline = useRef(false);
  const wasSlow = useRef(false);

  useEffect(() => {
    // Deteksi transisi offline → online
    if (wasOffline.current === true && isOnline === true) {
      // User baru balik online
      toast.success('Koneksi kembali normal', 'Online');
    }

    // Deteksi transisi slow → normal
    if (wasSlow.current === true && isSlow === false && isOnline === true) {
      toast.success('Jaringan kembali cepat', 'Online');
    }

    // Simpan state sebelumnya
    wasOffline.current = !isOnline;
    wasSlow.current = isSlow;

    // Show/hide banner
    setVisible(!isOnline || isSlow);
  }, [isOnline, isSlow]);

  if (!visible) return null;

  const isOffline = !isOnline;

  return (
    <View
      style={[
        styles.banner,
        { paddingTop: insets.top + 6 },
        isOffline ? styles.offline : styles.slow,
      ]}
    >
      <Ionicons
        name={isOffline ? 'cloud-offline-outline' : 'speedometer-outline'}
        size={16}
        color="#FFF"
      />
      <Text style={styles.text}>
        {isOffline
          ? 'Tidak ada koneksi internet'
          : 'Jaringan lambat, mohon tunggu...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  offline: { backgroundColor: '#D51C29' },
  slow: { backgroundColor: '#F2B705' },
  text: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
