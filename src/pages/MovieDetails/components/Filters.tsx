import { useState } from 'react';
import { Check } from 'lucide-react';

type Option = { label: string; hint?: string };

const VENUES: Option[] = [
  { label: 'Galleria Tbilisi', hint: 'Tbilisi' },
  { label: 'Rustaveli Palace', hint: 'Tbilisi' },
  { label: 'Vake Park', hint: 'Tbilisi' },
  { label: 'Batumi Boulevard', hint: 'Batumi' },
];
const FORMATS: Option[] = ['Standard', 'MAX', 'ATMOS', 'PANORAMA', 'MOTION'].map((label) => ({ label }));
const LANGUAGES: Option[] = ['Georgian Dub', 'Georgian Sub', 'Original + Subtitles', 'English Dub'].map((label) => ({ label }));
const TIMES: Option[] = [
  { label: 'Morning', hint: 'before 12:00' },
  { label: 'Afternoon', hint: '12:00–18:00' },
  { label: 'Evening', hint: 'after 18:00' },
];
const DATES = [
  ['Mon', 15], ['Tue', 16], ['Wed', 17], ['Thu', 18], ['Fri', 19], ['Sat', 20], ['Sun', 21],
] as const;

const SectionTitle = ({ children }: { children: string }) => (
  <h3 className="mb-3 text-xs font-medium tracking-[0.1em] text-slate-400 uppercase">{children}</h3>
);

const Divider = () => <hr className="my-6 border-white/10" />;

const CheckboxGroup = ({
  title, options, selected, onToggle,
}: { title: string; options: Option[]; selected: Set<string>; onToggle: (key: string) => void }) => (
  <fieldset>
    <legend className="contents"><SectionTitle>{title}</SectionTitle></legend>
    <div className="space-y-2.5">
      {options.map(({ label, hint }) => {
        const key = `${title}:${label}`;
        const checked = selected.has(key);
        return (
          <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
            <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => onToggle(key)} />
            <span
              className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#ef3a22] ${
                checked ? 'bg-[#ef3a22] border-[#ef3a22]' : 'border-slate-500 group-hover:border-slate-300'
              }`}
            >
              {checked && <Check className="w-3 h-3" strokeWidth={3} />}
            </span>
            <span className="text-sm font-medium">{label}</span>
            {hint && <span className="text-xs text-slate-400">· {hint}</span>}
          </label>
        );
      })}
    </div>
  </fieldset>
);

export const Filters = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [date, setDate] = useState<number | null>(null);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const activeCount = selected.size + (date !== null ? 1 : 0);

  return (
    <aside className="w-full lg:w-[320px] shrink-0 self-start rounded-2xl bg-[#1a2036] px-6 py-6">
      <h2 className="mb-6 text-lg font-bold">Filters</h2>

      <CheckboxGroup title="Venue" options={VENUES} selected={selected} onToggle={toggle} />
      <Divider />

      <SectionTitle>Date</SectionTitle>
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {DATES.map(([day, num]) => (
          <button
            key={num}
            aria-pressed={date === num}
            onClick={() => setDate(date === num ? null : num)}
            className={`shrink-0 w-[38px] rounded-md py-2 text-xs font-medium leading-5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22] ${
              date === num ? 'bg-[#ef3a22]' : 'bg-[#262d48] hover:bg-[#30385a]'
            }`}
          >
            {day}
            <br />
            {num}
          </button>
        ))}
      </div>
      <Divider />

      <CheckboxGroup title="Format" options={FORMATS} selected={selected} onToggle={toggle} />
      <Divider />
      <CheckboxGroup title="Language" options={LANGUAGES} selected={selected} onToggle={toggle} />
      <Divider />
      <CheckboxGroup title="Time of day" options={TIMES} selected={selected} onToggle={toggle} />
      <Divider />

      <p className="mt-16 text-center text-xs text-slate-400">{activeCount} filters active</p>
    </aside>
  );
};
