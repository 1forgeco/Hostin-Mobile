export type OrgRole = 'owner' | 'warden' | 'guard' | 'staff' | 'tenant' | 'parent' | 'platform';

export type User = {
  id: string;
  name: string;
  email: string;
  role: OrgRole;
};

export type AvailableRole = {
  orgId: string;
  workspace: string;
  role: OrgRole;
  accountSlug: string;
  destination: string;
};

export type Session = {
  accessToken: string;
  orgId: string;
  workspace: string;
  accountSlug: string;
  themeColor?: string | null;
  requiresPasswordChange?: boolean;
  availableRoles: AvailableRole[];
  user: User;
};
