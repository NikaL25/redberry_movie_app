import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { SessionsList } from './components/SessionsList';
import { Pagination } from './components/Pagination';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#111833] to-[#0a0e1a] text-white font-sans">
      <Header />

      <main className="mx-auto max-w-[1728px] px-6 lg:px-[51px] pt-10 pb-24">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <p className="mt-1 text-sm text-slate-400">Browse showtimes across all venues</p>

        <div className="mt-8 flex flex-col lg:flex-row gap-12">
          <Filters />
          <section className="flex-1 min-w-0">
            <SessionsList />
            <Pagination />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
