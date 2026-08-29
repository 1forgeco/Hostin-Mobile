import { authenticatedRequest, isPreviewMode } from '@/services/api';
import type { OrgRole, Session } from '@/types';

export type DashboardMetric = [value: string, label: string];
export type DashboardAttention = [title: string, detail: string, icon: string, moduleId?: string];
export type DashboardData = { headline: string; metrics: DashboardMetric[]; attention: DashboardAttention[]; preview: boolean };

const previewData: Record<OrgRole, Omit<DashboardData, 'preview'>> = {
  owner: { headline: 'Your properties at a glance', metrics: [['84%', 'Occupancy'], ['118', 'Residents'], ['₹2.4L', 'Rent due']], attention: [['Gate passes', '9 requests pending', 'exit-outline', 'gate'], ['Complaints', '3 need attention', 'construct-outline', 'complaints'], ['Documents', '21 to verify', 'document-text-outline', 'documents']] },
  warden: { headline: 'Today at City Complex', metrics: [['42', 'Rooms'], ['118', 'Residents'], ['9', 'Passes pending']], attention: [['Gate passes', '9 awaiting review', 'exit-outline', 'gate'], ['Complaints', '3 open issues', 'construct-outline', 'complaints'], ['Visitors', '6 expected today', 'id-card-outline', 'visitors']] },
  guard: { headline: 'Gate operations', metrics: [['9', 'Passes pending'], ['6', 'Visitors today'], ['3', 'Outside now']], attention: [['Gate passes', 'Review movements', 'exit-outline', 'gate'], ['Visitors', 'Manage arrivals', 'id-card-outline', 'visitors'], ['Contacts', 'Emergency directory', 'call-outline', 'staff']] },
  staff: { headline: 'Mess and resident support', metrics: [['78%', 'Meal rating'], ['4', 'Meals today'], ['3', 'Open threads']], attention: [['Mess menu', 'Manage this week', 'restaurant-outline', 'mess'], ['Community', 'Resident updates', 'chatbubble-outline', 'community'], ['Contacts', 'Staff directory', 'call-outline', 'staff']] },
  tenant: { headline: 'Your stay at City Complex', metrics: [['A-101', 'Your room'], ['₹12K', 'Rent due'], ['1', 'Active pass']], attention: [['Dues', 'Review payments', 'wallet-outline', 'finance'], ['Gate pass', 'Track your request', 'exit-outline', 'gate'], ['Mess', 'Today’s meals', 'restaurant-outline', 'mess']] },
  parent: { headline: 'Your child’s stay summary', metrics: [['A-101', 'Room'], ['₹12K', 'Amount due'], ['Inside', 'Movement']], attention: [['My child', 'View stay details', 'person-circle-outline', 'parent-child'], ['Billing', 'Review dues', 'receipt-outline', 'parent-billing'], ['Announcements', 'Property notices', 'megaphone-outline', 'parent-announcements']] },
  platform: { headline: '1Forge control center', metrics: [['27', 'Clients'], ['24', 'Active'], ['3', 'Onboarding']], attention: [['Organizations', 'Client lifecycle', 'business-outline', 'platform'], ['Plans', 'Subscriptions', 'layers-outline', 'platform-plans'], ['Onboarding', 'Provision workspaces', 'rocket-outline', 'platform-onboarding']] },
};

function array(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? value as Record<string, unknown>[] : []; }
function record(value: unknown): Record<string, unknown> { return value && typeof value === 'object' ? value as Record<string, unknown> : {}; }
function number(value: unknown) { const parsed = Number(value ?? 0); return Number.isFinite(parsed) ? parsed : 0; }
function money(value: unknown) { return `₹${number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`; }
function statusCount(items: Record<string, unknown>[], values: string[]) { return items.filter((item) => values.includes(String(item.status ?? '').toLowerCase())).length; }
async function optionalRequest<T>(session: Session, path: string, fallback: T): Promise<T> {
  try { return await authenticatedRequest<T>(session, path); }
  catch { return fallback; }
}

