import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth';
import { Logo } from '@/components/Logo';
import { colors, radius, shadow } from '@/theme';

export default function ChangePasswordScreen() {
  const { changePassword, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (password.length < 12) return setError('Use at least 12 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setSaving(true); setError('');
    try { await changePassword(password); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update password.'); }
    finally { setSaving(false); }
  };
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrapper}>
    <Logo /><View style={styles.card}><View style={styles.icon}><Ionicons name="key-outline" color={colors.forest} size={24} /></View><Text style={styles.title}>Create a secure password</Text><Text style={styles.subtitle}>Your property requires a password change before opening the workspace.</Text>
      <Text style={styles.label}>NEW PASSWORD</Text><View style={styles.inputWrap}><TextInput autoCapitalize="none" onChangeText={setPassword} placeholder="At least 12 characters" placeholderTextColor="#98A2B3" secureTextEntry={!show} style={styles.input} value={password} /><Pressable onPress={() => setShow((value) => !value)}><Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} color={colors.muted} size={20} /></Pressable></View>
      <Text style={styles.label}>CONFIRM PASSWORD</Text><View style={styles.inputWrap}><TextInput autoCapitalize="none" onChangeText={setConfirm} placeholder="Repeat your password" placeholderTextColor="#98A2B3" secureTextEntry={!show} style={styles.input} value={confirm} /></View>
      {!!error && <Text style={styles.error}>{error}</Text>}<Pressable disabled={saving} onPress={() => void submit()} style={styles.button}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update and continue</Text>}</Pressable><Pressable onPress={() => void signOut()}><Text style={styles.signOut}>Sign in with another account</Text></Pressable>
    </View>
  </KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.canvas, flex: 1 }, wrapper: { alignSelf: 'center', flex: 1, justifyContent: 'center', maxWidth: 480, padding: 22, width: '100%' }, card: { ...shadow, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, marginTop: 30, padding: 22 }, icon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 14, height: 48, justifyContent: 'center', width: 48 }, title: { color: colors.ink, fontSize: 26, fontWeight: '900', letterSpacing: -0.8, marginTop: 18 }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 22, marginTop: 7 }, label: { color: colors.ink, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 7, marginTop: 13 }, inputWrap: { alignItems: 'center', backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', minHeight: 52, paddingHorizontal: 13 }, input: { color: colors.ink, flex: 1, fontSize: 14 }, error: { color: colors.danger, fontSize: 12, marginTop: 12 }, button: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radius.sm, justifyContent: 'center', marginTop: 20, minHeight: 54 }, buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' }, signOut: { color: colors.forest, fontSize: 12, fontWeight: '700', marginTop: 17, textAlign: 'center' },
});
