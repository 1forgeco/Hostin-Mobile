import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth';
import { OwnerPropertySwitcher } from '@/components/OwnerPropertySwitcher';
import { Screen } from '@/components/Screen';
import { HostinModule, modulesForRole, roleLabels } from '@/modules';
import { DashboardData, loadDashboard } from '@/services/dashboard';
import { loadModule, ModuleRecord } from '@/services/modules';
import { colors, radius, shadow } from '@/theme';

const quickActions = [
  { label: 'Add floor', icon: 'layers-outline', moduleId: 'floors' },
  { label: 'Add room', icon: 'bed-outline', moduleId: 'rooms' },
  { label: 'Create due', icon: 'wallet-outline', moduleId: 'finance' },
  { label: 'Verify docs', icon: 'document-text-outline', moduleId: 'documents' },
  { label: 'Staff contact', icon: 'call-outline', moduleId: 'staff' },
  { label: 'New request', icon: 'file-tray-full-outline', moduleId: 'requests' },
] as const;

type SearchResult = {
  id: string;
  icon: string;
  moduleId: string;
  subtitle: string;
  title: string;
  type: 'module' | 'record';
};

function attentionTone(index: number) {
  return [
    { background: '#DDFBF3', tone: '#0F766E' },
    { background: '#FFF0D7', tone: '#DC6803' },
    { background: '#E8EEFF', tone: '#2F62E6' },
    { background: '#F0E6FF', tone: '#7A35D8' },
  ][index % 4];
}

function countFromDetail(detail: string) {
  return detail.match(/\d+/)?.[0] ?? '';
}

function matchesRecord(record: ModuleRecord, query: string) {
  const haystack = [record.title, record.subtitle, record.meta, record.status].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query);
}

