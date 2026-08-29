import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth';
import { Screen } from '@/components/Screen';
import { HostinModule, modulesForRole, roleLabels } from '@/modules';
import { colors, shadow } from '@/theme';

const categories: Record<string, string> = {
  overview: 'Overview', properties: 'Assets', floors: 'Operations', rooms: 'Operations',
  people: 'People', credentials: 'People', requests: 'Operations', 'parent-access': 'People',
  gate: 'Operations', visitors: 'Operations', complaints: 'Community', finance: 'Finance',
  community: 'Community', mess: 'Community', documents: 'Admin', staff: 'People',
  billing: 'Finance', reports: 'Finance', settings: 'Admin',
};

const filters = ['All', 'Operations', 'People', 'Finance', 'Community', 'Admin'];

function categoryFor(moduleId: string) {
  return categories[moduleId] ?? 'Workspace';
}

export default function ModulesScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeFilter, setActiveFilter] = useState('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const role = session?.user.role ?? 'tenant';
  const allowed = useMemo(() => modulesForRole(role), [role]);
  const normalizedQuery = query.trim().toLowerCase();
  const isCompact = width < 390;
  const drawerWidth = Math.min(330, Math.max(276, width * 0.84));

  const filtered = useMemo(() => allowed.filter((module) => {
    const category = categoryFor(module.id);
    const filterMatch = activeFilter === 'All' || category === activeFilter;
    const queryMatch = !normalizedQuery || `${module.title} ${module.description} ${category}`.toLowerCase().includes(normalizedQuery);
    return filterMatch && queryMatch;
  }), [activeFilter, allowed, normalizedQuery]);

  const grouped = useMemo(() => filters.slice(1).map((filter) => ({
    filter,
    modules: allowed.filter((module) => categoryFor(module.id) === filter),
  })).filter((group) => group.modules.length), [allowed]);

  const openModule = (module: HostinModule) => {
    setDrawerOpen(false);
    router.push({ pathname: '/module/[id]', params: { id: module.id } });
  };

  const chooseFilter = (filter: string) => {
    setActiveFilter(filter);
    setDrawerOpen(false);
  };

  return <Screen contentStyle={[styles.content, isCompact && styles.contentCompact]}>
    <View style={styles.header}>
      <Pressable accessibilityLabel="Open module navigation" onPress={() => setDrawerOpen(true)} style={styles.menuButton}>
        <Ionicons color={colors.ink} name="menu" size={22} />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text style={[styles.eyebrow, isCompact && styles.eyebrowCompact]}>{(session?.workspace ?? 'City Complex').toUpperCase()} · {roleLabels[role].toUpperCase()}</Text>
        <Text style={[styles.title, isCompact && styles.titleCompact]}>All Modules</Text>
      </View>
      <Pressable accessibilityLabel="Open notifications" onPress={() => router.push('/notifications')} style={styles.bell}>
        <Ionicons color={colors.ink} name="notifications-outline" size={20} />
        <View style={styles.dot} />
      </Pressable>
    </View>

    <View style={styles.searchBar}>
      <Ionicons color="#98A2B3" name="search-outline" size={18} />
      <TextInput placeholder="Search modules..." placeholderTextColor="#8F98AA" style={styles.searchInput} value={query} onChangeText={setQuery} />
      {!!query && <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')}><Ionicons color="#667085" name="close-circle" size={18} /></Pressable>}
    </View>

    <ScrollView horizontal contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false}>
      {filters.map((filter) => <Pressable key={filter} onPress={() => setActiveFilter(filter)} style={[styles.filter, activeFilter === filter && styles.filterActive]}>
        <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
      </Pressable>)}
    </ScrollView>

    <View style={styles.summaryRow}>
      <Text style={styles.sectionTitle}>{activeFilter === 'All' ? 'Enabled modules' : activeFilter}</Text>
      <Text style={styles.countText}>{filtered.length} available</Text>
    </View>

    <View style={styles.list}>
      {filtered.map((module) => <Pressable key={module.id} onPress={() => openModule(module)} style={({ pressed }) => [styles.moduleRow, pressed && styles.pressed]}>
        <View style={styles.moduleIcon}><Ionicons color={colors.forest} name={module.icon as keyof typeof Ionicons.glyphMap} size={20} /></View>
        <View style={styles.moduleCopy}>
          <Text numberOfLines={1} style={styles.moduleTitle}>{module.title}</Text>
          <Text numberOfLines={2} style={styles.moduleDescription}>{module.description}</Text>
        </View>
        <View style={styles.moduleMeta}><Text style={styles.moduleCategory}>{categoryFor(module.id)}</Text><Ionicons color="#98A2B3" name="chevron-forward" size={16} /></View>
      </Pressable>)}
      {!filtered.length && <Text style={styles.empty}>No modules match your search.</Text>}
    </View>

    <Modal animationType="fade" transparent visible={drawerOpen} onRequestClose={() => setDrawerOpen(false)}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.drawerRoot}>
        <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
        <View style={[styles.drawer, { width: drawerWidth }, shadow]}>
          <View style={styles.drawerHeader}>
            <View>
              <Text style={styles.drawerEyebrow}>{roleLabels[role]}</Text>
              <Text numberOfLines={1} style={styles.drawerTitle}>{session?.workspace ?? 'Workspace'}</Text>
            </View>
            <Pressable accessibilityLabel="Close module navigation" onPress={() => setDrawerOpen(false)} style={styles.drawerClose}><Ionicons color={colors.ink} name="close" size={20} /></Pressable>
          </View>

          <View style={styles.drawerFilters}>
            {filters.map((filter) => <Pressable key={filter} onPress={() => chooseFilter(filter)} style={[styles.drawerFilter, activeFilter === filter && styles.drawerFilterActive]}>
              <Text style={[styles.drawerFilterText, activeFilter === filter && styles.drawerFilterTextActive]}>{filter}</Text>
            </Pressable>)}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerList}>
            {grouped.map((group) => <View key={group.filter} style={styles.drawerGroup}>
              <Text style={styles.drawerGroupTitle}>{group.filter}</Text>
              {group.modules.map((module) => <Pressable key={module.id} onPress={() => openModule(module)} style={styles.drawerItem}>
                <View style={styles.drawerItemIcon}><Ionicons color={colors.forest} name={module.icon as keyof typeof Ionicons.glyphMap} size={17} /></View>
                <Text numberOfLines={1} style={styles.drawerItemText}>{module.title}</Text>
              </Pressable>)}
            </View>)}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  </Screen>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 142, paddingHorizontal: 18 },
  contentCompact: { paddingHorizontal: 14 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingTop: 18 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.forest, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  eyebrowCompact: { fontSize: 9, letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '900', letterSpacing: 0, marginTop: 4 },
  titleCompact: { fontSize: 23 },
  menuButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 16, borderWidth: 1, height: 42, justifyContent: 'center', width: 42, ...shadow },
  bell: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 16, borderWidth: 1, height: 42, justifyContent: 'center', width: 42, ...shadow },
  dot: { backgroundColor: colors.forest, borderColor: colors.surface, borderRadius: 5, borderWidth: 2, height: 9, position: 'absolute', right: 8, top: 7, width: 9 },
  searchBar: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#E4E8EE', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 9, height: 42, marginTop: 18, paddingHorizontal: 13 },
  searchInput: { color: colors.ink, flex: 1, fontSize: 12, fontWeight: '700', height: 40, padding: 0 },
  filters: { gap: 8, paddingRight: 14 },
  filter: { alignItems: 'center', borderColor: '#E1E5EC', borderRadius: 16, borderWidth: 1, height: 33, justifyContent: 'center', marginTop: 14, paddingHorizontal: 12 },
  filterActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  filterText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: colors.surface },
  summaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 20 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  countText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  list: { gap: 8 },
  moduleRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 70, paddingHorizontal: 12, paddingVertical: 10 },
  moduleIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 11, height: 40, justifyContent: 'center', width: 40 },
  moduleCopy: { flex: 1, minWidth: 0 },
  moduleTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  moduleDescription: { color: colors.muted, fontSize: 10, fontWeight: '600', lineHeight: 14, marginTop: 3 },
  moduleMeta: { alignItems: 'flex-end', gap: 7, maxWidth: 86 },
  moduleCategory: { color: colors.forest, fontSize: 9, fontWeight: '900', textAlign: 'right' },
  empty: { color: colors.muted, fontSize: 13, fontWeight: '700', paddingVertical: 26, textAlign: 'center' },
  pressed: { opacity: 0.74 },
  drawerRoot: { flex: 1 },
  drawerBackdrop: { backgroundColor: 'rgba(16, 24, 40, 0.32)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  drawer: { backgroundColor: colors.surface, borderBottomRightRadius: 22, borderTopRightRadius: 22, height: '100%', paddingHorizontal: 16, paddingTop: 34 },
  drawerHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 14 },
  drawerEyebrow: { color: colors.forest, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  drawerTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', marginTop: 4, maxWidth: 210 },
  drawerClose: { alignItems: 'center', backgroundColor: '#F8FAFB', borderColor: '#E6EAEE', borderRadius: 14, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  drawerFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
  drawerFilter: { borderColor: '#E1E5EC', borderRadius: 15, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  drawerFilterActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  drawerFilterText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  drawerFilterTextActive: { color: colors.surface },
  drawerList: { paddingBottom: 26 },
  drawerGroup: { marginTop: 8 },
  drawerGroupTitle: { color: '#667085', fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 7, textTransform: 'uppercase' },
  drawerItem: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', gap: 10, minHeight: 42, paddingHorizontal: 8 },
  drawerItemIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 10, height: 32, justifyContent: 'center', width: 32 },
  drawerItemText: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: '800' },
});
