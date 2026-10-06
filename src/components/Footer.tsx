import { Logo } from './Header'

export const Footer = () => (
  <footer className="mt-auto w-full border-t border-white/[0.06]">
    <div className="mx-auto flex w-full max-w-[1720px] items-center justify-between px-12 py-6 text-[11px] text-white/40">
      <Logo className="text-[13px]" />
      <p>© 2026 Kino XII. All rights reserved.</p>
    </div>
  </footer>
)