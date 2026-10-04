import { Search } from 'lucide-react';

export const Logo = ({ className = '' }: { className?: string }) => (
  <a href="#" className={`font-extrabold tracking-wide ${className}`}>
    KINO <span className="text-[#ef3a22]">XII</span>
  </a>
);

export const Header = () => {
  return (
    <header className="mx-auto max-w-[1728px] flex items-center gap-10 px-6 lg:px-[60px] py-[30px]">
      <Logo className="text-lg" />
      <nav>
        <a href="#" className="text-xs font-semibold tracking-[0.12em] text-white hover:text-[#ef3a22]">
          SESSIONS
        </a>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <label className="hidden md:flex items-center gap-2 w-[380px] rounded-full bg-[#1c2238] px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#ef3a22]">
          <Search className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search films and live events"
            placeholder="Search films and live events"
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-200 outline-none"
          />
        </label>
        <button className="ml-5 rounded-full bg-[#ef3a22] px-5 py-2.5 text-sm font-bold hover:bg-[#d72f19] focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
          Sign up
        </button>
        <button className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0a0e1a] hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22]">
          Log in
        </button>
      </div>
    </header>
  );
};
