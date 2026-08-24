import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth';
import { Screen } from '@/components/Screen';
import { loadNotifications, markNotificationRead } from '@/services/notifications';
import type { HostinNotification } from '@/services/notifications';
import { enablePushNotifications } from '@/services/push';
import { colors, radius } from '@/theme';

function notificationIcon(type?: string): keyof typeof Ionicons.glyphMap {
  if (type?.includes('gate')) return 'exit-outline';
  if (type?.includes('complaint')) return 'construct-outline';
  if (type?.includes('document')) return 'document-text-outline';
  if (type?.includes('announcement')) return 'megaphone-outline';
  return 'notifications-outline';
}

export default function NotificationsScreen() {
  const { session } = useAuth();
  const [alerts, setAlerts] = useState<HostinNotification[]>([]);
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
  const read = async (alert: HostinNotification) => {
    if (!session || !alert.unread) return;
    setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, unread: false } : item));
    try { await markNotificationRead(session, alert.id); }
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

  return <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(true)} tintColor={colors.forest} />}>
    <View style={styles.heading}><View><Text style={styles.eyebrow}>LIVE ACTIVITY</Text><Text style={styles.title}>Notifications</Text></View>{alerts.some((alert) => alert.unread) && <View style={styles.count}><Text style={styles.countText}>{alerts.filter((alert) => alert.unread).length} NEW</Text></View>}</View>
    <Text style={styles.subtitle}>Updates from your property and enabled modules.</Text>
    {Platform.OS !== 'web' && <Pressable disabled={enablingPush} onPress={() => void enablePush()} style={styles.pushButton}>{enablingPush ? <ActivityIndicator color={colors.forest} size="small" /> : <Ionicons color={colors.forest} name="phone-portrait-outline" size={18} />}<Text style={styles.pushText}>Enable device alerts</Text></Pressable>}
    {loading ? <ActivityIndicator color={colors.forest} style={styles.loader} /> : error ? <View style={styles.empty}><Ionicons name="cloud-offline-outline" color={colors.danger} size={28} /><Text style={styles.emptyTitle}>Notifications unavailable</Text><Text style={styles.emptyText}>{error}</Text><Pressable onPress={() => void refresh()}><Text style={styles.retry}>Try again</Text></Pressable></View> : alerts.length ? <View style={styles.list}>{alerts.map((alert, index) => <Pressable key={alert.id} onPress={() => void read(alert)} style={[styles.item, index < alerts.length - 1 && styles.border]}><View style={styles.icon}><Ionicons color={colors.forest} name={notificationIcon(alert.type)} size={19} /></View><View style={styles.copy}><View style={styles.row}><Text style={styles.name}>{alert.title}</Text><Text style={styles.time}>{alert.createdAt}</Text></View><Text style={styles.body}>{alert.body}</Text>{alert.unread && <Text style={styles.tap}>Tap to mark read</Text>}</View>{alert.unread && <View style={styles.dot} />}</Pressable>)}</View> : <View style={styles.empty}><Ionicons name="notifications-off-outline" color={colors.muted} size={29} /><Text style={styles.emptyTitle}>You’re all caught up</Text><Text style={styles.emptyText}>New property activity will appear here.</Text></View>}
  </Screen>;
}

const styles = StyleSheet.create({
  heading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' }, eyebrow: { color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 20 }, title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -1, marginTop: 7 }, subtitle: { color: colors.muted, fontSize: 13, marginTop: 7 }, count: { backgroundColor: colors.forestSoft, borderRadius: radius.pill, marginBottom: 4, paddingHorizontal: 10, paddingVertical: 6 }, countText: { color: colors.forest, fontSize: 9, fontWeight: '900' }, pushButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.forestSoft, borderRadius: radius.pill, flexDirection: 'row', gap: 7, marginTop: 14, minHeight: 38, paddingHorizontal: 13 }, pushText: { color: colors.forest, fontSize: 11, fontWeight: '800' }, list: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, marginTop: 22, paddingHorizontal: 15 }, item: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 16 }, border: { borderBottomColor: colors.border, borderBottomWidth: 1 }, icon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 13, height: 44, justifyContent: 'center', width: 44 }, copy: { flex: 1 }, row: { flexDirection: 'row', justifyContent: 'space-between' }, name: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: '800' }, time: { color: colors.muted, fontSize: 10 }, body: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 }, tap: { color: colors.forest, fontSize: 9, fontWeight: '700', marginTop: 5 }, dot: { backgroundColor: colors.forest, borderRadius: 4, height: 7, width: 7 }, loader: { marginTop: 55 }, empty: { alignItems: 'center', marginTop: 55, paddingHorizontal: 20 }, emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 10 }, emptyText: { color: colors.muted, fontSize: 12, marginTop: 5, textAlign: 'center' }, retry: { color: colors.forest, fontSize: 13, fontWeight: '800', marginTop: 12 },
});
