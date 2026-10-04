type SessionTicketProps = {
  time: string
  lang: string
  format: string
  price: number
  seats: number
}

export function SessionTicket({ time, lang, format, price, seats }: SessionTicketProps) {
  return (
    <button
      type="button"
      className="rounded-2xl bg-[#1a1d2b] px-3 py-2 text-left text-white transition hover:bg-[#23293c]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-lg font-bold">{time}</span>
        <span className="rounded-full bg-[#2d3245] px-2 py-1 text-[10px] font-semibold text-slate-200">{format}</span>
      </div>
      <div className="mt-2 text-[10px] text-slate-300">{lang}</div>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">{seats} left</span>
        <span className="font-bold text-[#f2f2f2]">₾{price}</span>
      </div>
    </button>
  )
}

