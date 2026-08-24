import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

export function ConnectivityBanner() {
  const network = useNetInfo();
  if (network.isConnected !== false) return null;
  return <View accessibilityLiveRegion="polite" style={styles.banner}><Text style={styles.text}>You’re offline · showing saved or preview content</Text></View>;
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.danger, left: 0, paddingHorizontal: 16, paddingVertical: 7, position: 'absolute', right: 0, top: 0, zIndex: 100 },
  text: { color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center' },
});
