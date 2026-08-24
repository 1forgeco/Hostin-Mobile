import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth';
import { Screen } from '@/components/Screen';
import { modulesForRole, roleLabels } from '@/modules';
import { DashboardData, loadDashboard } from '@/services/dashboard';
import { colors, radius } from '@/theme';

export default function DashboardScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const role = session?.user.role ?? 'tenant';
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const refresh = async (pull = false) => { if (!session) return; if (pull) setRefreshing(true); setError(''); try { setData(await loadDashboard(session)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load dashboard.'); } finally { setRefreshing(false); } };
  useEffect(() => { void refresh(); }, [session?.accessToken, session?.orgId, session?.user.role]);
  const modules = modulesForRole(role).slice(0, 4);
  return <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(true)} tintColor={colors.forest} />}>
    <View style={styles.header}><View><Text style={styles.kicker}>{(session?.workspace ?? 'City Complex').toUpperCase()} · {roleLabels[role].toUpperCase()}</Text><Text style={styles.title}>Hello, {session?.user.name}</Text></View><Pressable onPress={() => router.push('/notifications')} style={styles.bell}><Ionicons color={colors.ink} name="notifications-outline" size={22} /><View style={styles.notificationDot} /></Pressable></View>
    <View style={styles.hero}>{data ? <><Text style={styles.heroLabel}>{data.headline.toUpperCase()}</Text><View style={styles.metrics}>{data.metrics.map(([value, label], index) => <View key={label} style={[styles.metric, index > 0 && styles.metricBorder]}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>)}</View></> : <ActivityIndicator color="#fff" />}</View>{!!error && <Text style={styles.error}>{error}</Text>}
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Quick access</Text><Pressable onPress={() => router.push('/modules')}><Text style={styles.sectionLink}>All modules</Text></Pressable></View>
    <View style={styles.moduleRow}>{modules.map((module) => <Pressable key={module.id} onPress={() => router.push({ pathname: '/module/[id]', params: { id: module.id } })} style={styles.module}><View style={styles.moduleIcon}><Ionicons color={colors.forest} name={module.icon as keyof typeof Ionicons.glyphMap} size={20} /></View><Text numberOfLines={2} style={styles.moduleText}>{module.title}</Text></Pressable>)}</View>
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Needs attention</Text><Text style={styles.sectionLink}>View all</Text></View>
    <View style={styles.attention}>{data?.attention.map(([title, detail, icon, moduleId], index) => <Pressable key={`${title}-${index}`} onPress={() => moduleId && router.push({ pathname: '/module/[id]', params: { id: moduleId } })} style={[styles.attentionRow, index < data.attention.length - 1 && styles.rowBorder]}><View style={styles.attentionIcon}><Ionicons color={colors.forest} name={icon as keyof typeof Ionicons.glyphMap} size={19} /></View><View style={styles.attentionCopy}><Text style={styles.attentionTitle}>{title}</Text><Text style={styles.attentionDetail}>{detail}</Text></View><Ionicons color={colors.muted} name="chevron-forward" size={17} /></Pressable>)}</View>
    <View style={styles.activity}><View style={styles.activityIcon}><Ionicons color={colors.success} name="pulse-outline" size={19} /></View><View><Text style={styles.activityTitle}>Workspace live</Text><Text style={styles.activityText}>Access is controlled by your role and property plan.</Text></View></View>
  </Screen>;
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 22, paddingTop: 18 }, kicker: { color: colors.forest, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, title: { color: colors.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.8, marginTop: 6 }, bell: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, height: 45, justifyContent: 'center', width: 45 }, notificationDot: { backgroundColor: colors.warning, borderColor: colors.surface, borderRadius: 5, borderWidth: 2, height: 9, position: 'absolute', right: 9, top: 8, width: 9 },
  hero: { backgroundColor: colors.forest, borderRadius: radius.lg, padding: 20 }, heroLabel: { color: '#B6E5DD', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }, metrics: { flexDirection: 'row', marginTop: 19 }, metric: { flex: 1 }, metricBorder: { borderLeftColor: 'rgba(255,255,255,0.2)', borderLeftWidth: 1, paddingLeft: 14 }, metricValue: { color: colors.surface, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }, metricLabel: { color: '#C4E1DC', fontSize: 9, marginTop: 5 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 27 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 }, sectionLink: { color: colors.forest, fontSize: 11, fontWeight: '800' }, moduleRow: { flexDirection: 'row', gap: 8 }, module: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, flex: 1, minHeight: 96, paddingHorizontal: 5, paddingVertical: 12 }, moduleIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 11, height: 38, justifyContent: 'center', width: 38 }, moduleText: { color: colors.ink, fontSize: 9, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  attention: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 15 }, attentionRow: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 15 }, rowBorder: { borderBottomColor: colors.border, borderBottomWidth: 1 }, attentionIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 11, height: 40, justifyContent: 'center', width: 40 }, attentionCopy: { flex: 1 }, attentionTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, attentionDetail: { color: colors.muted, fontSize: 10, marginTop: 4 },
  activity: { alignItems: 'center', backgroundColor: '#ECFDF3', borderRadius: radius.sm, flexDirection: 'row', gap: 11, marginTop: 18, padding: 14 }, activityIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, height: 36, justifyContent: 'center', width: 36 }, activityTitle: { color: '#067647', fontSize: 11, fontWeight: '900' }, activityText: { color: '#42806A', fontSize: 9, marginTop: 3 }, error: { color: colors.danger, fontSize: 11, marginTop: 8 },
});
