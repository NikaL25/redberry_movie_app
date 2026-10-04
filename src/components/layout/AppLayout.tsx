import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'

export function AppLayout({ children, overlayHeader = false }: { children: ReactNode; overlayHeader?: boolean }) {
  return (
    <div className="cinema-page">
      <Header overlay={overlayHeader} />
      {children}
      <Footer />
    </div>
  )
}
