import { supabase } from '@/integrations/supabase/client';
import { hashPassword, verifyPassword, generateTrackingToken } from './crypto';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
      .eq('username', username)
      .order('last_login', { ascending: false, nullsFirst: false });

    if (error) return { success: false, error: 'Login failed' };
    if (!records || records.length === 0) return { success: false, error: 'Invalid name or application ID' };

    let record: typeof records[0] | null = null;
    for (const r of records) {
      const valid = await verifyPassword(password, r.password_hash);
      if (valid) { record = r; break; }
    }
    if (!record) return { success: false, error: 'Invalid name or application ID' };

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

// ─── Realtime (Broadcast-based for applicant; Postgres Changes for admin) ───

type ChannelHandler = (payload: any) => void;

function getAppChannelName(appId: string): string {
  return `application-${appId}`;
}

/** Subscribe to the realtime broadcast channel for the current application and track presence */
export function subscribeToApplicationChannel(
  onMessage: ChannelHandler,
  onStatusChange: ChannelHandler,
  onNotification: ChannelHandler,
  onTyping: ChannelHandler,
  onPresence: ChannelHandler,
  userName?: string,
): (() => void) | null {
  const appId = getStoredApplicationId();
  if (!appId) return null;

  const channel: RealtimeChannel = supabase.channel(getAppChannelName(appId));

  channel
    .on('broadcast', { event: 'message' }, (payload) => onMessage(payload))
    .on('broadcast', { event: 'status_change' }, (payload) => onStatusChange(payload))
    .on('broadcast', { event: 'notification' }, (payload) => onNotification(payload))
    .on('broadcast', { event: 'typing' }, (payload) => onTyping(payload))
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      onPresence(state);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && userName) {
        await channel.track({ user: userName, online_at: new Date().toISOString() });
      }
    });

  return () => { supabase.removeChannel(channel); };
}

/** Broadcast a chat message event to the application channel */
export function broadcastMessage(appId: string, message: any) {
  supabase.channel(getAppChannelName(appId)).send({
    type: 'broadcast',
    event: 'message',
    payload: message,
  });
}

/** Broadcast a status change event */
export function broadcastStatusChange(appId: string, status: any) {
  supabase.channel(getAppChannelName(appId)).send({
    type: 'broadcast',
    event: 'status_change',
    payload: status,
  });
}

/** Broadcast a notification event */
export function broadcastNotification(appId: string, notification: any) {
  supabase.channel(getAppChannelName(appId)).send({
    type: 'broadcast',
    event: 'notification',
    payload: notification,
  });
}

/** Broadcast typing indicator */
export function broadcastTyping(appId: string, isTyping: boolean, userName: string) {
  supabase.channel(getAppChannelName(appId)).send({
    type: 'broadcast',
    event: 'typing',
    payload: { isTyping, userName, timestamp: Date.now() },
  });
}

// ─── Admin-side Realtime (Postgres Changes) ───

