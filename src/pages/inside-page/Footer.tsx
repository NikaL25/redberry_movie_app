import { Timer } from 'lucide-react';

export const Hero = () => (
  <section className="relative h-[567px] overflow-hidden">
    <img
      src="https://csspicker.dev/api/image/?q=blue+alien+portrait&image_type=photo"
      alt=""
      className="absolute inset-0 h-full w-full object-cover blur-[3px] scale-105"
    />
    <div className="absolute inset-0 bg-[#1e4a6e]/55" />
    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0b1424]/70 to-transparent" />

    <div className="relative z-10 flex items-end gap-[34px] px-[60px] pt-[152px]">
      <div className="relative h-[374px] w-[289px] shrink-0 overflow-hidden rounded-xl shadow-2xl">
        <img
          src="https://csspicker.dev/api/image/?q=spartan+warrior+battle&image_type=photo"
          alt="The Odyssey poster"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute bottom-6 left-0 right-0 text-center font-serif text-[26px] font-bold tracking-[0.35em] text-white/70">
          THE ODYSSEY
        </span>
      </div>

      <div className="pb-[10px]">
        <span className="inline-block rounded bg-[#ff3b1f]/15 px-2 py-0.5 text-[11px] font-bold tracking-wide text-[#ff3b1f]">
          NOW PLAYING
        </span>
        <h1 className="mt-3 text-[42px] font-extrabold leading-none tracking-tight text-white">THE ODYSSEY</h1>
        <p className="mt-6 max-w-[550px] text-[14px] leading-[18px] text-white">
          While her husband maps a coast he will never sail, she keeps a second atlas of the places he leaves out, and
          it becomes the more accurate of the two.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <span className="rounded-full bg-[#ff3b1f]/15 px-3 py-1.5 text-[12px] font-bold text-[#ff3b1f]">16+</span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white">
            <Timer className="h-3 w-3" aria-hidden="true" />
            134 Min
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white">PANORAMA</span>
        </div>
      </div>
    </div>
  </section>
);
