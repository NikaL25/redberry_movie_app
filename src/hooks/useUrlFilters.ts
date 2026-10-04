import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toIsoDate } from '@/utils/formatters'
import type { SessionFilters } from '@/types/api'

function csvOrArray(params: URLSearchParams, csvKey: string, arrayKey: string) {
  const csv = params.get(csvKey)
  if (csv) return csv.split(',').map((item) => item.trim()).filter(Boolean)
  return params.getAll(arrayKey)
}

export function useUrlFilters(): [SessionFilters, (patch: Partial<SessionFilters>) => void] {
  const [params, setParams] = useSearchParams()

  const filters = useMemo<SessionFilters>(
    () => ({
      date: params.get('date') ?? toIsoDate(new Date()),
      search: params.get('search') ?? '',
      sort: params.get('sort') ?? 'time_asc',
      page: Number(params.get('page') || '1') || 1,
      venues: csvOrArray(params, 'venue', 'venues[]'),
      formats: csvOrArray(params, 'format', 'formats[]'),
      languages: csvOrArray(params, 'language', 'languages[]'),
      bands: csvOrArray(params, 'band', 'bands[]'),
    }),
    [params],
  )

  const update = useCallback(
    (patch: Partial<SessionFilters>) => {
      const next: SessionFilters = { ...filters, ...patch }
      if (
        patch.venues ||
        patch.formats ||
        patch.languages ||
        patch.bands ||
        patch.date ||
        patch.search ||
        patch.sort
      ) {
        next.page = patch.page ?? 1
      }
      const search = new URLSearchParams()
      if (next.date) search.set('date', next.date)
      if (next.search) search.set('search', next.search)
      if (next.sort) search.set('sort', next.sort)
      if (next.page > 1) search.set('page', String(next.page))
      if (next.venues.length) search.set('venue', next.venues.join(','))
      if (next.formats.length) search.set('format', next.formats.join(','))
      if (next.languages.length) search.set('language', next.languages.join(','))
      if (next.bands.length) search.set('band', next.bands.join(','))
      setParams(search)
    },
    [filters, setParams],
  )

  return [filters, update]
}
