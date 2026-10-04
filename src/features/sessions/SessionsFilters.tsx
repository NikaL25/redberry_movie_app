import { Checkbox } from '@/components/ui/Checkbox'
import type { FilterOptions } from '@/types/models'
import type { SessionFilters } from '@/types/api'
import { dayNumber, nextDays, weekdayShort } from '@/utils/formatters'

type Props = {
  options: FilterOptions
  filters: SessionFilters
  onChange: (patch: Partial<SessionFilters>) => void
}

export function SessionsFilters({ options, filters, onChange }: Props) {
  const dates = nextDays(7)
  const selectedVenues = options.venues.filter((venue) => filters.venues.includes(venue.slug))
  const formats = selectedVenues.length
    ? options.formats.filter((format) => selectedVenues.some((venue) => venue.formats.some((item) => item.slug === format.slug)))
    : options.formats

  const toggle = (key: keyof Pick<SessionFilters, 'venues' | 'formats' | 'languages' | 'bands'>, slug: string) => {
    const current = filters[key]
    const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
    const patch: Partial<SessionFilters> = { [key]: next }
    if (key === 'venues') {
      const venueSet = options.venues.filter((venue) => next.includes(venue.slug))
      const allowed = new Set(venueSet.flatMap((venue) => venue.formats.map((format) => format.slug)))
      patch.formats = venueSet.length ? filters.formats.filter((slug) => allowed.has(slug)) : filters.formats
    }
    onChange(patch)
  }

  const activeCount =
    filters.venues.length +
    filters.formats.length +
    filters.languages.length +
    filters.bands.length +
    (filters.search ? 1 : 0)

  return (
    <aside className="filters">
      <h2>Filters</h2>
      <fieldset>
        <legend>Venue</legend>
        {options.venues.map((venue) => (
          <Checkbox
            key={venue.slug}
            label={venue.name}
            hint={venue.city}
            checked={filters.venues.includes(venue.slug)}
            onChange={() => toggle('venues', venue.slug)}
          />
        ))}
      </fieldset>
      <hr />
      <fieldset>
        <legend>Date</legend>
        <div className="date-row">
          {dates.map((iso) => (
            <button
              key={iso}
              type="button"
              aria-pressed={filters.date === iso}
              className={filters.date === iso ? 'date-chip is-on' : 'date-chip'}
              onClick={() => onChange({ date: iso })}
            >
              {weekdayShort(iso)}
              <br />
              {dayNumber(iso)}
            </button>
          ))}
        </div>
      </fieldset>
      <hr />
      <fieldset>
        <legend>Format</legend>
        {formats.map((format) => (
          <Checkbox
            key={format.slug}
            label={format.name}
            checked={filters.formats.includes(format.slug)}
            onChange={() => toggle('formats', format.slug)}
          />
        ))}
      </fieldset>
      <hr />
      <fieldset>
        <legend>Language</legend>
        {options.languages.map((language) => (
          <Checkbox
            key={language.slug}
            label={language.name}
            checked={filters.languages.includes(language.slug)}
            onChange={() => toggle('languages', language.slug)}
          />
        ))}
      </fieldset>
      <hr />
      <fieldset>
        <legend>Time of day</legend>
        {options.timeBands.map((band) => (
          <Checkbox
            key={band.id}
            label={band.label}
            checked={filters.bands.includes(band.id)}
            onChange={() => toggle('bands', band.id)}
          />
        ))}
      </fieldset>
      <p className="filters-count">{activeCount} filters active</p>
    </aside>
  )
}
