import { Search } from 'lucide-react';

export const Header = () => (
  <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-[60px] pt-[30px]">
    <div className="flex items-center gap-9">
      <a href="#" className="text-[19px] font-extrabold tracking-wide text-white">
        KINO <span className="text-[#ff3b1f]">XII</span>
      </a>
      <a href="#" className="text-[12px] font-semibold tracking-[0.12em] text-white hover:text-white/80">
        SESSIONS
      </a>
    </div>
    <div className="flex items-center gap-3">
      <label className="relative flex h-[41px] w-[380px] items-center rounded-full bg-white/10 px-3 backdrop-blur-md">
        <Search className="h-3.5 w-3.5 text-white/90" aria-hidden="true" />
        <span className="sr-only">Search</span>
        <input
          type="search"
          placeholder="Search films and live events"
          className="ml-2 w-full bg-transparent text-[14px] text-white placeholder:text-white/90 focus:outline-none"
        />
      </label>
      <button className="ml-5 h-[41px] rounded-full bg-[#ef2d12] px-5 text-[14px] font-bold text-white hover:bg-[#ff3b1f]">
        Sign up
      </button>
      <button className="h-[41px] rounded-full bg-white px-5 text-[14px] font-bold text-[#0a0f1f] hover:bg-white/90">
        Log in
      </button>
    </div>
  </header>
);
