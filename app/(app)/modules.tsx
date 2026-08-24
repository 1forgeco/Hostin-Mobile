import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth';
import { Screen } from '@/components/Screen';
import { modulesForRole, roleLabels } from '@/modules';
import { colors, radius } from '@/theme';

export default function ModulesScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const role = session?.user.role ?? 'tenant';
  const allowed = modulesForRole(role);
  return <Screen>
    <Text style={styles.eyebrow}>ALLOWED MODULES</Text><Text style={styles.title}>{roleLabels[role]} workspace</Text><Text style={styles.subtitle}>{allowed.length} modules enabled for your role at {session?.workspace ?? 'City Complex'}.</Text>
    <View style={styles.grid}>{allowed.map((module) => <Pressable key={module.id} onPress={() => router.push({ pathname: '/module/[id]', params: { id: module.id } })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.icon}><Ionicons color={colors.forest} name={module.icon as keyof typeof Ionicons.glyphMap} size={22} /></View>
      <Text style={styles.name}>{module.title}</Text><Text style={styles.description}>{module.description}</Text>
      <View style={styles.open}><Text style={styles.openText}>Open module</Text><Ionicons color={colors.forest} name="arrow-forward" size={14} /></View>
    </Pressable>)}</View>
  </Screen>;
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginTop: 20 }, title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -1, marginTop: 7 }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 }, card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, minHeight: 176, padding: 15, width: '48.5%' }, pressed: { opacity: 0.75 }, icon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 12, height: 42, justifyContent: 'center', width: 42 }, name: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 13 }, description: { color: colors.muted, flex: 1, fontSize: 10, lineHeight: 15, marginTop: 5 }, open: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 12 }, openText: { color: colors.forest, fontSize: 10, fontWeight: '800' },
});
