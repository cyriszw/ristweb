import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/shared/PageHeader';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AdmissionForm from '@/components/admissions/AdmissionForm';

function S({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`${visible ? 'animate-reveal' : 'opacity-0'} ${className}`}>{children}</div>;
}

export default function Admissions() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<any[]>([]);
  const [enableSubjectSelection, setEnableSubjectSelection] = useState(false);

  useEffect(() => {
    supabase.from('files').select('*').order('uploaded_at', { ascending: false }).then(({ data }) => setFiles(data || []));
    supabase.from('site_settings').select('key, value').eq('key', 'admissions_subject_selection').maybeSingle().then(({ data }) => {
      if (data) setEnableSubjectSelection(data.value === 'true');
    });
  }, []);

  return (
    <Layout>
      <PageHeader title="Admissions" subtitle="Join the Marist Brothers family" bannerKey="admissions" />
      <section className="py-16">
        <div className="container max-w-4xl space-y-12">
          <S>
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">How to Apply</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>We welcome applications from students who are committed to academic excellence and personal growth. Follow these steps:</p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>Obtain an application form from the school office or download below.</li>
                <li>Complete the form with all required documents.</li>
                <li>Submit the application along with the registration fee.</li>
                <li>Attend the scheduled entrance assessment.</li>
                <li>Await the admission letter from the school.</li>
              </ol>
            </div>
          </S>
          <S>
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">Requirements</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
              <li>Certified copy of birth certificate</li>
              <li>Previous school report / transfer letter</li>
              <li>Two passport-sized photographs</li>
              <li>Medical report</li>
              <li>Baptism certificate (if applicable)</li>
            </ul>
          </S>

          {/* Application Status Portal Link */}
          <S>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <ExternalLink className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground mb-1">Application Status Portal</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Already applied? Log in to track your application status, send messages, and upload supporting documents.
                  </p>
                  <Button onClick={() => navigate('/application-status')} variant="default" className="gap-2">
                    <ExternalLink className="w-4 h-4" /> Go to Portal
                  </Button>
                </div>
              </div>
            </div>
          </S>

          {/* Online Application Form */}
          <S>
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">Online Application</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Fill in the form below to express your interest. Our admissions team will follow up with you.
            </p>
            <AdmissionForm enableSubjectSelection={enableSubjectSelection} />
          </S>

          {files.length > 0 && (
            <S>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">Downloadable Documents</h2>
              <div className="space-y-2">
                {files.map(f => (
                  <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-card border rounded-lg p-4 hover:shadow-sm transition-shadow group">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground flex-1">{f.file_name}</span>
                    <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </S>
          )}
        </div>
      </section>
    </Layout>
  );
}
