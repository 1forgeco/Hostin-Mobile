import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth';
import { LogoMark } from '@/components/Logo';
import { modulesForRole } from '@/modules';
import { loadModule, ModuleRecord, runRecordAction, submitModuleAction } from '@/services/modules';
import { pickDocument, pickImage } from '@/services/uploads';
import { colors, radius, shadow } from '@/theme';

type Field = { key: string; label: string; placeholder?: string; multiline?: boolean; optional?: boolean; dataType?: 'number' | 'json' | 'boolean'; picker?: 'image' | 'document' };
type Action = { label: string; endpoint: string; fields: Field[]; defaults?: Record<string, unknown>; method?: 'POST' | 'PUT'; pathKeys?: string[]; roles?: string[] };

const actions: Record<string, Action> = {
  floors: { label: 'Add floor', endpoint: '/floors', fields: [{ key: 'floorNumber', label: 'Floor number', dataType: 'number' }, { key: 'floorName', label: 'Floor name' }] },
  rooms: { label: 'Add room', endpoint: '/rooms', fields: [
    { key: 'floorId', label: 'Floor ID' }, { key: 'roomNumber', label: 'Room number' }, { key: 'roomType', label: 'Room type', placeholder: 'Single, double or triple' }, { key: 'capacity', label: 'Capacity' }, { key: 'monthlyRent', label: 'Monthly rent' },
  ] },
  tenants: { label: 'Add tenant', endpoint: '/tenants', fields: [
    { key: 'fullName', label: 'Full name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'password', label: 'Temporary password' },
  ] },
  'parent-access': { label: 'Link parent', endpoint: '/parents/link', fields: [
    { key: 'tenantId', label: 'Tenant user ID' }, { key: 'parentName', label: 'Parent name' }, { key: 'parentEmail', label: 'Parent email' }, { key: 'parentPhone', label: 'Parent phone' }, { key: 'relation', label: 'Relation', placeholder: 'mother, father or guardian' },
  ] },
  gate: { label: 'Request gate pass', endpoint: '/gate-passes', fields: [
    { key: 'purpose', label: 'Purpose' }, { key: 'destination', label: 'Destination' }, { key: 'expectedOutTime', label: 'Expected out time', placeholder: '2026-08-16T17:00:00Z' }, { key: 'expectedReturnTime', label: 'Expected return time', placeholder: '2026-08-16T20:00:00Z' },
  ] },
  visitors: { label: 'Register visitor', endpoint: '/visitors', fields: [
    { key: 'tenantId', label: 'Tenant ID' }, { key: 'visitorName', label: 'Visitor name' }, { key: 'visitorPhone', label: 'Phone' }, { key: 'visitorRelation', label: 'Relation' }, { key: 'visitorIdProof', label: 'ID proof' }, { key: 'purpose', label: 'Purpose' }, { key: 'expectedVisitTime', label: 'Expected visit time' },
  ] },
  complaints: { label: 'Raise complaint', endpoint: '/complaints', defaults: { photoUrls: [] }, fields: [
    { key: 'category', label: 'Category' }, { key: 'title', label: 'Title' }, { key: 'description', label: 'Description', multiline: true }, { key: 'priority', label: 'Priority', placeholder: 'low, medium or high' }, { key: 'photoUrls', label: 'Photo', optional: true, dataType: 'json', picker: 'image' },
  ] },
  'parent-help': { label: 'Raise concern', endpoint: '/complaints', defaults: { photoUrls: [], category: 'parent concern', priority: 'medium' }, fields: [
    { key: 'title', label: 'Subject' }, { key: 'description', label: 'Tell the warden what happened', multiline: true },
  ] },
  announcements: { label: 'Create notice', endpoint: '/announcements', defaults: { targetType: 'all', sendPush: true, sendWhatsapp: false }, fields: [
    { key: 'title', label: 'Title' }, { key: 'body', label: 'Message', multiline: true },
  ] },
  finance: { label: 'Create due', endpoint: '/dues', fields: [
    { key: 'tenantId', label: 'Tenant ID' }, { key: 'dueType', label: 'Due type' }, { key: 'amount', label: 'Amount' }, { key: 'description', label: 'Description' }, { key: 'dueDate', label: 'Due date', placeholder: '2026-08-20' }, { key: 'billingMonth', label: 'Billing month', placeholder: '2026-08' },
  ] },
  mess: { label: 'Publish menu', endpoint: '/mess-menus', fields: [
    { key: 'weekStartDate', label: 'Week start', placeholder: '2026-08-17' }, { key: 'items', label: 'Menu items (JSON)', placeholder: '[{"day":"Monday","meal":"lunch","name":"Thali"}]', multiline: true },
  ] },
  documents: { label: 'Add document', endpoint: '/documents', fields: [
    { key: 'docType', label: 'Document type' }, { key: 'fileName', label: 'File name' }, { key: 'fileUrl', label: 'Document', picker: 'document' }, { key: 'tenantId', label: 'Tenant ID' },
  ] },
  staff: { label: 'Add contact', endpoint: '/staff-contacts', fields: [
    { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }, { key: 'roleType', label: 'Role' },
  ] },
  requests: { label: 'New request', endpoint: '/owner/requests', fields: [
    { key: 'type', label: 'Request type' }, { key: 'title', label: 'Title' }, { key: 'details', label: 'Details', multiline: true },
  ] },
  'community:owner': { label: 'Post lost & found', endpoint: '/community/lost-found', defaults: { imageUrls: [] }, fields: [{ key: 'caption', label: 'What was lost or found?', multiline: true }, { key: 'imageUrls', label: 'Photo', optional: true, dataType: 'json', picker: 'image' }] },
  'community:tenant': { label: 'Post lost & found', endpoint: '/community/lost-found', defaults: { imageUrls: [] }, fields: [{ key: 'caption', label: 'What was lost or found?', multiline: true }, { key: 'imageUrls', label: 'Photo', optional: true, dataType: 'json', picker: 'image' }] },
  'finance:tenant': { label: 'Record payment', endpoint: '/payments', defaults: { gateway: 'manual' }, fields: [
    { key: 'dueId', label: 'Due ID' }, { key: 'amount', label: 'Amount' }, { key: 'paymentMethod', label: 'Payment method', placeholder: 'cash, upi, card or bank_transfer' }, { key: 'gatewayPaymentId', label: 'Transaction reference', optional: true },
  ] },
  'mess:tenant': { label: 'Rate a meal', endpoint: '/mess-feedback', fields: [
    { key: 'menuItemId', label: 'Menu item ID' }, { key: 'rating', label: 'Rating', placeholder: 'up or down' }, { key: 'note', label: 'Comment', multiline: true, optional: true },
  ] },
  'complaints:owner': { label: 'Assign complaint', endpoint: '/complaints/:complaintId/assign', pathKeys: ['complaintId'], fields: [{ key: 'complaintId', label: 'Complaint ID' }, { key: 'assignedToUserId', label: 'Assignee user ID' }] },
  'complaints:warden': { label: 'Assign complaint', endpoint: '/complaints/:complaintId/assign', pathKeys: ['complaintId'], fields: [{ key: 'complaintId', label: 'Complaint ID' }, { key: 'assignedToUserId', label: 'Assignee user ID' }] },
  platform: { label: 'Update organization', endpoint: '/platform/organizations/:orgId', method: 'PUT', pathKeys: ['orgId'], fields: [
    { key: 'orgId', label: 'Organization ID' }, { key: 'planId', label: 'Plan ID', optional: true }, { key: 'planStatus', label: 'Plan status', optional: true }, { key: 'planExpiresAt', label: 'Plan expiry', optional: true }, { key: 'totalCapacity', label: 'Total capacity', optional: true, dataType: 'number' }, { key: 'themeColor', label: 'Theme colour', placeholder: '#0F766E', optional: true }, { key: 'isActive', label: 'Active', placeholder: 'true or false', optional: true, dataType: 'boolean' },
  ] },
  'platform-plans': { label: 'Save plan', endpoint: '/platform/plans', defaults: { isActive: true, features: {} }, fields: [
    { key: 'name', label: 'Plan name' }, { key: 'tier', label: 'Tier' }, { key: 'maxTenants', label: 'Maximum tenants', dataType: 'number' }, { key: 'priceMonthly', label: 'Monthly price', dataType: 'number' }, { key: 'features', label: 'Features JSON', placeholder: '{"gate_pass":true}', optional: true, dataType: 'json', multiline: true },
  ] },
  'platform-onboarding': { label: 'Start onboarding', endpoint: '/platform/onboarding', defaults: { branchCount: 1, billingCycle: 'monthly' }, fields: [
    { key: 'name', label: 'Organization name' }, { key: 'slug', label: 'Workspace slug' }, { key: 'ownerName', label: 'Owner name' }, { key: 'ownerPhone', label: 'Owner phone' }, { key: 'ownerEmail', label: 'Owner email', optional: true }, { key: 'cityState', label: 'City and state' }, { key: 'address', label: 'Address', optional: true, multiline: true }, { key: 'clientType', label: 'Client type' }, { key: 'branchCount', label: 'Branch count', dataType: 'number' }, { key: 'planId', label: 'Plan ID' }, { key: 'billingCycle', label: 'Billing cycle', placeholder: 'monthly, quarterly or annual' },
  ] },
  'platform-features': { label: 'Update feature', endpoint: '/platform/organizations/:orgId/features', pathKeys: ['orgId'], fields: [
    { key: 'orgId', label: 'Organization ID' }, { key: 'featureKey', label: 'Feature key' }, { key: 'isEnabled', label: 'Enabled', placeholder: 'true or false', dataType: 'boolean' },
  ] },
};

const extraActions: Record<string, Action[]> = {
  rooms: [{ label: 'Assign tenant', endpoint: '/rooms/:roomId/assign-tenant', roles: ['owner', 'warden'], pathKeys: ['roomId'], fields: [
    { key: 'roomId', label: 'Room ID' }, { key: 'tenantUserId', label: 'Tenant user ID' }, { key: 'admissionDate', label: 'Admission date', placeholder: '2026-08-24', optional: true }, { key: 'emergencyContactName', label: 'Emergency contact name', optional: true }, { key: 'emergencyContactPhone', label: 'Emergency contact phone', optional: true }, { key: 'collegeOrCompany', label: 'College or company', optional: true },
  ] }, { label: 'Remove tenant', endpoint: '/rooms/:roomId/tenants/:tenantProfileId/remove', roles: ['owner', 'warden'], pathKeys: ['roomId', 'tenantProfileId'], fields: [
    { key: 'roomId', label: 'Room ID' }, { key: 'tenantProfileId', label: 'Tenant profile ID' }, { key: 'reason', label: 'Reason', multiline: true, optional: true },
  ] }],
  finance: [{ label: 'Reminder settings', endpoint: '/dues/reminder-config', roles: ['owner'], method: 'PUT', defaults: { sendWhatsapp: false, sendPush: true, sendSms: false, sendToParent: true, isActive: true }, fields: [
    { key: 'reminderDays', label: 'Reminder days JSON', placeholder: '[7,3,1]', dataType: 'json' }, { key: 'sendWhatsapp', label: 'WhatsApp', placeholder: 'true or false', dataType: 'boolean' }, { key: 'sendPush', label: 'Push', placeholder: 'true or false', dataType: 'boolean' }, { key: 'sendSms', label: 'SMS', placeholder: 'true or false', dataType: 'boolean' }, { key: 'sendToParent', label: 'Notify parents', placeholder: 'true or false', dataType: 'boolean' }, { key: 'isActive', label: 'Active', placeholder: 'true or false', dataType: 'boolean' },
  ] }],
  'parent-access': [{ label: 'Privacy settings', endpoint: '/parents/privacy', roles: ['owner', 'warden'], method: 'PUT', fields: [
    { key: 'parentProfileId', label: 'Parent profile ID' }, { key: 'canSeeRoommateContact', label: 'Share roommate contacts', placeholder: 'true or false', dataType: 'boolean' }, { key: 'canSeeParentContact', label: 'Share guardian contacts', placeholder: 'true or false', dataType: 'boolean' },
  ] }],
  staff: [{ label: 'Update contact', endpoint: '/staff-contacts/:contactId', roles: ['owner', 'warden'], method: 'PUT', pathKeys: ['contactId'], fields: [
    { key: 'contactId', label: 'Contact ID' }, { key: 'name', label: 'Name', optional: true }, { key: 'phone', label: 'Phone', optional: true }, { key: 'roleType', label: 'Role', optional: true }, { key: 'isEmergency', label: 'Emergency contact', placeholder: 'true or false', optional: true, dataType: 'boolean' }, { key: 'isActive', label: 'Active', placeholder: 'true or false', optional: true, dataType: 'boolean' },
  ] }],
  platform: [
    { label: 'Create account', endpoint: '/platform/organizations/:orgId/accounts', roles: ['platform'], pathKeys: ['orgId'], fields: [{ key: 'orgId', label: 'Organization ID' }, { key: 'fullName', label: 'Full name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'password', label: 'Temporary password' }, { key: 'role', label: 'Role' }, { key: 'accountSlug', label: 'Account slug', optional: true }] },
    { label: 'Account status', endpoint: '/platform/organizations/:orgId/accounts/:userId/status', method: 'PUT', pathKeys: ['orgId', 'userId'], fields: [{ key: 'orgId', label: 'Organization ID' }, { key: 'userId', label: 'User ID' }, { key: 'status', label: 'Status', placeholder: 'active, suspended, archived or left' }] },
    { label: 'Reset password', endpoint: '/platform/organizations/:orgId/accounts/:userId/reset-password', pathKeys: ['orgId', 'userId'], fields: [{ key: 'orgId', label: 'Organization ID' }, { key: 'userId', label: 'User ID' }] },
    { label: 'Role dashboard', endpoint: '/platform/organizations/:orgId/role-dashboards/:role', method: 'PUT', pathKeys: ['orgId', 'role'], fields: [{ key: 'orgId', label: 'Organization ID' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status', placeholder: 'active, inactive or maintenance' }] },
    { label: 'Role permission', endpoint: '/platform/organizations/:orgId/role-permissions/:role/:featureKey', method: 'PUT', pathKeys: ['orgId', 'role', 'featureKey'], fields: [{ key: 'orgId', label: 'Organization ID' }, { key: 'role', label: 'Role' }, { key: 'featureKey', label: 'Feature key' }, { key: 'isAllowed', label: 'Allowed', placeholder: 'true or false', dataType: 'boolean' }, { key: 'permissions', label: 'Permissions JSON', optional: true, dataType: 'json', multiline: true }] },
    { label: 'Access override', endpoint: '/platform/organizations/:orgId/access-overrides', pathKeys: ['orgId'], fields: [{ key: 'orgId', label: 'Organization ID' }, { key: 'userId', label: 'User ID' }, { key: 'role', label: 'Role' }, { key: 'featureKey', label: 'Feature key' }, { key: 'decision', label: 'Decision', placeholder: 'allow or deny' }, { key: 'reason', label: 'Reason', optional: true }, { key: 'expiresAt', label: 'Expires at', optional: true }] },
  ],
  'platform-onboarding': [
    { label: 'Save onboarding step', endpoint: '/platform/onboarding/:orgId/steps/:step', method: 'PUT', pathKeys: ['orgId', 'step'], fields: [{ key: 'orgId', label: 'Organization ID' }, { key: 'step', label: 'Step (2–9)' }, { key: 'data', label: 'Step data JSON', dataType: 'json', multiline: true }] },
    { label: 'Activate workspace', endpoint: '/platform/onboarding/:orgId/activate', pathKeys: ['orgId'], fields: [{ key: 'orgId', label: 'Organization ID' }] },
  ],
};

const allowedActions: Record<string, string[]> = {
  floors: ['owner', 'warden'], rooms: ['owner', 'warden'], tenants: ['warden'], 'parent-access': ['owner', 'warden'], gate: ['tenant'], visitors: ['guard'], complaints: ['owner', 'warden', 'tenant', 'parent'], 'parent-help': ['parent'], announcements: ['warden'], finance: ['owner', 'tenant'], community: ['owner', 'tenant'], mess: ['staff', 'tenant'], documents: ['owner', 'warden'], staff: ['owner', 'warden'], requests: ['owner'], platform: ['platform'], 'platform-plans': ['platform'], 'platform-onboarding': ['platform'], 'platform-features': ['platform'],
};

function statusColor(status = '') {
  const value = status.toLowerCase();
  if (value.includes('active') || value.includes('approved') || value.includes('verified') || value.includes('published') || value.includes('ready')) return colors.success;
  if (value.includes('pending') || value.includes('progress') || value.includes('partial') || value.includes('unread')) return colors.warning;
  if (value.includes('unpaid') || value.includes('maintenance')) return colors.danger;
  return colors.forest;
}

function text(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'H';
}

function money(value: unknown) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return text(value);
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function moduleCtaLabel(moduleId: string, fallback?: string) {
  return ({
    rooms: 'Add Room',
    floors: 'Add Floor',
    credentials: 'Add Team Member',
    gate: 'New Pass',
    finance: 'Add Charges',
    community: 'Create Announcement',
    staff: 'Add Contact',
    documents: 'Add Document',
    complaints: 'Raise / Assign',
  } as Record<string, string>)[moduleId] ?? fallback ?? 'Add';
}

function moduleTabs(moduleId: string) {
  return ({
    rooms: ['All', 'Occupied', 'Vacant', 'Maintenance'],
    credentials: ['All', 'Active', 'Pending'],
    gate: ['Tenant Passes', 'Visitors'],
    finance: ['All', 'Paid', 'Unpaid', 'Partial', 'Overdue'],
    community: ['Announcements', 'Complaints', 'Lost / Found'],
    staff: ['All', 'Security', 'Maintenance', 'Management'],
  } as Record<string, string[]>)[moduleId] ?? ['All'];
}

function statusMatchesTab(record: ModuleRecord, tab: string) {
  if (tab === 'All' || tab === 'Tenant Passes' || tab === 'Announcements') return true;
  const haystack = `${record.status} ${record.subtitle} ${record.meta}`.toLowerCase();
  if (tab === 'Vacant') return haystack.includes('vacant') || haystack.includes('available');
  if (tab === 'Overdue') return haystack.includes('overdue') || haystack.includes('unpaid');
  return haystack.includes(tab.toLowerCase());
}

function moduleStats(moduleId: string, records: ModuleRecord[]) {
  const total = records.length;
  const count = (term: string) => records.filter((record) => `${record.status} ${record.subtitle} ${record.meta}`.toLowerCase().includes(term)).length;
  if (moduleId === 'rooms' || moduleId === 'floors') return [
    ['Total', String(total), 'business-outline'],
    ['Occupied', String(count('occupied')), 'people-outline'],
    ['Partial', String(count('partial')), 'aperture-outline'],
    ['Empty', String(count('vacant') + count('available')), 'ellipse-outline'],
  ];
  if (moduleId === 'finance') return [
    ['Collected', money(records.filter((record) => `${record.status}`.toLowerCase().includes('paid')).reduce((sum, record) => sum + Number(record.raw?.amount_paid ?? record.raw?.amountPaid ?? 0), 0)), 'wallet-outline'],
    ['Due', money(records.reduce((sum, record) => sum + Math.max(0, Number(record.raw?.amount ?? 0) - Number(record.raw?.amount_paid ?? record.raw?.amountPaid ?? 0)), 0)), 'receipt-outline'],
    ['Overdue', String(count('unpaid') + count('overdue')), 'alert-circle-outline'],
    ['Records', String(total), 'pie-chart-outline'],
  ];
  if (moduleId === 'gate') return [
    ['Total Passes', String(total), 'calendar-outline'],
    ['Completed', String(count('completed')), 'checkmark-circle-outline'],
    ['Pending', String(count('pending')), 'time-outline'],
    ['Active', String(count('approved') + count('out')), 'pulse-outline'],
  ];
  return [];
}

function payloadFrom(values: Record<string, string>, fields: Field[], defaults: Record<string, unknown> = {}) {
  const payload: Record<string, unknown> = { ...defaults };
  for (const [key, value] of Object.entries(values)) {
    if (!value.trim()) continue;
    const field = fields.find((item) => item.key === key);
    if (field?.dataType === 'number' || ['capacity', 'monthlyRent', 'amount'].includes(key)) payload[key] = Number(value);
    else if (field?.dataType === 'boolean') payload[key] = value.trim().toLowerCase() === 'true';
    else if (field?.dataType === 'json' || key === 'items') {
      try { payload[key] = JSON.parse(value); } catch { throw new Error(`${field?.label ?? key} must be valid JSON.`); }
    } else payload[key] = value.trim();
  }
  return payload;
}

type RecordAction = { label: string; endpoint: string; payload?: Record<string, unknown>; destructive?: boolean };

function actionsForRecord(moduleId: string, role: string, record: ModuleRecord): RecordAction[] {
  const status = record.status?.toLowerCase() ?? '';
  if (moduleId === 'gate') {
    if (role === 'tenant' && status.includes('pending')) return [{ label: 'Cancel', endpoint: `/gate-passes/${record.id}/cancel`, destructive: true }];
    if (['owner', 'warden'].includes(role) && status.includes('pending')) return [
      { label: 'Approve', endpoint: `/gate-passes/${record.id}/approve`, payload: { status: 'approved' } },
      { label: 'Reject', endpoint: `/gate-passes/${record.id}/approve`, payload: { status: 'rejected' }, destructive: true },
    ];
    if (['owner', 'warden', 'guard'].includes(role) && status.includes('approved')) return [{ label: 'Check out', endpoint: `/gate-passes/${record.id}/check-out` }];
    if (['owner', 'warden', 'guard'].includes(role) && status.includes('out')) return [{ label: 'Check in', endpoint: `/gate-passes/${record.id}/check-in` }];
  }
  if (moduleId === 'visitors') {
    if (['owner', 'warden'].includes(role) && status.includes('pending')) return [
      { label: 'Approve', endpoint: `/visitors/${record.id}/approve`, payload: { status: 'approved' } },
      { label: 'Reject', endpoint: `/visitors/${record.id}/approve`, payload: { status: 'rejected' }, destructive: true },
    ];
    if (['owner', 'warden', 'guard'].includes(role) && status.includes('approved')) return [{ label: 'Check in', endpoint: `/visitors/${record.id}/check-in` }];
    if (['owner', 'warden', 'guard'].includes(role) && status.includes('checked in')) return [{ label: 'Check out', endpoint: `/visitors/${record.id}/check-out` }];
  }
  if (moduleId === 'complaints' && ['owner', 'warden', 'staff', 'guard'].includes(role)) {
    if (status.includes('open')) return [{ label: 'Start work', endpoint: `/complaints/${record.id}/status`, payload: { status: 'in_progress', note: 'Updated from HostIn mobile' } }];
    if (status.includes('progress')) return [{ label: 'Resolve', endpoint: `/complaints/${record.id}/status`, payload: { status: 'resolved', note: 'Resolved from HostIn mobile' } }];
  }
  if (moduleId === 'documents' && ['owner', 'warden'].includes(role) && !status.includes('verified')) return [{ label: 'Verify', endpoint: `/documents/${record.id}/verify`, payload: { isVerified: true } }];
  if (moduleId === 'tenants' && role === 'warden' && record.raw?.tenantProfileId && status.includes('active')) return [{ label: 'Vacate', endpoint: `/tenants/${record.raw.tenantProfileId}/vacate`, payload: { reason: 'Vacated from HostIn mobile' }, destructive: true }];
  if ((moduleId === 'announcements' || moduleId === 'parent-announcements') && (status.includes('unread') || record.raw?.isRead === false || record.raw?.acknowledged === false)) return [{ label: 'Mark read', endpoint: `/announcements/${record.id}/read` }];
  if (moduleId === 'mess' && ['owner', 'staff'].includes(role) && status.includes('draft')) return [{ label: 'Publish', endpoint: `/mess-menus/${record.id}/publish` }];
  if (moduleId === 'community' && ['owner', 'warden', 'staff'].includes(role)) return [{ label: 'React', endpoint: '/community/interactions', payload: { postId: record.id, postType: 'lost', kind: 'reaction' } }];
  return [];
}

export default function ModuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const module = session ? modulesForRole(session.user.role).find((item) => item.id === id) : undefined;
  const action = id && session ? actions[`${id}:${session.user.role}`] ?? actions[id] : undefined;
  const canAct = !!(session && id && action && allowedActions[id]?.includes(session.user.role));
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<Action | undefined>(action);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState('');
  const [actingId, setActingId] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});

  const refresh = async (pull = false) => {
    if (!session || !id || !module) return;
    pull ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const result = await loadModule(session, id);
      setRecords(result.records); setPreview(result.preview);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load this module.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const tabs = useMemo(() => moduleTabs(id ?? ''), [id]);
  const stats = useMemo(() => moduleStats(id ?? '', records), [id, records]);
  const isCompact = width < 390;

  useEffect(() => { void refresh(); }, [id, session?.accessToken]);
  useEffect(() => { setActiveTab(tabs[0] ?? 'All'); }, [id, tabs]);
  const filtered = useMemo(() => records.filter((item) => {
    const searchMatch = `${item.title} ${item.subtitle} ${item.meta} ${item.status}`.toLowerCase().includes(query.toLowerCase());
    return searchMatch && statusMatchesTab(item, activeTab);
  }), [activeTab, query, records]);

  const submit = async () => {
    const selectedAction = activeAction ?? action;
    if (!session || !selectedAction) return;
    const missing = selectedAction.fields.find((field) => !field.optional && !values[field.key]?.trim() && selectedAction.defaults?.[field.key] === undefined);
    if (missing) return Alert.alert('Missing information', `Enter ${missing.label.toLowerCase()}.`);
    setSaving(true);
    try {
      const payload = payloadFrom(values, selectedAction.fields, selectedAction.defaults);
      let endpoint = selectedAction.endpoint;
      for (const key of selectedAction.pathKeys ?? []) { endpoint = endpoint.replace(`:${key}`, encodeURIComponent(String(payload[key] ?? ''))); delete payload[key]; }
      await submitModuleAction(session, endpoint, payload, selectedAction.method);
      setFormOpen(false); setValues({});
      Alert.alert(preview ? 'Preview action complete' : 'Saved', preview ? 'The action works in preview mode and is ready for the live API.' : 'The record was saved successfully.');
      await refresh();
    } catch (cause) { Alert.alert('Could not save', cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setSaving(false); }
  };

  const runAction = async (record: ModuleRecord, item: RecordAction) => {
    if (!session) return;
    const execute = async () => {
      setActingId(`${record.id}:${item.label}`);
      try {
        await runRecordAction(session, item.endpoint, item.payload);
        Alert.alert(preview ? 'Preview action complete' : 'Updated', `${item.label} completed successfully.`);
        await refresh();
      } catch (cause) { Alert.alert('Action failed', cause instanceof Error ? cause.message : 'Please try again.'); }
      finally { setActingId(''); }
    };
    if (item.destructive) Alert.alert(item.label, `Are you sure you want to ${item.label.toLowerCase()} this record?`, [{ text: 'Keep', style: 'cancel' }, { text: item.label, style: 'destructive', onPress: () => void execute() }]);
    else await execute();
  };

  const chooseFile = async (field: Field) => {
    setPicking(field.key);
    try {
      const picked = field.picker === 'image' ? await pickImage() : await pickDocument();
      if (!picked) return;
      setValues((current) => ({
        ...current,
        [field.key]: field.picker === 'image' ? JSON.stringify([picked.dataUrl]) : picked.dataUrl,
        ...(field.picker === 'document' ? { fileName: picked.fileName } : {}),
      }));
    } catch (cause) { Alert.alert('Could not attach file', cause instanceof Error ? cause.message : 'Please try another file.'); }
    finally { setPicking(''); }
  };

  if (!module) return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.title}>Module unavailable</Text><Text style={styles.subtitle}>This module is not enabled for your signed-in role.</Text><Pressable onPress={() => router.back()} style={styles.primary}><Text style={styles.primaryText}>Go back</Text></Pressable></View></SafeAreaView>;

  const renderSkeleton = () => <View style={styles.skeletonWrap}>
    <View style={styles.skeletonStats}>{Array.from({ length: 4 }).map((_, index) => <View key={index} style={styles.skeletonStat}><View style={styles.skeletonCircle} /><View style={styles.skeletonLineWide} /><View style={styles.skeletonLineShort} /></View>)}</View>
    <View style={styles.skeletonRecords}>{Array.from({ length: 5 }).map((_, index) => <View key={index} style={styles.skeletonRecord}><View style={styles.skeletonCircle} /><View style={styles.skeletonCopy}><View style={styles.skeletonLineWide} /><View style={styles.skeletonLine} /></View><View style={styles.skeletonBadge} /></View>)}</View>
  </View>;

  const renderActions = (item: ModuleRecord) => session && id && actionsForRecord(id, session.user.role, item).length > 0 ? <View style={styles.recordActions}>{actionsForRecord(id, session.user.role, item).map((recordAction) => <Pressable disabled={!!actingId} key={recordAction.label} onPress={() => void runAction(item, recordAction)} style={[styles.recordAction, recordAction.destructive && styles.recordActionDanger]}>{actingId === `${item.id}:${recordAction.label}` ? <ActivityIndicator color={recordAction.destructive ? colors.danger : colors.forest} size="small" /> : <Text style={[styles.recordActionText, recordAction.destructive && styles.recordActionDangerText]}>{recordAction.label}</Text>}</Pressable>)}</View> : null;

  const renderRecord = (item: ModuleRecord) => {
    const raw = item.raw ?? {};
    const status = item.status || text(raw.status);
    const tone = statusColor(status);
    if (id === 'rooms' || id === 'floors') {
      return <View key={item.id} style={[styles.roomCard, { borderColor: `${tone}66` }]}>
        <View style={styles.roomTop}><View><Text style={styles.roomNumber}>{item.title}</Text><Text numberOfLines={1} style={styles.roomTenant}>{item.subtitle || 'Vacant'}</Text></View>{!!status && <View style={[styles.statusDot, { borderColor: tone, backgroundColor: status.toLowerCase().includes('occupied') ? tone : 'transparent' }]} />}</View>
        {!!item.meta && <Text numberOfLines={1} style={styles.roomMeta}>{item.meta}</Text>}
        {renderActions(item)}
      </View>;
    }
    if (id === 'credentials') {
      return <View key={item.id} style={styles.accountCard}>
        <View style={styles.accountTop}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.title)}</Text></View><View style={styles.accountCopy}><Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text><Text numberOfLines={1} style={styles.cardSubtitle}>{item.subtitle}</Text></View>{!!status && <View style={[styles.badge, { backgroundColor: `${tone}14` }]}><Text style={[styles.badgeText, { color: tone }]}>{status}</Text></View>}</View>
        <View style={styles.accountGrid}><View style={styles.accountField}><Text style={styles.fieldLabel}>Login ID</Text><Text numberOfLines={1} style={styles.fieldValue}>{text(raw.email) || item.meta || item.subtitle}</Text></View><View style={styles.accountField}><Text style={styles.fieldLabel}>Last active</Text><Text numberOfLines={1} style={styles.fieldValue}>{text(raw.last_login_at || raw.lastLoginAt) || 'Recently'}</Text></View></View>
        {renderActions(item)}
      </View>;
    }
    if (id === 'gate') {
      return <View key={item.id} style={[styles.travelCard, { borderLeftColor: tone }]}>
        <View style={styles.travelMain}><View style={styles.travelIcon}><Ionicons color={tone} name="airplane-outline" size={20} /></View><View style={styles.travelCopy}><Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text><Text numberOfLines={1} style={styles.cardSubtitle}>{item.subtitle}</Text></View>{!!status && <View style={[styles.badge, { backgroundColor: `${tone}14` }]}><Text style={[styles.badgeText, { color: tone }]}>{status}</Text></View>}</View>
        <View style={styles.travelRoute}><Text numberOfLines={1} style={styles.routePoint}>{text(raw.destination) || item.meta || 'Destination'}</Text><View style={styles.routeLine}><View style={styles.routeDash} /><Ionicons color="#667085" name="airplane" size={15} /><View style={styles.routeDash} /></View><Text numberOfLines={1} style={styles.routePoint}>{text(raw.expected_return_time || raw.expectedReturnTime) || 'Return'}</Text></View>
        {renderActions(item)}
      </View>;
    }
    if (id === 'finance') {
      const amount = money(raw.amount ?? item.meta);
      const paid = money(raw.amount_paid ?? raw.amountPaid ?? 0);
      const balance = money(Math.max(0, Number(raw.amount ?? 0) - Number(raw.amount_paid ?? raw.amountPaid ?? 0)));
      return <View key={item.id} style={styles.paymentCard}>
        <View style={styles.paymentTop}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.title)}</Text></View><View style={styles.accountCopy}><Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text><Text numberOfLines={1} style={styles.cardSubtitle}>{item.subtitle}</Text></View>{!!status && <View style={[styles.badge, { backgroundColor: `${tone}14` }]}><Text style={[styles.badgeText, { color: tone }]}>{status}</Text></View>}</View>
        <View style={styles.paymentGrid}><View><Text style={styles.fieldLabel}>Monthly Due</Text><Text style={styles.fieldValue}>{amount}</Text></View><View><Text style={styles.fieldLabel}>Paid</Text><Text style={styles.fieldValue}>{paid}</Text></View><View><Text style={styles.fieldLabel}>Balance</Text><Text style={[styles.fieldValue, { color: balance === '₹0' ? colors.success : colors.danger }]}>{balance}</Text></View></View>
        {renderActions(item)}
      </View>;
    }
    if (id === 'community') {
      return <View key={item.id} style={styles.postCard}>
        <View style={styles.accountTop}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.title)}</Text></View><View style={styles.accountCopy}><Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text><Text numberOfLines={1} style={styles.cardSubtitle}>{item.meta || item.subtitle}</Text></View><Ionicons color={colors.muted} name="ellipsis-vertical" size={17} /></View>
        {!!item.subtitle && <Text numberOfLines={3} style={styles.postText}>{item.subtitle}</Text>}
        <View style={styles.postFooter}><Text style={styles.postMetric}>0 likes</Text><Text style={styles.postMetric}>0 comments</Text><Text style={styles.viewLink}>View</Text></View>
        {renderActions(item)}
      </View>;
    }
    if (id === 'staff') {
      return <View key={item.id} style={styles.contactCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.title)}</Text></View><View style={styles.accountCopy}><Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text><Text numberOfLines={1} style={styles.cardSubtitle}>{item.subtitle}</Text><Text numberOfLines={1} style={styles.contactPhone}>{item.meta}</Text></View><Pressable style={styles.callButton}><Ionicons color={colors.forest} name="call-outline" size={19} /><Text style={styles.callText}>Call</Text></Pressable>
      </View>;
    }
    return <View key={item.id} style={styles.card}>
      <View style={styles.cardIcon}><Ionicons name={module.icon as keyof typeof Ionicons.glyphMap} color={colors.forest} size={19} /></View>
      <View style={styles.cardBody}><Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text>{!!item.subtitle && <Text numberOfLines={2} style={styles.cardSubtitle}>{item.subtitle}</Text>}<View style={styles.cardMeta}>{!!status && <View style={[styles.badge, { backgroundColor: `${tone}14` }]}><Text style={[styles.badgeText, { color: tone }]}>{status}</Text></View>}{!!item.meta && <Text numberOfLines={1} style={styles.meta}>{item.meta}</Text>}</View>{renderActions(item)}</View>
    </View>;
  };

  return <SafeAreaView edges={['top']} style={styles.safe}>
    <View style={styles.topBar}>
      <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}><Ionicons name="chevron-back" color={colors.ink} size={20} /></Pressable>
      <View style={styles.brandMini}><LogoMark size={30} /><Text style={styles.brandText}>hostin.</Text></View>
      <View style={styles.topSpacer} />
      <View style={styles.propertyPill}><Ionicons color={colors.ink} name="business-outline" size={15} /><Text numberOfLines={1} style={styles.propertyPillText}>{session?.workspace ?? 'Workspace'}</Text><Ionicons color={colors.ink} name="chevron-down" size={13} /></View>
      <View style={styles.profileDot}><Text style={styles.profileDotText}>{initials(session?.workspace ?? 'CC')}</Text></View>
    </View>
    <ScrollView contentContainerStyle={[styles.content, isCompact && styles.contentCompact]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(true)} tintColor={colors.forest} />}>
      <View style={styles.titleRow}>
        <View style={styles.titleIcon}><Ionicons color={colors.ink} name={module.icon as keyof typeof Ionicons.glyphMap} size={24} /></View>
        <View style={styles.titleCopy}><Text style={[styles.title, isCompact && styles.titleCompact]}>{module.title}</Text><Text style={styles.subtitle}>{module.description}</Text></View>
      </View>
      {canAct && <Pressable accessibilityLabel={action?.label} onPress={() => { setActiveAction(action); setFormOpen(true); }} style={styles.inlineCta}><Ionicons name="add" color="#fff" size={18} /><Text style={styles.inlineCtaText}>{moduleCtaLabel(id ?? '', action?.label)}</Text></Pressable>}
      {preview && <View style={styles.preview}><Ionicons name="flask-outline" color={colors.warning} size={18} /><Text style={styles.previewText}>Preview data is active. Connect the existing HostIn API to use live records.</Text></View>}
      {!loading && !!stats.length && <View style={styles.statsGrid}>{stats.map(([label, value, icon]) => <View key={label} style={styles.statCard}><View style={styles.statIcon}><Ionicons color={colors.forest} name={icon as keyof typeof Ionicons.glyphMap} size={18} /></View><Text adjustsFontSizeToFit numberOfLines={1} style={styles.statValue}>{value}</Text><Text numberOfLines={2} style={styles.statLabel}>{label}</Text></View>)}</View>}
      {tabs.length > 1 && <ScrollView horizontal contentContainerStyle={styles.tabs} showsHorizontalScrollIndicator={false}>{tabs.map((tab) => <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}><Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text></Pressable>)}</ScrollView>}
      <View style={styles.search}><Ionicons name="search" color={colors.muted} size={18} /><TextInput value={query} onChangeText={setQuery} placeholder={`Search ${module.title.toLowerCase()}...`} placeholderTextColor="#98A2B3" style={styles.searchInput} />{!!query && <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" color={colors.muted} size={18} /></Pressable>}</View>
      {session && id && (extraActions[id] ?? []).some((tool) => !tool.roles || tool.roles.includes(session.user.role)) && <View style={styles.moduleTools}>{extraActions[id].filter((tool) => !tool.roles || tool.roles.includes(session.user.role)).map((tool) => <Pressable key={tool.label} onPress={() => { setActiveAction(tool); setFormOpen(true); }} style={styles.toolButton}><Ionicons name="build-outline" color={colors.forest} size={15} /><Text style={styles.toolText}>{tool.label}</Text></Pressable>)}</View>}
      {loading ? renderSkeleton() : error ? <View style={styles.empty}><Ionicons name="cloud-offline-outline" color={colors.danger} size={28} /><Text style={styles.emptyTitle}>Couldn’t load records</Text><Text style={styles.emptyText}>{error}</Text><Pressable onPress={() => void refresh()}><Text style={styles.retry}>Try again</Text></Pressable></View> : filtered.length ? <View style={[styles.records, (id === 'rooms' || id === 'floors') && styles.roomGrid]}>{filtered.map(renderRecord)}</View> : <View style={styles.empty}><Ionicons name="file-tray-outline" color={colors.muted} size={30} /><Text style={styles.emptyTitle}>No records found</Text><Text style={styles.emptyText}>{query ? 'Try a different search.' : 'New records will appear here.'}</Text></View>}
    </ScrollView>
    <Modal animationType="slide" transparent visible={formOpen} onRequestClose={() => setFormOpen(false)}>
      <View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={() => setFormOpen(false)} /><View style={styles.sheet}>
        <View style={styles.handle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>{activeAction?.label ?? action?.label}</Text><Text style={styles.sheetSubtitle}>Fields match the HostIn backend.</Text></View><Pressable onPress={() => setFormOpen(false)} style={styles.iconButton}><Ionicons name="close" color={colors.ink} size={22} /></Pressable></View>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">{(activeAction ?? action)?.fields.map((field) => <View key={field.key}><Text style={styles.label}>{field.label}{field.optional ? ' · OPTIONAL' : ''}</Text>{field.picker ? <Pressable disabled={picking === field.key} onPress={() => void chooseFile(field)} style={styles.pickerButton}>{picking === field.key ? <ActivityIndicator color={colors.forest} /> : <><Ionicons name={field.picker === 'image' ? 'image-outline' : 'document-attach-outline'} color={colors.forest} size={20} /><View style={styles.pickerCopy}><Text style={styles.pickerTitle}>{values[field.key] ? 'Attachment ready' : `Choose ${field.picker}`}</Text><Text numberOfLines={1} style={styles.pickerSubtitle}>{field.picker === 'document' && values.fileName ? values.fileName : 'PDF or image, up to 2 MB'}</Text></View></>}</Pressable> : <TextInput autoCapitalize="none" multiline={field.multiline} onChangeText={(value) => setValues((current) => ({ ...current, [field.key]: value }))} placeholder={field.placeholder ?? field.label} placeholderTextColor="#98A2B3" style={[styles.input, field.multiline && styles.multiline]} value={values[field.key] ?? ''} />}</View>)}
          <Pressable disabled={saving} onPress={() => void submit()} style={[styles.primary, saving && styles.disabled]}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save</Text>}</Pressable>
        </ScrollView>
      </View></View>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.canvas, flex: 1 },
  topBar: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: '#EEF1F4', borderBottomWidth: 1, flexDirection: 'row', gap: 8, minHeight: 58, paddingHorizontal: 12, paddingVertical: 8 },
  backButton: { alignItems: 'center', backgroundColor: '#F8FAFB', borderColor: colors.border, borderRadius: 12, borderWidth: 1, height: 32, justifyContent: 'center', width: 32 },
  brandMini: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  brandText: { color: colors.forest, fontSize: 17, fontWeight: '900' },
  topSpacer: { flex: 1 },
  propertyPill: { alignItems: 'center', borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', gap: 5, maxWidth: 150, minHeight: 34, paddingHorizontal: 10 },
  propertyPillText: { color: colors.ink, flexShrink: 1, fontSize: 11, fontWeight: '900' },
  profileDot: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: 17, height: 34, justifyContent: 'center', width: 34 },
  profileDotText: { color: colors.surface, fontSize: 12, fontWeight: '900' },
  content: { padding: 14, paddingBottom: 116 },
  contentCompact: { paddingHorizontal: 12 },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, marginTop: 6 },
  titleIcon: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#E7F4F1', borderRadius: 14, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  titleCopy: { flex: 1, minWidth: 0 },
  title: { color: colors.ink, fontSize: 23, fontWeight: '900', letterSpacing: 0 },
  titleCompact: { fontSize: 21 },
  subtitle: { color: colors.muted, fontSize: 12, fontWeight: '600', lineHeight: 17, marginTop: 3 },
  inlineCta: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.forest, borderRadius: 12, flexDirection: 'row', gap: 6, marginTop: 13, minHeight: 36, paddingHorizontal: 13 },
  inlineCtaText: { color: colors.surface, fontSize: 12, fontWeight: '900' },
  preview: { alignItems: 'center', backgroundColor: colors.coralSoft, borderColor: '#F5DEB3', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 8, marginTop: 12, padding: 10 },
  previewText: { color: '#8A5A13', flex: 1, fontSize: 11, lineHeight: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  statCard: { alignItems: 'flex-start', backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 12, borderWidth: 1, flex: 1, minHeight: 76, minWidth: '22%', padding: 10, ...shadow },
  statIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 12, height: 28, justifyContent: 'center', width: 28 },
  statValue: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: 7 },
  statLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', lineHeight: 12, marginTop: 1 },
  tabs: { gap: 7, paddingRight: 8 },
  tab: { alignItems: 'center', borderColor: colors.border, borderRadius: 12, borderWidth: 1, height: 34, justifyContent: 'center', marginTop: 15, paddingHorizontal: 13 },
  tabActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  tabText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  tabTextActive: { color: colors.surface },
  search: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 8, height: 40, marginTop: 12, paddingHorizontal: 12 },
  searchInput: { color: colors.ink, flex: 1, fontSize: 12, fontWeight: '700', height: 38, padding: 0 },
  moduleTools: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  toolButton: { alignItems: 'center', backgroundColor: colors.forestSoft, borderColor: '#D4F4EC', borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', gap: 5, minHeight: 28, paddingHorizontal: 10 },
  toolText: { color: colors.forest, fontSize: 10, fontWeight: '900' },
  loader: { marginTop: 50 },
  skeletonWrap: { marginTop: 14 },
  skeletonStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skeletonStat: { backgroundColor: 'rgba(255,255,255,0.8)', borderColor: '#EEF1F4', borderRadius: 12, borderWidth: 1, flex: 1, minHeight: 76, minWidth: '22%', padding: 10 },
  skeletonRecords: { gap: 9, marginTop: 12 },
  skeletonRecord: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.86)', borderColor: '#EEF1F4', borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 66, padding: 11, ...shadow },
  skeletonCircle: { backgroundColor: '#E8EEFA', borderRadius: 16, height: 32, width: 32 },
  skeletonCopy: { flex: 1, gap: 8 },
  skeletonLineWide: { backgroundColor: '#E8EEFA', borderRadius: radius.pill, height: 10, width: '68%' },
  skeletonLine: { backgroundColor: '#EEF2F8', borderRadius: radius.pill, height: 9, width: '88%' },
  skeletonLineShort: { backgroundColor: '#EEF2F8', borderRadius: radius.pill, height: 9, marginTop: 8, width: '46%' },
  skeletonBadge: { backgroundColor: '#EEF2F8', borderRadius: radius.pill, height: 22, width: 48 },
  records: { gap: 9, marginTop: 12 },
  roomGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  roomCard: { backgroundColor: '#FBFFFE', borderRadius: 11, borderWidth: 1, minHeight: 74, padding: 10, width: '48.5%' },
  roomTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  roomNumber: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  roomTenant: { color: colors.forest, fontSize: 10, fontWeight: '700', marginTop: 3, maxWidth: 118 },
  roomMeta: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 8 },
  statusDot: { borderRadius: 9, borderWidth: 2, height: 18, width: 18 },
  card: { ...shadow, alignItems: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 11 },
  cardIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 11, height: 34, justifyContent: 'center', width: 34 },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  cardSubtitle: { color: colors.muted, fontSize: 11, fontWeight: '600', lineHeight: 16, marginTop: 2 },
  cardMeta: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 10, fontWeight: '900', textTransform: 'capitalize' },
  meta: { color: colors.muted, flexShrink: 1, fontSize: 10, fontWeight: '700' },
  accountCard: { ...shadow, backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 14, borderWidth: 1, padding: 12 },
  accountTop: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  avatar: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  avatarText: { color: colors.forest, fontSize: 14, fontWeight: '900' },
  accountCopy: { flex: 1, minWidth: 0 },
  accountGrid: { borderTopColor: '#EEF1F4', borderTopWidth: 1, flexDirection: 'row', gap: 12, marginTop: 11, paddingTop: 10 },
  accountField: { flex: 1, minWidth: 0 },
  fieldLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', marginBottom: 5, textTransform: 'uppercase' },
  fieldValue: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  travelCard: { ...shadow, backgroundColor: colors.surface, borderColor: '#EEF1F4', borderLeftWidth: 4, borderRadius: 14, borderWidth: 1, padding: 12 },
  travelMain: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  travelIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 16, height: 38, justifyContent: 'center', width: 38 },
  travelCopy: { flex: 1, minWidth: 0 },
  travelRoute: { alignItems: 'center', borderTopColor: '#EEF1F4', borderTopWidth: 1, flexDirection: 'row', gap: 10, marginTop: 13, paddingTop: 12 },
  routePoint: { color: colors.ink, flex: 1, fontSize: 11, fontWeight: '800' },
  routeLine: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  routeDash: { backgroundColor: '#CBD5E1', height: 1, width: 22 },
  paymentCard: { ...shadow, backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 14, borderWidth: 1, padding: 12 },
  paymentTop: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  paymentGrid: { borderTopColor: '#EEF1F4', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 11, paddingTop: 10 },
  postCard: { ...shadow, backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 14, borderWidth: 1, padding: 12 },
  postText: { color: colors.ink, fontSize: 12, fontWeight: '800', lineHeight: 18, marginTop: 10 },
  postFooter: { alignItems: 'center', borderTopColor: '#EEF1F4', borderTopWidth: 1, flexDirection: 'row', gap: 18, marginTop: 13, paddingTop: 12 },
  postMetric: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  viewLink: { color: colors.forest, fontSize: 12, fontWeight: '900', marginLeft: 'auto' },
  contactCard: { ...shadow, alignItems: 'center', backgroundColor: colors.surface, borderColor: '#EEF1F4', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  contactPhone: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 6 },
  callButton: { alignItems: 'center', borderColor: colors.border, borderRadius: 12, borderWidth: 1, gap: 3, height: 50, justifyContent: 'center', width: 54 },
  callText: { color: colors.forest, fontSize: 11, fontWeight: '900' },
  recordActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  recordAction: { alignItems: 'center', backgroundColor: colors.forestSoft, borderColor: '#D4F4EC', borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', minHeight: 30, minWidth: 76, paddingHorizontal: 12 },
  recordActionText: { color: colors.forest, fontSize: 10, fontWeight: '900' },
  recordActionDanger: { backgroundColor: '#FFF1F0', borderColor: '#FFE0DA' },
  recordActionDangerText: { color: colors.danger },
  empty: { alignItems: 'center', marginTop: 48, paddingHorizontal: 20 },
  emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '900', marginTop: 10 },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: 'center' },
  retry: { color: colors.forest, fontSize: 13, fontWeight: '900', marginTop: 12 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 30 },
  primary: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: 13, justifyContent: 'center', marginTop: 18, minHeight: 48, paddingHorizontal: 20 },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  disabled: { opacity: 0.55 },
  modalBackdrop: { backgroundColor: 'rgba(16,24,40,0.45)', flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', paddingBottom: 20 },
  handle: { alignSelf: 'center', backgroundColor: '#D0D5DD', borderRadius: 3, height: 5, marginTop: 9, width: 42 },
  sheetHeader: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  sheetTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  sheetSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  iconButton: { alignItems: 'center', backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: 13, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 },
  form: { gap: 13, padding: 16, paddingBottom: 35 },
  label: { color: colors.ink, fontSize: 11, fontWeight: '800', marginBottom: 6 },
  input: { backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: 13, borderWidth: 1, color: colors.ink, fontSize: 13, minHeight: 46, paddingHorizontal: 12, paddingVertical: 10 },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  pickerButton: { alignItems: 'center', backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 56, paddingHorizontal: 13 },
  pickerCopy: { flex: 1 },
  pickerTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  pickerSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
});
