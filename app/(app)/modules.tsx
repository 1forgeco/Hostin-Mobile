import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { useAuth } from '@/auth';
import { OwnerPropertySwitcher } from '@/components/OwnerPropertySwitcher';
import { Screen } from '@/components/Screen';
import { modulesForRole, roleLabels } from '@/modules';
import { colors, radius, shadow } from '@/theme';

const categories: Record<string, string> = {
  overview: 'Overview', properties: 'Assets', floors: 'Operations', rooms: 'Operations',
  people: 'People', credentials: 'People', requests: 'Operations', 'parent-access': 'People',
  gate: 'Operations', visitors: 'Operations', complaints: 'Community', finance: 'Finance',
  community: 'Community', mess: 'Community', documents: 'Admin', staff: 'People',
  billing: 'Finance', reports: 'Finance', settings: 'Admin',
};

const pinnedIds = ['overview', 'properties', 'finance', 'complaints'];
const filters = ['All', 'Operations', 'People', 'Finance', 'Community', 'Admin'];

export default function ModulesScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const role = session?.user.role ?? 'tenant';
  const allowed = modulesForRole(role);
  const pinned = allowed.filter((module) => pinnedIds.includes(module.id)).slice(0, 4);
  const allModules = allowed.filter((module) => !pinnedIds.includes(module.id));
  const isCompact = width < 390;
  const isPhone = width < 520;
  const isTablet = width >= 760;
  const moduleCardWidth = isPhone ? '48%' : isTablet ? '23.5%' : '31.6%';

  return <Screen contentStyle={[styles.content, isCompact && styles.contentCompact]}>
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {role === 'owner' ? <OwnerPropertySwitcher workspace={session?.workspace ?? 'City Complex'} /> : <Text style={[styles.eyebrow, isCompact && styles.eyebrowCompact]}>{(session?.workspace ?? 'City Complex').toUpperCase()} · {roleLabels[role].toUpperCase()}</Text>}
        <Text style={[styles.title, isCompact && styles.titleCompact]}>Modules</Text>
        <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>Everything enabled for your workspace.</Text>
      </View>
      <Pressable accessibilityLabel="Open notifications" onPress={() => router.push('/notifications')} style={styles.bell}>
        <Ionicons color={colors.ink} name="notifications-outline" size={20} />
        <View style={styles.dot} />
      </Pressable>
    </View>

    <View style={styles.searchBar}>
      <Ionicons color="#98A2B3" name="search-outline" size={18} />
      <TextInput editable={false} placeholder="Search modules..." placeholderTextColor="#8F98AA" style={styles.searchInput} />
      <Ionicons color="#667085" name="options-outline" size={19} />
    </View>

    <ScrollView horizontal contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false}>
      {filters.map((filter, index) => <Pressable key={filter} style={[styles.filter, index === 0 && styles.filterActive]}>
        <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>{filter}</Text>
      </Pressable>)}
    </ScrollView>

    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Pinned</Text>
      <Text style={styles.link}>Edit</Text>
    </View>
    <ScrollView horizontal contentContainerStyle={styles.pinnedRow} showsHorizontalScrollIndicator={false}>
      {pinned.map((module) => <Pressable key={module.id} onPress={() => router.push({ pathname: '/module/[id]', params: { id: module.id } })} style={({ pressed }) => [styles.pinnedCard, shadow, pressed && styles.pressed]}>
        <Ionicons color={colors.forest} name="pin" size={14} style={styles.pin} />
        <View style={styles.pinnedIcon}><Ionicons color={colors.forest} name={module.icon as keyof typeof Ionicons.glyphMap} size={25} /></View>
        <Text numberOfLines={2} style={styles.pinnedTitle}>{module.title}</Text>
        <Text style={styles.pinnedCategory}>{categories[module.id] ?? 'Workspace'}</Text>
      </Pressable>)}
    </ScrollView>

    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>All Modules</Text>
      <Ionicons color={colors.ink} name="grid-outline" size={20} />
    </View>
    <View style={styles.grid}>
      {allModules.map((module) => <Pressable key={module.id} onPress={() => router.push({ pathname: '/module/[id]', params: { id: module.id } })} style={({ pressed }) => [styles.card, { width: moduleCardWidth }, isPhone && styles.cardPhone, shadow, pressed && styles.pressed]}>
        <View style={styles.cardIcon}><Ionicons color={colors.forest} name={module.icon as keyof typeof Ionicons.glyphMap} size={22} /></View>
        <View style={styles.cardCopy}>
          <Text numberOfLines={1} style={styles.cardTitle}>{module.title}</Text>
          <Text style={styles.cardCategory}>{categories[module.id] ?? 'Workspace'}</Text>
        </View>
      </Pressable>)}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 102, paddingHorizontal: 18 },
  contentCompact: { paddingHorizontal: 14 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 18 },
  headerCopy: { flex: 1, paddingRight: 12 },
  eyebrow: { color: colors.forest, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  eyebrowCompact: { fontSize: 9, letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '900', letterSpacing: 0, marginTop: 9 },
  titleCompact: { fontSize: 30 },
  subtitle: { color: colors.muted, fontSize: 13, fontWeight: '500', marginTop: 6 },
  subtitleCompact: { fontSize: 12, lineHeight: 17 },
  bell: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 18, borderWidth: 1, height: 44, justifyContent: 'center', width: 44, ...shadow },
  dot: { backgroundColor: colors.forest, borderColor: colors.surface, borderRadius: 5, borderWidth: 2, height: 9, position: 'absolute', right: 8, top: 7, width: 9 },
  searchBar: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#E4E8EE', borderRadius: 21, borderWidth: 1, flexDirection: 'row', gap: 9, height: 45, marginTop: 22, paddingHorizontal: 14 },
  searchInput: { color: colors.ink, flex: 1, fontSize: 12, fontWeight: '600', height: 43, padding: 0 },
  filters: { gap: 9, paddingRight: 16 },
  filter: { alignItems: 'center', borderColor: '#E1E5EC', borderRadius: 18, borderWidth: 1, height: 37, justifyContent: 'center', marginTop: 18, paddingHorizontal: 14 },
  filterActive: { backgroundColor: colors.forest, borderColor: colors.forest, ...shadow },
  filterText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: colors.surface },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  link: { color: colors.forest, fontSize: 12, fontWeight: '900' },
  pinnedRow: { flexDirection: 'row', gap: 9, marginTop: 12, paddingRight: 8 },
  pinnedCard: { backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 14, borderWidth: 1, height: 126, justifyContent: 'flex-end', padding: 12, width: 118 },
  pin: { position: 'absolute', right: 12, top: 12 },
  pinnedIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 14, height: 45, justifyContent: 'center', marginBottom: 16, width: 45 },
  pinnedTitle: { color: colors.ink, fontSize: 12, fontWeight: '900', lineHeight: 16 },
  pinnedCategory: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12 },
  card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 10, height: 78, paddingHorizontal: 11 },
  cardPhone: { alignItems: 'flex-start', flexDirection: 'column', gap: 7, height: 108, justifyContent: 'center', paddingHorizontal: 11 },
  cardIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  cardCategory: { color: colors.muted, fontSize: 10, fontWeight: '600', marginTop: 3 },
  pressed: { opacity: 0.74 },
});
