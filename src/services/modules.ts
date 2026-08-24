import { authenticatedRequest, isPreviewMode } from '@/services/api';
import type { OrgRole, Session } from '@/types';

export type ModuleRecord = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  status?: string;
  raw?: Record<string, unknown>;
};

const previews: Record<string, ModuleRecord[]> = {
  rooms: [
    { id: 'a101', title: 'Room A-101', subtitle: 'First floor · Double', meta: '2 / 2 occupied', status: 'occupied' },
    { id: 'a102', title: 'Room A-102', subtitle: 'First floor · Triple', meta: '2 / 3 occupied', status: 'available' },
    { id: 'b204', title: 'Room B-204', subtitle: 'Second floor · Single', meta: 'Maintenance', status: 'maintenance' },
  ],
  floors: [
    { id: 'floor1', title: 'First floor', subtitle: '12 rooms · 30 beds', meta: '27 occupied', status: 'available' },
    { id: 'floor2', title: 'Second floor', subtitle: '10 rooms · 24 beds', meta: '20 occupied', status: 'available' },
  ],
  tenants: [
    { id: 'aarav', title: 'Aarav Mehta', subtitle: 'Room A-101', meta: '₹12,000 due', status: 'active' },
    { id: 'isha', title: 'Isha Rao', subtitle: 'Room A-102', meta: 'No dues', status: 'active' },
    { id: 'kabir', title: 'Kabir Singh', subtitle: 'Unassigned', meta: 'Onboarding', status: 'onboarding' },
  ],
  'parent-access': [{ id: 'parent-link', title: 'Aarav Mehta', subtitle: 'Parent access linked', meta: 'Mother · contact sharing private', status: 'active' }],
  gate: [
    { id: 'pass1', title: 'Rohan Patel', subtitle: 'Home visit · 5:00 PM', meta: 'Return 7:30 PM', status: 'pending' },
    { id: 'pass2', title: 'Maya Nair', subtitle: 'Coaching · 4:00 PM', meta: 'Return 8:00 PM', status: 'approved' },
  ],
  visitors: [
    { id: 'visit1', title: 'Priya Shah', subtitle: 'Visiting Isha Rao', meta: 'Expected 5:00 PM', status: 'approved' },
    { id: 'visit2', title: 'Mr. Nair', subtitle: 'Visiting Maya Nair', meta: 'Expected 6:30 PM', status: 'pending' },
  ],
  complaints: [
    { id: 'complaint1', title: 'Water leakage', subtitle: 'Room A-101 · Plumbing', meta: 'High priority', status: 'in progress' },
    { id: 'complaint2', title: 'Wi-Fi unavailable', subtitle: 'Second floor · Network', meta: 'Medium priority', status: 'open' },
  ],
  announcements: [
    { id: 'notice1', title: 'Water shutdown tomorrow', subtitle: 'Published to all residents', meta: '92 reads', status: 'published' },
    { id: 'notice2', title: 'Independence Day schedule', subtitle: 'Published to all residents', meta: '108 reads', status: 'published' },
  ],
  finance: [
    { id: 'due1', title: 'Rent · August', subtitle: 'Aarav Mehta', meta: '₹12,000', status: 'unpaid' },
    { id: 'due2', title: 'Mess · August', subtitle: 'Kabir Singh', meta: '₹4,500', status: 'partial' },
  ],
  community: [
    { id: 'community1', title: 'Water shutdown', subtitle: 'Announcement · All residents', meta: '92 reads', status: 'published' },
    { id: 'community2', title: 'Lost charger', subtitle: 'Lost & found · Common room', meta: '2 comments', status: 'open' },
  ],
  mess: [
    { id: 'meal1', title: 'Monday lunch', subtitle: 'Paneer rice, dal and salad', meta: '82% rating', status: 'published' },
    { id: 'meal2', title: 'Tuesday dinner', subtitle: 'Dal tadka and jeera rice', meta: 'Draft', status: 'draft' },
  ],
  documents: [
    { id: 'doc1', title: 'Aadhaar', subtitle: 'Aarav Mehta', meta: 'Uploaded today', status: 'pending' },
    { id: 'doc2', title: 'PAN card', subtitle: 'Isha Rao', meta: 'Verified by warden', status: 'verified' },
  ],
  staff: [
    { id: 'staff1', title: 'Anita Sharma', subtitle: 'Warden · Day shift', meta: '+91 98765 43210', status: 'primary' },
    { id: 'staff2', title: 'Ramesh Kumar', subtitle: 'Guard · Night shift', meta: '+91 98765 43211', status: 'emergency' },
  ],
  requests: [{ id: 'req1', title: 'Create guard credential', subtitle: 'City Complex · Submitted by Owner', meta: 'Today', status: 'under review' }],
  properties: [{ id: 'city', title: 'City Complex', subtitle: 'Growth plan · 84% occupancy', meta: '118 residents', status: 'healthy' }],
  people: [{ id: 'person1', title: 'Aarav Mehta', subtitle: 'Tenant · Room A-101', meta: '+91 98765 40001', status: 'active' }],
  credentials: [{ id: 'cred1', title: 'warden@city-complex.hostin.local', subtitle: 'Warden · City Complex', meta: 'Last active today', status: 'active' }],
  billing: [{ id: 'bill1', title: 'Growth plan', subtitle: 'City Complex · Active', meta: 'Renews monthly', status: 'active' }],
  reports: [{ id: 'report1', title: 'Occupancy report', subtitle: 'August 2026', meta: '84% occupied', status: 'ready' }],
  settings: [{ id: 'setting1', title: 'Workspace access', subtitle: 'City Complex is active', meta: 'All core modules', status: 'active' }],
  platform: [{ id: 'org1', title: 'City Complex', subtitle: 'Growth · Active', meta: '118 residents', status: 'active' }],
  'platform-plans': [{ id: 'growth', title: 'Growth', subtitle: 'Full operations suite', meta: '18 organizations', status: 'active' }],
  'platform-onboarding': [{ id: 'north-campus', title: 'North Campus', subtitle: 'Property and credential setup', meta: 'Step 3 of 4', status: 'in progress' }],
  'platform-features': [{ id: 'features-city', title: 'City Complex', subtitle: '14 modules enabled', meta: 'Growth plan', status: 'active' }],
  'platform-notifications': [{ id: 'platform-notice', title: 'Scheduled maintenance', subtitle: 'All active clients', meta: 'Draft', status: 'draft' }],
  'platform-analytics': [{ id: 'adoption', title: 'Platform adoption', subtitle: '24 active organizations', meta: '89% monthly active', status: 'healthy' }],
  'parent-home': [{ id: 'ward', title: 'Aarav Mehta', subtitle: 'Room A-101 · City Complex', meta: 'Warden: Anita Sharma', status: 'active' }],
  'parent-child': [{ id: 'ward-profile', title: 'Aarav Mehta', subtitle: 'Engineering student · Room A-101', meta: 'Joined 12 July 2026', status: 'verified' }],
  'parent-gate': [{ id: 'ward-pass', title: 'Home visit', subtitle: 'Out 5:00 PM · Return 7:30 PM', meta: 'Today', status: 'approved' }],
  'parent-billing': [{ id: 'ward-due', title: 'Rent · August', subtitle: 'Due 20 August 2026', meta: '₹12,000', status: 'unpaid' }],
  'parent-mess': [{ id: 'ward-meal', title: 'Today’s menu', subtitle: 'Paneer rice, dal and salad', meta: 'Lunch · 12:30 PM', status: 'published' }],
  'parent-announcements': [{ id: 'ward-notice', title: 'Water shutdown tomorrow', subtitle: 'Maintenance from 10:00 AM to 12:00 PM', meta: 'Published today', status: 'unread' }],
  'parent-contacts': [{ id: 'warden-contact', title: 'Anita Sharma', subtitle: 'Warden · Day shift', meta: '+91 98765 43210', status: 'primary' }],
  'parent-help': [{ id: 'parent-concern', title: 'Meal quality follow-up', subtitle: 'Mess · Raised yesterday', meta: 'Warden assigned', status: 'in progress' }],
  'parent-documents': [{ id: 'ward-doc', title: 'Aadhaar', subtitle: 'Aarav Mehta', meta: 'Verified by warden', status: 'verified' }],
};

