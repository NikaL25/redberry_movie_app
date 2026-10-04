import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTickets } from './profileQueries'
import { refundOrder } from './profileApi'
import { EmptyState, ErrorBanner, Spinner } from '@/components/feedback/Status'
import { Button } from '@/components/ui/Button'
import { formatGel, formatPaidAt } from '@/utils/formatters'
import { queryKeys } from '@/app/queryClient'
import { parseApiError } from '@/utils/errorHandling'
import type { Order } from '@/types/models'

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
    <div>
      <div className="ticket-tabs">
        <button type="button" className={tab === 'upcoming' ? 'is-active' : ''} onClick={() => setTab('upcoming')}>
          Upcoming
        </button>
        <button type="button" className={tab === 'past' ? 'is-active' : ''} onClick={() => setTab('past')}>
          Past
        </button>
      </div>
      {active.isLoading ? <Spinner label="Loading tickets" /> : null}
      {active.isError ? <ErrorBanner message={parseApiError(active.error).message} onRetry={() => void active.refetch()} /> : null}
      {active.data && active.data.length === 0 ? (
        <EmptyState title={tab === 'upcoming' ? 'No upcoming tickets' : 'No past tickets'} />
      ) : null}
      <div className="ticket-list">
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
            refundError={refund.error && refund.variables === order.reference ? parseApiError(refund.error).message : null}
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
  return (
    <article className="ticket-card">
      <header>
        <h3>{order.session.movie.title}</h3>
        <span>{order.reference}</span>
      </header>
      <p>
        {order.session.venue.name} · {order.session.date} {order.session.time} · Hall {order.session.hall.name}
      </p>
      <ul>
        {order.tickets.map((ticket) => (
          <li key={ticket.id}>
            {ticket.seatCode} · {ticket.ticketType.name} · {formatGel(ticket.price)}
          </li>
        ))}
      </ul>
      <footer>
        <span>
          {formatGel(order.totalPrice)} · {order.status} · {formatPaidAt(order.paidAt)}
        </span>
        {order.isUpcoming ? (
          <Button
            variant="dark"
            disabled={!order.isRefundable || refunding}
            title={order.isRefundable ? 'Refund this order' : 'Refunds close 2 hours before the session starts'}
            onClick={onRefund}
          >
            Refund
          </Button>
        ) : null}
      </footer>
      {refundError ? <p className="field-error">{refundError}</p> : null}
    </article>
  )
}
