'use client'

import { useState } from 'react'
import { Bell, ChevronLeft, ChevronRight, Clock3, Search, Ticket } from 'lucide-react'

const films = [
  { title: 'The Odyssey', genre: 'Thriller', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=85' },
  { title: 'Spider-Man', genre: 'Action', image: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=600&q=85' },
  { title: 'Dune: Part Three', genre: 'Sci-fi', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=85' },
  { title: 'Avengers: Doomsday', genre: 'Action', image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=600&q=85' },
  { title: 'Joker', genre: 'Drama', image: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=600&q=85' },
  { title: 'Nine Red Doors', genre: 'Drama', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=85' },
]

const comingSoon = [
  { title: "The Cartographer's Wife", date: 'IN CINEMAS 2 OCTOBER', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=700&q=85' },
  { title: 'The Last Frontier', date: 'IN CINEMAS 2 OCTOBER', image: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=700&q=85' },
  { title: 'Nocturne', date: 'IN CINEMAS 2 OCTOBER', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=700&q=85' },
]

export default function Page() {
  const [slide, setSlide] = useState(0)
  const [query, setQuery] = useState('')

  return (
    <main className="cinema-page">
      <section className="hero">
        <div className="hero-overlay" />
        <nav className="nav container">
          <a className="brand" href="#top" aria-label="Kino XII home">KINO <span>XII</span></a>
          <a className="sessions" href="#now-playing">SESSIONS</a>
          <div className="nav-actions">
            <label className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search films and live events" aria-label="Search films and live events" /></label>
            <button className="button button-red" type="button">Sign up</button>
            <button className="button button-light" type="button">Log in</button>
          </div>
        </nav>
        <div className="hero-content container">
          <div className="eyebrow">PREMIERE · WEEK OF 15 SEPT</div>
          <h1>THE ODYSSEY</h1>
          <div className="meta"><span>12+</span><span><Clock3 size={14} /> 134 Min</span><span>MAX</span><span>PANORAMA</span></div>
          <p>A king spends ten years finding his way home from a war he already won, while monsters,<br className="desktop" /> gods, and his own restlessness make sure the return takes longer than the fighting did. By<br className="desktop" /> the time land comes back into view, the man arriving is not quite the one who left</p>
          <div className="hero-buttons"><button className="button button-red"><Ticket size={16} /> Buy tickets</button><button className="button button-dark">All sessions</button></div>
        </div>
        <div className="slider container"><div className="progress"><i className="active" /><i /><i /><i /></div><button aria-label="Previous slide" onClick={() => setSlide(Math.max(0, slide - 1))}><ChevronLeft /></button><button aria-label="Next slide" onClick={() => setSlide(Math.min(3, slide + 1))}><ChevronRight /></button></div>
      </section>

      <section className="section container" id="now-playing">
        <header className="section-heading"><h2>NOW PLAYING</h2><a href="#now-playing">See all</a></header>
        <div className="film-grid">{films.map((film) => <article className="film-card" key={film.title}><img src={film.image} alt={`${film.title} poster`} /><h3>{film.title}</h3><p>{film.genre} · 102 min</p><small>16+</small><footer><strong>From £14</strong><button className="button button-red">Buy Ticket</button></footer></article>)}</div>
      </section>

      <section className="section coming container"><header className="section-heading"><h2>COMING SOONываыв...</h2><a href="#coming">See all</a></header><div className="coming-grid">{comingSoon.map((film) => <article className="coming-card" key={film.title}><img src={film.image} alt="" /><div><b>{film.date}</b><h3>{film.title}</h3><p>Drama · 134 min</p><small>12+</small><button className="notify"><Bell size={14} /> Notify Me</button></div></article>)}</div></section>

      <footer className="site-footer container"><strong>KINO <span>XII</span></strong><span>© 2026 Kino XII. All rights reserved.</span></footer>
    </main>
  )
}

