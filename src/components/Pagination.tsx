import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TOTAL = 10;

export const Pagination = () => {
  const [page, setPage] = useState(3);

  const pages: (number | '...')[] = [1, 2, 3, '...', TOTAL];

  const btn = 'w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22]';

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2">
      <button
        aria-label="Previous page"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        className={`${btn} bg-[#1c2238] hover:bg-[#262d48]`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="w-10 text-center text-slate-300">…</span>
        ) : (
          <button
            key={p}
            aria-current={page === p ? 'page' : undefined}
            onClick={() => setPage(p)}
            className={`${btn} ${page === p ? 'bg-[#ef3a22] font-semibold' : 'text-slate-200 hover:bg-[#1c2238]'}`}
          >
            {p}
          </button>
        )
      )}

      <button
        aria-label="Next page"
        onClick={() => setPage((p) => Math.min(TOTAL, p + 1))}
        className={`${btn} bg-[#1c2238] hover:bg-[#262d48]`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};
