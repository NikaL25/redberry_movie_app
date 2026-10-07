import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTickets } from './profileQueries'
import { refundOrder } from './profileApi'
import { EmptyState, ErrorBanner, Spinner } from '@/components/feedback/Status'
import { formatGel, formatPaidAt } from '@/utils/formatters'
import { queryKeys } from '@/app/queryClient'
import { parseApiError } from '@/utils/errorHandling'
import type { Order } from '@/types/models'

const LABEL = 'mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#696f86]'

function SegmentTab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b1d] ${
        active ? 'bg-[#292c3d] text-white shadow-sm' : 'text-[#6c7186] hover:text-slate-300'
      }`}
    >
      <span>{label}</span>
      {count !== undefined ? (
        <span className={`text-xs font-bold ${active ? 'text-slate-300' : 'text-[#6c7186]'}`}>{count}</span>
      ) : null}
    </button>
  )
}

export function TicketsPanel() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const upcoming = useTickets('upcoming')
  const past = useTickets('past')
  const active = tab === 'upcoming' ? upcoming : past
  const queryClient = useQueryClient()
  const refund = useMutation({
    mutationFn: refundOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tickets('upcoming') })
      void queryClient.invalidateQueries({ queryKey: queryKeys.tickets('past') })
    },
  })

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center rounded-[14px] bg-[#191a27] p-1">
        <SegmentTab
          active={tab === 'upcoming'}
          label="Upcoming"
          count={upcoming.data?.length}
          onClick={() => setTab('upcoming')}
        />
        <SegmentTab
          active={tab === 'past'}
          label="Past"
          count={past.data?.length}
          onClick={() => setTab('past')}
        />
      </div>

      {active.isLoading ? <Spinner label="Loading tickets" /> : null}
      {active.isError ? (
        <ErrorBanner message={parseApiError(active.error).message} onRetry={() => void active.refetch()} />
      ) : null}
      {active.data && active.data.length === 0 ? (
        <EmptyState title={tab === 'upcoming' ? 'No upcoming tickets' : 'No past tickets'} />
      ) : null}

      <div className="space-y-6">
        {active.data?.map((order) => (
          <TicketCard
            key={order.id}
            order={order}
            onRefund={() => {
              if (window.confirm(`Refund order ${order.reference}? This cannot be undone.`)) {
                refund.mutate(order.reference)
              }
            }}
            refunding={refund.isPending}
            refundError={
              refund.error && refund.variables === order.reference ? parseApiError(refund.error).message : null
            }
          />
        ))}
      </div>
    </div>
  )
}

function TicketCard({
  order,
  onRefund,
  refunding,
  refundError,
}: {
  order: Order
  onRefund: () => void
  refunding: boolean
  refundError: string | null
}) {
  const { session } = order
  const movie = session.movie
  const poster = movie.posterUrl

  return (
    <article className="flex flex-col items-stretch overflow-hidden rounded-[28px] border border-[#1f2235]/40 bg-[#171926] shadow-xl xl:flex-row">
      {/* Левая часть: постер и информация */}
      <div className="flex flex-1 flex-col items-start gap-6 p-6 md:flex-row md:items-center lg:gap-8 lg:p-7">
        <div className="relative h-[134px] w-[96px] flex-shrink-0 overflow-hidden rounded-[14px] border border-white/5 bg-[#0d0c14] shadow-md">
          {poster ? (
            <img src={poster} alt={`${movie.title} poster`} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-[#3a1b14] via-[#1a1725] to-[#0d0c14]" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-black uppercase tracking-wide text-white lg:text-[22px]">
              {movie.title}
            </h3>
            <span className="inline-flex items-center justify-center rounded-full bg-[#431920] px-2 py-0.5 text-xs font-bold leading-tight text-[#f55959]">
              {movie.ageRating.code}
            </span>
            <span className="text-sm font-medium text-[#737890]">{movie.runtimeMinutes} min</span>
          </div>

          <div className="grid grid-cols-1 gap-6 pt-0.5 sm:grid-cols-3 lg:gap-10">
            <div>
              <div className={LABEL}>Date</div>
              <div className="whitespace-nowrap text-[15px] font-bold text-white">
                {session.date} <span className="text-slate-300">·</span> {session.time}
              </div>
            </div>

            <div>
              <div className={LABEL}>Venue</div>
              <div className="whitespace-nowrap text-[15px] font-bold text-white">
                {session.venue.name} <span className="text-slate-300">·</span> Hall {session.hall.name}
              </div>
            </div>

            <div>
              <div className={LABEL}>Format</div>
              <div className="whitespace-nowrap text-[15px] font-bold text-white">
                {session.format.name} <span className="text-slate-300">·</span> {session.language.name}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
            <span className="mr-1.5 text-[11px] font-bold uppercase tracking-wider text-[#696f86]">Seats</span>
            {order.tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center gap-1 rounded-[8px] bg-[#252839] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2e3247]"
                title={formatGel(ticket.price)}
              >
                <span className="font-semibold">{ticket.seatCode}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-200">{ticket.ticketType.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Правая часть: заказ и возврат */}
      <div className="flex w-full flex-shrink-0 flex-col justify-between border-t border-dashed border-[#292c3f]/80 bg-[#171926] p-6 lg:p-7 xl:w-[340px] xl:border-l xl:border-t-0">
        <div>
          <div className={LABEL}>Order</div>
          <div className="text-sm font-bold tracking-wide text-white">{order.reference}</div>
          <div className="mt-1 text-[11px] font-medium text-[#6c7287]">
            {order.status} · {formatPaidAt(order.paidAt)}
          </div>
        </div>

        <div className="mt-5 space-y-3 xl:mt-0">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-[#737890]">Total paid</span>
            <span className="text-2xl font-extrabold text-white lg:text-[26px]">
              {formatGel(order.totalPrice)}
            </span>
          </div>

          {order.isUpcoming ? (
            <>
              <button
                type="button"
                disabled={!order.isRefundable || refunding}
                title={order.isRefundable ? 'Refund this order' : 'Refunds close 2 hours before the session starts'}
                onClick={onRefund}
                className="w-full rounded-[12px] bg-[#2b2f42] px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-[#373b52] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b1d] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              >
                {refunding ? 'Refunding…' : 'Refund'}
              </button>

              <p className="text-center text-[11px] font-medium text-[#6c7287]">
                {order.isRefundable
                  ? 'Refundable until 2 hours before the session'
                  : 'Refunds are closed for this session'}
              </p>
            </>
          ) : null}

          {refundError ? (
            <p role="alert" className="text-center text-xs text-[#ff6b5a]">
              {refundError}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}