export function subscribeToAdminChat(
  appId: string,
  onInsert: (msg: any) => void,
): () => void {
  const channel = supabase
    .channel(`admin-chat-${appId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'application_chat_messages', filter: `application_id=eq.${appId}` },
      (payload) => onInsert(payload.new),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToAdminNotifications(
  onInsert: (n: any) => void,
): () => void {
  const channel = supabase
    .channel('admin-notifications')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'application_notifications', filter: 'recipient_type=eq.admin' },
      (payload) => onInsert(payload.new),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ─── Mark messages as read (for applicant) ───

export async function markMessagesAsRead(messageIds: string[]) {
  if (messageIds.length === 0) return;
  await supabase
    .from('application_chat_messages')
    .update({ is_read: true })
    .in('id', messageIds);
}

// ─── Student Enrollment ───

const CLASSES_BY_GRADE: Record<string, string[]> = {
  'Form 1': ['1A1', '1A2', '1A3'],
  'Form 2': ['2A1', '2A2', '2A3'],
  'Form 3': ['3A1', '3A2', '3A3'],
  'Form 4': ['4A1', '4A2', '4A3'],
  'Form 5': ['Lower6 Arts', 'Lower6 Science', 'Lower6 Commerce'],
  'Form 6': ['Upper6 Arts', 'Upper6 Science', 'Upper6 Commerce'],
};

const HOUSE_NAMES = ['Mafuyana', 'Mzilikazi', 'Champagnat', 'Lwanga'];

export function getClassesByGrade(grade: string): string[] {
  return CLASSES_BY_GRADE[grade] || [];
}

export function getHouseNames(): string[] {
  return HOUSE_NAMES;
}

export async function generateStudentId(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_student_id');
  if (error) throw error;
  return data as string;
}

export interface EnrollStudentData {
  application_id: string;
  first_name: string;
  last_name: string;
  house: string;
  grade: string;
  class: string;
  date_of_birth?: string;
  gender?: string;
  parent_name?: string;
  parent_contact?: string;
  parent_email?: string;
  address?: string;
}

export async function enrollStudent(data: EnrollStudentData): Promise<{ success: boolean; student?: any; error?: string }> {
  try {
    const studentId = await generateStudentId();

    const { data: student, error } = await supabase.from('students').insert([{
      student_id: studentId,
      application_id: data.application_id,
      first_name: data.first_name,
      last_name: data.last_name,
      house: data.house,
      grade: data.grade,
      class: data.class,
      date_of_birth: data.date_of_birth || null,
      gender: data.gender || null,
      parent_name: data.parent_name || null,
      parent_contact: data.parent_contact || null,
      parent_email: data.parent_email || null,
      address: data.address || null,
    }]).select().single();

    if (error) return { success: false, error: error.message };

    // Update application status to enrolled
    await supabase.from('application_statuses').insert([{
      application_id: data.application_id,
      status: 'enrolled',
      notes: 'Enrolled as student: ' + studentId,
    }]);

    return { success: true, student: student || undefined };
  } catch (err) {
    return { success: false, error: 'Enrollment failed' };
  }
}

export async function getEnrolledStudent(appId: string): Promise<any | null> {
  const { data } = await supabase.from('students').select('*').eq('application_id', appId).maybeSingle();
  return data || null;
}

export async function getAllStudents() {
  const { data } = await supabase.from('students').select('*').order('admission_date', { ascending: false });
  return data || [];
}

export async function getStudentById(id: string) {
  const { data } = await supabase.from('students').select('*').eq('id', id).single();
  return data;
}

export async function updateStudent(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from('students').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function archiveStudent(id: string) {
  const { data, error } = await supabase.from('students').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function getAcceptedApplications() {
  const { data: latestStatuses } = await supabase
    .from('application_statuses')
    .select('application_id, status, created_at')
    .in('status', ['accepted', 'enrolled'])
    .order('created_at', { ascending: false });

  if (!latestStatuses) return [];

  // Get unique latest status per application
  const latest: Record<string, any> = {};
  for (const s of latestStatuses) {
    if (!latest[s.application_id]) latest[s.application_id] = s;
  }

  const acceptedIds = Object.entries(latest)
    .filter(([, s]) => (s as any).status === 'accepted')
    .map(([id]) => id);

  if (acceptedIds.length === 0) return [];

  const { data: apps } = await supabase
    .from('admission_applications')
    .select('*')
    .in('id', acceptedIds)
    .order('created_at', { ascending: false });

  return apps || [];
}

export async function getDashboardStats() {
  const [appRes, studentRes] = await Promise.all([
    supabase.from('application_statuses').select('application_id, status').order('created_at', { ascending: false }),
    supabase.from('students').select('house, grade, class, status'),
  ]);

  const statuses = appRes.data || [];
  // Get latest status per application
  const latest: Record<string, string> = {};
  for (const s of statuses) {
    if (!latest[s.application_id]) latest[s.application_id] = s.status;
  }

  const statusCounts = { pending: 0, accepted: 0, rejected: 0, enrolled: 0 };
  for (const s of Object.values(latest)) {
    if (s === 'accepted') statusCounts.accepted++;
    else if (s === 'rejected') statusCounts.rejected++;
    else if (s === 'enrolled') statusCounts.enrolled++;
    else statusCounts.pending++;
  }

  const students = studentRes.data || [];
  const totalStudents = students.filter(s => s.status === 'active').length;
  const perHouse: Record<string, number> = {};
  const perGrade: Record<string, number> = {};
  const perClass: Record<string, number> = {};
  for (const s of students) {
    if (s.status !== 'active') continue;
    perHouse[s.house] = (perHouse[s.house] || 0) + 1;
    perGrade[s.grade] = (perGrade[s.grade] || 0) + 1;
    perClass[s.class] = (perClass[s.class] || 0) + 1;
  }

  return { statusCounts, totalStudents, perHouse, perGrade, perClass };
}

// ─── Extended status list ───

const STATUS_LABELS_EXTENDED: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  additional_info_required: 'Documents Required',
  interview_scheduled: 'Interview Scheduled',
  accepted: 'Accepted',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
  enrolment_complete: 'Enrolment Complete',
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  submitted: 'Your application has been successfully submitted and is awaiting review.',
  under_review: 'The admissions office is currently reviewing your application.',
  additional_info_required: 'Additional documents are required before your application can continue.',
  interview_scheduled: 'Your interview has been scheduled. Please attend on the specified date.',
  accepted: 'Congratulations! Your application has been accepted.',
  rejected: 'Unfortunately your application was not successful.',
  waitlisted: 'Your application has been placed on the waiting list.',
  enrolment_complete: 'Your admission process has been completed successfully.',
};

const STATUS_ICONS: Record<string, string> = {
  submitted: 'FileText',
  under_review: 'Search',
  additional_info_required: 'Paperclip',
  interview_scheduled: 'Calendar',
  accepted: 'CheckCircle',
  rejected: 'XCircle',
  waitlisted: 'Clock',
  enrolment_complete: 'GraduationCap',
};

const PROGRESS_STEPS = [
  'Application Submitted',
  'Under Review',
  'Additional Info Required',
  'Interview Scheduled',
  'Admission Decision',
  'Enrolment Complete',
];

const STATUS_TO_PROGRESS_INDEX: Record<string, number> = {
  submitted: 0,
  under_review: 1,
  additional_info_required: 2,
  interview_scheduled: 3,
  accepted: 4,
  rejected: -1,
  waitlisted: 3,
  enrolment_complete: 5,
};

export function getStatusDescription(status: string): string {
  return STATUS_DESCRIPTIONS[status] || '';
}

export function getStatusIcon(status: string): string {
  return STATUS_ICONS[status] || 'FileText';
}

export function getProgressSteps(): string[] {
  return PROGRESS_STEPS;
}

export function getProgressIndex(status: string): number {
  return STATUS_TO_PROGRESS_INDEX[status] ?? 0;
}