const endpointByModule: Record<string, string> = {
  overview: '/owner/dashboard', properties: '/owner/dashboard', people: '/owner/dashboard', credentials: '/owner/dashboard', billing: '/owner/dashboard', reports: '/owner/dashboard', settings: '/owner/dashboard',
  floors: '/floors', rooms: '/rooms?limit=250', tenants: '/tenants?limit=250', 'parent-access': '/tenants?limit=250', gate: '/gate-passes?limit=250', visitors: '/visitors?limit=250', complaints: '/complaints?limit=250', announcements: '/announcements?limit=250', finance: '/dues?limit=250', community: '/community/lost-found?limit=250', mess: '/mess-menus', documents: '/documents?limit=250', staff: '/staff-contacts?limit=250', requests: '/owner/requests',
  'parent-home': '/parents/ward', 'parent-child': '/parents/ward', 'parent-gate': '/parents/ward', 'parent-billing': '/parents/ward', 'parent-mess': '/parents/ward', 'parent-announcements': '/parents/ward', 'parent-contacts': '/parents/ward', 'parent-help': '/parents/ward', 'parent-documents': '/parents/ward',
  platform: '/platform/organizations', 'platform-plans': '/platform/plans', 'platform-onboarding': '/platform/organizations', 'platform-features': '/platform/organizations', 'platform-notifications': '/platform/notifications', 'platform-analytics': '/platform/organizations',
};

