export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="feedback" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="feedback">
      <h3>{title}</h3>
      {text ? <p>{text}</p> : null}
    </div>
  )
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="banner banner-error" role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="banner-action" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  )
}