export default function DashboardScreen() {
  const { session, switchRole } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const role = session?.user.role ?? 'tenant';
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [quickOpen, setQuickOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const isCompact = width < 390;

  const refresh = async (pull = false) => {
    if (!session) return;
    if (pull) setRefreshing(true);
    setError('');
    try { setData(await loadDashboard(session)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load dashboard.'); } finally { setRefreshing(false); }
  };

  useEffect(() => { void refresh(); }, [session?.accessToken, session?.orgId, session?.user.role]);

  const allowedModules = useMemo(() => modulesForRole(role), [role]);
  const quickModules = useMemo(() => {
    const modules = role === 'owner' ? allowedModules.filter((module) => module.id !== 'overview') : allowedModules;
    return modules.slice(0, 4);
  }, [allowedModules, role]);
  const ownerSearchModules = useMemo(() => allowedModules.filter((module) => module.id !== 'overview'), [allowedModules]);

  useEffect(() => {
    if (!searchOpen || !session) return;
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults(ownerSearchModules.slice(0, 8).map((module) => ({ id: `module-${module.id}`, icon: module.icon, moduleId: module.id, subtitle: module.description, title: module.title, type: 'module' })));
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      const moduleMatches = ownerSearchModules
        .filter((module) => `${module.title} ${module.description}`.toLowerCase().includes(query))
        .map((module) => ({ id: `module-${module.id}`, icon: module.icon, moduleId: module.id, subtitle: module.description, title: module.title, type: 'module' as const }));
      const recordMatches = await Promise.all(ownerSearchModules.map(async (module: HostinModule) => {
        try {
          const result = await loadModule(session, module.id);
          return result.records.filter((record) => matchesRecord(record, query)).slice(0, 3).map((record) => ({
            id: `record-${module.id}-${record.id}`,
            icon: module.icon,
            moduleId: module.id,
            subtitle: [record.subtitle, record.meta, record.status].filter(Boolean).join(' · '),
            title: record.title,
            type: 'record' as const,
          }));
        } catch {
          return [];
        }
      }));
      if (!cancelled) {
        setSearchResults([...moduleMatches, ...recordMatches.flat()].slice(0, 18));
        setSearchLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [ownerSearchModules, searchOpen, searchQuery, session]);

  const openModule = (moduleId: string) => {
    setQuickOpen(false);
    setSearchOpen(false);
    router.push({ pathname: '/module/[id]', params: { id: moduleId } });
  };

  const searchModal = session && role === 'owner' ? <Modal animationType="slide" visible={searchOpen} onRequestClose={() => setSearchOpen(false)}>
    <SafeAreaView edges={['top', 'bottom']} style={styles.searchModal}>
      <View style={styles.searchModalHeader}>
        <View style={styles.searchModalBar}>
          <Ionicons color="#98A2B3" name="search-outline" size={18} />
          <TextInput autoFocus placeholder="Search modules, rooms, residents..." placeholderTextColor="#8F98AA" style={styles.searchModalInput} value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <Pressable onPress={() => setSearchOpen(false)} style={styles.searchClose}><Ionicons color={colors.ink} name="close" size={20} /></Pressable>
      </View>
      {searchLoading ? <ActivityIndicator color={colors.forest} style={styles.searchLoader} /> : <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.searchResults}>
        {searchResults.map((result) => <Pressable key={result.id} onPress={() => openModule(result.moduleId)} style={styles.searchResult}>
          <View style={styles.searchResultIcon}><Ionicons color={colors.forest} name={result.icon as keyof typeof Ionicons.glyphMap} size={19} /></View>
          <View style={styles.searchResultCopy}><Text numberOfLines={1} style={styles.searchResultTitle}>{result.title}</Text><Text numberOfLines={2} style={styles.searchResultSubtitle}>{result.subtitle}</Text></View>
          <Text style={styles.searchType}>{result.type}</Text>
        </Pressable>)}
        {!searchResults.length && <Text style={styles.emptySearch}>No matching modules or records found.</Text>}
      </ScrollView>}
    </SafeAreaView>
  </Modal> : null;

  const ownerFloating = role === 'owner' ? <View pointerEvents="box-none" style={styles.floatingLayer}>
    {quickOpen && <Pressable style={styles.floatingBackdrop} onPress={() => setQuickOpen(false)} />}
    {quickOpen && <View style={[styles.quickMenuFloating, shadow]}>{quickActions.map((action) => <Pressable key={action.label} onPress={() => openModule(action.moduleId)} style={styles.quickMenuItem}>
      <View style={styles.quickMenuIcon}><Ionicons color={colors.forest} name={action.icon} size={16} /></View>
      <Text style={styles.quickMenuText}>{action.label}</Text>
    </Pressable>)}</View>}
    <Pressable onPress={() => setQuickOpen((value) => !value)} style={[styles.quickActionsFloating, quickOpen && styles.quickActionsOpen, shadow]}>
      <Ionicons color="#FFFFFF" name={quickOpen ? 'close' : 'add'} size={19} />
      <Text style={styles.quickActionsText}>Quick actions</Text>
    </Pressable>
  </View> : undefined;

  if (role === 'owner' && session) {
    const attention = data?.attention ?? [];
    return <Screen contentStyle={[styles.ownerContent, isCompact && styles.ownerContentCompact]} floating={ownerFloating} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(true)} tintColor={colors.forest} />}>
      <View style={styles.ownerHeader}><View style={styles.ownerHeaderCopy}><OwnerPropertySwitcher session={session} onSwitch={switchRole} /><Text style={[styles.ownerTitle, isCompact && styles.ownerTitleCompact]}>Hello, Owner</Text></View><Pressable accessibilityLabel="Open notifications" onPress={() => router.push('/notifications')} style={styles.ownerBell}><Ionicons color={colors.ink} name="notifications-outline" size={20} /><View style={styles.ownerDot} /></Pressable></View>
      <Pressable onPress={() => { setSearchQuery(''); setSearchOpen(true); }} style={styles.searchBar}><Ionicons color="#98A2B3" name="search-outline" size={18} /><Text style={styles.searchPlaceholder}>Search modules, rooms, residents...</Text><View style={styles.sparkButton}><Ionicons color={colors.forest} name="options-outline" size={16} /></View></Pressable>
      {searchModal}
      <LinearGradient colors={['#07998E', '#006E73', '#054B5D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.ownerHero, isCompact && styles.ownerHeroCompact, shadow]}>
        <View style={styles.heroGlow} /><View style={styles.heroTop}><View style={styles.heroIcon}><Ionicons color="#FFFFFF" name="trending-up" size={16} /></View><Text style={[styles.ownerHeroLabel, isCompact && styles.ownerHeroLabelCompact]}>{data?.headline ?? 'Your properties at a glance'}</Text></View><View style={[styles.buildingWrap, isCompact && styles.buildingWrapCompact]} pointerEvents="none"><View style={styles.buildingTall}>{[0, 1, 2, 3].map((item) => <View key={item} style={styles.window} />)}</View><View style={styles.buildingShort}>{[0, 1, 2].map((item) => <View key={item} style={styles.windowSmall} />)}</View></View>
        {data ? <View style={[styles.ownerMetrics, isCompact && styles.ownerMetricsCompact]}>{data.metrics.map(([value, label], index) => <View key={label} style={[styles.ownerMetric, index > 0 && styles.ownerMetricBorder]}><Text adjustsFontSizeToFit numberOfLines={1} style={[styles.ownerMetricValue, isCompact && styles.ownerMetricValueCompact]}>{value}</Text><Text numberOfLines={1} style={styles.ownerMetricLabel}>{label}</Text></View>)}</View> : <ActivityIndicator color="#fff" style={styles.ownerLoader} />}
      </LinearGradient>{!!error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.ownerSectionHeader}><Text style={styles.ownerSectionTitle}>Quick access</Text><Pressable onPress={() => router.push('./modules')} style={styles.linkButton}><Text style={styles.ownerSectionLink}>All modules</Text><Ionicons color={colors.forest} name="chevron-forward" size={15} /></Pressable></View>
      <ScrollView horizontal contentContainerStyle={styles.ownerModuleRow} showsHorizontalScrollIndicator={false}>{quickModules.map((module) => <Pressable key={module.id} onPress={() => openModule(module.id)} style={({ pressed }) => [styles.ownerModule, shadow, pressed && styles.pressed]}><View style={styles.ownerModuleIcon}><Ionicons color={colors.forest} name={module.icon as keyof typeof Ionicons.glyphMap} size={22} /></View><Text numberOfLines={2} style={styles.ownerModuleText}>{module.title}</Text></Pressable>)}</ScrollView>
      <View style={styles.ownerSectionHeader}><Text style={styles.ownerSectionTitle}>Needs attention</Text><Pressable onPress={() => router.push('./modules')} style={styles.linkButton}><Text style={styles.ownerSectionLink}>View all</Text><Ionicons color={colors.forest} name="chevron-forward" size={15} /></Pressable></View>
      <View style={[styles.ownerAttention, shadow]}>{attention.length ? attention.map(([title, detail, icon, moduleId], index) => {
        const tone = attentionTone(index);
        return <Pressable key={`${title}-${index}`} onPress={() => moduleId && openModule(moduleId)} style={[styles.ownerAttentionRow, index < attention.length - 1 && styles.ownerRowBorder]}>
          <View style={styles.ownerAttentionIcon}><Ionicons color={colors.forest} name={icon as keyof typeof Ionicons.glyphMap} size={20} /></View><View style={styles.ownerAttentionCopy}><Text style={styles.ownerAttentionTitle}>{title}</Text><Text style={styles.ownerAttentionDetail}>{detail}</Text></View>{!!countFromDetail(detail) && <View style={[styles.ownerCount, { backgroundColor: tone.background }]}><Text style={[styles.ownerCountText, { color: tone.tone }]}>{countFromDetail(detail)}</Text></View>}<Ionicons color="#98A2B3" name="chevron-forward" size={18} />
        </Pressable>;
      }) : <Text style={styles.ownerEmpty}>No owner items need attention right now.</Text>}</View>
    </Screen>;
  }

  return <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(true)} tintColor={colors.forest} />}>
    <View style={styles.header}><View><Text style={styles.kicker}>{(session?.workspace ?? 'City Complex').toUpperCase()} · {roleLabels[role].toUpperCase()}</Text><Text style={styles.title}>Hello, {session?.user.name}</Text></View><Pressable onPress={() => router.push('/notifications')} style={styles.bell}><Ionicons color={colors.ink} name="notifications-outline" size={22} /><View style={styles.notificationDot} /></Pressable></View>
    <View style={styles.hero}>{data ? <><Text style={styles.heroLabel}>{data.headline.toUpperCase()}</Text><View style={styles.metrics}>{data.metrics.map(([value, label], index) => <View key={label} style={[styles.metric, index > 0 && styles.metricBorder]}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>)}</View></> : <ActivityIndicator color="#fff" />}</View>{!!error && <Text style={styles.error}>{error}</Text>}
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Quick access</Text><Pressable onPress={() => router.push('./modules')}><Text style={styles.sectionLink}>All modules</Text></Pressable></View>
    <View style={styles.moduleRow}>{quickModules.map((module) => <Pressable key={module.id} onPress={() => openModule(module.id)} style={styles.module}><View style={styles.moduleIcon}><Ionicons color={colors.forest} name={module.icon as keyof typeof Ionicons.glyphMap} size={20} /></View><Text numberOfLines={2} style={styles.moduleText}>{module.title}</Text></Pressable>)}</View>
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Needs attention</Text><Text style={styles.sectionLink}>View all</Text></View>
    <View style={styles.attention}>{data?.attention.map(([title, detail, icon, moduleId], index) => <Pressable key={`${title}-${index}`} onPress={() => moduleId && openModule(moduleId)} style={[styles.attentionRow, index < data.attention.length - 1 && styles.rowBorder]}><View style={styles.attentionIcon}><Ionicons color={colors.forest} name={icon as keyof typeof Ionicons.glyphMap} size={19} /></View><View style={styles.attentionCopy}><Text style={styles.attentionTitle}>{title}</Text><Text style={styles.attentionDetail}>{detail}</Text></View><Ionicons color={colors.muted} name="chevron-forward" size={17} /></Pressable>)}</View>
    <View style={styles.activity}><View style={styles.activityIcon}><Ionicons color={colors.success} name="pulse-outline" size={19} /></View><View><Text style={styles.activityTitle}>Workspace live</Text><Text style={styles.activityText}>Access is controlled by your account and property plan.</Text></View></View>
  </Screen>;
}

const styles = StyleSheet.create({
  ownerContent: { paddingBottom: 112, paddingHorizontal: 18 }, ownerContentCompact: { paddingHorizontal: 14 }, ownerHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12, paddingTop: 18 }, ownerHeaderCopy: { flex: 1, paddingRight: 12 }, ownerTitle: { color: colors.ink, fontSize: 31, fontWeight: '900', letterSpacing: 0, marginTop: 5 }, ownerTitleCompact: { fontSize: 27 }, ownerBell: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 18, borderWidth: 1, height: 44, justifyContent: 'center', width: 44, ...shadow }, ownerDot: { backgroundColor: '#F97316', borderColor: colors.surface, borderRadius: 5, borderWidth: 2, height: 9, position: 'absolute', right: 9, top: 8, width: 9 },
  searchBar: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#E9EDF2', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 8, height: 44, marginBottom: 14, paddingLeft: 14, paddingRight: 5, ...shadow }, searchPlaceholder: { color: '#8F98AA', flex: 1, fontSize: 12, fontWeight: '700' }, sparkButton: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  ownerHero: { borderRadius: 18, minHeight: 164, overflow: 'hidden', padding: 16 }, ownerHeroCompact: { minHeight: 152, padding: 14 }, heroGlow: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 120, height: 180, position: 'absolute', right: -84, top: -110, width: 220 }, heroTop: { alignItems: 'center', flexDirection: 'row', gap: 10 }, heroIcon: { alignItems: 'center', backgroundColor: 'rgba(214,168,79,0.42)', borderRadius: 10, height: 31, justifyContent: 'center', width: 31 }, ownerHeroLabel: { color: colors.surface, flex: 1, fontSize: 14, fontWeight: '900' }, ownerHeroLabelCompact: { fontSize: 13 }, buildingWrap: { alignItems: 'flex-end', bottom: 0, flexDirection: 'row', gap: 6, opacity: 0.42, position: 'absolute', right: 14 }, buildingWrapCompact: { opacity: 0.18, right: 4 }, buildingTall: { backgroundColor: '#32C8C0', borderRadius: 4, gap: 6, height: 92, padding: 10, width: 42 }, buildingShort: { backgroundColor: '#58D9D3', borderRadius: 4, gap: 6, height: 66, padding: 8, width: 36 }, window: { backgroundColor: 'rgba(0,65,75,0.55)', borderRadius: 2, height: 8, width: 16 }, windowSmall: { backgroundColor: 'rgba(0,65,75,0.48)', borderRadius: 2, height: 7, width: 14 },
  ownerMetrics: { flexDirection: 'row', marginTop: 38 }, ownerMetricsCompact: { marginTop: 34 }, ownerMetric: { flex: 1, minWidth: 0 }, ownerMetricBorder: { borderLeftColor: 'rgba(255,255,255,0.35)', borderLeftWidth: 1, paddingLeft: 8 }, ownerMetricValue: { color: colors.surface, fontSize: 27, fontWeight: '900', letterSpacing: 0 }, ownerMetricValueCompact: { fontSize: 23 }, ownerMetricLabel: { color: '#D2F0ED', fontSize: 10, fontWeight: '700', marginTop: 3 }, ownerLoader: { marginTop: 42 },
  ownerSectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 20 }, ownerSectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', letterSpacing: 0 }, linkButton: { alignItems: 'center', flexDirection: 'row', gap: 2 }, ownerSectionLink: { color: colors.forest, fontSize: 11, fontWeight: '900' }, ownerModuleRow: { flexDirection: 'row', gap: 8, paddingRight: 6 }, ownerModule: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 14, borderWidth: 1, height: 102, justifyContent: 'center', paddingHorizontal: 6, width: 82 }, ownerModuleIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 15, height: 44, justifyContent: 'center', width: 44 }, ownerModuleText: { color: colors.ink, fontSize: 10, fontWeight: '900', lineHeight: 13, marginTop: 8, minHeight: 26, textAlign: 'center' },
  ownerAttention: { backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 15, borderWidth: 1, marginBottom: 16, paddingHorizontal: 10, paddingVertical: 2 }, ownerAttentionRow: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 55 }, ownerRowBorder: { borderBottomColor: '#EBEEF2', borderBottomWidth: 1 }, ownerAttentionIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 11, height: 38, justifyContent: 'center', width: 38 }, ownerAttentionCopy: { flex: 1 }, ownerAttentionTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' }, ownerAttentionDetail: { color: '#7B8496', fontSize: 10, fontWeight: '600', marginTop: 2 }, ownerCount: { alignItems: 'center', borderRadius: 11, height: 26, justifyContent: 'center', minWidth: 30, paddingHorizontal: 7 }, ownerCountText: { fontSize: 11, fontWeight: '900' }, ownerEmpty: { color: colors.muted, fontSize: 12, fontWeight: '700', paddingVertical: 18, textAlign: 'center' }, pressed: { opacity: 0.74 },
  floatingLayer: { bottom: 86, left: 0, pointerEvents: 'box-none', position: 'absolute', right: 0, zIndex: 20 }, floatingBackdrop: { bottom: -86, left: 0, position: 'absolute', right: 0, top: -900 }, quickMenuFloating: { alignSelf: 'flex-end', backgroundColor: colors.surface, borderColor: '#DCEBE7', borderRadius: 16, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10, marginRight: 18, padding: 10, width: 244 }, quickMenuItem: { alignItems: 'center', backgroundColor: '#F8FFFD', borderColor: '#E5F3EF', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 7, minHeight: 38, paddingHorizontal: 8, width: '48%' }, quickMenuIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 8, height: 26, justifyContent: 'center', width: 26 }, quickMenuText: { color: colors.ink, flex: 1, fontSize: 10, fontWeight: '900' }, quickActionsFloating: { alignItems: 'center', alignSelf: 'flex-end', backgroundColor: colors.forest, borderColor: '#69D0C6', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 7, height: 42, justifyContent: 'center', marginRight: 18, minWidth: 146, paddingHorizontal: 14 }, quickActionsOpen: { backgroundColor: '#095E57' }, quickActionsText: { color: colors.surface, fontSize: 12, fontWeight: '900' },
  searchModal: { backgroundColor: colors.canvas, flex: 1 }, searchModalHeader: { alignItems: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 16, paddingTop: 8 }, searchModalBar: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#E4E8EE', borderRadius: 18, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 8, height: 42, paddingHorizontal: 12 }, searchModalInput: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: '700', height: 40, padding: 0 }, searchClose: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#E4E8EE', borderRadius: 16, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 }, searchLoader: { marginTop: 28 }, searchResults: { padding: 16, paddingBottom: 40 }, searchResult: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 11, marginBottom: 9, minHeight: 64, padding: 11 }, searchResultIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 11, height: 38, justifyContent: 'center', width: 38 }, searchResultCopy: { flex: 1, minWidth: 0 }, searchResultTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' }, searchResultSubtitle: { color: colors.muted, fontSize: 10, fontWeight: '600', lineHeight: 14, marginTop: 3 }, searchType: { color: colors.forest, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }, emptySearch: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 28, textAlign: 'center' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 22, paddingTop: 18 }, kicker: { color: colors.forest, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, title: { color: colors.ink, fontSize: 25, fontWeight: '900', letterSpacing: 0, marginTop: 6 }, bell: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, height: 45, justifyContent: 'center', width: 45 }, notificationDot: { backgroundColor: colors.warning, borderColor: colors.surface, borderRadius: 5, borderWidth: 2, height: 9, position: 'absolute', right: 9, top: 8, width: 9 },
  hero: { backgroundColor: colors.forest, borderRadius: radius.lg, padding: 20 }, heroLabel: { color: '#B6E5DD', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }, metrics: { flexDirection: 'row', marginTop: 19 }, metric: { flex: 1 }, metricBorder: { borderLeftColor: 'rgba(255,255,255,0.2)', borderLeftWidth: 1, paddingLeft: 14 }, metricValue: { color: colors.surface, fontSize: 22, fontWeight: '900', letterSpacing: 0 }, metricLabel: { color: '#C4E1DC', fontSize: 9, marginTop: 5 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 27 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', letterSpacing: 0 }, sectionLink: { color: colors.forest, fontSize: 11, fontWeight: '800' }, moduleRow: { flexDirection: 'row', gap: 8 }, module: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, flex: 1, minHeight: 96, paddingHorizontal: 5, paddingVertical: 12 }, moduleIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 11, height: 38, justifyContent: 'center', width: 38 }, moduleText: { color: colors.ink, fontSize: 9, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  attention: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 15 }, attentionRow: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 15 }, rowBorder: { borderBottomColor: colors.border, borderBottomWidth: 1 }, attentionIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 11, height: 40, justifyContent: 'center', width: 40 }, attentionCopy: { flex: 1 }, attentionTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, attentionDetail: { color: colors.muted, fontSize: 10, marginTop: 4 },
  activity: { alignItems: 'center', backgroundColor: '#ECFDF3', borderRadius: radius.sm, flexDirection: 'row', gap: 11, marginTop: 18, padding: 14 }, activityIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, height: 36, justifyContent: 'center', width: 36 }, activityTitle: { color: '#067647', fontSize: 11, fontWeight: '900' }, activityText: { color: '#42806A', fontSize: 9, marginTop: 3 }, error: { color: colors.danger, fontSize: 11, marginTop: 8 },
});
