import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { authenticatedRequest, isPreviewMode } from '@/services/api';
import type { Session } from '@/types';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }),
  });
}

export type PushSetupResult = { enabled: boolean; registeredWithBackend: boolean; message: string };

export async function enablePushNotifications(session: Session): Promise<PushSetupResult> {
  if (Platform.OS === 'web') return { enabled: false, registeredWithBackend: false, message: 'Device push notifications are available in the Android and iOS apps.' };
  if (!Device.isDevice) return { enabled: false, registeredWithBackend: false, message: 'Use a physical device to enable push notifications.' };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'HostIn updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F47B5B',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return { enabled: false, registeredWithBackend: false, message: 'Notification permission was not granted.' };

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return { enabled: true, registeredWithBackend: false, message: 'Notifications are allowed. Complete EAS project setup to activate remote delivery.' };

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const registrationPath = process.env.EXPO_PUBLIC_PUSH_REGISTER_PATH;
  if (!registrationPath || isPreviewMode) return { enabled: true, registeredWithBackend: false, message: 'This device is ready. The HostIn backend still needs its push-token registration endpoint configured.' };

  await authenticatedRequest(session, registrationPath, {
    method: 'POST',
    body: JSON.stringify({ token, platform: Platform.OS, projectId }),
  });
  return { enabled: true, registeredWithBackend: true, message: 'Push notifications are active on this device.' };
}

export function notificationRoute(data: Record<string, unknown> | undefined): string {
  const route = typeof data?.route === 'string' ? data.route : '';
  if (/^\/(module\/[^/]+|notifications|modules|profile)$/.test(route)) return route;
  const moduleId = typeof data?.moduleId === 'string' ? data.moduleId : '';
  return moduleId ? `/module/${encodeURIComponent(moduleId)}` : '/notifications';
}
