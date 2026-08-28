import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useAuth } from '@/auth';
import { Screen } from '@/components/Screen';
import { loadNotifications, markNotificationRead } from '@/services/notifications';
import type { HostinNotification } from '@/services/notifications';
import { enablePushNotifications } from '@/services/push';
import { colors, radius, shadow } from '@/theme';

const chips = ['All', 'Urgent', 'Payments', 'Residents', 'Operations'];

function notificationIcon(type?: string): keyof typeof Ionicons.glyphMap {
  if (type?.includes('gate')) return 'exit-outline';
  if (type?.includes('complaint')) return 'construct-outline';
  if (type?.includes('document')) return 'document-text-outline';
  if (type?.includes('announcement')) return 'megaphone-outline';
  if (type?.includes('visitor')) return 'person-outline';
  return 'notifications-outline';
}

function moduleFor(type?: string) {
  if (type?.includes('gate')) return 'gate';
  if (type?.includes('complaint')) return 'complaints';
  if (type?.includes('document')) return 'documents';
  if (type?.includes('announcement')) return 'community';
  if (type?.includes('payment') || type?.includes('due')) return 'finance';
  if (type?.includes('visitor')) return 'visitors';
  return 'overview';
}

function actionFor(type?: string) {
  if (type?.includes('gate')) return 'Review';
  if (type?.includes('complaint')) return 'View details';
  if (type?.includes('document')) return 'View';
  if (type?.includes('visitor')) return 'Verify';
  if (type?.includes('maintenance')) return 'Remind';
  return 'View';
}

