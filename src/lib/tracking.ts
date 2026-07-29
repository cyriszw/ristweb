import { supabase } from '@/integrations/supabase/client';
import { hashPassword, verifyPassword, generateTrackingToken } from './crypto';

const TRACKING_TOKEN_KEY = 'marist_tracking_token';
const TRACKING_APP_ID_KEY = 'marist_tracking_app_id';
const TRACKING_NAME_KEY = 'marist_tracking_name';

export function getStoredTrackingToken(): string | null {
  return localStorage.getItem(TRACKING_TOKEN_KEY);
}

export function getStoredApplicationId(): string | null {
  return localStorage.getItem(TRACKING_APP_ID_KEY);
}

export function getStoredApplicantName(): string | null {
  return localStorage.getItem(TRACKING_NAME_KEY);
}

export function clearTrackingSession(): void {
  localStorage.removeItem(TRACKING_TOKEN_KEY);
  localStorage.removeItem(TRACKING_APP_ID_KEY);
  localStorage.removeItem(TRACKING_NAME_KEY);
}

function storeSession(token: string, appId: string, name: string): void {
  localStorage.setItem(TRACKING_TOKEN_KEY, token);
  localStorage.setItem(TRACKING_APP_ID_KEY, appId);
  localStorage.setItem(TRACKING_NAME_KEY, name);
}

interface CreateTrackingResult {
  success: boolean;
  error?: string;
}

export async function createTrackingAccount(
  applicationId: string,
  studentName: string,
  password: string
): Promise<CreateTrackingResult> {
  try {
    const passwordHash = await hashPassword(password);
    const token = generateTrackingToken();

    const { error } = await supabase.from('application_tracking').insert([{
      application_id: applicationId,
      username: studentName,
      password_hash: passwordHash,
      tracking_token: token,
    }]);

    if (error) return { success: false, error: error.message };

    storeSession(token, applicationId, studentName);
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to create tracking account' };
  }
}

interface LoginResult {
  success: boolean;
  error?: string;
  applicationId?: string;
}

export async function loginToPortal(username: string, password: string): Promise<LoginResult> {
  try {
    const { data: records, error } = await supabase
      .from('application_tracking')
      .select('id, application_id, username, password_hash, tracking_token')
      .eq('username', username);

    if (error) return { success: false, error: 'Login failed' };
    if (!records || records.length === 0) return { success: false, error: 'Invalid name or application ID' };

    const record = records[0];
    const valid = await verifyPassword(password, record.password_hash);
    if (!valid) return { success: false, error: 'Invalid name or application ID' };

    await supabase.from('application_tracking').update({ last_login: new Date().toISOString() }).eq('id', record.id);

    storeSession(record.tracking_token, record.application_id, record.username);
    return { success: true, applicationId: record.application_id };
  } catch (err) {
    return { success: false, error: 'Login failed' };
  }
}

export function isLoggedIn(): boolean {
  return !!getStoredTrackingToken() && !!getStoredApplicationId();
}

export async function getApplicationData() {
  const token = getStoredTrackingToken();
  const appId = getStoredApplicationId();
  if (!token || !appId) return null;

  const { data: app } = await supabase
    .from('admission_applications')
    .select('*')
    .eq('id', appId)
    .single();

  return app;
}

export async function getApplicationStatuses() {
  const token = getStoredTrackingToken();
  const appId = getStoredApplicationId();
  if (!token || !appId) return [];

  const { data } = await supabase
    .from('application_statuses')
    .select('*')
    .eq('application_id', appId)
    .order('created_at', { ascending: false });

  return data || [];
}

export async function getCurrentStatus() {
  const statuses = await getApplicationStatuses();
  return statuses.length > 0 ? statuses[0] : null;
}

export async function getChatMessages() {
  const token = getStoredTrackingToken();
  const appId = getStoredApplicationId();
  if (!token || !appId) return [];

  const { data } = await supabase
    .from('application_chat_messages')
    .select('*')
    .eq('application_id', appId)
    .order('created_at', { ascending: true });

  return data || [];
}

export async function sendChatMessage(message: string) {
  const token = getStoredTrackingToken();
  const appId = getStoredApplicationId();
  if (!token || !appId) return false;

  const { error } = await supabase.from('application_chat_messages').insert([{
    application_id: appId,
    sender_type: 'applicant',
    message,
  }]);

  if (error) return false;

  await supabase.from('application_notifications').insert([{
    application_id: appId,
    recipient_type: 'admin',
    title: 'New Message from Applicant',
    message: `A new message has been sent by the applicant.`,
  }]);

  return true;
}

export async function getAttachments() {
  const token = getStoredTrackingToken();
  const appId = getStoredApplicationId();
  if (!token || !appId) return [];

  const { data } = await supabase
    .from('application_attachments')
    .select('*')
    .eq('application_id', appId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  return data || [];
}

export async function uploadAttachment(file: File): Promise<boolean> {
  const token = getStoredTrackingToken();
  const appId = getStoredApplicationId();
  if (!token || !appId) return false;

  const currentStatus = await getCurrentStatus();
  if (currentStatus && ['accepted', 'rejected'].includes(currentStatus.status)) return false;

  if (file.size > 10 * 1024 * 1024) return false;

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const path = `applications/${appId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from('files').upload(path, file);
  if (uploadError) return false;

  const { data: urlData } = supabase.storage.from('files').getPublicUrl(path);

  const { error: dbError } = await supabase.from('application_attachments').insert([{
    application_id: appId,
    file_name: file.name,
    file_url: urlData.publicUrl,
    file_size: file.size,
    file_type: file.type || `application/${ext}`,
    uploaded_by: 'applicant',
  }]);

  if (dbError) return false;

  await supabase.from('application_notifications').insert([{
    application_id: appId,
    recipient_type: 'admin',
    title: 'New Attachment Uploaded',
    message: `${file.name} has been uploaded by the applicant.`,
  }]);

  return true;
}

export async function getNotifications() {
  const token = getStoredTrackingToken();
  const appId = getStoredApplicationId();
  if (!token || !appId) return [];

  const { data } = await supabase
    .from('application_notifications')
    .select('*')
    .eq('application_id', appId)
    .eq('recipient_type', 'applicant')
    .order('created_at', { ascending: false })
    .limit(50);

  return data || [];
}

export async function getUnreadNotificationCount() {
  const token = getStoredTrackingToken();
  const appId = getStoredApplicationId();
  if (!token || !appId) return 0;

  const { count } = await supabase
    .from('application_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('application_id', appId)
    .eq('recipient_type', 'applicant')
    .eq('is_read', false);

  return count || 0;
}

export async function markNotificationsRead() {
  const token = getStoredTrackingToken();
  const appId = getStoredApplicationId();
  if (!token || !appId) return;

  await supabase
    .from('application_notifications')
    .update({ is_read: true })
    .eq('application_id', appId)
    .eq('recipient_type', 'applicant')
    .eq('is_read', false);
}

export async function getActivityLog() {
  const token = getStoredTrackingToken();
  const appId = getStoredApplicationId();
  if (!token || !appId) return [];

  const { data } = await supabase
    .from('application_activity_log')
    .select('*')
    .eq('application_id', appId)
    .order('created_at', { ascending: false });

  return data || [];
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  additional_info_required: 'Additional Information Required',
  interview_scheduled: 'Interview Scheduled',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  additional_info_required: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  interview_scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
}
