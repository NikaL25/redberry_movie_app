export type Session = {
  time: string;
  format: string;
  language: string;
  hall: string;
  price: number;
  seatsLeft: number; // 0 = sold out
};

export type Movie = {
  id: string;
  title: string;
  rating: string;
  duration: number;
  poster: string;
  sessions: Session[];
};

const s = (time: string, format: string, seatsLeft: number): Session => ({
  time,
  format,
  seatsLeft,
  language: 'Original + Subtitles',
  hall: 'Galleria Tbilisi · Hall D',
  price: 22,
});

const poster = (q: string) => `https://csspicker.dev/api/image/?q=${q}&image_type=photo`;

export const MOVIES: Movie[] = [
  {
    id: 'odyssey',
    title: 'The Odyssey',
    rating: '12+',
    duration: 134,
    poster: poster('greek+warrior'),
    sessions: [s('10:15', 'Standart', 21), s('14:00', 'MAX', 1), s('16:30', 'PANORAMA', 45), s('19:15', 'PANORAMA', 25), s('21:15', 'PANORAMA', 12)],
  },
  {
    id: 'avengers',
    title: 'Avengers: Doomsday',
    rating: '12+',
    duration: 134,
    poster: poster('superhero+team'),
    sessions: [s('10:15', 'PANORAMA', 3), s('14:00', 'MAX', 31), s('16:30', 'Standart', 0), s('19:15', 'Standart', 17), s('22:30', 'PANORAMA', 0)],
  },
  {
    id: 'spiderman',
    title: 'Spider-Man',
    rating: '12+',
    duration: 134,
    poster: poster('spider+hero'),
    sessions: [s('10:15', 'Standart', 33), s('14:00', 'MAX', 0), s('16:30', 'MAX', 45), s('19:15', 'Standart', 23)],
  },
  {
    id: 'dune',
    title: 'Dune: Part Three',
    rating: '12+',
    duration: 134,
    poster: poster('desert+dunes'),
    sessions: [s('10:15', 'PANORAMA', 12), s('14:00', 'MAX', 5), s('16:30', 'Standart', 30), s('19:15', 'Standart', 15), s('21:15', 'Standart', 0)],
  },
];
