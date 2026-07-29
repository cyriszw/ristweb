import { Checkbox } from '@/components/ui/checkbox';
import { OLevelGroup } from '@/hooks/useSubjects';

interface Props {
  selected: string[];
  onChange: (subjects: string[]) => void;
  groups: OLevelGroup[];
}

export default function OLevelSubjectSelector({ selected, onChange, groups }: Props) {
  const toggle = (subject: string) => {
    onChange(
      selected.includes(subject)
        ? selected.filter(s => s !== subject)
        : [...selected, subject]
    );
  };

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">No O-Level subjects available.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">O-Level Subject Selection</h3>
        <p className="text-sm text-muted-foreground mt-1">Select the subjects you are currently studying or wish to study.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {groups.map(group => (
          <div key={group.group} className="bg-card border rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-primary">{group.group}</h4>
            <div className="space-y-2">
              {group.subjects.map(subject => (
                <label key={subject} className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox
                    checked={selected.includes(subject)}
                    onCheckedChange={() => toggle(subject)}
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {subject}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Selected ({selected.length}):</p>
          <div className="flex flex-wrap gap-2">
            {selected.map(s => (
              <span
                key={s}
                onClick={() => toggle(s)}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer hover:bg-primary/20 transition-colors"
              >
                {s} ×
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
