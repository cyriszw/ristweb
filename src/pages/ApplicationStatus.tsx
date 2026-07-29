import { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  loginToPortal, isLoggedIn, clearTrackingSession, getStoredApplicantName,
  getApplicationData, getCurrentStatus, getChatMessages, sendChatMessage,
  getAttachments, uploadAttachment, getNotifications, getUnreadNotificationCount,
  markNotificationsRead, getActivityLog, getStatusLabel, getStatusColor, getStoredApplicationId, getStoredTrackingToken
} from '@/lib/tracking';
import {
  LogOut, Send, Upload, FileText, Download, MessageSquare, Bell, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Paperclip, User, Eye, ExternalLink
} from 'lucide-react';

type Tab = 'overview' | 'messages' | 'documents' | 'activity';

export default function ApplicationStatus() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setChecking(false);
  }, []);

  if (checking) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;
  return <Dashboard onLogout={() => { clearTrackingSession(); setLoggedIn(false); navigate('/application-status'); }} />;
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please enter your name and password');
      return;
    }
    setLoading(true);
    const result = await loginToPortal(username.trim(), password);
    setLoading(false);
    if (result.success) {
      toast.success('Logged in successfully');
      onLogin();
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <Layout>
      <section className="py-16">
        <div className="container max-w-md">
          <div className="bg-card border rounded-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <User className="w-7 h-7 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">Application Status Portal</h1>
              <p className="text-sm text-muted-foreground">Track your application, send messages, and upload documents.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name or Application ID</label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your full name" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full gap-2">
                <LogOut className="w-4 h-4 rotate-90" /> {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center">
              Haven't applied yet? <button onClick={() => navigate('/admissions')} className="text-primary hover:underline font-medium">Apply now</button>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [appData, setAppData] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [app, status, msgs, atts, notifs, count, activity] = await Promise.all([
      getApplicationData(),
      getCurrentStatus(),
      getChatMessages(),
      getAttachments(),
      getNotifications(),
      getUnreadNotificationCount(),
      getActivityLog(),
    ]);
    setAppData(app);
    setCurrentStatus(status);
    setMessages(msgs);
    setAttachments(atts);
    setNotifications(notifs);
    setUnreadCount(count);
    setActivityLog(activity);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const tabs = [
    { key: 'overview' as Tab, label: 'Overview', icon: FileText, badge: 0 },
    { key: 'messages' as Tab, label: 'Messages', icon: MessageSquare, badge: messages.filter(m => m.sender_type === 'admin' && !m.is_read).length },
    { key: 'documents' as Tab, label: 'Documents', icon: Paperclip, badge: 0 },
    { key: 'activity' as Tab, label: 'Activity', icon: Clock, badge: 0 },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="container max-w-5xl flex items-center justify-between h-16 px-4">
          <h1 className="font-display text-lg font-bold text-foreground">Application Portal</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => { markNotificationsRead(); setUnreadCount(0); setTab('overview'); loadAll(); }} className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
            </button>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="container max-w-5xl px-4 py-6">
        {/* Mobile tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto md:hidden">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`shrink-0 px-3 py-1.5 rounded text-xs font-medium ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-56 shrink-0">
            <nav className="space-y-1 sticky top-24">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                  <t.icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{t.label}</span>
                  {t.badge > 0 && <span className="w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">{t.badge}</span>}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-6">
            {tab === 'overview' && <OverviewTab appData={appData} currentStatus={currentStatus} notifications={notifications} activityLog={activityLog} onRefresh={loadAll} />}
            {tab === 'messages' && <MessagesTab messages={messages} onRefresh={loadAll} />}
            {tab === 'documents' && <DocumentsTab attachments={attachments} onRefresh={loadAll} currentStatus={currentStatus} />}
            {tab === 'activity' && <ActivityTab activityLog={activityLog} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ appData, currentStatus, notifications, activityLog, onRefresh }: any) {
  const todayNotifs = notifications.filter((n: any) => !n.is_read).slice(0, 5);
  const recentActivity = activityLog.slice(0, 5);

  return (
    <>
      {/* Status Card */}
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-foreground">Application Status</h2>
        {currentStatus && (
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(currentStatus.status)}`}>
              {getStatusLabel(currentStatus.status)}
            </span>
            <span className="text-xs text-muted-foreground">
              Updated {new Date(currentStatus.created_at).toLocaleDateString()}
            </span>
          </div>
        )}
        {appData && (
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground font-medium">{appData.student_name}</span></div>
            <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{appData.email}</span></div>
            <div><span className="text-muted-foreground">Level:</span> <span className="text-foreground capitalize">{appData.level?.replace('-', ' ')}</span></div>
            <div><span className="text-muted-foreground">Submitted:</span> <span className="text-foreground">{new Date(appData.created_at).toLocaleDateString()}</span></div>
          </div>
        )}
        {currentStatus?.notes && (
          <div className="bg-muted rounded-lg p-3 text-sm">
            <span className="font-medium text-foreground">Latest Note:</span>
            <p className="text-muted-foreground mt-1">{currentStatus.notes}</p>
          </div>
        )}
      </div>

      {/* Recent Notifications */}
      {todayNotifs.length > 0 && (
        <div className="bg-card border rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Notifications</h2>
            <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">{todayNotifs.length} new</span>
          </div>
          <div className="space-y-2">
            {todayNotifs.map((n: any) => (
              <div key={n.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Bell className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button onClick={() => onRefresh()} className="bg-card border rounded-xl p-5 text-left hover:shadow-sm transition-shadow group">
          <MessageSquare className="w-5 h-5 text-primary mb-2" />
          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">View Messages</h3>
          <p className="text-xs text-muted-foreground mt-1">Chat with admissions staff</p>
        </button>
        <button onClick={() => onRefresh()} className="bg-card border rounded-xl p-5 text-left hover:shadow-sm transition-shadow group">
          <Upload className="w-5 h-5 text-primary mb-2" />
          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">Upload Documents</h3>
          <p className="text-xs text-muted-foreground mt-1">Support your application</p>
        </button>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="bg-card border rounded-xl p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-foreground">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 text-sm">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
                <div>
                  <p className="text-foreground capitalize">{a.action.replace(/_/g, ' ')}</p>
                  {a.details && <p className="text-xs text-muted-foreground">{a.details}</p>}
                  <p className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function MessagesTab({ messages, onRefresh }: { messages: any[]; onRefresh: () => void }) {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const applicantName = getStoredApplicantName();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    const ok = await sendChatMessage(newMessage.trim());
    setSending(false);
    if (ok) {
      setNewMessage('');
      onRefresh();
    } else {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="bg-card border rounded-xl flex flex-col h-[600px]">
      <div className="p-4 border-b">
        <h2 className="font-display text-lg font-bold text-foreground">Messages</h2>
        <p className="text-xs text-muted-foreground">Communicate with the admissions office</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_type === 'applicant' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${m.sender_type === 'applicant' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm">{m.message}</p>
                <div className={`flex items-center gap-2 mt-1 ${m.sender_type === 'applicant' ? 'justify-end' : ''}`}>
                  <span className="text-[11px] opacity-70">{new Date(m.created_at).toLocaleString()}</span>
                  {m.sender_type === 'admin' && !m.is_read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                  )}
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
            placeholder="Type your message..."
            rows={2}
            className="resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="shrink-0 self-end" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ attachments, onRefresh, currentStatus }: { attachments: any[]; onRefresh: () => void; currentStatus: any }) {
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const isFinal = currentStatus && ['accepted', 'rejected'].includes(currentStatus.status);

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB');
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed');
      return;
    }
    setPendingFile(file);
    setShowModal(true);
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setShowModal(false);
    setUploading(true);
    const ok = await uploadAttachment(pendingFile);
    setUploading(false);
    setPendingFile(null);
    if (ok) {
      toast.success('File uploaded successfully');
      onRefresh();
    } else {
      toast.error('Failed to upload file');
    }
  };

  return (
    <>
      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-display text-lg font-bold text-foreground">Attachment Notice</h3>
            <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground space-y-2">
              <p>Files uploaded through this chat are only used to support your admissions application.</p>
              <p>Once your application has been accepted or rejected, these uploaded attachments will automatically be removed from your applicant portal.</p>
              <p>Admissions administrators may download and review these files before they are deleted.</p>
            </div>
            {pendingFile && (
              <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{pendingFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(pendingFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={handleUpload} className="flex-1">Continue</Button>
              <Button variant="outline" onClick={() => { setShowModal(false); setPendingFile(null); }} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Documents</h2>
            <p className="text-xs text-muted-foreground">Support your application with files</p>
          </div>
          {!isFinal && (
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" className="gap-2" disabled={uploading}>
                <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileSelect} disabled={uploading} />
            </label>
          )}
        </div>

        {isFinal && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Uploads are disabled as a final decision has been made.
          </div>
        )}

        {attachments.length === 0 ? (
          <div className="text-center py-8">
            <Paperclip className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{a.file_name}</p>
                  <p className="text-xs text-muted-foreground">{(a.file_size / 1024).toFixed(1)} KB • {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Download">
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ActivityTab({ activityLog }: { activityLog: any[] }) {
  return (
    <div className="bg-card border rounded-xl p-6 space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Activity Log</h2>
        <p className="text-xs text-muted-foreground">Timeline of your application events</p>
      </div>
      {activityLog.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No activity recorded yet</p>
        </div>
      ) : (
        <div className="space-y-0">
          {activityLog.map((a: any, i: number) => {
            const actionIcons: Record<string, any> = {
              application_submitted: CheckCircle,
              status_changed: AlertCircle,
            };
            const Icon = actionIcons[a.action] || Clock;
            return (
              <div key={a.id} className="flex gap-4 pb-4 relative">
                {i < activityLog.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />}
                <div className={`p-1.5 rounded-full shrink-0 h-fit ${a.action === 'application_submitted' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                  <Icon className={`w-3.5 h-3.5 ${a.action === 'application_submitted' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground capitalize">{a.action.replace(/_/g, ' ')}</p>
                  {a.details && <p className="text-xs text-muted-foreground">{a.details}</p>}
                  <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
