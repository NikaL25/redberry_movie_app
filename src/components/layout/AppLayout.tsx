import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'

export function AppLayout({ children, overlayHeader = false }: { children: ReactNode; overlayHeader?: boolean }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#070a11] font-sans text-white">
      <Header overlay={overlayHeader} />
      {children}
      <Footer />
    </div>
  )
}