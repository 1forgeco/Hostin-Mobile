import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { colors } from '@/theme';

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.forest, tabBarInactiveTintColor: '#7B8496', tabBarLabelStyle: { fontSize: isCompact ? 9 : 10, fontWeight: '700', marginTop: 1 }, tabBarStyle: { backgroundColor: 'rgba(255,255,255,0.96)', borderColor: '#EEF1F4', borderRadius: isCompact ? 19 : 22, borderTopWidth: 0, height: isCompact ? 66 : 72, marginBottom: isCompact ? 8 : 12, marginHorizontal: isCompact ? 10 : 18, paddingBottom: isCompact ? 6 : 8, paddingTop: 7, position: 'absolute', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 18, elevation: 6 } }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <Ionicons color={color} name={focused ? 'home' : 'home-outline'} size={22} /> }} />
    <Tabs.Screen name="modules" options={{ title: 'Modules', tabBarIcon: ({ color, focused }) => <Ionicons color={color} name={focused ? 'grid' : 'grid-outline'} size={22} /> }} />
    <Tabs.Screen name="notifications" options={{ href: null }} />
    <Tabs.Screen name="profile" options={{ title: 'You', tabBarIcon: ({ color, focused }) => <Ionicons color={color} name={focused ? 'person' : 'person-outline'} size={22} /> }} />
  </Tabs>;
}
