import { Check } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
  hint?: string
}

export function Checkbox({ label, hint, checked, ...props }: Props) {
  return (
    <label className="check-row">
      <input type="checkbox" className="peer sr-only" checked={checked} {...props} />
      <span className={`check-box ${checked ? 'is-on' : ''}`}>{checked ? <Check className="w-3 h-3" strokeWidth={3} /> : null}</span>
      <span className="check-label">{label}</span>
      {hint ? <span className="check-hint">· {hint}</span> : null}
    </label>
  )
}
