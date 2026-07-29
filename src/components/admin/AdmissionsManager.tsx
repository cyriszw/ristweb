import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Trash2, ChevronLeft, Send, FileText, Download, MessageSquare, Clock,
  User, Mail, Phone, Calendar, Upload, X, Eye, AlertCircle, CheckCircle,
  Paperclip
} from 'lucide-react';

const STATUS_OPTIONS = [
  'submitted', 'under_review', 'additional_info_required',
  'interview_scheduled', 'accepted', 'rejected'
];

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted', under_review: 'Under Review',
  additional_info_required: 'Additional Information Required',
  interview_scheduled: 'Interview Scheduled', accepted: 'Accepted', rejected: 'Rejected',
};

const STATUS_COLORS: Record<string, string> = {
  submitted: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  under_review: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  additional_info_required: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
  interview_scheduled: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
  accepted: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  rejected: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
};

export default function AdmissionsManager() {
  const [enableSubjects, setEnableSubjects] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('key, value').eq('key', 'admissions_subject_selection').maybeSingle();
    if (data) setEnableSubjects(data.value === 'true');
  }, []);

  const loadApplications = useCallback(async () => {
    const { data } = await supabase.from('admission_applications').select('*').order('created_at', { ascending: false });
    setApplications(data || []);
  }, []);

  useEffect(() => { loadSettings(); loadApplications(); }, [loadSettings, loadApplications]);

  const saveSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from('site_settings').select('id').eq('key', key).maybeSingle();
    if (existing) {
      await supabase.from('site_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
    } else {
      await supabase.from('site_settings').insert([{ key, value }]);
    }
  };

  const toggleSubjects = async (val: boolean) => {
    setEnableSubjects(val);
    await saveSetting('admissions_subject_selection', String(val));
    toast.success(val ? 'Subject selection enabled' : 'Subject selection disabled');
  };

  if (selectedApp) {
    return <ApplicationDetail app={selectedApp} onBack={() => { setSelectedApp(null); loadApplications(); }} />;
  }

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Admissions Management</h2>

      <div className="bg-card border rounded-lg p-5 mb-6 space-y-4">
        <h3 className="font-semibold text-sm text-foreground">Display Controls</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Enable Subject Selection</div>
            <div className="text-xs text-muted-foreground">Students can select subjects during application</div>
          </div>
          <Switch checked={enableSubjects} onCheckedChange={toggleSubjects} />
        </div>
      </div>

      <div className="bg-card border rounded-lg p-5">
        <h3 className="font-semibold text-sm text-foreground mb-4">Applications ({applications.length})</h3>
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications received yet.</p>
        ) : (
          <div className="space-y-2">
            {applications.map(app => (
              <button key={app.id} onClick={() => setSelectedApp(app)}
                className="w-full text-left border rounded-lg p-4 hover:shadow-sm transition-shadow group">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-foreground">{app.student_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {app.email} {app.phone && `• ${app.phone}`} • {app.level?.toUpperCase()} • {new Date(app.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors mr-1">View</span>
                    <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors -rotate-180" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationDetail({ app, onBack }: { app: any; onBack: () => void }) {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadDetails = useCallback(async () => {
    const [sRes, mRes, aRes, lRes] = await Promise.all([
      supabase.from('application_statuses').select('*').eq('application_id', app.id).order('created_at', { ascending: false }),
      supabase.from('application_chat_messages').select('*').eq('application_id', app.id).order('created_at', { ascending: true }),
      supabase.from('application_attachments').select('*').eq('application_id', app.id).eq('is_deleted', false).order('created_at', { ascending: false }),
      supabase.from('application_activity_log').select('*').eq('application_id', app.id).order('created_at', { ascending: false }),
    ]);
    setStatuses(sRes.data || []);
    setCurrentStatus(sRes.data?.[0] || null);
    setMessages(mRes.data || []);
    setAttachments(aRes.data || []);
    setActivityLog(lRes.data || []);
  }, [app.id]);

  useEffect(() => { loadDetails(); }, [loadDetails]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleStatusChange = async () => {
    if (!selectedStatus) { toast.error('Select a status'); return; }
    setSaving(true);
    const { error } = await supabase.from('application_statuses').insert([{
      application_id: app.id,
      status: selectedStatus,
      notes: newNote.trim() || null,
    }]);
    setSaving(false);
    if (error) { toast.error('Failed to update status'); return; }
    toast.success(`Status changed to ${STATUS_LABELS[selectedStatus]}`);

    if (['accepted', 'rejected'].includes(selectedStatus)) {
      await supabase.from('application_attachments').update({ is_deleted: true }).eq('application_id', app.id);
    }

    await supabase.from('application_notifications').insert([{
      application_id: app.id, recipient_type: 'applicant',
      title: 'Application Status Updated',
      message: `Your status has been changed to: ${STATUS_LABELS[selectedStatus]}`,
    }]);

    await supabase.from('application_activity_log').insert([{
      application_id: app.id, action: 'status_changed',
      details: `Status changed to: ${STATUS_LABELS[selectedStatus]}${newNote.trim() ? ` - ${newNote.trim()}` : ''}`,
    }]);

    setSelectedStatus('');
    setNewNote('');
    loadDetails();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSendingMsg(true);
    const { error } = await supabase.from('application_chat_messages').insert([{
      application_id: app.id, sender_type: 'admin', message: newMessage.trim(),
    }]);
    setSendingMsg(false);
    if (error) { toast.error('Failed to send'); return; }
    setNewMessage('');

    await supabase.from('application_notifications').insert([{
      application_id: app.id, recipient_type: 'applicant',
      title: 'New Message from Admissions',
      message: 'You have a new message from the admissions office.',
    }]);

    loadDetails();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10 MB)'); return; }
    setUploadingFile(true);
    const path = `applications/${app.id}/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('files').upload(path, file);
    if (uploadErr) { toast.error('Upload failed'); setUploadingFile(false); return; }
    const { data: urlData } = supabase.storage.from('files').getPublicUrl(path);
    await supabase.from('application_attachments').insert([{
      application_id: app.id, file_name: file.name, file_url: urlData.publicUrl,
      file_size: file.size, file_type: file.type, uploaded_by: 'admin',
    }]);
    setUploadingFile(false);
    toast.success('File uploaded');
    loadDetails();
    e.target.value = '';
  };

  const handleDeleteAttachment = async (att: any) => {
    await supabase.from('application_attachments').update({ is_deleted: true }).eq('id', att.id);
    toast.success('Attachment removed');
    loadDetails();
  };

  const handleArchiveChat = async () => {
    await supabase.from('application_chat_messages').delete().eq('application_id', app.id);
    toast.success('Chat archived');
    loadDetails();
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Applications
      </button>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Left Column - Applicant Info + Status */}
        <div className="xl:col-span-1 space-y-4">
          {/* Applicant Info */}
          <div className="bg-card border rounded-lg p-5 space-y-3">
            <h3 className="font-display text-lg font-bold text-foreground">{app.student_name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3.5 h-3.5" /> {app.email}
              </div>
              {app.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {app.phone}</div>}
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-3.5 h-3.5" /> Level: <span className="capitalize text-foreground">{app.level?.replace('-', ' ')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" /> Submitted: {new Date(app.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-card border rounded-lg p-5 space-y-3">
            <h4 className="font-semibold text-sm text-foreground">Current Status</h4>
            {currentStatus && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[currentStatus.status]}`}>
                {currentStatus.status === 'accepted' ? <CheckCircle className="w-3 h-3" /> :
                 currentStatus.status === 'rejected' ? <X className="w-3 h-3" /> :
                 <AlertCircle className="w-3 h-3" />}
                {STATUS_LABELS[currentStatus.status]}
              </span>
            )}
            {currentStatus?.notes && <p className="text-xs text-muted-foreground mt-2">{currentStatus.notes}</p>}
          </div>

          {/* Status Change */}
          <div className="bg-card border rounded-lg p-5 space-y-3">
            <h4 className="font-semibold text-sm text-foreground">Change Status</h4>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background">
              <option value="">Select status...</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s} disabled={s === currentStatus?.status}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note (optional)" rows={2} />
            <Button onClick={handleStatusChange} disabled={saving || !selectedStatus} size="sm" className="w-full">
              {saving ? 'Updating...' : 'Update Status'}
            </Button>
          </div>

          {/* Attachments */}
          <div className="bg-card border rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-foreground">Attachments ({attachments.length})</h4>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled={uploadingFile}>
                  <Upload className="w-3 h-3" /> {uploadingFile ? '...' : 'Upload'}
                </Button>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleUpload} />
              </label>
            </div>
            {attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No attachments</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {attachments.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 bg-muted/50 rounded p-2 text-xs">
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate flex-1 text-foreground">{a.file_name}</span>
                    <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="p-0.5 hover:text-primary" title="Download">
                      <Download className="w-3 h-3" />
                    </a>
                    <button onClick={() => handleDeleteAttachment(a)} className="p-0.5 hover:text-destructive" title="Delete">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="bg-card border rounded-lg p-5 space-y-3">
            <h4 className="font-semibold text-sm text-foreground">Activity Log</h4>
            {activityLog.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity recorded</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activityLog.map((a: any) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <Clock className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground capitalize">{a.action.replace(/_/g, ' ')}</p>
                      {a.details && <p className="text-muted-foreground">{a.details}</p>}
                      <p className="text-muted-foreground/60">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className="xl:col-span-2">
          <div className="bg-card border rounded-lg flex flex-col h-[700px]">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-foreground">Chat with Applicant</h3>
                <p className="text-xs text-muted-foreground">{messages.length} messages</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleArchiveChat}>
                Archive Chat
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${m.sender_type === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-sm">{m.message}</p>
                      <div className={`flex items-center gap-2 mt-1 ${m.sender_type === 'admin' ? 'justify-end' : ''}`}>
                        <span className="text-[11px] opacity-70">{new Date(m.created_at).toLocaleString()}</span>
                        {m.sender_type === 'admin' && m.is_read && <Eye className="w-3 h-3 opacity-70" />}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  className="resize-none"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                />
                <Button onClick={handleSendMessage} disabled={sendingMsg || !newMessage.trim()} className="shrink-0 self-end" size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
