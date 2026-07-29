import { getSubjectAdvice, getCareerSuggestions } from '@/data/subjects';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, CheckCircle2, Briefcase } from 'lucide-react';

interface Props {
  selected: string[];
  onChange: (subjects: string[]) => void;
  subjects: string[];
  streamMap: Record<string, string>;
}

export default function ALevelSubjectSelector({ selected, onChange, subjects, streamMap }: Props) {
  const toggle = (subject: string) => {
    if (selected.includes(subject)) {
      onChange(selected.filter(s => s !== subject));
    } else if (selected.length < 3) {
      onChange([...selected, subject]);
    }
  };

  const advice = getSubjectAdvice(selected, streamMap);
  const careers = getCareerSuggestions(selected, streamMap);

  if (subjects.length === 0) {
    return <p className="text-sm text-muted-foreground">No A-Level subjects available.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">A-Level Subject Selection</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select up to <strong>3 subjects</strong> from the list below.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-lg p-4">
            <div className="grid sm:grid-cols-2 gap-2">
              {subjects.map(subject => {
                const isSelected = selected.includes(subject);
                const isDisabled = !isSelected && selected.length >= 3;
                return (
                  <label
                    key={subject}
                    className={`flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/10 border border-primary/30'
                        : isDisabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-muted border border-transparent'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => !isDisabled && toggle(subject)}
                      disabled={isDisabled}
                    />
                    <span className="text-sm text-foreground">{subject}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border rounded-lg p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Your Selection ({selected.length}/3)</h4>
            {selected.length === 0 ? (
              <p className="text-xs text-muted-foreground">No subjects selected yet.</p>
            ) : (
              <div className="space-y-2">
                {selected.map(s => (
                  <div
                    key={s}
                    onClick={() => toggle(s)}
                    className="flex items-center justify-between bg-primary/10 text-primary text-sm font-medium px-3 py-2 rounded-md cursor-pointer hover:bg-primary/20 transition-colors"
                  >
                    <span>{s}</span>
                    <span className="text-xs">×</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {advice && (
            <div
              className={`border rounded-lg p-4 transition-all animate-in fade-in slide-in-from-right-2 duration-300 ${
                advice.type === 'good'
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                  : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
              }`}
            >
              <div className="flex items-start gap-2">
                {advice.type === 'good' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className={`text-sm font-semibold ${
                    advice.type === 'good' ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'
                  }`}>
                    {advice.type === 'good' ? 'Good Combination' : 'Consider Carefully'}
                  </h4>
                  <p className={`text-xs mt-1 ${
                    advice.type === 'good' ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    {advice.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {careers.length > 0 && (
            <div className="bg-card border rounded-lg p-4 animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Suggested Career Paths</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {careers.map(c => (
                  <span key={c} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
