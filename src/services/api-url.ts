export type RuntimePlatform = 'android' | 'ios' | 'web' | string;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function hostFromExpoUri(hostUri?: string | null) {
  if (!hostUri) return null;
  try {
    return new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`).hostname;
  } catch {
    return null;
  }
}

/**
 * Localhost means a different machine on a physical phone and in the Android
 * emulator. During Expo development, reuse Metro's host so the API points back
 * to the developer's Mac. Production HTTPS URLs are never rewritten.
 */
export function resolveApiUrl(
  configuredUrl: string | undefined,
  platform: RuntimePlatform,
  expoHostUri?: string | null,
  development = false,
) {
  const trimmed = configuredUrl?.trim().replace(/\/$/, '');
  if (!trimmed || !development || platform === 'web') return trimmed;

  try {
    const url = new URL(trimmed);
    if (!LOCAL_HOSTS.has(url.hostname)) return trimmed;

    const expoHost = hostFromExpoUri(expoHostUri);
    if (expoHost && !LOCAL_HOSTS.has(expoHost)) url.hostname = expoHost;
    else if (platform === 'android') url.hostname = '10.0.2.2';
    else return trimmed;

    return url.toString().replace(/\/$/, '');
  } catch {
    return trimmed;
  }
}

export function apiConnectionMessage(apiUrl?: string) {
  return apiUrl
    ? `Cannot reach the HostIn backend at ${apiUrl}. Start it with \"npm run backend:start\" and try again.`
    : 'The HostIn backend URL is not configured.';
}
