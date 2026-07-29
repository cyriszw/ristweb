import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/shared/PageHeader';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useSubjects } from '@/hooks/useSubjects';
import AcademicsCharts from '@/components/academics/AcademicsCharts';

function S({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`${visible ? 'animate-reveal' : 'opacity-0'} ${className}`}>{children}</div>;
}

export default function Academics() {
  const { oLevelGroups, aLevelSubjects, loading } = useSubjects();

  return (
    <Layout>
      <PageHeader title="Academics" subtitle="Comprehensive curriculum preparing students for success" bannerKey="academics" />
      <section className="py-16">
        <div className="container max-w-4xl space-y-12">
          <S>
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">Curriculum</h2>
            <p className="text-muted-foreground leading-relaxed">
              We follow the Zimbabwe Schools Examination Council (ZIMSEC) curriculum, offering both Ordinary Level (O-Level) and Advanced Level (A-Level) programmes. Our dedicated teaching staff ensure that every student receives personalised attention and support.
            </p>
          </S>

          {/* O-Level Subjects */}
          <S>
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">O-Level Subjects</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading subjects...</p>
            ) : oLevelGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects available.</p>
            ) : (
              <div className="space-y-6">
                {oLevelGroups.map(group => (
                  <div key={group.group}>
                    <h3 className="text-sm font-semibold text-primary mb-2">{group.group}</h3>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {group.subjects.map(s => (
                        <div key={s} className="px-4 py-2.5 bg-card border rounded-md text-sm font-medium text-foreground">{s}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </S>

          {/* A-Level Subjects */}
          <S>
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">A-Level Subjects</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading subjects...</p>
            ) : aLevelSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects available.</p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {aLevelSubjects.map(s => (
                  <div key={s} className="px-4 py-2.5 bg-card border rounded-md text-sm font-medium text-foreground">{s}</div>
                ))}
              </div>
            )}
          </S>

          <S>
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">Learning Environment</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our classrooms are equipped with modern learning resources, and we maintain a low student-to-teacher ratio to ensure quality instruction. The school library, science laboratories, and computer lab provide hands-on learning experiences for all students.
            </p>
          </S>
          <S>
            <AcademicsCharts />
          </S>
        </div>
      </section>
    </Layout>
  );
}
