import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useAuth } from '@/auth';
import { Screen } from '@/components/Screen';
import { loadNotifications, markNotificationRead } from '@/services/notifications';
import type { HostinNotification } from '@/services/notifications';
import { enablePushNotifications } from '@/services/push';
import { colors, radius } from '@/theme';

const chips = ['All', 'New', 'Payments', 'Activity'];

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
    if (activeChip === 'New') return alerts.filter((alert) => alert.unread);
    if (activeChip === 'Payments') return alerts.filter((alert) => alert.type?.includes('payment') || alert.type?.includes('due'));
    return alerts.filter((alert) => !alert.type?.includes('payment') && !alert.type?.includes('due'));
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
        <Text style={[styles.title, isCompact && styles.titleCompact]}>Alerts</Text>
      </View>
      {unreadCount > 0 && <Pressable onPress={() => setActiveChip('New')} style={styles.count}><Text style={styles.countText}>{unreadCount} NEW</Text></Pressable>}
    </View>

    {Platform.OS !== 'web' && <Pressable disabled={enablingPush} onPress={() => void enablePush()} style={[styles.pushCard, isCompact && styles.pushCardCompact]}>
      <View style={styles.pushIcon}>{enablingPush ? <ActivityIndicator color={colors.forest} size="small" /> : <Ionicons color={colors.forest} name="notifications-outline" size={20} />}</View>
      <Text style={styles.pushTitle}>Enable device alerts</Text>
      <Ionicons color={colors.forest} name="chevron-forward" size={20} />
    </Pressable>}

    <ScrollView horizontal contentContainerStyle={styles.chips} showsHorizontalScrollIndicator={false}>
      {chips.map((chip) => <Pressable key={chip} onPress={() => setActiveChip(chip)} style={[styles.chip, activeChip === chip && styles.chipActive]}>
        <Text style={[styles.chipText, activeChip === chip && styles.chipTextActive]}>{chip}</Text>
        {chip === 'New' && unreadCount > 0 && <View style={styles.urgentDot} />}
      </Pressable>)}
    </ScrollView>

    {loading ? <ActivityIndicator color={colors.forest} style={styles.loader} /> : error ? <View style={styles.empty}><Ionicons name="cloud-offline-outline" color={colors.danger} size={30} /><Text style={styles.emptyTitle}>Alerts unavailable</Text><Text style={styles.emptyText}>{error}</Text><Pressable onPress={() => void refresh()}><Text style={styles.retry}>Try again</Text></Pressable></View> : visibleAlerts.length ? <View style={styles.list}>
      {visibleAlerts.map((alert) => <Pressable key={alert.id} onPress={() => void read(alert)} style={({ pressed }) => [styles.card, alert.unread && styles.cardUnread, pressed && styles.pressed]}>
        <View style={[styles.cardIcon, isCompact && styles.cardIconCompact]}><Ionicons color={colors.forest} name={notificationIcon(alert.type)} size={isCompact ? 20 : 22} /></View>
        <View style={styles.cardCopy}>
          <View style={styles.cardTop}><Text numberOfLines={1} style={styles.cardTitle}>{alert.title}</Text><Text style={styles.time}>{alert.createdAt} ago</Text></View>
          <Text numberOfLines={1} style={styles.body}>{alert.body}</Text>
        </View>
        {alert.unread ? <View style={styles.unreadDot} /> : <Ionicons color="#98A2B3" name="chevron-forward" size={16} />}
      </Pressable>)}
    </View> : <View style={styles.empty}><Ionicons name="notifications-off-outline" color={colors.muted} size={31} /><Text style={styles.emptyTitle}>Nothing urgent right now</Text><Text style={styles.emptyText}>New property activity will appear here.</Text></View>}
  </Screen>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 132, paddingHorizontal: 18 },
  contentCompact: { paddingHorizontal: 14 },
  heading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 },
  headingCopy: { flex: 1, paddingRight: 14 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '900', letterSpacing: 0 },
  titleCompact: { fontSize: 25 },
  count: { backgroundColor: colors.forestSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  countText: { color: colors.forest, fontSize: 11, fontWeight: '900' },
  pushCard: { alignItems: 'center', backgroundColor: '#F0FFFC', borderColor: '#CDEFE8', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, marginTop: 16, minHeight: 52, paddingHorizontal: 12 },
  pushCardCompact: { gap: 10, paddingHorizontal: 12 },
  pushIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 10, height: 34, justifyContent: 'center', width: 34 },
  pushTitle: { color: colors.forest, flex: 1, fontSize: 13, fontWeight: '900' },
  chips: { gap: 8, paddingRight: 16 },
  chip: { alignItems: 'center', borderColor: '#E1E5EC', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 6, height: 33, justifyContent: 'center', marginTop: 14, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  chipTextActive: { color: colors.surface },
  urgentDot: { backgroundColor: '#EF3E46', borderRadius: 3, height: 6, width: 6 },
  list: { gap: 8, marginTop: 18 },
  card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 70, paddingHorizontal: 12, paddingVertical: 10 },
  cardUnread: { borderColor: '#D7F3EC' },
  cardIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 11, height: 40, justifyContent: 'center', width: 40 },
  cardIconCompact: { borderRadius: 10, height: 38, width: 38 },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  cardTitle: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: '900' },
  time: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 4 },
  unreadDot: { backgroundColor: colors.forest, borderRadius: 4, height: 8, width: 8 },
  loader: { marginTop: 60 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 11 },
  emptyText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: 'center' },
  retry: { color: colors.forest, fontSize: 13, fontWeight: '900', marginTop: 14 },
  pressed: { opacity: 0.74 },
});
