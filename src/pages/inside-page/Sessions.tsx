const rows = [
  ['DIRECTOR', 'Elene Kapanadze'],
  ['MAIN CAST', 'David Merabishvili, Ana Lomidze, Giorgi Tskhadadze, Mariam Beridze'],
  ['DURATION', '109 minutes'],
  ['RELEASE DATE', '4 September 2026'],
  ['FORMATS', 'MAX, MOTION, ATMOS'],
  ['FROM', '₾16'],
];

export const Details = () => (
  <aside className="w-[390px]">
    <h2 className="text-[20px] font-bold text-white">Details</h2>
    <dl className="mt-3 space-y-[14px]">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[12px] font-medium text-white/70">{k}</dt>
          <dd className="mt-1 text-[14px] font-semibold leading-[15px] text-white">{v}</dd>
        </div>
      ))}
    </dl>
    <div className="mt-4 rounded-lg bg-[#1f1a1d] px-[13px] py-[10px]">
      <p className="text-[12px] font-semibold text-[#ff8a1f]">RATING NOTE</p>
      <div className="mt-1 flex gap-2 text-[11px] leading-[16px] text-[#ff8a1f]">
        <span className="font-bold">16+</span>
        <span>Not recommended for under-16s. Tickets require an account aged 16 or over.</span>
      </div>
    </div>
  </aside>
);
