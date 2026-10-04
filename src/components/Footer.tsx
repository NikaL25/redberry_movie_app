import { Logo } from './Header';

export const Footer = () => (
  <footer className="mx-6 lg:mx-[34px] border-t border-white/10 py-5 flex items-center justify-between">
    <Logo className="text-sm" />
    <p className="text-xs text-slate-400">© 2026 Kino XII. All rights reserved.</p>
  </footer>
);
