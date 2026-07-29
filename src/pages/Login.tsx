import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';
import schoolLogo from '@/assets/school-logo.png';

export default function Login() {
  const { user, isAdmin, signIn, loading, adminChecking } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Only block on initial auth loading, not ongoing admin checks
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (user && isAdmin) return <Navigate to="/admin" replace />;
  // Show "no admin" only when admin check is fully done and user is not admin
  const showNoAdminMsg = !!user && !isAdmin && !adminChecking && !submitting;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={schoolLogo} alt="Logo" className="h-16 w-16 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="text-sm text-muted-foreground mt-1">Marist Brothers High School Dete</p>
        </div>
        <form onSubmit={handleLogin} className="bg-card border rounded-lg p-6 space-y-4 shadow-sm">
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}
          {showNoAdminMsg && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">You do not have admin privileges.</div>}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={submitting} className="w-full active:scale-[0.97]">
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