export async function loadDashboard(session: Session): Promise<DashboardData> {
  if (isPreviewMode) return { ...previewData[session.user.role], preview: true };
  const role = session.user.role;
  if (role === 'owner') {
    const response = await authenticatedRequest<Record<string, unknown>>(session, '/owner/dashboard');
    const dashboard = record(response.dashboard); const summary = record(dashboard.summary); const attention = array(dashboard.attention);
    const totalBeds = number(summary.totalBeds); const occupied = Math.max(0, totalBeds - number(summary.availableBeds));
    return { preview: false, headline: 'Your properties at a glance', metrics: [[totalBeds ? `${Math.round(occupied / totalBeds * 100)}%` : '0%', 'Occupancy'], [String(number(summary.totalTenants)), 'Residents'], [money(summary.pendingRent), 'Rent due']], attention: attention.slice(0, 3).map((item) => [String(item.label ?? 'Needs attention'), `${number(item.count)} items`, item.key === 'gate_passes' ? 'exit-outline' : item.key === 'documents' ? 'document-text-outline' : 'alert-circle-outline', item.key === 'gate_passes' ? 'gate' : item.key === 'documents' ? 'documents' : item.key === 'stale_complaints' ? 'complaints' : 'requests']), };
  }
  if (role === 'warden') {
    const response = await authenticatedRequest<Record<string, unknown>>(session, '/warden/dashboard'); const data = record(response.dashboard);
    const rooms = array(data.rooms); const complaints = array(data.complaints); const passes = array(data.gatePasses); const visitors = array(data.visitors);
    return { preview: false, headline: `Today at ${session.workspace}`, metrics: [[String(rooms.length), 'Rooms'], [String(rooms.reduce((sum, room) => sum + number(room.current_occupancy), 0)), 'Residents'], [String(statusCount(passes, ['pending'])), 'Passes pending']], attention: [['Gate passes', `${statusCount(passes, ['pending'])} awaiting review`, 'exit-outline', 'gate'], ['Complaints', `${complaints.length} open issues`, 'construct-outline', 'complaints'], ['Visitors', `${visitors.length} expected`, 'id-card-outline', 'visitors']] };
  }
  if (role === 'parent') {
    const response = await authenticatedRequest<Record<string, unknown>>(session, '/parents/ward'); const ward = array(response.wards)[0] ?? {}; const wardInfo = record(ward.ward); const summary = record(ward.summary);
    return { preview: false, headline: `${String(wardInfo.name ?? 'Child')}’s stay summary`, metrics: [[String(record(wardInfo.room).roomNumber ?? '—'), 'Room'], [money(summary.pendingAmount), 'Amount due'], [String(wardInfo.stayStatus ?? '—'), 'Movement']], attention: [['My child', 'View stay details', 'person-circle-outline', 'parent-child'], ['Billing', `${array(ward.dues).length} fee records`, 'receipt-outline', 'parent-billing'], ['Announcements', `${array(response.announcements).filter((item) => !item.acknowledged).length} unread`, 'megaphone-outline', 'parent-announcements']] };
  }
  if (role === 'platform') {
    const response = await authenticatedRequest<Record<string, unknown>>(session, '/platform/organizations?limit=200'); const organizations = array(response.organizations);
    return { preview: false, headline: '1Forge control center', metrics: [[String(organizations.length), 'Clients'], [String(organizations.filter((item) => item.isActive !== false).length), 'Active'], [String(organizations.filter((item) => record(item.onboarding).status && record(item.onboarding).status !== 'active').length), 'Onboarding']], attention: organizations.slice(0, 3).map((item) => [String(item.name ?? 'Organization'), `${String(item.planName ?? 'Plan')} · ${String(item.planStatus ?? 'unknown')}`, 'business-outline', 'platform']) };
  }
  if (role === 'guard') {
    const [passData, visitorData] = await Promise.all([authenticatedRequest<Record<string, unknown>>(session, '/gate-passes?limit=100'), authenticatedRequest<Record<string, unknown>>(session, '/visitors?limit=100')]);
    const passes = array(passData.passes ?? passData.gatePasses); const visitors = array(visitorData.visitors);
    return { preview: false, headline: 'Gate operations', metrics: [[String(statusCount(passes, ['pending'])), 'Passes pending'], [String(visitors.length), 'Visitors'], [String(statusCount(passes, ['checked_out', 'out'])), 'Outside now']], attention: [['Gate passes', 'Review movement queue', 'exit-outline', 'gate'], ['Visitors', 'Manage arrivals', 'id-card-outline', 'visitors'], ['Contacts', 'Emergency directory', 'call-outline', 'staff']] };
  }
  if (role === 'staff') {
    const [menuData, communityData] = await Promise.all([optionalRequest<Record<string, unknown>>(session, '/mess-menus', {}), authenticatedRequest<Record<string, unknown>>(session, '/community/lost-found?limit=50')]);
    const menus = array(menuData.menus ?? menuData.items); const posts = array(communityData.posts);
    return { preview: false, headline: 'Mess and resident support', metrics: [[String(menus.length), 'Menus'], [String(posts.length), 'Community posts'], ['Live', 'Workspace']], attention: [['Mess menu', 'Manage weekly meals', 'restaurant-outline', 'mess'], ['Community', `${posts.length} posts`, 'chatbubble-outline', 'community'], ['Contacts', 'Staff directory', 'call-outline', 'staff']] };
  }
  const [dueData, passData, menuData] = await Promise.all([authenticatedRequest<Record<string, unknown>>(session, '/dues?limit=100'), authenticatedRequest<Record<string, unknown>>(session, '/gate-passes?limit=100'), optionalRequest<Record<string, unknown>>(session, '/mess-menus', {})]);
  const dues = array(dueData.dues); const passes = array(passData.passes ?? passData.gatePasses); const pending = dues.filter((item) => !['paid', 'waived'].includes(String(item.status ?? '').toLowerCase())).reduce((sum, item) => sum + Math.max(0, number(item.amount) - number(item.amount_paid)), 0);
  return { preview: false, headline: `Your stay at ${session.workspace}`, metrics: [[money(pending), 'Amount due'], [String(statusCount(passes, ['pending', 'approved', 'checked_out', 'out'])), 'Active passes'], [String(array(menuData.menus ?? menuData.items).length), 'Menus']], attention: [['Dues', 'Review payments', 'wallet-outline', 'finance'], ['Gate pass', 'Track movement', 'exit-outline', 'gate'], ['Mess', 'Today’s meals', 'restaurant-outline', 'mess']] };
}
