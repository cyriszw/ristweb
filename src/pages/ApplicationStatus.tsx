import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  markNotificationsRead, getActivityLog, getStatusLabel, getStatusColor,
  getStoredApplicationId, getStoredTrackingToken, subscribeToApplicationChannel,
  markMessagesAsRead, broadcastMessage, broadcastTyping,
  getStatusDescription, getStatusIcon, getProgressSteps, getProgressIndex,
  getApplicationStatuses,
} from '@/lib/tracking';
import {
  LogOut, Send, Upload, FileText, Download, MessageSquare, Bell, Clock,
  CheckCircle, XCircle, AlertCircle, ChevronRight, Paperclip, User, Eye,
  ExternalLink, Search, Calendar, GraduationCap, Check, ChevronLeft,
  Loader2, ArrowUp, ArrowDown, MessageCircle, Circle, CheckCheck,
} from 'lucide-react';

type Tab = 'overview' | 'messages' | 'documents' | 'activity';

/* ─── Skeleton ─── */
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className || ''}`} />;
}

/* ─── Status Card ─── */
function StatusCard({ status, appData }: { status: any; appData: any }) {
  const statusKey = status?.status || 'submitted';
  const desc = getStatusDescription(statusKey);
  const colorMap: Record<string, string> = {
    submitted: 'from-blue-500 to-blue-600 shadow-blue-500/25',
    under_review: 'from-amber-500 to-yellow-600 shadow-amber-500/25',
    additional_info_required: 'from-yellow-500 to-orange-500 shadow-yellow-500/25',
    interview_scheduled: 'from-purple-500 to-violet-600 shadow-purple-500/25',
    accepted: 'from-green-500 to-emerald-600 shadow-green-500/25',
    rejected: 'from-red-500 to-rose-600 shadow-red-500/25',
    waitlisted: 'from-gray-500 to-slate-600 shadow-gray-500/25',
    enrolment_complete: 'from-emerald-500 to-teal-600 shadow-emerald-500/25',
  };
  const badgeColor: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    additional_info_required: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    interview_scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    waitlisted: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
    enrolment_complete: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  };
  const iconMap: Record<string, any> = {
    submitted: FileText,
    under_review: Search,
    additional_info_required: Paperclip,
    interview_scheduled: Calendar,
    accepted: CheckCircle,
    rejected: XCircle,
    waitlisted: Clock,
    enrolment_complete: GraduationCap,
  };
  const Icon = iconMap[statusKey] || FileText;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border shadow-lg group">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[statusKey] || 'from-blue-500 to-blue-600'} opacity-[0.08] dark:opacity-[0.12]`} />
      <div className="relative p-6 md:p-8 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[statusKey] || 'from-blue-500 to-blue-600'} shadow-lg`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">{getStatusLabel(statusKey)}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${badgeColor[statusKey]}`}>
            {getStatusLabel(statusKey)}
          </span>
        </div>
        {status && (
          <p className="text-xs text-muted-foreground">Last updated {new Date(status.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-border/50">
          {appData && <>
            <InfoItem label="Reference" value={appData.id?.slice(0, 8).toUpperCase()} />
            <InfoItem label="Academic Year" value={new Date().getFullYear().toString()} />
            <InfoItem label="Grade/Form" value={appData.level?.replace('-', ' ').toUpperCase()} />
            <InfoItem label="Campus" value="Main Campus" />
          </>}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value || '—'}</p>
    </div>
  );
}

/* ─── Progress Tracker ─── */
function ProgressTracker({ currentStatus }: { currentStatus: any }) {
  const progressSteps = getProgressSteps();
  const currentIdx = getProgressIndex(currentStatus?.status);
  const isRejected = currentStatus?.status === 'rejected';
  const animateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animateRef.current) {
      animateRef.current.querySelectorAll('.step-item').forEach((el, i) => {
        (el as HTMLElement).style.setProperty('--i', String(i));
      });
    }
  }, []);

  return (
    <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm" ref={animateRef}>
      <h3 className="font-semibold text-foreground mb-6 text-sm">Application Progress</h3>
      {isRejected ? (
        <div className="flex flex-col items-center py-8 text-center">
          <XCircle className="w-12 h-12 text-red-400 mb-3" />
          <p className="text-sm font-medium text-foreground">Application was not successful</p>
          <p className="text-xs text-muted-foreground mt-1">The admission process has concluded.</p>
        </div>
      ) : (
        <>
          {/* Desktop: horizontal */}
          <div className="hidden md:flex items-start justify-between relative">
            <div className="absolute top-[19px] left-0 right-0 h-0.5 bg-muted-foreground/20" />
            {currentIdx >= 0 && (
              <div
                className="absolute top-[19px] left-0 h-0.5 bg-primary transition-all duration-700 ease-out"
                style={{ width: `${(currentIdx / (progressSteps.length - 1)) * 100}%` }}
              />
            )}
            {progressSteps.map((step, i) => {
              const isCompleted = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={i} className="step-item flex flex-col items-center relative z-10 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCompleted ? 'bg-green-500 shadow-lg shadow-green-500/30 scale-100' :
                    isCurrent ? 'bg-primary shadow-lg shadow-primary/30 scale-110' :
                    'bg-muted border-2 border-muted-foreground/20'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5 text-white" /> :
                     isCurrent ? <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" /> :
                     <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />}
                  </div>
                  <p className={`text-xs font-medium mt-2 text-center max-w-[90px] leading-tight ${
                    isCompleted ? 'text-green-600 dark:text-green-400' :
                    isCurrent ? 'text-primary font-semibold' :
                    'text-muted-foreground/50'
                  }`}>{step}</p>
                </div>
              );
            })}
          </div>
          {/* Mobile: vertical */}
          <div className="md:hidden space-y-0">
            {progressSteps.map((step, i) => {
              const isCompleted = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={i} className="step-item flex items-start gap-4 pb-6 relative animate-fade-in-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
                  {i < progressSteps.length - 1 && (
                    <div className={`absolute left-[18px] top-10 bottom-0 w-0.5 ${isCompleted ? 'bg-green-400' : 'bg-muted-foreground/15'}`} />
                  )}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                    isCompleted ? 'bg-green-500 shadow-md shadow-green-500/30' :
                    isCurrent ? 'bg-primary shadow-md shadow-primary/30 scale-110' :
                    'bg-muted border-2 border-muted-foreground/20'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 text-white" /> :
                     isCurrent ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> :
                     <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                  </div>
                  <div className="pt-1.5">
                    <p className={`text-sm font-medium ${
                      isCompleted ? 'text-green-600 dark:text-green-400' :
                      isCurrent ? 'text-primary font-semibold' :
                      'text-muted-foreground/60'
                    }`}>{step}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out both; }
      `}</style>
    </div>
  );
}

