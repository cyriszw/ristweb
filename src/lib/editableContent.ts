export interface EditableKey {
  key: string;
  label: string;
  hint?: string;
  multiline?: boolean;
}

export interface EditableGroup {
  group: string;
  keys: EditableKey[];
}

/** Registry of site_content keys the quick editor exposes, grouped by page. */
export const EDITABLE_GROUPS: EditableGroup[] = [
  {
    group: 'Footer (all pages)',
    keys: [
      { key: 'footer_school_name', label: 'School name', hint: 'Shown next to the crest in the footer' },
      { key: 'footer_tagline', label: 'Footer tagline', hint: 'Short paragraph under the school name', multiline: true },
      { key: 'footer_address', label: 'Address' },
      { key: 'footer_phone', label: 'Phone number' },
      { key: 'footer_email', label: 'Email address' },
    ],
  },
  {
    group: 'Homepage',
    keys: [
      { key: 'homepage_motto', label: 'Hero motto', hint: 'Tagline under the hero heading', multiline: true },
      { key: 'homepage_intro', label: 'Intro paragraph', hint: 'Text block below the hero', multiline: true },
    ],
  },
  {
    group: 'Pages',
    keys: [
      { key: 'about_text', label: 'About page text', multiline: true },
      { key: 'academics_intro', label: 'Academics intro', multiline: true },
      { key: 'admissions_info', label: 'Admissions info', multiline: true },
      { key: 'fees_intro', label: 'Fees page intro', multiline: true },
      { key: 'clubs_intro', label: 'Clubs intro', multiline: true },
      { key: 'sports_intro', label: 'Sports intro', multiline: true },
      { key: 'gallery_intro', label: 'Gallery intro', multiline: true },
      { key: 'news_intro', label: 'News intro', multiline: true },
      { key: 'contact_info', label: 'Contact page info', multiline: true },
    ],
  },
];

export const ALL_EDITABLE_KEYS = EDITABLE_GROUPS.flatMap(g => g.keys.map(k => k.key));

export const FOOTER_DEFAULTS = {
  footer_school_name: 'Marist Brothers High School',
  footer_tagline:
    'Scientia et Virtus — Empowering young minds through knowledge and virtue since our founding. A proud member of the Marist Brothers educational tradition.',
  footer_address: 'Dete, Hwange District, Zimbabwe',
  footer_phone: '+263 XX XXX XXXX',
  footer_email: 'info@maristdete.ac.zw',
};
