import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Send, Lock, ExternalLink } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useNavigate } from 'react-router-dom';
import { createTrackingAccount } from '@/lib/tracking';
import OLevelSubjectSelector from './OLevelSubjectSelector';
import ALevelSubjectSelector from './ALevelSubjectSelector';

interface Props {
  enableSubjectSelection: boolean;
}

export default function AdmissionForm({ enableSubjectSelection }: Props) {
  const navigate = useNavigate();
  const { oLevelGroups, aLevelSubjects, streamMap, loading: subjectsLoading } = useSubjects();
  const [form, setForm] = useState({
    student_name: '',
    email: '',
    phone: '',
    level: 'o-level' as 'o-level' | 'a-level',
  });
  const [oLevelSubjects, setOLevelSubjects] = useState<string[]>([]);
  const [aLevelSelected, setALevelSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name.trim() || !form.email.trim()) {
      toast.error('Please fill in your name and email');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.from('admission_applications').insert([{
      student_name: form.student_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      level: form.level,
      o_level_subjects: form.level === 'o-level' ? oLevelSubjects : [],
      a_level_subjects: form.level === 'a-level' ? aLevelSelected : [],
    }]).select().single();

    setSubmitting(false);
    if (error || !data) { toast.error('Failed to submit application. Please try again.'); return; }
    setSubmitted(true);
    setSubmittedAppId(data.id);
    toast.success('Application submitted successfully!');
  };

  const handleCreateAccount = async () => {
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!submittedAppId) return;

    setCreatingAccount(true);
    const result = await createTrackingAccount(submittedAppId, form.student_name.trim(), password);
    setCreatingAccount(false);

    if (result.success) {
      setAccountCreated(true);
      toast.success('Tracking account created!');
    } else {
      toast.error(result.error || 'Failed to create tracking account');
    }
  };

  if (accountCreated) {
    return (
      <div className="bg-card border rounded-lg p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground">Application Submitted!</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Your tracking account has been created. You can now log in to track your application status, send messages, and upload documents.
        </p>
        <div className="bg-muted rounded-lg p-4 max-w-sm mx-auto text-left space-y-1">
          <p className="text-sm text-foreground"><span className="font-medium">Username:</span> {form.student_name.trim()}</p>
          <p className="text-sm text-muted-foreground">Use your full name and the password you created to log in.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/application-status')} className="gap-2">
            <ExternalLink className="w-4 h-4" /> Go to Application Portal
          </Button>
          <Button variant="outline" onClick={() => { setSubmitted(false); setAccountCreated(false); setSubmittedAppId(null); setForm({ student_name: '', email: '', phone: '', level: 'o-level' }); setOLevelSubjects([]); setALevelSelected([]); }}>
            Submit Another
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-card border rounded-lg p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground">Create Your Tracking Account</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Set up a password to track your application online. Your full name <strong>"{form.student_name.trim()}"</strong> will be your username.
        </p>
        <div className="max-w-sm mx-auto space-y-3 text-left">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Confirm Password</label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
          </div>
          <Button onClick={handleCreateAccount} disabled={creatingAccount} className="w-full gap-2">
            <Lock className="w-4 h-4" /> {creatingAccount ? 'Creating Account...' : 'Create Tracking Account'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Your password is securely hashed and never stored in plain text.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h3 className="font-display text-lg font-bold text-foreground">Student Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Full Name *</label>
            <Input value={form.student_name} onChange={e => setForm(p => ({ ...p, student_name: e.target.value }))} placeholder="Enter full name" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email Address *</label>
            <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Enter email" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Phone Number</label>
            <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Applying For</label>
            <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value as 'o-level' | 'a-level' }))} className="w-full px-3 py-2 border rounded-md text-sm bg-background">
              <option value="o-level">O-Level (Form 1–4)</option>
              <option value="a-level">A-Level (Form 5–6)</option>
            </select>
          </div>
        </div>
      </div>

      {enableSubjectSelection && !subjectsLoading && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {form.level === 'o-level' ? (
            <OLevelSubjectSelector selected={oLevelSubjects} onChange={setOLevelSubjects} groups={oLevelGroups} />
          ) : (
            <ALevelSubjectSelector selected={aLevelSelected} onChange={setALevelSelected} subjects={aLevelSubjects} streamMap={streamMap} />
          )}
        </div>
      )}

      <Button type="submit" disabled={submitting} className="gap-2">
        <Send className="w-4 h-4" />
        {submitting ? 'Submitting...' : 'Submit Application'}
      </Button>
    </form>
  );
}
