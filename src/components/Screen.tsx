import { PropsWithChildren, ReactElement } from 'react';
import { RefreshControlProps, ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

export function Screen({ children, contentStyle, floating, refreshControl }: PropsWithChildren<{ contentStyle?: StyleProp<ViewStyle>; floating?: ReactElement; refreshControl?: ReactElement<RefreshControlProps> }>) {
  return <SafeAreaView edges={['top']} style={styles.safe}>
    <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled" refreshControl={refreshControl} showsVerticalScrollIndicator={false}>{children}</ScrollView>
    {floating}
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { backgroundColor: colors.canvas, flex: 1 }, content: { paddingBottom: 120, paddingHorizontal: 20 } });
