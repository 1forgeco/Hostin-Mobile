import type { OrgRole, Session } from '@/types';

export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
export const isPreviewMode = !API_URL;

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = 'ApiError'; this.status = status; }
}

let refreshPromise: Promise<string> | null = null;
let sessionUpdateListener: ((session: Session) => void) | null = null;

export function registerSessionUpdateListener(listener: ((session: Session) => void) | null) {
  sessionUpdateListener = listener;
}

const previewSession: Session = {
  accessToken: 'preview-access-token',
  orgId: 'city-complex-preview',
  workspace: 'city-complex',
  accountSlug: 'demo-user',
  availableRoles: [],
  user: { id: 'preview-user', name: 'Demo User', email: 'owner@city-complex.hostin.local', role: 'owner' },
};

export const demoPassword = 'city-complex@123';
export const demoAccounts: { role: OrgRole; label: string; email: string; detail: string; icon: string; password?: string }[] = [
  { role: 'owner', label: 'Owner', email: 'owner@city-complex.hostin.local', detail: 'Business, occupancy, dues and reports', icon: 'business-outline' },
  { role: 'warden', label: 'Warden', email: 'warden@city-complex.hostin.local', detail: 'Rooms, residents, passes and operations', icon: 'people-outline' },
  { role: 'guard', label: 'Guard', email: 'security@city-complex.hostin.local', detail: 'Gate passes, visitors and entry logs', icon: 'shield-checkmark-outline' },
  { role: 'staff', label: 'Mess Manager', email: 'staff@city-complex.hostin.local', detail: 'Meals, menus, feedback and support', icon: 'restaurant-outline' },
  { role: 'tenant', label: 'Tenant', email: 'tenant@city-complex.hostin.local', detail: 'Dues, requests, community and mess', icon: 'bed-outline' },
  { role: 'parent', label: 'Parent', email: 'parent@city-complex.hostin.local', detail: 'Ward updates, dues and announcements', icon: 'heart-outline' },
  { role: 'platform', label: '1Forge Platform', email: 'admin@1forge.com', detail: 'Organizations, plans, controls and analytics', icon: 'planet-outline', password: 'PlatformAdminPassword123' },
];

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error('The Hostin API URL has not been configured.');
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(error?.message ?? error?.error ?? 'Something went wrong. Please try again.', response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function authenticatedRequest<T>(session: Session, path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error('Preview mode does not call the backend.');
  const execute = () => request<T>(path, { ...init, headers: { Authorization: `Bearer ${session.accessToken}`, 'x-org-id': session.orgId, ...init?.headers } });
  try { return await execute(); }
  catch (cause) {
    if (!(cause instanceof ApiError) || cause.status !== 401 || session.user.role === 'platform') throw cause;
    refreshPromise ??= request<{ accessToken: string }>('/auth/session/refresh', { method: 'POST', body: '{}' })
      .then((result) => result.accessToken)
      .finally(() => { refreshPromise = null; });
    const accessToken = await refreshPromise;
    session.accessToken = accessToken;
    sessionUpdateListener?.({ ...session });
    return execute();
  }
}

export const authApi = {
  async login(email: string, password: string): Promise<Session> {
    if (!API_URL) {
      await new Promise((resolve) => setTimeout(resolve, 650));
      if (!email.trim() || !password.trim()) throw new Error('Enter your email and password.');
      const account = demoAccounts.find((item) => item.email === email) ?? demoAccounts[0];
      return {
        ...previewSession,
        orgId: account.role === 'platform' ? 'platform' : previewSession.orgId,
        workspace: account.role === 'platform' ? '1forge' : previewSession.workspace,
        accountSlug: `${account.role}-demo`,
        availableRoles: [{ orgId: previewSession.orgId, workspace: previewSession.workspace, role: account.role, accountSlug: `${account.role}-demo`, destination: `/city-complex/${account.role}/${account.role}-demo` }],
        user: { id: `${account.role}-preview`, name: account.label, email, role: account.role },
      };
    }
    const platformAccount = demoAccounts.find((item) => item.role === 'platform' && item.email.toLowerCase() === email.trim().toLowerCase());
    if (platformAccount) {
      const data = await request<{ token: string; user: { id: string; email: string; fullName: string } }>('/platform/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      return { accessToken: data.token, orgId: 'platform', workspace: '1Forge Platform', accountSlug: data.user.id, availableRoles: [], user: { id: data.user.id, name: data.user.fullName, email: data.user.email, role: 'platform' } };
    }
    const data = await request<{ session: {
      accessToken: string; orgId: string; workspace: string; role: OrgRole; accountSlug: string;
      userName: string; email: string; themeColor?: string | null; requiresPasswordChange?: boolean;
      availableRoles?: Session['availableRoles'];
    } }>('/auth/resolve-login', { method: 'POST', body: JSON.stringify({ email, password }) });
    return {
      accessToken: data.session.accessToken,
      orgId: data.session.orgId,
      workspace: data.session.workspace,
      accountSlug: data.session.accountSlug,
      themeColor: data.session.themeColor,
      requiresPasswordChange: data.session.requiresPasswordChange,
      availableRoles: data.session.availableRoles ?? [],
      user: { id: data.session.accountSlug, name: data.session.userName, email: data.session.email, role: data.session.role },
    };
  },
  async changePassword(session: Session, password: string) {
    if (isPreviewMode) { await new Promise((resolve) => setTimeout(resolve, 450)); return; }
    await authenticatedRequest(session, '/auth/change-password', { method: 'POST', body: JSON.stringify({ password }) });
  },
  async logout(session: Session) {
    if (isPreviewMode || session.user.role === 'platform') return;
    await authenticatedRequest(session, '/auth/session/logout', { method: 'POST', body: '{}' });
  },
};
