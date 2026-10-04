import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export function ModalOverlay({ open, title, onClose, children, wide }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-root" role="presentation">
      <button className="modal-backdrop" aria-label="Close dialog" onClick={onClose} />
      <div className={`modal-panel ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <button type="button" className="modal-x" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        {children}
        <div className="modal-footer-close">
          <button type="button" className="button button-dark" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