export default function NotificationsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [alerts, setAlerts] = useState<HostinNotification[]>([]);
  const [activeChip, setActiveChip] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [enablingPush, setEnablingPush] = useState(false);

  const refresh = async (pull = false) => {
    if (!session) return;
    pull ? setRefreshing(true) : setLoading(true); setError('');
    try { setAlerts(await loadNotifications(session)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load notifications.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { void refresh(); }, [session?.accessToken, session?.orgId]);

  const unreadCount = alerts.filter((alert) => alert.unread).length;
  const isCompact = width < 390;
  const visibleAlerts = useMemo(() => {
    if (activeChip === 'All') return alerts;
    if (activeChip === 'Urgent') return alerts.filter((alert) => alert.unread || alert.type?.includes('gate') || alert.type?.includes('complaint'));
    if (activeChip === 'Payments') return alerts.filter((alert) => alert.type?.includes('payment') || alert.type?.includes('due'));
    if (activeChip === 'Residents') return alerts.filter((alert) => alert.type?.includes('document') || alert.type?.includes('visitor'));
    return alerts.filter((alert) => alert.type?.includes('gate') || alert.type?.includes('complaint') || alert.type?.includes('announcement'));
  }, [activeChip, alerts]);

  const read = async (alert: HostinNotification) => {
    if (!session) return;
    if (alert.unread) setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, unread: false } : item));
    router.push({ pathname: '/module/[id]', params: { id: moduleFor(alert.type) } });
    try { if (alert.unread) await markNotificationRead(session, alert.id); }
    catch { setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, unread: true } : item)); }
  };

  const enablePush = async () => {
    if (!session) return;
    setEnablingPush(true);
    try {
      const result = await enablePushNotifications(session);
      Alert.alert(result.enabled ? 'Notification setup' : 'Push unavailable', result.message);
    } catch (cause) { Alert.alert('Push setup failed', cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setEnablingPush(false); }
  };

  return <Screen contentStyle={[styles.content, isCompact && styles.contentCompact]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(true)} tintColor={colors.forest} />}>
    <View style={styles.heading}>
      <View style={styles.headingCopy}>
        <Text style={[styles.eyebrow, isCompact && styles.eyebrowCompact]}>LIVE ACTIVITY</Text>
        <Text style={[styles.title, isCompact && styles.titleCompact]}>Alerts</Text>
        <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>Priority updates from your property and enabled modules.</Text>
      </View>
      {unreadCount > 0 && <Pressable onPress={() => setActiveChip('Urgent')} style={styles.count}><Text style={styles.countText}>{unreadCount} NEW</Text></Pressable>}
    </View>

    {Platform.OS !== 'web' && <Pressable disabled={enablingPush} onPress={() => void enablePush()} style={[styles.pushCard, isCompact && styles.pushCardCompact]}>
      <View style={styles.pushIcon}>{enablingPush ? <ActivityIndicator color={colors.forest} size="small" /> : <Ionicons color={colors.forest} name="notifications-outline" size={29} />}</View>
      <View style={styles.pushCopy}><Text style={styles.pushTitle}>Enable device alerts</Text><Text style={styles.pushText}>Get real-time updates on this device.</Text></View>
      <Ionicons color={colors.forest} name="chevron-forward" size={26} />
    </Pressable>}

    <ScrollView horizontal contentContainerStyle={styles.chips} showsHorizontalScrollIndicator={false}>
      {chips.map((chip) => <Pressable key={chip} onPress={() => setActiveChip(chip)} style={[styles.chip, activeChip === chip && styles.chipActive]}>
        <Text style={[styles.chipText, activeChip === chip && styles.chipTextActive]}>{chip}</Text>
        {chip === 'Urgent' && <View style={styles.urgentDot} />}
      </Pressable>)}
    </ScrollView>

    {loading ? <ActivityIndicator color={colors.forest} style={styles.loader} /> : error ? <View style={styles.empty}><Ionicons name="cloud-offline-outline" color={colors.danger} size={30} /><Text style={styles.emptyTitle}>Alerts unavailable</Text><Text style={styles.emptyText}>{error}</Text><Pressable onPress={() => void refresh()}><Text style={styles.retry}>Try again</Text></Pressable></View> : visibleAlerts.length ? <View style={styles.list}>
      {visibleAlerts.map((alert) => <Pressable key={alert.id} onPress={() => void read(alert)} style={({ pressed }) => [styles.card, isCompact && styles.cardCompact, shadow, pressed && styles.pressed]}>
        <View style={[styles.priorityDot, { backgroundColor: alert.unread ? '#EF3E46' : colors.forest }]} />
        <View style={[styles.cardIcon, isCompact && styles.cardIconCompact]}><Ionicons color={colors.forest} name={notificationIcon(alert.type)} size={isCompact ? 24 : 30} /></View>
        <View style={styles.cardCopy}>
          <View style={styles.cardTop}><Text numberOfLines={1} style={styles.cardTitle}>{alert.title}</Text><Text style={styles.time}>{alert.createdAt} ago</Text></View>
          <Text numberOfLines={1} style={styles.body}>{alert.body}</Text>
          <View style={styles.cardFooter}><View style={styles.moduleTag}><Ionicons color={colors.forest} name={notificationIcon(alert.type)} size={13} /><Text style={styles.moduleTagText}>{moduleFor(alert.type).replace('-', ' ')}</Text></View><View style={styles.actionPill}><Text style={styles.actionText}>{actionFor(alert.type)}</Text></View></View>
        </View>
        {alert.unread && <View style={styles.unreadDot} />}
      </Pressable>)}
    </View> : <View style={styles.empty}><Ionicons name="notifications-off-outline" color={colors.muted} size={31} /><Text style={styles.emptyTitle}>Nothing urgent right now</Text><Text style={styles.emptyText}>New property activity will appear here.</Text></View>}
  </Screen>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 102, paddingHorizontal: 18 },
  contentCompact: { paddingHorizontal: 14 },
  heading: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 18 },
  headingCopy: { flex: 1, paddingRight: 14 },
  eyebrow: { color: colors.forest, fontSize: 10, fontWeight: '900', letterSpacing: 2.2 },
  eyebrowCompact: { fontSize: 9, letterSpacing: 1.7 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '900', letterSpacing: 0, marginTop: 12 },
  titleCompact: { fontSize: 30 },
  subtitle: { color: colors.muted, fontSize: 14, fontWeight: '500', lineHeight: 21, marginTop: 6 },
  subtitleCompact: { fontSize: 12, lineHeight: 18 },
  count: { backgroundColor: colors.forestSoft, borderRadius: radius.pill, marginTop: 28, paddingHorizontal: 13, paddingVertical: 8 },
  countText: { color: colors.forest, fontSize: 11, fontWeight: '900' },
  pushCard: { alignItems: 'center', backgroundColor: '#F0FFFC', borderColor: '#CDEFE8', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, marginTop: 22, minHeight: 76, paddingHorizontal: 14 },
  pushCardCompact: { gap: 10, paddingHorizontal: 12 },
  pushIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 13, height: 48, justifyContent: 'center', width: 48 },
  pushCopy: { flex: 1 },
  pushTitle: { color: colors.forest, fontSize: 14, fontWeight: '900' },
  pushText: { color: colors.muted, fontSize: 12, fontWeight: '500', marginTop: 4 },
  chips: { gap: 9, paddingRight: 16 },
  chip: { alignItems: 'center', borderColor: '#E1E5EC', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 7, height: 38, justifyContent: 'center', marginTop: 18, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest, ...shadow },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  chipTextActive: { color: colors.surface },
  urgentDot: { backgroundColor: '#EF3E46', borderRadius: 4, height: 8, width: 8 },
  list: { gap: 9, marginTop: 24 },
  card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 100, paddingHorizontal: 14, paddingVertical: 14 },
  cardCompact: { alignItems: 'flex-start', gap: 10, minHeight: 96, paddingHorizontal: 12, paddingVertical: 13 },
  priorityDot: { borderRadius: 4, height: 8, marginLeft: -4, width: 8 },
  cardIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 13, height: 48, justifyContent: 'center', width: 48 },
  cardIconCompact: { borderRadius: 11, height: 42, width: 42 },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  cardTitle: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: '900' },
  time: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 12, fontWeight: '500', marginTop: 5 },
  cardFooter: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginTop: 9 },
  moduleTag: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  moduleTagText: { color: colors.forest, fontSize: 10, fontWeight: '900', textTransform: 'capitalize' },
  actionPill: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.pill, justifyContent: 'center', minHeight: 31, paddingHorizontal: 12 },
  actionText: { color: colors.forest, fontSize: 11, fontWeight: '900' },
  unreadDot: { backgroundColor: colors.forest, borderRadius: 4, height: 8, position: 'absolute', right: 17, top: 21, width: 8 },
  loader: { marginTop: 60 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 11 },
  emptyText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: 'center' },
  retry: { color: colors.forest, fontSize: 13, fontWeight: '900', marginTop: 14 },
  pressed: { opacity: 0.74 },
});
