const KinoLogo = () => (
  <div className="flex items-center gap-1 font-bold text-white tracking-tight">
    <span className="text-xl">KINO</span>
    <span className="text-red-600 text-xl">XII</span>
  </div>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ChevronDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-white font-sans">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-8">
          <KinoLogo />
          <nav className="text-sm font-medium text-gray-400 hover:text-white cursor-pointer">SESSIONS</nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <input 
              type="text" 
              placeholder="Search films and live events" 
              className="bg-[#161b22] border border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:outline-none focus:border-gray-500"
            />
            <div className="absolute left-3 top-2.5"><SearchIcon /></div>
          </div>
          <button className="text-sm font-semibold px-5 py-2 bg-red-600 rounded-full hover:bg-red-700 transition">Sign up</button>
          <button className="text-sm font-semibold px-5 py-2 bg-transparent border border-gray-700 rounded-full hover:bg-gray-800 transition">Log in</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        
        <div className="flex gap-8 border-b border-gray-800 mb-8">
          <button className="pb-4 border-b-2 border-red-600 text-sm font-medium">Personal Information</button>
          <button className="pb-4 text-gray-500 hover:text-gray-300 text-sm font-medium flex items-center gap-2">
            My Tickets 
            <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">2</span>
          </button>
        </div>

        <div className="max-w-xl space-y-6">
          {[
            { label: 'Full name', value: 'Meri Sanikidze' },
            { label: 'Email', value: 'merisanikidze@gmail.com', helper: 'Set at registration and cannot be changed' },
            { label: 'Mobile number', value: '555 123 456' }
          ].map((field) => (
            <div key={field.label} className="space-y-2">
              <label className="text-sm text-gray-400">{field.label}</label>
              <input 
                type="text" 
                defaultValue={field.value}
                className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-gray-500"
              />
              {field.helper && <p className="text-xs text-gray-500">{field.helper}</p>}
            </div>
          ))}

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Date of birth</label>
            <div className="relative">
              <input type="text" placeholder="e.g. Text" className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-gray-500" />
              <div className="absolute right-3 top-3"><CalendarIcon /></div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Preferred Venue (Optional)</label>
            <div className="relative">
              <select className="w-full appearance-none bg-[#161b22] border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-gray-500 text-gray-400">
                <option>e.g. Text</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none"><ChevronDown /></div>
            </div>
          </div>

          <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg text-sm transition mt-4">
            Save changesss
          </button>
        </div>
      </main>

      <footer className="mt-auto border-t border-gray-800 px-6 py-6 flex justify-between items-center text-gray-500 text-xs">
        <KinoLogo />
        <p>© 2026 Kino XII. All rights reserved.</p>
      </footer>
    </div>
  );
}