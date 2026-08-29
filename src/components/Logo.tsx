import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return <View style={styles.row}><Text style={[styles.word, inverted && styles.wordInverted]}>host</Text><Text style={styles.accent}>in.</Text></View>;
}

export function LogoMark({ size = 38 }: { size?: number }) {
  return <View style={[styles.mark, { borderRadius: Math.round(size * 0.32), height: size, width: size }]}>
    <Text style={[styles.markText, { fontSize: Math.round(size * 0.42) }]}>h.</Text>
  </View>;
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row' },
  word: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -1.4 },
  accent: { color: colors.forest, fontSize: 29, fontWeight: '900', letterSpacing: -1.4 },
  wordInverted: { color: colors.surface },
  mark: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#E7F4F1', borderWidth: 1, justifyContent: 'center', shadowColor: '#0F172A', shadowOffset: { height: 6, width: 0 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  markText: { color: colors.forest, fontWeight: '900', letterSpacing: 0 },
});
