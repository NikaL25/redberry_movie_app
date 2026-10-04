import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
  valid?: boolean
}

export function Input({ label, error, hint, id, className, valid, ...props }: Props) {
  const inputId = id ?? props.name ?? 'input'
  const errorId = `${inputId}-error`
  return (
    <label className="field" htmlFor={inputId}>
      {label ? <span className="field-label">{label}</span> : null}
      <span className="field-control">
        <input
          id={inputId}
          className={cn(
            'field-input',
            error && 'is-invalid',
            valid && !error && 'is-valid',
            className,
          )}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={error ? errorId : props['aria-describedby']}
          {...props}
        />
        {valid && !error ? <span className="field-check" aria-hidden="true">✓</span> : null}
      </span>
      {error ? <span id={errorId} className="field-error" role="alert">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}
