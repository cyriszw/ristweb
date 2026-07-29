// Subject stream classification and combination advisor logic
// O-Level groups and A-Level lists are now fetched from the database via useSubjects hook

type Stream = 'sciences' | 'commercials' | 'arts';

interface CombinationAdvice {
  type: 'good' | 'warning';
  message: string;
}

// Known good combos
const GOOD_COMBOS: { subjects: string[]; message: string }[] = [
  { subjects: ['Mathematics', 'Physics', 'Chemistry'], message: '✅ Ideal for Engineering, STEM, and Science careers' },
  { subjects: ['Accounting', 'Economics', 'Business Studies'], message: '✅ Strong combination for Business, Finance, and Entrepreneurship' },
  { subjects: ['History', 'Literature in English', 'Divinity / Religious Studies'], message: '✅ Excellent for Law, Humanities, and Social Sciences' },
  { subjects: ['Mathematics', 'Physics', 'Computer Science'], message: '✅ Perfect for Computer Engineering and IT careers' },
  { subjects: ['Biology', 'Chemistry', 'Mathematics'], message: '✅ Ideal for Medicine, Pharmacy, and Health Sciences' },
  { subjects: ['Biology', 'Chemistry', 'Physics'], message: '✅ Strong for Medical and Applied Sciences' },
  { subjects: ['Accounting', 'Economics', 'Mathematics'], message: '✅ Great for Actuarial Science, Banking, and Finance' },
  { subjects: ['Geography', 'Biology', 'Chemistry'], message: '✅ Good for Environmental Science and Agriculture' },
  { subjects: ['History', 'Geography', 'English Language'], message: '✅ Solid for Teaching, Journalism, and Social Work' },
];

export function getSubjectAdvice(selected: string[], streamMap: Record<string, string>): CombinationAdvice | null {
  if (selected.length < 2) return null;

  if (selected.length === 3) {
    const sorted = [...selected].sort();
    for (const combo of GOOD_COMBOS) {
      const comboSorted = [...combo.subjects].sort();
      if (sorted.every((s, i) => s === comboSorted[i])) {
        return { type: 'good', message: combo.message };
      }
    }
  }

  const streams = selected.map(s => streamMap[s]).filter(Boolean) as Stream[];
  const uniqueStreams = new Set(streams);

  if (uniqueStreams.size === 1) {
    const stream = streams[0];
    const streamLabels: Record<Stream, string> = {
      sciences: 'STEM and Science',
      commercials: 'Business and Commerce',
      arts: 'Humanities and Arts',
    };
    return { type: 'good', message: `✅ Well-aligned combination for ${streamLabels[stream]} career paths` };
  }

  if (uniqueStreams.size === 2) {
    const streamArr = Array.from(uniqueStreams);
    const hasArts = streamArr.includes('arts');
    const hasSciences = streamArr.includes('sciences');
    const hasCommercials = streamArr.includes('commercials');

    // Sciences + Commercials is allowed
    if (hasSciences && hasCommercials) {
      return { type: 'good', message: '✅ Sciences and Commercials can be combined — versatile for STEM and Business careers' };
    }
    if (hasArts && hasSciences) {
      return { type: 'warning', message: '⚠️ Sciences and Arts cannot be combined. Please select subjects from one stream only.' };
    }
    if (hasArts && hasCommercials) {
      return { type: 'warning', message: '⚠️ Arts and Commercials cannot be combined. Please select subjects from one stream only.' };
    }
  }

  if (uniqueStreams.size >= 3) {
    return { type: 'warning', message: '⚠️ This combination includes Arts with other streams. Arts cannot be mixed with Sciences or Commercials.' };
  }

  return null;
}

export function getCareerSuggestions(selected: string[], streamMap: Record<string, string>): string[] {
  if (selected.length < 2) return [];

  const streams = selected.map(s => streamMap[s]).filter(Boolean) as Stream[];
  const uniqueStreams = new Set(streams);

  if (uniqueStreams.size === 1) {
    const stream = streams[0];
    const careers: Record<Stream, string[]> = {
      sciences: ['Engineering', 'Medicine', 'IT & Software', 'Research Science', 'Architecture'],
      commercials: ['Accounting', 'Banking', 'Entrepreneurship', 'Marketing', 'Economics'],
      arts: ['Law', 'Journalism', 'Teaching', 'Diplomacy', 'Social Work'],
    };
    return careers[stream] || [];
  }

  return ['Consider aligning subjects to a specific stream for clearer career options'];
}
