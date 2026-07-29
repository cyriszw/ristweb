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
  Paperclip, Users, ClipboardList, Search, ArrowUpDown, GraduationCap,
  Pencil, Home, BookOpen, Ban, Printer, ExternalLink, Plus, Loader2,
} from 'lucide-react';
import {
  subscribeToAdminChat, broadcastMessage, broadcastStatusChange, broadcastNotification,
  getHouseNames, getClassesByGrade, getAcceptedApplications, getAllStudents,
  enrollStudent, getDashboardStats, updateStudent, archiveStudent,
} from '@/lib/tracking';

const STATUS_OPTIONS = [
  'submitted', 'under_review', 'additional_info_required',
  'interview_scheduled', 'accepted', 'rejected',
];

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted', under_review: 'Under Review',
  additional_info_required: 'Additional Information Required',
  interview_scheduled: 'Interview Scheduled', accepted: 'Accepted',
  rejected: 'Rejected', enrolled: 'Enrolled',
};

const STATUS_COLORS: Record<string, string> = {
  submitted: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  under_review: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  additional_info_required: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
  interview_scheduled: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
  accepted: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  rejected: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  enrolled: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
};

type AdminTab = 'applications' | 'enrollment' | 'students';

export default function AdmissionsManager() {
  const [tab, setTab] = useState<AdminTab>('applications');
  const [enableSubjects, setEnableSubjects] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [enrollmentQueue, setEnrollmentQueue] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollingApp, setEnrollingApp] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('key, value').eq('key', 'admissions_subject_selection').maybeSingle();
    if (data) setEnableSubjects(data.value === 'true');
  }, []);

  const loadApplications = useCallback(async () => {
    const { data } = await supabase.from('admission_applications').select('*').order('created_at', { ascending: false });
    setApplications(data || []);
  }, []);

  const loadEnrollmentQueue = useCallback(async () => {
    const apps = await getAcceptedApplications();
    setEnrollmentQueue(apps);
  }, []);

  const loadStudents = useCallback(async () => {
    const data = await getAllStudents();
    setStudents(data);
  }, []);

  const loadStats = useCallback(async () => {
    const data = await getDashboardStats();
    setStats(data);
  }, []);

  useEffect(() => {
    loadSettings(); loadApplications(); loadEnrollmentQueue(); loadStudents(); loadStats();
  }, [loadSettings, loadApplications, loadEnrollmentQueue, loadStudents, loadStats]);

  useEffect(() => {
    if (showEnrollModal) loadEnrollmentQueue();
  }, [showEnrollModal, loadEnrollmentQueue]);

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

  const tabs = [
    { key: 'applications' as AdminTab, label: 'Applications', icon: ClipboardList, count: applications.length },
    { key: 'enrollment' as AdminTab, label: 'Enrollment Queue', icon: Users, count: enrollmentQueue.length },
    { key: 'students' as AdminTab, label: 'Students', icon: GraduationCap, count: students.filter(s => s.status === 'active').length },
  ];

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Admissions Management</h2>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Pending" value={stats.statusCounts.pending} color="text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20" />
          <StatCard label="Accepted" value={stats.statusCounts.accepted} color="text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20" />
          <StatCard label="Rejected" value={stats.statusCounts.rejected} color="text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20" />
          <StatCard label="Enrolled" value={stats.statusCounts.enrolled} color="text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-card border rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              tab === t.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/10 text-muted-foreground'
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Display Controls */}
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

      {/* Tab Content */}
      {tab === 'applications' && (
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
      )}

      {tab === 'enrollment' && (
        <EnrollmentQueueTab
          queue={enrollmentQueue}
          onEnroll={(app) => { setEnrollingApp(app); setShowEnrollModal(true); }}
          onRefresh={() => { loadEnrollmentQueue(); loadStudents(); loadStats(); }}
        />
      )}

      {tab === 'students' && (
        <StudentsTab students={students} onRefresh={() => { loadStudents(); loadStats(); }} />
      )}

      {showEnrollModal && enrollingApp && (
        <EnrollmentModal
          app={enrollingApp}
          onClose={() => { setShowEnrollModal(false); setEnrollingApp(null); }}
          onComplete={() => { setShowEnrollModal(false); setEnrollingApp(null); loadEnrollmentQueue(); loadStudents(); loadStats(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color.split(' ')[0]}`}>{value}</p>
    </div>
  );
}

/* ─── Enrollment Queue Tab ─── */
function EnrollmentQueueTab({ queue, onEnroll, onRefresh }: { queue: any[]; onEnroll: (app: any) => void; onRefresh: () => void }) {
  return (
    <div className="bg-card border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-foreground">Enrollment Queue ({queue.length})</h3>
        <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1.5 text-xs">
          <Loader2 className="w-3 h-3" /> Refresh
        </Button>
      </div>
      {queue.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No applications awaiting enrollment.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Accept an application to move it here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map(app => (
            <div key={app.id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-foreground">{app.student_name}</div>
                <div className="text-xs text-muted-foreground">
                  {app.email} • {app.level?.toUpperCase()} • {new Date(app.created_at).toLocaleDateString()}
                </div>
              </div>
              <Button onClick={() => onEnroll(app)} size="sm" className="gap-1.5 shrink-0">
                <GraduationCap className="w-4 h-4" /> Complete Enrollment
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Enrollment Modal ─── */
function EnrollmentModal({ app, onClose, onComplete }: { app: any; onClose: () => void; onComplete: () => void }) {
  const [firstName, setFirstName] = useState(app.student_name?.split(' ').slice(0, -1).join(' ') || '');
  const [lastName, setLastName] = useState(app.student_name?.split(' ').slice(-1)[0] || '');
  const [house, setHouse] = useState('');
  const [grade, setGrade] = useState('Form 1');
  const [className, setClassName] = useState('');
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    supabase.rpc('generate_student_id').then(({ data }) => {
      if (data) setStudentId(data as string);
    });
  }, []);

  const grades = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
  const houses = getHouseNames();
  const classes = getClassesByGrade(grade);

  useEffect(() => {
    setClassName(classes[0] || '');
  }, [grade, classes]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) { toast.error('Enter student name'); return; }
    if (!house) { toast.error('Select a house'); return; }
    if (!className) { toast.error('Select a class'); return; }
    setSaving(true);

    const result = await enrollStudent({
      application_id: app.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      house,
      grade,
      class: className,
    });

    setSaving(false);
    if (result.success) {
      toast.success(`Student enrolled as ${result.student?.student_id}`);
      // Broadcast enrollment
      broadcastStatusChange(app.id, {
        status: 'enrolled',
        notes: `Enrolled as ${result.student?.student_id}`,
        created_at: new Date().toISOString(),
      });
      broadcastNotification(app.id, {
        title: 'Enrollment Complete!',
        message: `Your enrollment has been completed. Welcome to Marist Brothers! Student ID: ${result.student?.student_id}`,
      });
      onComplete();
    } else {
      toast.error(result.error || 'Enrollment failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">Complete Enrollment</h3>
            <p className="text-xs text-muted-foreground">{app.student_name}</p>
          </div>
        </div>

        {/* Student ID */}
        <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Student ID</p>
            <p className="text-sm font-bold text-foreground font-mono">{studentId || <Loader2 className="w-4 h-4 animate-spin inline" />}</p>
          </div>
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">First Name</label>
            <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Last Name</label>
            <Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-10" />
          </div>
        </div>

        {/* House */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-muted-foreground" /> House
          </label>
          <div className="grid grid-cols-2 gap-2">
            {houses.map(h => (
              <button key={h} onClick={() => setHouse(h)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  house === h
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                }`}>
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Grade */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" /> Grade / Form
          </label>
          <select value={grade} onChange={e => setGrade(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background">
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Class */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Class</label>
          <div className="grid grid-cols-3 gap-2">
            {classes.map(c => (
              <button key={c} onClick={() => setClassName(c)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  className === c
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1 h-11 rounded-xl gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? 'Enrolling...' : 'Save & Enroll Student'}
          </Button>
          <Button variant="outline" onClick={onClose} className="h-11 rounded-xl">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Students Tab ─── */
function StudentsTab({ students, onRefresh }: { students: any[]; onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('student_id');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [showProfile, setShowProfile] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const filtered = students
    .filter(s => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return s.student_id?.toLowerCase().includes(q)
        || s.first_name?.toLowerCase().includes(q)
        || s.last_name?.toLowerCase().includes(q)
        || s.house?.toLowerCase().includes(q)
        || s.grade?.toLowerCase().includes(q)
        || s.class?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  if (showProfile) {
    return <StudentProfile student={showProfile} onBack={() => setShowProfile(null)} onUpdate={() => { onRefresh(); }} />;
  }

  return (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-foreground">Students ({students.filter(s => s.status === 'active').length})</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search students..."
              className="pl-9 h-9 w-56 text-sm rounded-xl"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{search ? 'No students match your search' : 'No enrolled students yet.'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                {['student_id', 'first_name', 'house', 'grade', 'class', 'admission_date', 'status'].map(f => (
                  <th key={f} className="text-left py-3 px-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort(f)}>
                    <div className="flex items-center gap-1">
                      {f === 'student_id' ? 'Student ID' : f === 'first_name' ? 'Name' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
                      {sortField === f && <ArrowUpDown className={`w-3 h-3 ${sortDir === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                ))}
                <th className="text-right py-3 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-xs font-medium">{s.student_id}</td>
                  <td className="py-3 px-3 font-medium">{s.first_name} {s.last_name}</td>
                  <td className="py-3 px-3">{s.house}</td>
                  <td className="py-3 px-3">{s.grade}</td>
                  <td className="py-3 px-3">{s.class}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{new Date(s.admission_date).toLocaleDateString()}</td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setShowProfile(s)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="View Profile">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingStudent(s)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={() => { setEditingStudent(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

/* ─── Edit Student Modal ─── */
function EditStudentModal({ student, onClose, onSave }: { student: any; onClose: () => void; onSave: () => void }) {
  const [house, setHouse] = useState(student.house);
  const [grade, setGrade] = useState(student.grade);
  const [className, setClassName] = useState(student.class);
  const [status, setStatus] = useState(student.status);
  const [saving, setSaving] = useState(false);

  const grades = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
  const houses = getHouseNames();
  const classes = getClassesByGrade(grade);

  useEffect(() => {
    if (!getClassesByGrade(grade).includes(className)) {
      setClassName(classes[0] || '');
    }
  }, [grade]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStudent(student.id, { house, grade, class: className, status });
      toast.success('Student updated');
      onSave();
    } catch {
      toast.error('Failed to update');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-foreground">Edit Student</h3>
        <p className="text-xs text-muted-foreground">{student.student_id} — {student.first_name} {student.last_name}</p>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">House</label>
          <div className="grid grid-cols-2 gap-2">
            {houses.map(h => (
              <button key={h} onClick={() => setHouse(h)}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  house === h ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground'
                }`}>{h}</button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Grade</label>
          <select value={grade} onChange={e => setGrade(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-sm bg-background">
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Class</label>
          <div className="grid grid-cols-3 gap-2">
            {classes.map(c => (
              <button key={c} onClick={() => setClassName(c)}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  className === c ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground'
                }`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-sm bg-background">
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1 h-10 rounded-xl">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={onClose} className="h-10 rounded-xl">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Student Profile ─── */
function StudentProfile({ student, onBack, onUpdate }: { student: any; onBack: () => void; onUpdate: () => void }) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (student.application_id) {
      supabase.from('application_attachments').select('*')
        .eq('application_id', student.application_id).eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .then(({ data }) => setAttachments(data || []));
    }
  }, [student.application_id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student.application_id) return;
    setUploading(true);
    const path = `applications/${student.application_id}/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('files').upload(path, file);
    if (uploadErr) { toast.error('Upload failed'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('files').getPublicUrl(path);
    await supabase.from('application_attachments').insert([{
      application_id: student.application_id, file_name: file.name,
      file_url: urlData.publicUrl, file_size: file.size, file_type: file.type, uploaded_by: 'admin',
    }]);
    setUploading(false);
    toast.success('Uploaded');
    const { data } = await supabase.from('application_attachments').select('*')
      .eq('application_id', student.application_id).eq('is_deleted', false)
      .order('created_at', { ascending: false });
    setAttachments(data || []);
    e.target.value = '';
  };

  const handleDeleteAttachment = async (att: any) => {
    await supabase.from('application_attachments').update({ is_deleted: true }).eq('id', att.id);
    setAttachments(prev => prev.filter(a => a.id !== att.id));
    toast.success('Document removed');
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Student Card - ${student.student_id}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 40px; }
        .card { border: 2px solid #000; padding: 30px; max-width: 350px; }
        h1 { font-size: 18px; margin: 0 0 5px; }
        .label { font-size: 11px; color: #666; margin-top: 8px; }
        .value { font-size: 14px; font-weight: bold; }
      </style></head><body>
      <div class="card">
        <h1>Marist Brothers</h1>
        <p style="font-size:12px;color:#666;margin-bottom:15px;">Student Identity Card</p>
        <div class="label">Student ID</div><div class="value">${student.student_id}</div>
        <div class="label">Name</div><div class="value">${student.first_name} ${student.last_name}</div>
        <div class="label">House</div><div class="value">${student.house}</div>
        <div class="label">Grade</div><div class="value">${student.grade}</div>
        <div class="label">Class</div><div class="value">${student.class}</div>
        <div class="label">Admission Date</div><div class="value">${new Date(student.admission_date).toLocaleDateString()}</div>
        <div class="label">Status</div><div class="value">${student.status}</div>
      </div></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="bg-card border rounded-xl p-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Students
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mt-3">{student.first_name} {student.last_name}</h2>
            <p className="text-sm font-mono text-primary font-bold">{student.student_id}</p>
            <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ${
              student.status === 'active'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground'
            }`}>{student.status}</span>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" /> Print Card
              </Button>
            </div>
          </div>

          <div className="border rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">Personal Info</h4>
            <ProfileField label="Date of Birth" value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '—'} />
            <ProfileField label="Gender" value={student.gender || '—'} />
            <ProfileField label="Parent/Guardian" value={student.parent_name || '—'} />
            <ProfileField label="Parent Contact" value={student.parent_contact || '—'} />
            <ProfileField label="Parent Email" value={student.parent_email || '—'} />
            <ProfileField label="Address" value={student.address || '—'} />
          </div>

          <div className="border rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">Academic Info</h4>
            <ProfileField label="House" value={student.house} />
            <ProfileField label="Grade" value={student.grade} />
            <ProfileField label="Class" value={student.class} />
            <ProfileField label="Admission Date" value={new Date(student.admission_date).toLocaleDateString()} />
          </div>
        </div>

        {/* Documents */}
        <div className="lg:col-span-2">
          <div className="border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-foreground">Admission Documents</h4>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled={uploading}>
                  <Upload className="w-3 h-3" /> {uploading ? '...' : 'Upload'}
                </Button>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleUpload} />
              </label>
            </div>
            {attachments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map(a => (
                  <div key={a.id} className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{a.file_name}</p>
                      <p className="text-xs text-muted-foreground">{(a.file_size / 1024).toFixed(1)} KB</p>
                    </div>
                    <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                      <Download className="w-4 h-4" />
                    </a>
                    <button onClick={() => handleDeleteAttachment(a)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

/* ─── ApplicationDetail (unchanged from before, included for completeness) ─── */
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

  useEffect(() => {
    const cleanups: (() => void)[] = [];

    const broadcastChannel = supabase.channel(`application-${app.id}`);
    broadcastChannel
      .on('broadcast', { event: 'message' }, (payload) => {
        const msg = payload.payload;
        if (msg.sender_type !== 'applicant') return;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      })
      .subscribe();
    cleanups.push(() => { supabase.removeChannel(broadcastChannel); });

    const pgCleanup = subscribeToAdminChat(app.id, (newMsg: any) => {
      if (newMsg.sender_type !== 'applicant') return;
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });
    cleanups.push(pgCleanup);

    return () => { cleanups.forEach(fn => fn()); };
  }, [app.id, app.student_name]);

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

    broadcastStatusChange(app.id, {
      status: selectedStatus,
      notes: newNote.trim() || null,
      created_at: new Date().toISOString(),
    });
    broadcastNotification(app.id, {
      title: 'Application Status Updated',
      message: `Your status has been changed to: ${STATUS_LABELS[selectedStatus]}`,
    });

    setSelectedStatus('');
    setNewNote('');
    loadDetails();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    const optimisticId = `opt-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: optimisticId, application_id: app.id, sender_type: 'admin',
      message: text, is_read: false, created_at: new Date().toISOString(),
    }]);
    setNewMessage('');
    setSendingMsg(true);

    const { error, data } = await supabase.from('application_chat_messages').insert([{
      application_id: app.id, sender_type: 'admin', message: text,
    }]).select().single();

    setSendingMsg(false);
    if (error || !data) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      if (error) toast.error('Failed to send');
      return;
    }

    setMessages(prev => prev.map(m => m.id === optimisticId ? data : m));
    broadcastMessage(app.id, data);

    await supabase.from('application_notifications').insert([{
      application_id: app.id, recipient_type: 'applicant',
      title: 'New Message from Admissions',
      message: 'You have a new message from the admissions office.',
    }]);
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
        <div className="xl:col-span-1 space-y-4">
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

          <div className="bg-card border rounded-lg p-5 space-y-3">
            <h4 className="font-semibold text-sm text-foreground">Current Status</h4>
            {currentStatus && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[currentStatus.status] || 'bg-muted text-muted-foreground'}`}>
                {currentStatus.status === 'accepted' ? <CheckCircle className="w-3 h-3" /> :
                 currentStatus.status === 'enrolled' ? <GraduationCap className="w-3 h-3" /> :
                 currentStatus.status === 'rejected' ? <X className="w-3 h-3" /> :
                 <AlertCircle className="w-3 h-3" />}
                {STATUS_LABELS[currentStatus.status] || currentStatus.status}
              </span>
            )}
            {currentStatus?.notes && <p className="text-xs text-muted-foreground mt-2">{currentStatus.notes}</p>}
          </div>

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
