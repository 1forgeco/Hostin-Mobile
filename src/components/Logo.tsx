import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return <View style={styles.row}><Text style={[styles.word, inverted && styles.wordInverted]}>host</Text><Text style={styles.accent}>in.</Text></View>;
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row' },
  word: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -1.4 },
  accent: { color: colors.forest, fontSize: 29, fontWeight: '900', letterSpacing: -1.4 },
  wordInverted: { color: colors.surface },
});
