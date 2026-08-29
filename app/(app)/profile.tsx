import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useAuth } from '@/auth';
import { Screen } from '@/components/Screen';
import { roleLabels } from '@/modules';
import { colors, radius, shadow } from '@/theme';

const menuRows: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'shield-checkmark-outline', label: 'Login & security' },
  { icon: 'document-text-outline', label: 'Privacy policy' },
  { icon: 'trash-bin-outline', label: 'Data & account requests' },
  { icon: 'help-circle-outline', label: 'Help & support' },
];

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const currentRole = session ? roleLabels[session.user.role] : '';
  const isCompact = width < 390;

  const openRow = (label: string) => {
    if (label === 'Privacy policy') {
      const url = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
      if (url) void Linking.openURL(url); else Alert.alert('Privacy policy', 'Add the published privacy-policy URL before store submission.');
    } else if (label === 'Data & account requests') {
      const email = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
      if (email) void Linking.openURL(`mailto:${email}?subject=HostIn%20data%20or%20account%20request`); else Alert.alert(label, 'Contact your property administrator to request data access, correction, or account deletion.');
    } else if (label === 'Help & support') {
      const email = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
      if (email) void Linking.openURL(`mailto:${email}?subject=HostIn%20support`); else Alert.alert(label, 'Contact your property administrator or HostIn support for assistance.');
    } else Alert.alert(label, 'Your token is encrypted in Keychain or Keystore on this device.');
  };

  return <Screen contentStyle={[styles.content, isCompact && styles.contentCompact]}>
    <View style={styles.header}>
      <View>
        <Text style={[styles.eyebrow, isCompact && styles.eyebrowCompact]}>ACCOUNT</Text>
        <Text style={[styles.title, isCompact && styles.titleCompact]}>You</Text>
      </View>
      <Pressable accessibilityLabel="Open notifications" onPress={() => router.push('/notifications')} style={styles.bell}>
        <Ionicons color={colors.ink} name="notifications-outline" size={20} />
        <View style={styles.dot} />
      </Pressable>
    </View>

    <LinearGradient colors={['#007D73', '#006457', '#004A47']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.profileCard, isCompact && styles.profileCardCompact, shadow]}>
      <View style={styles.profileGlow} />
      <View style={[styles.avatar, isCompact && styles.avatarCompact]}><Text style={[styles.avatarText, isCompact && styles.avatarTextCompact]}>{session?.user.name.slice(0, 1) ?? 'O'}</Text></View>
      <View style={styles.profileCopy}>
        <Text style={styles.name}>{session?.user.name ?? 'Owner'}</Text>
        <Text numberOfLines={1} style={styles.email}>{session?.user.email ?? 'owner@city-complex.hostin.local'}</Text>
        <View style={styles.rolePill}><Text style={styles.rolePillText}>{currentRole.toUpperCase()}</Text></View>
      </View>
      <View style={[styles.buildingGhost, isCompact && styles.buildingGhostCompact]}><Ionicons color="rgba(255,255,255,0.24)" name="business-outline" size={72} /></View>
    </LinearGradient>

    <View style={[styles.menu, shadow]}>
      {menuRows.map((row, index) => <Pressable key={row.label} onPress={() => openRow(row.label)} style={[styles.row, index < menuRows.length - 1 && styles.rowBorder]}>
        <View style={styles.menuIcon}><Ionicons color={colors.forest} name={row.icon} size={20} /></View>
        <Text style={[styles.rowLabel, isCompact && styles.rowLabelCompact]}>{row.label}</Text>
        <Ionicons color="#667085" name="chevron-forward" size={19} />
      </Pressable>)}
    </View>

    <Pressable onPress={() => Alert.alert('Sign out of HostIn?', "You'll need to sign in again to manage City Complex.", [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => void signOut() }])} style={styles.logout}>
      <Ionicons color={colors.danger} name="log-out-outline" size={21} />
      <Text style={styles.logoutText}>Sign out</Text>
    </Pressable>
  </Screen>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 104, paddingHorizontal: 18 },
  contentCompact: { paddingHorizontal: 14 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 18 },
  eyebrow: { color: colors.coral, fontSize: 10, fontWeight: '900', letterSpacing: 2.8 },
  eyebrowCompact: { fontSize: 9, letterSpacing: 2 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '900', letterSpacing: 0, marginTop: 10 },
  titleCompact: { fontSize: 30 },
  bell: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 18, borderWidth: 1, height: 44, justifyContent: 'center', width: 44, ...shadow },
  dot: { backgroundColor: colors.forest, borderColor: colors.surface, borderRadius: 5, borderWidth: 2, height: 9, position: 'absolute', right: 8, top: 7, width: 9 },
  profileCard: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 17, marginTop: 24, minHeight: 118, overflow: 'hidden', padding: 20 },
  profileCardCompact: { gap: 13, marginTop: 20, minHeight: 108, padding: 15 },
  profileGlow: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 78, height: 124, position: 'absolute', right: -18, top: 10, width: 124 },
  avatar: { alignItems: 'center', backgroundColor: colors.coral, borderRadius: 20, height: 68, justifyContent: 'center', width: 68 },
  avatarCompact: { borderRadius: 17, height: 56, width: 56 },
  avatarText: { color: colors.surface, fontSize: 30, fontWeight: '900' },
  avatarTextCompact: { fontSize: 24 },
  profileCopy: { flex: 1, minWidth: 0 },
  name: { color: colors.surface, fontSize: 20, fontWeight: '900' },
  email: { color: '#B9D6D2', fontSize: 12, fontWeight: '500', marginTop: 7 },
  rolePill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.pill, marginTop: 9, paddingHorizontal: 10, paddingVertical: 5 },
  rolePillText: { color: colors.surface, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  buildingGhost: { bottom: 12, position: 'absolute', right: 18 },
  buildingGhostCompact: { opacity: 0.45, right: -12 },
  accessCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#DCEBE7', borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 78, marginTop: 14, padding: 14 },
  accessCardCompact: { alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, padding: 13 },
  accessIcon: { alignItems: 'center', backgroundColor: '#F0FFFC', borderColor: '#DCEBE7', borderRadius: 12, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  accessCopy: { flex: 1, minWidth: 0 },
  accessTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  accessValue: { color: colors.muted, fontSize: 13, fontWeight: '500', marginTop: 4 },
  roleValue: { color: colors.forest, fontSize: 13, fontWeight: '900', marginTop: 4 },
  outlineButton: { alignItems: 'center', borderColor: '#DCEBE7', borderRadius: 11, borderWidth: 1, flexDirection: 'row', gap: 5, minHeight: 36, paddingHorizontal: 11 },
  outlineButtonCompact: { marginLeft: 56 },
  outlineText: { color: colors.forest, fontSize: 11, fontWeight: '900' },
  menu: { backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 16, borderWidth: 1, marginTop: 18, paddingHorizontal: 16, paddingVertical: 6 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 14, minHeight: 56 },
  rowBorder: { borderBottomColor: '#EBEEF2', borderBottomWidth: 1 },
  menuIcon: { alignItems: 'center', backgroundColor: '#F0FFFC', borderColor: '#DCEBE7', borderRadius: 10, borderWidth: 1, height: 38, justifyContent: 'center', width: 38 },
  rowLabel: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: '900' },
  rowLabelCompact: { fontSize: 14 },
  trustCard: { alignItems: 'center', backgroundColor: '#F4FFFC', borderColor: '#CDEFE8', borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 12, marginTop: 18, minHeight: 84, overflow: 'hidden', padding: 14 },
  trustCardCompact: { alignItems: 'flex-start', padding: 13 },
  trustIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 24, height: 46, justifyContent: 'center', width: 46 },
  trustCopy: { flex: 1 },
  trustTitle: { color: colors.forest, fontSize: 14, fontWeight: '900' },
  trustText: { color: colors.muted, fontSize: 11, fontWeight: '500', lineHeight: 16, marginTop: 4 },
  trustBadge: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: 17, height: 54, justifyContent: 'center', marginRight: -4, width: 54 },
  logout: { alignItems: 'center', backgroundColor: '#FFF7F5', borderColor: '#F9CFC8', borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 11, justifyContent: 'center', marginTop: 16, minHeight: 56 },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '900' },
});
