import { Stack } from 'expo-router';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/auth';
import { ConnectivityBanner } from '@/components/ConnectivityBanner';
import { notificationRoute } from '@/services/push';
import { colors } from '@/theme';

function Navigation() {
  const { isLoading, session } = useAuth();
  if (isLoading) return <View style={styles.loading}><ActivityIndicator color={colors.coral} size="large" /></View>;
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Protected guard={!session}><Stack.Screen name="login" /></Stack.Protected>
    <Stack.Protected guard={Boolean(session?.requiresPasswordChange)}><Stack.Screen name="change-password" /></Stack.Protected>
    <Stack.Protected guard={Boolean(session && !session.requiresPasswordChange)}><Stack.Screen name="(app)" /><Stack.Screen name="module/[id]" /></Stack.Protected>
  </Stack>;
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      router.push(notificationRoute(response.notification.request.content.data) as never);
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) router.push(notificationRoute(response.notification.request.content.data) as never);
    });
    return () => subscription.remove();
  }, []);
  return <SafeAreaProvider><AuthProvider><StatusBar style="dark" /><Navigation /><ConnectivityBanner /></AuthProvider></SafeAreaProvider>;
}

const styles = StyleSheet.create({ loading: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, justifyContent: 'center' } });
