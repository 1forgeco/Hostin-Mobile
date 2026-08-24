import { authenticatedRequest, isPreviewMode } from '@/services/api';
import type { Session } from '@/types';

export type HostinNotification = { id: string; title: string; body: string; createdAt: string; unread: boolean; type?: string };

const previewNotifications: HostinNotification[] = [
  { id: 'notification-1', type: 'gate_pass', title: 'Gate pass awaiting review', body: 'Rohan Patel requested a home visit.', createdAt: '8m', unread: true },
  { id: 'notification-2', type: 'complaint', title: 'Complaint assigned', body: 'Water leakage · Room A-101', createdAt: '1h', unread: true },
  { id: 'notification-3', type: 'document', title: 'Document uploaded', body: 'Aarav Mehta uploaded Aadhaar.', createdAt: '3h', unread: true },
  { id: 'notification-4', type: 'announcement', title: 'Announcement published', body: 'Water shutdown notice sent to residents.', createdAt: '1d', unread: false },
];

function text(value: unknown) { return typeof value === 'string' ? value : ''; }

export async function loadNotifications(session: Session) {
  if (isPreviewMode) return previewNotifications;
  const endpoint = session.user.role === 'platform' ? '/platform/notifications' : '/notifications?limit=100';
  const response = await authenticatedRequest<{ notifications?: Record<string, unknown>[] }>(session, endpoint);
  return (response.notifications ?? []).map((item, index): HostinNotification => ({
    id: text(item.id) || `notification-${index}`,
    title: text(item.title) || 'HostIn update',
    body: text(item.body || item.message),
    createdAt: text(item.created_at || item.createdAt),
    unread: text(item.status).toLowerCase() !== 'read',
    type: text(item.type),
  }));
}

export async function markNotificationRead(session: Session, id: string) {
  if (isPreviewMode || session.user.role === 'platform') return { success: true };
  return authenticatedRequest(session, `/notifications/${id}/read`, { method: 'POST', body: '{}' });
}
