import type { OrgRole } from '@/types';

export type HostinModule = {
  id: string;
  title: string;
  description: string;
  icon: string;
  roles: OrgRole[];
  endpoint: string;
};

export const roleLabels: Record<OrgRole, string> = {
  owner: 'Owner', warden: 'Warden', guard: 'Guard', staff: 'Mess Manager',
  tenant: 'Tenant', parent: 'Parent', platform: '1Forge Platform',
};

export const modules: HostinModule[] = [
  { id: 'overview', title: 'Dashboard', description: 'What needs your attention today.', icon: 'grid-outline', roles: ['owner', 'warden'], endpoint: '/metrics' },
  { id: 'properties', title: 'My Properties', description: 'Properties, branches, plans and occupancy.', icon: 'business-outline', roles: ['owner'], endpoint: '/owner/dashboard' },
  { id: 'floors', title: 'Floors', description: 'Floor structure, rooms, occupancy and capacity.', icon: 'layers-outline', roles: ['owner', 'warden'], endpoint: '/floors' },
  { id: 'rooms', title: 'Rooms', description: 'Floors, capacity, availability and history.', icon: 'bed-outline', roles: ['owner', 'warden'], endpoint: '/rooms' },
  { id: 'people', title: 'People & Roles', description: 'Master directory across every property role.', icon: 'people-outline', roles: ['owner'], endpoint: '/owner/dashboard' },
  { id: 'credentials', title: 'Credentials', description: 'Login IDs, account status and role access.', icon: 'key-outline', roles: ['owner'], endpoint: '/owner/dashboard' },
  { id: 'requests', title: 'Requests', description: 'Credential, feature, plan and support requests.', icon: 'file-tray-full-outline', roles: ['owner'], endpoint: '/owner/requests' },
  { id: 'tenants', title: 'Tenants', description: 'Create, search and manage residents.', icon: 'person-add-outline', roles: ['warden'], endpoint: '/tenants' },
  { id: 'parent-access', title: 'Parent Access', description: 'Link guardian accounts and privacy permissions.', icon: 'heart-circle-outline', roles: ['owner', 'warden'], endpoint: '/tenants' },
  { id: 'gate', title: 'Gate Passes', description: 'Requests, approvals and movement tracking.', icon: 'exit-outline', roles: ['owner', 'warden', 'guard', 'tenant'], endpoint: '/gate-passes' },
  { id: 'visitors', title: 'Visitors', description: 'Visitor approvals, check-ins and logs.', icon: 'id-card-outline', roles: ['owner', 'warden', 'guard'], endpoint: '/visitors' },
  { id: 'complaints', title: 'Complaints', description: 'Assign, update and resolve complaints.', icon: 'construct-outline', roles: ['owner', 'warden'], endpoint: '/complaints' },
  { id: 'announcements', title: 'Announcements', description: 'Create and view property notices.', icon: 'megaphone-outline', roles: ['warden'], endpoint: '/announcements' },
  { id: 'finance', title: 'Dues & Payments', description: 'Dues, payments, receipts and reminders.', icon: 'wallet-outline', roles: ['owner', 'tenant'], endpoint: '/dues' },
  { id: 'community', title: 'Community', description: 'Notices, complaints and lost/found.', icon: 'chatbubbles-outline', roles: ['owner', 'staff', 'tenant'], endpoint: '/community' },
  { id: 'mess', title: 'Mess', description: 'Weekly menu, publishing and feedback.', icon: 'restaurant-outline', roles: ['owner', 'staff', 'tenant'], endpoint: '/mess-menus' },
  { id: 'documents', title: 'Documents Vault', description: 'Upload and verify resident documents.', icon: 'document-lock-outline', roles: ['owner', 'warden'], endpoint: '/documents' },
  { id: 'staff', title: 'Staff Contacts', description: 'Staff directory and emergency contacts.', icon: 'call-outline', roles: ['owner', 'warden', 'guard', 'staff', 'tenant'], endpoint: '/staff-contacts' },
  { id: 'billing', title: 'Billing & Plans', description: 'Plan, usage, renewal and add-ons.', icon: 'card-outline', roles: ['owner'], endpoint: '/owner/dashboard' },
  { id: 'reports', title: 'Reports', description: 'Finance, occupancy, roles and operations.', icon: 'bar-chart-outline', roles: ['owner'], endpoint: '/owner/dashboard' },
  { id: 'settings', title: 'Settings', description: 'Workspace, feature and access controls.', icon: 'settings-outline', roles: ['owner'], endpoint: '/owner/dashboard' },
  { id: 'parent-home', title: 'Home', description: 'Your child’s stay, fees and notices.', icon: 'home-outline', roles: ['parent'], endpoint: '/parents/ward' },
  { id: 'parent-child', title: 'My Child', description: 'Stay profile, room and assigned warden.', icon: 'person-circle-outline', roles: ['parent'], endpoint: '/parents/ward' },
  { id: 'parent-gate', title: 'Gate Pass', description: 'Movement status and gate-pass history.', icon: 'exit-outline', roles: ['parent'], endpoint: '/parents/ward' },
  { id: 'parent-billing', title: 'Billing', description: 'Dues, fee breakdown and receipts.', icon: 'receipt-outline', roles: ['parent'], endpoint: '/parents/ward' },
  { id: 'parent-mess', title: 'Mess Menu', description: 'Today’s meals and weekly schedule.', icon: 'restaurant-outline', roles: ['parent'], endpoint: '/parents/ward' },
  { id: 'parent-announcements', title: 'Announcements', description: 'Official notices and acknowledgements.', icon: 'megaphone-outline', roles: ['parent'], endpoint: '/parents/ward' },
  { id: 'parent-contacts', title: 'Contacts', description: 'Warden, gate and emergency contacts.', icon: 'call-outline', roles: ['parent'], endpoint: '/parents/ward' },
  { id: 'parent-help', title: 'Help & Concerns', description: 'Raise and track a concern.', icon: 'help-buoy-outline', roles: ['parent'], endpoint: '/complaints' },
  { id: 'parent-documents', title: 'Documents', description: 'Document verification status.', icon: 'documents-outline', roles: ['parent'], endpoint: '/parents/ward' },
  { id: 'platform', title: 'Organizations', description: 'Clients, status, usage and lifecycle controls.', icon: 'business-outline', roles: ['platform'], endpoint: '/platform/organizations' },
  { id: 'platform-plans', title: 'Plans', description: 'Create and manage subscription plans.', icon: 'layers-outline', roles: ['platform'], endpoint: '/platform/plans' },
  { id: 'platform-onboarding', title: 'Onboarding', description: 'Provision properties, people and credentials.', icon: 'rocket-outline', roles: ['platform'], endpoint: '/platform/onboarding' },
  { id: 'platform-features', title: 'Feature Controls', description: 'Enable products and modules per organization.', icon: 'options-outline', roles: ['platform'], endpoint: '/platform/organizations' },
  { id: 'platform-notifications', title: 'Platform Notices', description: 'Broadcast service and client updates.', icon: 'notifications-outline', roles: ['platform'], endpoint: '/platform/notifications' },
  { id: 'platform-analytics', title: 'Analytics', description: 'Client, plan and adoption reporting.', icon: 'analytics-outline', roles: ['platform'], endpoint: '/platform/organizations' },
];

export function modulesForRole(role: OrgRole) {
  return modules.filter((module) => module.roles.includes(role));
}
