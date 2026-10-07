import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
  /** Без рамки, фона, X и кнопки Close: окно рисует содержимое само (бронирование). */
  bare?: boolean
}

export function ModalOverlay({ open, title, onClose, children, wide, bare }: Props) {
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

  const panelClass = bare
    ? 'relative z-10 m-auto w-[min(1440px,calc(100vw-32px))] max-h-[calc(100vh-32px)] overflow-y-auto rounded-[32px] [scrollbar-width:none]'
    : `modal-panel ${wide ? 'modal-wide' : ''}`

  return (
    <div className="modal-root" role="presentation">
      <button className="modal-backdrop" aria-label="Close dialog" onClick={onClose} />
      <div className={panelClass} role="dialog" aria-modal="true" aria-label={title}>
        {!bare ? (
          <button type="button" className="modal-x" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        ) : null}
        {children}
        {!bare ? (
          <div className="modal-footer-close">
            <button type="button" className="button button-dark" onClick={onClose}>
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}