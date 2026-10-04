export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://api.kinoxii.redberryinternship.ge/api'

export const endpoints = {
  register: '/register',
  login: '/login',
  logout: '/logout',
  me: '/me',
  profile: '/profile',
  filterOptions: '/filter-options',
  search: '/search',
  nowPlaying: '/movies/now-playing',
  comingSoon: '/movies/coming-soon',
  featured: '/movies/featured',
  movie: (slug: string) => `/movies/${slug}`,
  movieSessions: (slug: string) => `/movies/${slug}/sessions`,
  notify: (slug: string) => `/movies/${slug}/notify`,
  sessions: '/sessions',
  session: (id: number) => `/sessions/${id}`,
  seats: (id: number) => `/sessions/${id}/seats`,
  holds: (id: number) => `/sessions/${id}/holds`,
  hold: (holdId: string) => `/holds/${holdId}`,
  orders: '/orders',
  refund: (reference: string) => `/orders/${reference}/refund`,
  tickets: '/tickets',
} as const
