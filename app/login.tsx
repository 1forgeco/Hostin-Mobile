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
      <View style={styles.brand}><Logo /></View>
      <View style={styles.intro}><Text style={styles.eyebrow}>ONE SECURE ENTRY</Text><Text style={styles.title}>Welcome back.</Text><Text style={styles.subtitle}>Use the account issued by your property. HostIn opens the correct workspace and role automatically.</Text></View>
      <View style={styles.demoHeader}><View><Text style={styles.label}>EXPLORE THE DEMO</Text><Text style={styles.demoTitle}>Try every HostIn role.</Text></View><Text style={styles.demoHint}>Tap to fill</Text></View>
      <View style={styles.roleGrid}>{demoAccounts.map((account) => {
        const selected = email === account.email;
        return <Pressable key={account.role} onPress={() => { setEmail(account.email); setPassword(account.password ?? demoPassword); setError(''); }} style={[styles.roleCard, selected && styles.roleCardSelected]}>
          <View style={[styles.roleIcon, selected && styles.roleIconSelected]}><Ionicons color={selected ? colors.surface : colors.forest} name={account.icon as keyof typeof Ionicons.glyphMap} size={18} /></View>
          <View style={styles.roleCopy}><Text style={styles.roleName}>{account.label}</Text><Text numberOfLines={2} style={styles.roleDetail}>{account.detail}</Text></View>
          {selected ? <Ionicons color={colors.forest} name="checkmark-circle" size={18} /> : null}
        </Pressable>;
      })}</View>
      <View style={styles.card}>
        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <View style={styles.inputWrap}><Ionicons color={colors.muted} name="mail-outline" size={19} /><TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#9AA39F" style={styles.input} value={email} /></View>
        <View style={styles.passwordHeader}><Text style={styles.label}>PASSWORD</Text><Pressable onPress={() => Alert.alert('Reset your password', 'Contact your property administrator to reset the account securely.')}><Text style={styles.forgot}>Forgot password?</Text></Pressable></View>
        <View style={styles.inputWrap}><Ionicons color={colors.muted} name="lock-closed-outline" size={19} /><TextInput autoCapitalize="none" onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor="#9AA39F" secureTextEntry={!showPassword} style={styles.input} value={password} /><Pressable hitSlop={10} onPress={() => setShowPassword((current) => !current)}><Ionicons color={colors.muted} name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} /></Pressable></View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable disabled={loading} onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>{loading ? <ActivityIndicator color={colors.surface} /> : <><Text style={styles.buttonText}>Sign in to Hostin</Text><Ionicons color={colors.surface} name="arrow-forward" size={19} /></>}</Pressable>
        <View style={styles.previewNote}><Ionicons color={colors.forest} name="sparkles-outline" size={16} /><Text style={styles.previewText}>Preview mode uses the exact City Complex demo roles from the HostIn repository.</Text></View>
      </View>
      <Text style={styles.footer}>By continuing, you agree to Hostin's Terms and Privacy Policy.</Text>
    </ScrollView></KeyboardAvoidingView></SafeAreaView>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, wrapper: { alignSelf: 'center', maxWidth: 520, paddingBottom: 36, paddingHorizontal: 22, paddingTop: 34, width: '100%' }, brand: { marginBottom: 28 }, intro: { marginBottom: 24 },
  eyebrow: { color: colors.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 12 }, title: { color: colors.ink, fontSize: 38, fontWeight: '800', letterSpacing: -1.4 }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 10, maxWidth: 380 },
  demoHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11 }, demoTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginTop: 3 }, demoHint: { color: colors.muted, fontSize: 10, marginBottom: 2 }, roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 20 }, roleCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', gap: 9, minHeight: 74, padding: 10, width: '48.5%' }, roleCardSelected: { backgroundColor: colors.forestSoft, borderColor: colors.forest }, roleIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 10, height: 34, justifyContent: 'center', width: 34 }, roleIconSelected: { backgroundColor: colors.forest }, roleCopy: { flex: 1 }, roleName: { color: colors.ink, fontSize: 12, fontWeight: '800' }, roleDetail: { color: colors.muted, fontSize: 8, lineHeight: 11, marginTop: 3 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, padding: 20, ...shadow }, label: { color: colors.ink, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 8 },
  inputWrap: { alignItems: 'center', backgroundColor: '#F8F8F5', borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', gap: 10, height: 54, paddingHorizontal: 14 }, input: { color: colors.ink, flex: 1, fontSize: 15 },
  passwordHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }, forgot: { color: colors.coral, fontSize: 12, fontWeight: '700', marginBottom: 8 }, error: { color: colors.danger, fontSize: 12, marginTop: 10 },
  button: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radius.sm, flexDirection: 'row', gap: 10, height: 56, justifyContent: 'center', marginTop: 22 }, buttonPressed: { opacity: 0.86, transform: [{ scale: 0.99 }] }, buttonText: { color: colors.surface, fontSize: 15, fontWeight: '800' },
  previewNote: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 10, flexDirection: 'row', gap: 8, marginTop: 14, padding: 11 }, previewText: { color: colors.forest, flex: 1, fontSize: 11, lineHeight: 16 }, footer: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 24, textAlign: 'center' },
});
