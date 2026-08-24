import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/theme';

export default function AppLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.forest, tabBarInactiveTintColor: '#8A9490', tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 }, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 76, paddingBottom: 10, paddingTop: 9 } }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="grid-outline" size={size} /> }} />
    <Tabs.Screen name="modules" options={{ title: 'Modules', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="apps-outline" size={size} /> }} />
    <Tabs.Screen name="notifications" options={{ title: 'Alerts', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="notifications-outline" size={size} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'You', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-outline" size={size} /> }} />
  </Tabs>;
}
