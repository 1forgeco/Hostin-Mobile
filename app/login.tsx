import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth';
import { Logo } from '@/components/Logo';
import { demoAccounts, demoPassword } from '@/services/api';
import { colors, radius, shadow } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState(demoPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      await signIn(email, password);
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to sign in.');
    } finally { setLoading(false); }
  };

  return <LinearGradient colors={[colors.canvas, '#EEF3EF']} style={styles.flex}>
    <SafeAreaView style={styles.flex}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.wrapper} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.heroArt} pointerEvents="none">
        <View style={[styles.cloud, styles.cloudOne]} />
        <View style={[styles.cloud, styles.cloudTwo]} />
        <View style={[styles.tower, styles.towerBack]} />
        <View style={[styles.tower, styles.towerMain]}>
          <View style={styles.roof} />
          <View style={styles.windowGrid}>{Array.from({ length: 12 }).map((_, index) => <View key={index} style={styles.windowPane} />)}</View>
        </View>
        <View style={styles.podium} />
        <View style={styles.trees}><View style={styles.tree} /><View style={[styles.tree, styles.treeSmall]} /><View style={styles.tree} /></View>
      </View>
      <View style={styles.brand}><Logo /></View>
      <View style={styles.intro}><Text style={styles.title}>Welcome back</Text><Text style={styles.subtitle}>Sign in to manage your property, tenants, and operations.</Text></View>
      <View style={styles.card}>
        <Text style={styles.label}>Email address</Text>
        <View style={styles.inputWrap}><Ionicons color={colors.muted} name="mail-outline" size={19} /><TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#9AA39F" style={styles.input} value={email} /></View>
        <Text style={styles.passwordLabel}>Password</Text>
        <View style={styles.inputWrap}><Ionicons color={colors.muted} name="lock-closed-outline" size={19} /><TextInput autoCapitalize="none" onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor="#9AA39F" secureTextEntry={!showPassword} style={styles.input} value={password} /><Pressable hitSlop={10} onPress={() => setShowPassword((current) => !current)}><Ionicons color={colors.muted} name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} /></Pressable></View>
        <Pressable onPress={() => Alert.alert('Reset your password', 'Contact your property administrator to reset the account securely.')} style={styles.forgotButton}><Text style={styles.forgot}>Forgot password?</Text></Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable disabled={loading} onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>{loading ? <ActivityIndicator color={colors.surface} /> : <><Text style={styles.buttonText}>Sign in</Text><Ionicons color={colors.surface} name="arrow-forward" size={24} /></>}</Pressable>
      </View>
      <View style={styles.roles}>
        <Text style={styles.roleLabel}>Sign in as</Text>
        <ScrollView horizontal contentContainerStyle={styles.roleCarousel} keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}>{demoAccounts.map((account) => {
          const selected = email === account.email;
          return <Pressable key={account.role} onPress={() => { setEmail(account.email); setPassword(account.password ?? demoPassword); setError(''); }} style={[styles.rolePill, selected && styles.rolePillSelected]}>
            <Ionicons color={selected ? colors.surface : colors.ink} name={account.icon as keyof typeof Ionicons.glyphMap} size={18} />
            <Text style={[styles.roleName, selected && styles.roleNameSelected]}>{account.role === 'staff' ? 'Staff' : account.label}</Text>
          </Pressable>;
        })}</ScrollView>
      </View>
      <View style={styles.footerRow}><View style={styles.footerIcon}><Ionicons color={colors.forest} name="shield-checkmark-outline" size={15} /></View><Text style={styles.footer}>By continuing, you agree to Hostin's <Text style={styles.footerLink}>Terms</Text> and <Text style={styles.footerLink}>Privacy Policy</Text>.</Text></View>
    </ScrollView></KeyboardAvoidingView></SafeAreaView>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrapper: { alignSelf: 'center', maxWidth: 520, minHeight: '100%', overflow: 'hidden', paddingBottom: 34, paddingHorizontal: 20, paddingTop: 64, width: '100%' },
  heroArt: { height: 260, opacity: 0.82, position: 'absolute', right: -8, top: 36, width: 260 },
  cloud: { backgroundColor: 'rgba(255,255,255,0.76)', borderRadius: radius.pill, position: 'absolute' },
  cloudOne: { height: 42, right: -12, top: 28, width: 102 },
  cloudTwo: { height: 30, right: 82, top: 88, width: 80 },
  tower: { position: 'absolute' },
  towerBack: { backgroundColor: 'rgba(208,225,226,0.48)', height: 132, right: 128, top: 96, width: 38 },
  towerMain: { backgroundColor: '#F7FBFA', borderColor: 'rgba(130,169,174,0.28)', borderWidth: 1, height: 174, justifyContent: 'flex-end', right: 16, top: 58, width: 94 },
  roof: { backgroundColor: '#93B5BA', height: 18, position: 'absolute', right: 0, top: -18, width: 70 },
  windowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, padding: 10 },
  windowPane: { backgroundColor: 'rgba(15,118,110,0.22)', height: 26, width: 19 },
  podium: { backgroundColor: '#0F766E', bottom: 16, height: 30, position: 'absolute', right: 0, width: 120 },
  trees: { alignItems: 'flex-end', bottom: 8, flexDirection: 'row', gap: 3, position: 'absolute', right: 82 },
  tree: { backgroundColor: 'rgba(15,118,110,0.32)', borderRadius: radius.pill, height: 44, width: 30 },
  treeSmall: { height: 34, width: 26 },
  brand: { marginBottom: 38, marginTop: 128 },
  intro: { marginBottom: 28 },
  title: { color: colors.ink, fontSize: 38, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 26, marginTop: 22, maxWidth: 340 },
  card: { backgroundColor: 'rgba(255,255,255,0.96)', borderColor: 'rgba(255,255,255,0.86)', borderRadius: radius.lg, borderWidth: 1, padding: 24, ...shadow },
  label: { color: colors.ink, fontSize: 16, fontWeight: '800', marginBottom: 14 },
  inputWrap: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.72)', borderColor: '#B8D7D2', borderRadius: radius.sm, borderWidth: 1.5, flexDirection: 'row', gap: 14, height: 64, paddingHorizontal: 18 },
  input: { color: colors.ink, flex: 1, fontSize: 16 },
  passwordLabel: { color: colors.ink, fontSize: 16, fontWeight: '800', marginBottom: 14, marginTop: 28 },
  forgotButton: { alignSelf: 'flex-end', marginTop: 16 },
  forgot: { color: colors.forest, fontSize: 14, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 12, marginTop: 12 },
  button: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radius.sm, flexDirection: 'row', height: 64, justifyContent: 'center', marginTop: 30 },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  buttonText: { color: colors.surface, fontSize: 19, fontWeight: '800', marginRight: 70 },
  roles: { marginTop: 30 },
  roleLabel: { color: colors.ink, fontSize: 16, fontWeight: '800', marginBottom: 14 },
  roleCarousel: { gap: 12, paddingRight: 20 },
  rolePill: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', gap: 9, height: 50, justifyContent: 'center', paddingHorizontal: 18 },
  rolePillSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  roleName: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  roleNameSelected: { color: colors.surface },
  footerRow: { alignItems: 'center', flexDirection: 'row', gap: 11, marginTop: 34 },
  footerIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.pill, height: 28, justifyContent: 'center', width: 28 },
  footer: { color: colors.muted, flex: 1, fontSize: 12, lineHeight: 19 },
  footerLink: { color: colors.forest, fontWeight: '800' },
});
