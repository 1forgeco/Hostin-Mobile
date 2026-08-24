export const colors = {
  ink: '#101828', muted: '#667085', canvas: '#F7F8FA', surface: '#FFFFFF',
  forest: '#0F766E', forestSoft: '#E6FFFA', coral: '#D6A84F', coralSoft: '#FFF8E8',
  border: '#E4E7EC', success: '#079455', warning: '#DC6803', danger: '#D92D20',
} as const;

export const radius = { sm: 12, md: 18, lg: 26, pill: 999 } as const;

export const shadow = Platform.OS === 'web'
  ? ({ boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)' } as const)
  : ({ shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 } as const);
import { Platform } from 'react-native';
