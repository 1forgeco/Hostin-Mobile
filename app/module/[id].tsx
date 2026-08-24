import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth';
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
  const module = session ? modulesForRole(session.user.role).find((item) => item.id === id) : undefined;
  const action = id && session ? actions[`${id}:${session.user.role}`] ?? actions[id] : undefined;
  const canAct = !!(session && id && action && allowedActions[id]?.includes(session.user.role));
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [query, setQuery] = useState('');
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

  useEffect(() => { void refresh(); }, [id, session?.accessToken]);
  const filtered = useMemo(() => records.filter((item) => `${item.title} ${item.subtitle} ${item.meta} ${item.status}`.toLowerCase().includes(query.toLowerCase())), [query, records]);

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

  return <SafeAreaView edges={['top']} style={styles.safe}>
    <View style={styles.header}>
      <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" color={colors.ink} size={22} /></Pressable>
      <View style={styles.heading}><Text numberOfLines={1} style={styles.headerTitle}>{module.title}</Text><Text numberOfLines={1} style={styles.headerSubtitle}>{session?.workspace}</Text></View>
      {canAct ? <Pressable accessibilityLabel={action?.label} onPress={() => { setActiveAction(action); setFormOpen(true); }} style={styles.addButton}><Ionicons name="add" color="#fff" size={23} /></Pressable> : <View style={styles.buttonSpacer} />}
    </View>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(true)} tintColor={colors.forest} />}>
      <Text style={styles.eyebrow}>ROLE-BASED WORKSPACE</Text><Text style={styles.title}>{module.title}</Text><Text style={styles.subtitle}>{module.description}</Text>
      {preview && <View style={styles.preview}><Ionicons name="flask-outline" color={colors.warning} size={18} /><Text style={styles.previewText}>Preview data is active. Connect the existing HostIn API to use live records.</Text></View>}
      <View style={styles.search}><Ionicons name="search" color={colors.muted} size={19} /><TextInput value={query} onChangeText={setQuery} placeholder="Search records" placeholderTextColor="#98A2B3" style={styles.searchInput} /></View>
      {session && id && (extraActions[id] ?? []).some((tool) => !tool.roles || tool.roles.includes(session.user.role)) && <View style={styles.moduleTools}>{extraActions[id].filter((tool) => !tool.roles || tool.roles.includes(session.user.role)).map((tool) => <Pressable key={tool.label} onPress={() => { setActiveAction(tool); setFormOpen(true); }} style={styles.toolButton}><Ionicons name="build-outline" color={colors.forest} size={15} /><Text style={styles.toolText}>{tool.label}</Text></Pressable>)}</View>}
      {loading ? <ActivityIndicator color={colors.forest} style={styles.loader} /> : error ? <View style={styles.empty}><Ionicons name="cloud-offline-outline" color={colors.danger} size={28} /><Text style={styles.emptyTitle}>Couldn’t load records</Text><Text style={styles.emptyText}>{error}</Text><Pressable onPress={() => void refresh()}><Text style={styles.retry}>Try again</Text></Pressable></View> : filtered.length ? filtered.map((item) => <View key={item.id} style={styles.card}>
        <View style={styles.cardIcon}><Ionicons name={module.icon as keyof typeof Ionicons.glyphMap} color={colors.forest} size={21} /></View>
        <View style={styles.cardBody}><Text style={styles.cardTitle}>{item.title}</Text>{!!item.subtitle && <Text style={styles.cardSubtitle}>{item.subtitle}</Text>}<View style={styles.cardMeta}>{!!item.status && <View style={[styles.badge, { backgroundColor: `${statusColor(item.status)}14` }]}><Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status}</Text></View>}{!!item.meta && <Text style={styles.meta}>{item.meta}</Text>}</View>{session && id && actionsForRecord(id, session.user.role, item).length > 0 && <View style={styles.recordActions}>{actionsForRecord(id, session.user.role, item).map((recordAction) => <Pressable disabled={!!actingId} key={recordAction.label} onPress={() => void runAction(item, recordAction)} style={[styles.recordAction, recordAction.destructive && styles.recordActionDanger]}>{actingId === `${item.id}:${recordAction.label}` ? <ActivityIndicator color={recordAction.destructive ? colors.danger : colors.forest} size="small" /> : <Text style={[styles.recordActionText, recordAction.destructive && styles.recordActionDangerText]}>{recordAction.label}</Text>}</Pressable>)}</View>}</View>
      </View>) : <View style={styles.empty}><Ionicons name="file-tray-outline" color={colors.muted} size={30} /><Text style={styles.emptyTitle}>No records found</Text><Text style={styles.emptyText}>{query ? 'Try a different search.' : 'New records will appear here.'}</Text></View>}
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
  safe: { backgroundColor: colors.canvas, flex: 1 }, header: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 11 }, heading: { flex: 1, marginHorizontal: 10 }, headerTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' }, headerSubtitle: { color: colors.muted, fontSize: 11, marginTop: 2 }, iconButton: { alignItems: 'center', backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 }, addButton: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: 13, height: 42, justifyContent: 'center', width: 42 }, buttonSpacer: { width: 42 }, content: { padding: 20, paddingBottom: 50 }, eyebrow: { color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }, title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -1, marginTop: 7 }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 6 }, preview: { alignItems: 'center', backgroundColor: colors.coralSoft, borderColor: '#F5DEB3', borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', gap: 9, marginTop: 18, padding: 12 }, previewText: { color: '#8A5A13', flex: 1, fontSize: 11, lineHeight: 16 }, search: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', gap: 9, marginBottom: 13, marginTop: 18, paddingHorizontal: 13 }, searchInput: { color: colors.ink, flex: 1, fontSize: 14, paddingVertical: 13 }, moduleTools: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 13 }, toolButton: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.pill, flexDirection: 'row', gap: 6, minHeight: 34, paddingHorizontal: 12 }, toolText: { color: colors.forest, fontSize: 10, fontWeight: '800' }, loader: { marginTop: 50 }, card: { ...shadow, alignItems: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: 12, marginBottom: 10, padding: 15 }, cardIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 12, height: 42, justifyContent: 'center', width: 42 }, cardBody: { flex: 1 }, cardTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, cardSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }, cardMeta: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }, badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 }, badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }, meta: { color: colors.muted, fontSize: 10 }, recordActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 }, recordAction: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.pill, justifyContent: 'center', minHeight: 30, minWidth: 72, paddingHorizontal: 11 }, recordActionText: { color: colors.forest, fontSize: 10, fontWeight: '800' }, recordActionDanger: { backgroundColor: '#FFF1F0' }, recordActionDangerText: { color: colors.danger }, empty: { alignItems: 'center', marginTop: 48, paddingHorizontal: 20 }, emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 10 }, emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: 'center' }, retry: { color: colors.forest, fontSize: 13, fontWeight: '800', marginTop: 12 }, center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 30 }, primary: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radius.sm, justifyContent: 'center', marginTop: 18, minHeight: 50, paddingHorizontal: 20 }, primaryText: { color: '#fff', fontSize: 14, fontWeight: '800' }, disabled: { opacity: 0.55 }, modalBackdrop: { backgroundColor: 'rgba(16,24,40,0.45)', flex: 1, justifyContent: 'flex-end' }, sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%', paddingBottom: 20 }, handle: { alignSelf: 'center', backgroundColor: '#D0D5DD', borderRadius: 3, height: 5, marginTop: 9, width: 42 }, sheetHeader: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 18 }, sheetTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' }, sheetSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 }, form: { gap: 14, padding: 18, paddingBottom: 35 }, label: { color: colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 6 }, input: { backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, fontSize: 14, minHeight: 48, paddingHorizontal: 13, paddingVertical: 11 }, multiline: { minHeight: 92, textAlignVertical: 'top' }, pickerButton: { alignItems: 'center', backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 58, paddingHorizontal: 13 }, pickerCopy: { flex: 1 }, pickerTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, pickerSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
});