const collectionKeys: Record<string, string[]> = {
  floors: ['floors'], rooms: ['rooms'], tenants: ['tenants'], 'parent-access': ['tenants'], gate: ['passes', 'gatePasses'], visitors: ['visitors'], complaints: ['complaints'], announcements: ['announcements'], finance: ['dues'], community: ['posts'], mess: ['menus', 'items'], documents: ['documents'], staff: ['contacts'], requests: ['requests'], platform: ['organizations'],
  properties: ['properties'], people: ['people'], credentials: ['credentials'], billing: ['billing'], reports: ['recentActivity'],
  'platform-plans': ['plans'], 'platform-notifications': ['notifications'], 'platform-onboarding': ['organizations'], 'platform-features': ['organizations'], 'platform-analytics': ['organizations'],
};

function label(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function normalizeItem(item: Record<string, unknown>, index: number): ModuleRecord {
  const tenant = item.tenant as Record<string, unknown> | undefined;
  const room = item.room as Record<string, unknown> | undefined;
  const stats = item.statistics as Record<string, unknown> | undefined;
  const title = label(item.title || item.fullName || item.full_name || item.name || item.floorName || item.roomNumber || item.room_number || item.visitorName || item.visitor_name || item.fileName || item.file_name || item.caption || item.email || tenant?.full_name) || `Record ${index + 1}`;
  const subtitle = label(item.body || item.description || item.purpose || item.category || item.property || item.role || item.docType || item.doc_type || item.phone || room?.roomNumber || room?.room_number || item.destination || (stats ? `${label(stats.totalRooms)} rooms · ${label(stats.totalCapacity)} beds` : ''));
  const meta = label(item.meta || item.amount || item.monthlyRent || item.monthly_rent || item.expectedVisitTime || item.expected_visit_time || item.expectedOutTime || item.expected_out_time || item.createdAt || item.created_at || (stats ? `${label(stats.currentOccupancy)} occupied` : ''));
  const status = label(item.status || (item.acknowledged === true || item.isRead === true ? 'read' : item.acknowledged === false || item.isRead === false ? 'unread' : item.is_published === true ? 'published' : item.is_published === false ? 'draft' : item.is_verified === true ? 'verified' : item.is_verified === false ? 'pending' : ''));
  return { id: label(item.tenantProfileId || item.id || item.userId || item.user_id) || `${title}-${index}`, title, subtitle, meta, status, raw: item };
}

function parentCollection(moduleId: string, response: Record<string, unknown>) {
  const ward = Array.isArray(response.wards) ? (response.wards[0] as Record<string, unknown> | undefined) : undefined;
  if (!ward) return [];
  if (moduleId === 'parent-home' || moduleId === 'parent-child') return [ward.ward as Record<string, unknown>];
  if (moduleId === 'parent-gate') return (ward.gatePasses as Record<string, unknown>[]) ?? [];
  if (moduleId === 'parent-billing') return [...((ward.dues as Record<string, unknown>[]) ?? []), ...((ward.payments as Record<string, unknown>[]) ?? [])];
  if (moduleId === 'parent-mess') return [response.menu as Record<string, unknown>].filter(Boolean);
  if (moduleId === 'parent-announcements') return (response.announcements as Record<string, unknown>[]) ?? [];
  if (moduleId === 'parent-contacts') return [...((response.contacts as Record<string, unknown>[]) ?? []), response.assignedWarden as Record<string, unknown>].filter(Boolean);
  if (moduleId === 'parent-help') return (ward.complaints as Record<string, unknown>[]) ?? [];
  if (moduleId === 'parent-documents') return (ward.documents as Record<string, unknown>[]) ?? [];
  return [];
}

function findCollection(moduleId: string, response: Record<string, unknown>) {
  const root = (response.dashboard && typeof response.dashboard === 'object' ? response.dashboard : response) as Record<string, unknown>;
  for (const key of collectionKeys[moduleId] ?? []) {
    if (Array.isArray(root[key])) return root[key] as Record<string, unknown>[];
  }
  for (const value of Object.values(root)) if (Array.isArray(value)) return value as Record<string, unknown>[];
  return [root];
}

export async function loadModule(session: Session, moduleId: string): Promise<{ records: ModuleRecord[]; preview: boolean }> {
  if (isPreviewMode) return { records: previews[moduleId] ?? previews[roleHomeModule(session.user.role)] ?? [], preview: true };
  const endpoint = session.user.role === 'warden' && moduleId === 'overview' ? '/warden/dashboard' : endpointByModule[moduleId];
  if (!endpoint) return { records: [], preview: false };
  const response = await authenticatedRequest<Record<string, unknown>>(session, endpoint);
  const records = moduleId.startsWith('parent-') ? parentCollection(moduleId, response) : moduleId === 'mess' && response.menu && typeof response.menu === 'object' ? [response.menu as Record<string, unknown>] : findCollection(moduleId, response);
  return { records: records.map(normalizeItem), preview: false };
}

function roleHomeModule(role: OrgRole) {
  if (role === 'parent') return 'parent-home';
  if (role === 'platform') return 'platform';
  return role === 'staff' ? 'mess' : role === 'guard' ? 'gate' : role === 'tenant' ? 'finance' : 'overview';
}

export async function submitModuleAction(session: Session, endpoint: string, payload: Record<string, unknown>, method = 'POST') {
  if (isPreviewMode) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true, preview: true };
  }
  return authenticatedRequest<Record<string, unknown>>(session, endpoint, { method, body: JSON.stringify(payload) });
}

export async function runRecordAction(session: Session, endpoint: string, payload: Record<string, unknown> = {}) {
  if (isPreviewMode) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return { success: true, preview: true };
  }
  return authenticatedRequest<Record<string, unknown>>(session, endpoint, { method: 'POST', body: JSON.stringify(payload) });
}
