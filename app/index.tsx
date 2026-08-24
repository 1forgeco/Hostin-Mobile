import { Redirect } from 'expo-router';
import { useAuth } from '@/auth';

export default function Index() {
  const { session } = useAuth();
  return <Redirect href={session ? '/(app)' : '/login'} />;
}