/* ─── Login Page ─── */
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) { toast.error('Please enter your name and password'); return; }
    setLoading(true);
    const result = await loginToPortal(username.trim(), password);
    setLoading(false);
    if (result.success) { toast.success('Logged in successfully'); onLogin(); }
    else { toast.error(result.error || 'Login failed'); }
  };

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container max-w-md">
          <div className="bg-card border rounded-2xl p-8 shadow-lg space-y-6 animate-fade-in-up">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">Application Status Portal</h1>
              <p className="text-sm text-muted-foreground">Track your application, send messages, and upload documents.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name or Application ID</label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your full name" required className="h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required className="h-11" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 gap-2 text-base">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4 rotate-90" />}
                {loading ? 'Signing in...' : 'Sign In'}
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

/* ─── Main Page ─── */
export default function ApplicationStatus() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setChecking(false);
  }, []);

  if (checking) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;
  return <Dashboard onLogout={() => { clearTrackingSession(); setLoggedIn(false); navigate('/application-status'); }} />;
}

/* ─── Dashboard ─── */
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
  const [someoneTyping, setSomeoneTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [presence, setPresence] = useState<any>({});
  const appId = getStoredApplicationId() || '';
  const applicantName = getStoredApplicantName() || '';

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

  // Realtime subscriptions
  useEffect(() => {
    const cleanup = subscribeToApplicationChannel(
      // onMessage
      (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.payload.id)) return prev;
          return [...prev, payload.payload];
        });
        setUnreadCount(prev => prev + 1);
      },
      // onStatusChange
      (payload) => {
        setCurrentStatus(payload.payload);
        loadAll();
      },
      // onNotification
      (payload) => {
        setNotifications(prev => [payload.payload, ...prev]);
        setUnreadCount(prev => prev + 1);
      },
      // onTyping
      (payload) => {
        const { isTyping, userName } = payload.payload;
        if (userName !== applicantName) {
          setSomeoneTyping(isTyping);
          setTypingUser(isTyping ? userName : '');
        }
      },
      // onPresence
      (state) => {
        setPresence(state);
      },
      applicantName,
    );
    return () => { if (cleanup) cleanup(); };
  }, [appId, applicantName, loadAll]);

  // Mark admin messages as read when tab opens
  useEffect(() => {
    if (tab === 'messages') {
      const unreadIds = messages.filter(m => m.sender_type === 'admin' && !m.is_read).map(m => m.id);
      if (unreadIds.length > 0) {
        markMessagesAsRead(unreadIds);
        setMessages(prev => prev.map(m => m.is_read || m.sender_type !== 'admin' ? m : { ...m, is_read: true }));
      }
    }
  }, [tab, messages]);

  const tabs = [
    { key: 'overview' as Tab, label: 'Overview', icon: FileText },
    { key: 'messages' as Tab, label: 'Messages', icon: MessageSquare },
    { key: 'documents' as Tab, label: 'Documents', icon: Paperclip },
    { key: 'activity' as Tab, label: 'Activity', icon: Clock },
  ];

  const adminPresent = Object.values(presence).some((p: any) => p?.[0]?.user !== applicantName);
  const unreadMsgCount = messages.filter(m => m.sender_type === 'admin' && !m.is_read).length;

  if (loading) return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-40 h-16" />
      <div className="container max-w-5xl px-4 py-6 space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b sticky top-0 z-40">
        <div className="container max-w-5xl flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-display text-base font-bold text-foreground">Application Portal</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Online indicator */}
            {adminPresent && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Admissions online
              </div>
            )}
            <button onClick={() => { markNotificationsRead(); setUnreadCount(0); loadAll(); }}
              className="relative p-2 rounded-xl hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-destructive/30 animate-scale-in">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-xl hover:bg-muted">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="container max-w-5xl px-4 py-6">
        {/* Mobile tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto md:hidden bg-card rounded-2xl p-1 border shadow-sm">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                tab === t.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'
              }`}>
              {t.label}
              {t.key === 'messages' && unreadMsgCount > 0 && (
                <span className="ml-1.5 w-4 h-4 inline-flex items-center justify-center bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full">{unreadMsgCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-56 shrink-0">
            <nav className="space-y-1 sticky top-24">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    tab === t.key ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}>
                  <t.icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{t.label}</span>
                  {t.key === 'messages' && unreadMsgCount > 0 && (
                    <span className="min-w-[20px] h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">{unreadMsgCount}</span>
                  )}
                </button>
              ))}
              {adminPresent && (
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Admissions online
                </div>
              )}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-6 animate-fade-in">
            {tab === 'overview' && (
              <>
                <StatusCard status={currentStatus} appData={appData} />
                <ProgressTracker currentStatus={currentStatus} />
                <NotificationPanel notifications={notifications} onRefresh={loadAll} />
              </>
            )}
            {tab === 'messages' && (
              <MessagesTab
                messages={messages}
                setMessages={setMessages}
                onRefresh={loadAll}
                someoneTyping={someoneTyping}
                typingUser={typingUser}
                setSomeoneTyping={setSomeoneTyping}
                applicantName={applicantName}
                appId={appId}
                adminPresent={adminPresent}
              />
            )}
            {tab === 'documents' && <DocumentsTab attachments={attachments} onRefresh={loadAll} currentStatus={currentStatus} />}
            {tab === 'activity' && <ActivityTab activityLog={activityLog} />}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0); } to { transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}

/* ─── Notification Panel ─── */
function NotificationPanel({ notifications, onRefresh }: { notifications: any[]; onRefresh: () => void }) {
  const unread = notifications.filter((n: any) => !n.is_read);
  if (unread.length === 0) return null;
  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">Recent Updates</h3>
        <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">{unread.length} new</span>
      </div>
      <div className="space-y-2">
        {unread.slice(0, 5).map((n: any) => (
          <div key={n.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
            <Bell className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Messages Tab ─── */
function MessagesTab({
  messages, setMessages, onRefresh, someoneTyping, typingUser, setSomeoneTyping,
  applicantName, appId, adminPresent,
}: {
  messages: any[]; setMessages: React.Dispatch<React.SetStateAction<any[]>>; onRefresh: () => void;
  someoneTyping: boolean; typingUser: string;
  setSomeoneTyping: (v: boolean) => void; applicantName: string; appId: string; adminPresent: boolean;
}) {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      application_id: appId,
      sender_type: 'applicant',
      message: newMessage.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    setAutoScroll(true);

    const ok = await sendChatMessage(newMessage.trim());
    setSending(false);
    if (ok) {
      onRefresh();
    } else {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      toast.error('Failed to send message');
    }
  };

  const handleTyping = (val: string) => {
    setNewMessage(val);
    if (val.trim() && !isTyping) {
      setIsTyping(true);
      broadcastTyping(appId, true, applicantName);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      broadcastTyping(appId, false, applicantName);
    }, 1500);
  };

  return (
    <div className="bg-card border rounded-2xl flex flex-col h-[600px] md:h-[650px] shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Messages</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {adminPresent ? (
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Admissions online</span>
              ) : 'Admissions offline'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {messages.filter(m => m.sender_type === 'admin' && m.is_read).length > 0 && (
              <span className="flex items-center gap-1"><CheckCheck className="w-3.5 h-3.5 text-green-500" /> Read</span>
            )}
          </div>
        </div>
      </div>

      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isAdmin = m.sender_type === 'admin';
            const showRead = isAdmin && m.is_read;
            const prevIsSameSender = i > 0 && messages[i - 1].sender_type === m.sender_type;
            return (
              <div key={m.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} ${prevIsSameSender ? 'mt-0.5' : 'mt-2'} animate-message-in`}>
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2.5 transition-all ${
                  isAdmin ? 'bg-muted rounded-tl-md' : 'bg-primary text-primary-foreground rounded-tr-md'
                } ${prevIsSameSender && isAdmin ? 'rounded-tl-2xl' : ''} ${prevIsSameSender && !isAdmin ? 'rounded-tr-2xl' : ''}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.message}</p>
                  <div className={`flex items-center gap-1.5 mt-1 ${isAdmin ? '' : 'justify-end'}`}>
                    <span className="text-[10px] opacity-60">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!isAdmin && showRead && <CheckCheck className="w-3 h-3 text-white/70" />}
                    {!isAdmin && !m.is_read && m.id.startsWith('opt-') && <Loader2 className="w-3 h-3 animate-spin text-white/70" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {someoneTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-background/50">
        <div className="flex gap-2 items-end">
          <Textarea
            value={newMessage}
            onChange={e => handleTyping(e.target.value)}
            placeholder="Type your message..."
            rows={1}
            className="min-h-[44px] max-h-32 resize-none rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="shrink-0 h-[44px] w-[44px] rounded-xl" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <style>{`
        @keyframes message-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-message-in { animation: message-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}

/* ─── Documents Tab ─── */
function DocumentsTab({ attachments, onRefresh, currentStatus }: { attachments: any[]; onRefresh: () => void; currentStatus: any }) {
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const isFinal = currentStatus && ['accepted', 'rejected'].includes(currentStatus.status);
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return; }
    if (!allowedTypes.includes(file.type)) { toast.error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed'); return; }
    setPendingFile(file);
    setShowModal(true);
    e.target.value = '';
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    setShowModal(false);
    setUploading(true);
    const ok = await uploadAttachment(pendingFile);
    setUploading(false);
    setPendingFile(null);
    if (ok) { toast.success('File uploaded successfully'); onRefresh(); }
    else { toast.error('Failed to upload file'); }
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => { setShowModal(false); setPendingFile(null); }}>
          <div className="bg-card border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-foreground">Attachment Notice</h3>
            <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>Files uploaded through this chat are only used to support your admissions application.</p>
              <p>Once your application has been accepted or rejected, these uploaded attachments will automatically be removed from your applicant portal.</p>
              <p>Admissions administrators may download and review these files before they are deleted.</p>
            </div>
            {pendingFile && (
              <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-3 border">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{pendingFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(pendingFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={confirmUpload} className="flex-1 h-11 rounded-xl">Continue</Button>
              <Button variant="outline" onClick={() => { setShowModal(false); setPendingFile(null); }} className="flex-1 h-11 rounded-xl">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Documents</h2>
            <p className="text-xs text-muted-foreground">Support your application with files</p>
          </div>
          {!isFinal && (
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" className="gap-2 rounded-xl h-9" disabled={uploading}>
                <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileSelect} disabled={uploading} />
            </label>
          )}
        </div>

        {isFinal && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Uploads Disabled</p>
              <p className="text-xs mt-0.5 opacity-80">Uploads are disabled as a final decision has been made.</p>
            </div>
          </div>
        )}

        {attachments.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Paperclip className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 bg-muted/30 rounded-xl p-3 hover:bg-muted/50 transition-colors group">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{a.file_name}</p>
                  <p className="text-xs text-muted-foreground">{(a.file_size / 1024).toFixed(1)} KB</p>
                </div>
                <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Download">
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

/* ─── Activity Tab ─── */
function ActivityTab({ activityLog }: { activityLog: any[] }) {
  const iconMap: Record<string, any> = {
    application_submitted: CheckCircle,
    status_changed: AlertCircle,
  };
  const colorMap: Record<string, string> = {
    application_submitted: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    status_changed: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
  };

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
      <div>
        <h2 className="font-semibold text-foreground">Activity Log</h2>
        <p className="text-xs text-muted-foreground">Timeline of your application events</p>
      </div>
      {activityLog.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">No activity recorded yet</p>
        </div>
      ) : (
        <div className="space-y-0">
          {activityLog.map((a: any, i: number) => {
            const Icon = iconMap[a.action] || Clock;
            const color = colorMap[a.action] || 'text-muted-foreground bg-muted';
            return (
              <div key={a.id} className="flex gap-4 pb-5 relative">
                {i < activityLog.length - 1 && <div className="absolute left-[17px] top-9 bottom-0 w-0.5 bg-border" />}
                <div className={`p-2 rounded-xl shrink-0 h-fit ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 pt-1">
                  <p className="text-sm font-medium text-foreground capitalize">{a.action.replace(/_/g, ' ')}</p>
                  {a.details && <p className="text-xs text-muted-foreground mt-0.5">{a.details}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
