import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow } from '@/theme';
import type { AvailableRole, Session } from '@/types';

export function OwnerPropertySwitcher({ onSwitch, session }: { onSwitch: (role: AvailableRole) => void | Promise<void>; session: Session }) {
  const [open, setOpen] = useState(false);
  const ownerWorkspaces = useMemo(() => {
    const current: AvailableRole = { accountSlug: session.accountSlug, destination: '', orgId: session.orgId, role: 'owner', workspace: session.workspace };
    const seen = new Set<string>();
    return [current, ...session.availableRoles.filter((item) => item.role === 'owner')].filter((item) => {
      const key = `${item.orgId}-${item.accountSlug}-${item.workspace}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [session.accountSlug, session.availableRoles, session.orgId, session.workspace]);
  const canSwitch = ownerWorkspaces.length > 1;

  return <>
    <View style={styles.kickerRow}>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={({ pressed }) => [styles.propertyButton, pressed && styles.pressed]}>
        <Text numberOfLines={1} style={styles.propertyText}>{session.workspace.toUpperCase()}</Text>
        <Ionicons color={colors.forest} name="chevron-down" size={13} />
      </Pressable>
      <Text style={styles.separator}>·</Text>
      <Text style={styles.roleText}>OWNER</Text>
    </View>
    <Modal animationType="slide" transparent visible={open} onRequestClose={() => setOpen(false)}>
      <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
        <Pressable style={[styles.sheet, shadow]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Switch property</Text>
          <Text style={styles.sheetSubtitle}>{canSwitch ? 'Choose one of your owner workspaces.' : 'Only one owner workspace is assigned to this account.'}</Text>
          {ownerWorkspaces.map((property) => {
            const active = property.orgId === session.orgId && property.accountSlug === session.accountSlug;
            return <Pressable key={`${property.orgId}-${property.accountSlug}`} onPress={() => { setOpen(false); if (!active) void onSwitch(property); }} style={[styles.option, active && styles.optionActive]}>
              <View style={styles.optionIcon}><Ionicons color={colors.forest} name="business-outline" size={19} /></View>
              <Text style={styles.optionText}>{property.workspace}</Text>
              {active ? <Ionicons color={colors.forest} name="checkmark-circle" size={21} /> : <Text style={styles.switchText}>Switch</Text>}
            </Pressable>;
          })}
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  kickerRow: { alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: 7, minWidth: 0 },
  propertyButton: { alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: 3, minWidth: 0 },
  propertyText: { color: colors.forest, flexShrink: 1, fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  separator: { color: colors.forest, fontSize: 10, fontWeight: '900' },
  roleText: { color: colors.forest, fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  backdrop: { backgroundColor: 'rgba(16, 24, 40, 0.25)', flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 28, paddingHorizontal: 18, paddingTop: 10 },
  handle: { alignSelf: 'center', backgroundColor: '#D0D5DD', borderRadius: radius.pill, height: 4, marginBottom: 16, width: 42 },
  sheetTitle: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  sheetSubtitle: { color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 12, marginTop: 5 },
  option: { alignItems: 'center', borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 12, marginTop: 9, minHeight: 54, paddingHorizontal: 13 },
  optionActive: { backgroundColor: colors.forestSoft, borderColor: '#B9EADF' },
  optionIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, height: 36, justifyContent: 'center', width: 36 },
  optionText: { color: colors.ink, flex: 1, fontSize: 14, fontWeight: '800' },
  switchText: { color: colors.forest, fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.7 },
});
