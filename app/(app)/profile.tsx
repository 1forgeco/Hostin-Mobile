import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth';
import { Screen } from '@/components/Screen';
import { roleLabels } from '@/modules';
import { colors, radius } from '@/theme';

const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; note?: string }[] = [
  { icon: 'business-outline', label: 'Workspace access', note: 'City Complex' }, { icon: 'key-outline', label: 'Roles and permissions' },
  { icon: 'notifications-outline', label: 'Notifications' }, { icon: 'shield-checkmark-outline', label: 'Login and security' },
  { icon: 'document-text-outline', label: 'Privacy policy' }, { icon: 'trash-bin-outline', label: 'Data & account requests' },
  { icon: 'help-circle-outline', label: 'Help and support' },
];

export default function ProfileScreen() {
  const { session, signOut, switchRole } = useAuth();
  const router = useRouter();
  const openRow = (label: string) => {
    if (label === 'Notifications') router.push('/notifications');
    else if (label === 'Workspace access' || label === 'Roles and permissions') router.push('/modules');
    else if (label === 'Privacy policy') {
      const url = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
      if (url) void Linking.openURL(url); else Alert.alert('Privacy policy', 'Add the published privacy-policy URL before store submission.');
    } else if (label === 'Data & account requests') {
      const email = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
      if (email) void Linking.openURL(`mailto:${email}?subject=HostIn%20data%20or%20account%20request`); else Alert.alert(label, 'Contact your property administrator to request data access, correction, or account deletion.');
    } else if (label === 'Help and support') {
      const email = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
      if (email) void Linking.openURL(`mailto:${email}?subject=HostIn%20support`); else Alert.alert(label, 'Contact your property administrator or HostIn support for assistance.');
    } else Alert.alert(label, 'Your token is encrypted in Keychain or Keystore on this device.');
  };
  const otherRoles = session?.availableRoles.filter((item) => item.role !== session.user.role || item.orgId !== session.orgId) ?? [];
  return <Screen><Text style={styles.eyebrow}>ACCOUNT</Text><Text style={styles.title}>Your HostIn</Text><View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{session?.user.name.slice(0, 1)}</Text></View><View style={styles.profileCopy}><Text style={styles.name}>{session?.user.name}</Text><Text style={styles.email}>{session?.user.email}</Text><View style={styles.role}><Text style={styles.roleText}>{session ? roleLabels[session.user.role].toUpperCase() : ''}</Text></View></View></View>{otherRoles.length > 0 && <><Text style={styles.sectionLabel}>SWITCH WORKSPACE OR ROLE</Text><View style={styles.switcher}>{otherRoles.map((item) => <Pressable key={`${item.orgId}:${item.role}`} onPress={() => void switchRole(item)} style={styles.switchRow}><View style={styles.icon}><Ionicons color={colors.forest} name="swap-horizontal-outline" size={19} /></View><View style={styles.switchCopy}><Text style={styles.label}>{roleLabels[item.role]}</Text><Text style={styles.note}>{item.workspace}</Text></View><Ionicons color={colors.muted} name="chevron-forward" size={17} /></Pressable>)}</View></>}<View style={styles.menu}>{rows.map((row, index) => <Pressable key={row.label} onPress={() => openRow(row.label)} style={[styles.row, index < rows.length - 1 && styles.rowBorder]}><View style={styles.icon}><Ionicons color={colors.forest} name={row.icon} size={19} /></View><Text style={styles.label}>{row.label}</Text>{row.label === 'Workspace access' ? <Text style={styles.note}>{session?.workspace}</Text> : row.note ? <Text style={styles.note}>{row.note}</Text> : null}<Ionicons color={colors.muted} name="chevron-forward" size={17} /></Pressable>)}</View><Pressable onPress={() => void signOut()} style={styles.logout}><Ionicons color={colors.danger} name="log-out-outline" size={19} /><Text style={styles.logoutText}>Sign out</Text></Pressable><Text style={styles.version}>HostIn Mobile · Reference build</Text></Screen>;
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.coral, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 20 }, title: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -1, marginTop: 7 }, profile: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radius.lg, flexDirection: 'row', marginTop: 22, padding: 18 }, avatar: { alignItems: 'center', backgroundColor: colors.coral, borderRadius: 19, height: 58, justifyContent: 'center', width: 58 }, avatarText: { color: colors.surface, fontSize: 22, fontWeight: '800' }, profileCopy: { flex: 1, marginLeft: 13 }, name: { color: colors.surface, fontSize: 17, fontWeight: '800' }, email: { color: '#B8C9C2', fontSize: 11, marginTop: 4 }, role: { alignSelf: 'flex-start', backgroundColor: '#315A4C', borderRadius: radius.pill, marginTop: 8, paddingHorizontal: 8, paddingVertical: 4 }, roleText: { color: '#D9ECE4', fontSize: 8, fontWeight: '800', letterSpacing: 1 }, sectionLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: -8, marginTop: 20 }, switcher: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, marginTop: 18, paddingHorizontal: 15 }, switchRow: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 13 }, switchCopy: { flex: 1 }, menu: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, marginTop: 18, paddingHorizontal: 15 }, row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 15 }, rowBorder: { borderBottomColor: colors.border, borderBottomWidth: 1 }, icon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 10, height: 36, justifyContent: 'center', width: 36 }, label: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: '700' }, note: { color: colors.muted, fontSize: 10 }, logout: { alignItems: 'center', backgroundColor: '#FFF4F1', borderColor: '#F4DBD5', borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 18, padding: 15 }, logoutText: { color: colors.danger, fontSize: 13, fontWeight: '800' }, version: { color: colors.muted, fontSize: 10, marginTop: 20, textAlign: 'center' },
});
