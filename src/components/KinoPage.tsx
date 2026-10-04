const KinoPage = () => {
  const sessions = [
    { day: 'Mon', date: '15' },
    { day: 'Tue', date: '16' },
    { day: 'Wed', date: '17' },
    { day: 'Thu', date: '18' },
    { day: 'Fri', date: '19' },
    { day: 'Sat', date: '20' },
    { day: 'Sun', date: '21' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white font-sans">
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold tracking-tighter">KINO <span className="text-red-600">XII</span></h1>
          <nav className="text-sm font-medium text-gray-400">SESSIONS</nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search films and live events" 
              className="bg-[#1a1d24] border border-gray-700 rounded-full py-2 px-4 pl-10 w-64 text-sm focus:outline-none focus:border-red-600"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <button className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-full text-sm font-semibold">Sign up</button>
          <button className="bg-[#1a1d24] hover:bg-[#252a33] px-6 py-2 rounded-full text-sm font-semibold">Log in</button>
        </div>
      </header>

      <main className="px-8 py-8">
        <section className="relative rounded-2xl overflow-hidden mb-12 h-[400px]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c10] via-[#0a0c10]/80 to-transparent z-10" />
          <img src="https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=2000" alt="Hero background" className="absolute inset-0 w-full h-full object-cover" />
          <div className="relative z-20 flex items-center gap-8 p-12 h-full">
            <img src="https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=400" alt="The Odyssey Poster" className="w-64 h-96 rounded-xl shadow-2xl object-cover" />
            <div className="max-w-2xl">
              <span className="text-red-500 text-xs font-bold tracking-widest uppercase mb-2 block">Now Playing</span>
              <h2 className="text-6xl font-extrabold mb-4">THE ODYSSEY</h2>
              <p className="text-gray-300 text-lg mb-6">While her husband maps a coast he will never sail, she keeps a second atlas of the places he leaves out, and it becomes the more accurate of the two.</p>
              <div className="flex gap-3">
                <span className="bg-white/10 px-3 py-1 rounded text-sm font-bold">16+</span>
                <span className="bg-white/10 px-3 py-1 rounded text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M12 6v6l4 2" strokeWidth="2"/></svg>
                  134 Min
                </span>
                <span className="bg-white/10 px-3 py-1 rounded text-sm">PANORAMA</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-6">Sessions <span className="text-gray-500 text-sm font-normal">22 sessions over the next seven days</span></h3>
            <div className="flex gap-2 mb-8">
              {sessions.map((s, i) => (
                <button key={i} className={`flex flex-col items-center p-4 rounded-xl w-16 ${i === 0 ? 'bg-red-600' : 'bg-[#1a1d24]'}`}>
                  <span className="text-xs font-bold">{s.day}</span>
                  <span className="text-xl font-bold">{s.date}</span>
                </button>
              ))}
            </div>

            {['Galleria Tbilisi', 'Vake Park'].map((loc) => (
              <div key={loc} className="mb-8">
                <h4 className="text-lg font-semibold mb-4">{loc}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1a1d24] p-6 rounded-2xl">
                    <p className="font-bold mb-4">Hall A</p>
                    <div className="flex gap-4">
                      <button className="bg-[#252a33] hover:bg-[#2f3642] px-6 py-3 rounded-xl flex flex-col items-center">
                        <span className="text-xl font-bold">12:00</span>
                        <span className="text-[10px] text-gray-400">ENG • MAX</span>
                      </button>
                      <div className="bg-[#0a0c10] px-4 py-3 rounded-xl flex flex-col items-center justify-center border border-gray-800">
                        <span className="text-red-500 font-bold">₾ 16</span>
                        <span className="text-[10px] text-gray-500">45 left</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="bg-[#1a1d24] p-8 rounded-2xl h-fit">
            <h3 className="text-xl font-bold mb-6">Details</h3>
            <div className="space-y-6">
              <div><p className="text-gray-500 text-sm">Director</p><p>Elene Kapanadze</p></div>
              <div><p className="text-gray-500 text-sm">Main cast</p><p>David Merabishvili, Ana Lomidze, Giorgi Tskhadadze, Mariam Beridze</p></div>
              <div><p className="text-gray-500 text-sm">Duration</p><p>109 minutes</p></div>
              <div><p className="text-gray-500 text-sm">Release date</p><p>4 September 2026</p></div>
              <div><p className="text-gray-500 text-sm">Formats</p><p>MAX, MOTION, ATMOS</p></div>
              <div><p className="text-gray-500 text-sm">From</p><p className="text-xl font-bold">₾16</p></div>
              <div className="bg-[#252a33] p-4 rounded-lg border-l-4 border-red-600">
                <p className="text-xs font-bold mb-1">RATING NOTE</p>
                <p className="text-xs text-gray-400">16+ Not recommended for under-16s. Tickets require an account aged 16 or over.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="px-8 py-8 border-t border-gray-800 text-sm text-gray-500 flex justify-between">
        <p>KINO XII</p>
        <p>© 2026 Kino XII. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default KinoPage;