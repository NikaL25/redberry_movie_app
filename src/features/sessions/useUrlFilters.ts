import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toIsoDate } from '@/utils/formatters'
import type { SessionFilters } from '@/types/api'

const DEFAULT_SORT = 'time_asc'
const DEFAULT_PAGE = 1

const VALID_SORTS = new Set([
  'time_asc',
  'time_desc',
  'price_asc',
  'price_desc',
  'title_asc',
])

function csvOrArray(
  params: URLSearchParams,
  csvKey: string,
  arrayKey: string,
): string[] {
  const csv = params.get(csvKey)

  if (csv) {
    return csv
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return params
    .getAll(arrayKey)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parsePage(value: string | null): number {
  if (!value) {
    return DEFAULT_PAGE
  }

  const page = Number(value)

  if (!Number.isInteger(page) || page < 1) {
    return DEFAULT_PAGE
  }

  return page
}

function parseSort(value: string | null): string {
  if (!value || !VALID_SORTS.has(value)) {
    return DEFAULT_SORT
  }

  return value
}

function hasOwnProperty<T extends object>(
  object: T,
  key: PropertyKey,
): key is keyof T {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function serializeFilters(filters: SessionFilters): URLSearchParams {
  const params = new URLSearchParams()

  /*
   * Date всегда сохраняем в URL.
   *
   * Это важно, потому что по ТЗ после refresh/copy URL
   * выбранная дата должна восстановиться.
   */
  if (filters.date) {
    params.set('date', filters.date)
  }

  /*
   * Search не является обязательным параметром из ТЗ,
   * но он уже присутствует в текущем Sessions UI,
   * поэтому сохраняем его как часть URL state.
   */
  if (filters.search.trim()) {
    params.set('search', filters.search.trim())
  }

  /*
   * Sort является частью URL state.
   */
  if (filters.sort && filters.sort !== DEFAULT_SORT) {
    params.set('sort', filters.sort)
  }

  /*
   * Первую страницу специально не записываем.
   *
   * URL:
   * /sessions?date=2026-11-14
   *
   * вместо:
   * /sessions?date=2026-11-14&page=1
   */
  if (filters.page > DEFAULT_PAGE) {
    params.set('page', String(filters.page))
  }

  /*
   * Множественные фильтры хранятся CSV-строкой.
   *
   * Например:
   * venue=galleria,batumi
   * format=max,atmos
   */
  if (filters.venues.length > 0) {
    params.set('venue', filters.venues.join(','))
  }

  if (filters.formats.length > 0) {
    params.set('format', filters.formats.join(','))
  }

  if (filters.languages.length > 0) {
    params.set('language', filters.languages.join(','))
  }

  if (filters.bands.length > 0) {
    params.set('band', filters.bands.join(','))
  }

  return params
}

export function useUrlFilters(): [
  SessionFilters,
  (patch: Partial<SessionFilters>) => void,
] {
  const [params, setParams] = useSearchParams()

  const filters = useMemo<SessionFilters>(() => {
    const today = toIsoDate(new Date())

    return {
      date: params.get('date') ?? today,

      search: params.get('search') ?? '',

      sort: parseSort(params.get('sort')),

      page: parsePage(params.get('page')),

      venues: csvOrArray(params, 'venue', 'venues[]'),

      formats: csvOrArray(params, 'format', 'formats[]'),

      languages: csvOrArray(
        params,
        'language',
        'languages[]',
      ),

      bands: csvOrArray(
        params,
        'band',
        'bands[]',
      ),
    }
  }, [params])

  const update = useCallback(
    (patch: Partial<SessionFilters>) => {
      /*
       * Берём текущее состояние из URL-derived state.
       */
      const next: SessionFilters = {
        ...filters,
        ...patch,
      }

      /*
       * По ТЗ:
       *
       * при изменении любого фильтра или сортировки
       * необходимо вернуться на страницу №1.
       *
       * Проверяем наличие свойства через hasOwnProperty,
       * а не через:
       *
       * if (patch.search)
       *
       * потому что:
       *
       * patch.search === ''
       *
       * тоже является изменением фильтра.
       */
      const filterOrSortChanged =
        hasOwnProperty(patch, 'venues') ||
        hasOwnProperty(patch, 'formats') ||
        hasOwnProperty(patch, 'languages') ||
        hasOwnProperty(patch, 'bands') ||
        hasOwnProperty(patch, 'date') ||
        hasOwnProperty(patch, 'search') ||
        hasOwnProperty(patch, 'sort')

      if (filterOrSortChanged) {
        next.page = DEFAULT_PAGE
      }

      /*
       * Если пользователь явно меняет страницу,
       * используем переданную page.
       *
       * Например:
       * onChange({ page: 3 })
       */
      if (hasOwnProperty(patch, 'page') && !filterOrSortChanged) {
        next.page = patch.page ?? DEFAULT_PAGE
      }

      /*
       * Защита от некорректного page.
       */
      if (!Number.isInteger(next.page) || next.page < DEFAULT_PAGE) {
        next.page = DEFAULT_PAGE
      }

      /*
       * Защита от неизвестного sort.
       */
      if (!VALID_SORTS.has(next.sort)) {
        next.sort = DEFAULT_SORT
      }

      /*
       * Создаём новый URL.
       *
       * setSearchParams() без replace означает PUSH в browser history.
       *
       * Поэтому:
       *
       * фильтр A
       * -> фильтр B
       * -> фильтр C
       *
       * затем Back:
       * C -> B -> A
       *
       * что соответствует ТЗ.
       */
      const nextParams = serializeFilters(next)

      setParams(nextParams)
    },
    [filters, setParams],
  )

  return [filters, update]
}
