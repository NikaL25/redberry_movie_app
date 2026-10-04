import { Ticket } from 'lucide-react';
import type { Session } from './data';

const LOW_SEATS = 5;

export const SessionCard = ({ session }: { session: Session }) => {
  const { time, format, language, hall, price, seatsLeft } = session;
  const soldOut = seatsLeft === 0;
  const low = seatsLeft <= LOW_SEATS;

  return (
    <button
      disabled={soldOut}
      aria-label={`${time}, ${format}, ${soldOut ? 'sold out' : `${seatsLeft} seats left`}, ₾${price}`}
      className={`w-[252px] shrink-0 rounded-2xl bg-[#1a2036] px-4 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22] ${
        soldOut ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#232a45]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">{time}</span>
        <span className="rounded-full bg-[#2a3150] px-2.5 py-1 text-xs font-medium">{format}</span>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className="text-slate-300">{language}</span>
        {soldOut ? (
          <span className="text-slate-300">Sold out</span>
        ) : (
          <span className={`flex items-center gap-1 ${low ? 'text-[#ef3a22]' : 'text-[#3ddc84]'}`}>
            <Ticket className="w-3.5 h-3.5 -rotate-45" fill="currentColor" aria-hidden="true" />
            {seatsLeft} left
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-semibold">{hall}</span>
        <span className="text-sm font-bold">₾{price}</span>
      </div>
    </button>
  );
};
