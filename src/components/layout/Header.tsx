import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Check, ChevronDown, LogOut, Ticket, User } from 'lucide-react'

import { SearchTypeahead } from '@/features/movies/SearchTypeahead'
import { useAuth } from '@/features/auth/useAuth'
import { openAuthModal, setReplay } from '@/features/auth/authSlice'

/**
 * Основная сетка проекта:
 *
 * 1920px viewport
 * ├── 60px
 * ├── 1800px content
 * └── 60px
 */
export const PAGE_WIDTH = 'mx-auto w-full max-w-[1800px]'

export function Logo({ className = 'text-[19px]' }: { className?: string }) {
  return (
    <span className={`font-black tracking-wider text-white ${className}`}>
      KINO <span className="text-[#e63920]">XII</span>
    </span>
  )
}

function nameParts(fullName: string | null | undefined, username: string) {
  const parts = (fullName?.trim() || username).split(/\s+/).filter(Boolean)
  const first = parts[0] ?? ''
  const initials = `${first[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()

  return { first, initials }
}

function Avatar({
  src,
  initials,
  size,
  dot,
  dotComplete,
}: {
  src?: string | null
  initials: string
  size: number
  dot?: boolean
  dotComplete?: boolean
}) {
  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full rounded-xl object-cover"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center rounded-xl border border-white/10 bg-[#1f2937] font-bold tracking-tight text-white/90"
          style={{ fontSize: size > 44 ? 16 : 13 }}
        >
          {initials}
        </span>
      )}

      {dot ? (
        <i
          className={`absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-[#0b101b] ${
            dotComplete ? 'bg-[#22c55e]' : 'bg-[#f97316]'
          }`}
        />
      ) : null}
    </span>
  )
}

export function Header({ overlay = false }: { overlay?: boolean }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { user, isAuthenticated, signOut } = useAuth()

  const [open, setOpen] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const goProfile = () => {
    setOpen(false)

    if (!isAuthenticated) {
      dispatch(setReplay({ type: 'profile' }))
      dispatch(openAuthModal('login'))
      return
    }

    navigate('/profile')
  }

  const goTickets = () => {
    setOpen(false)

    if (!isAuthenticated) {
      dispatch(setReplay({ type: 'tickets' }))
      dispatch(openAuthModal('login'))
      return
    }

    navigate('/profile?tab=tickets')
  }

 const onLogout = () => {
  setOpen(false)
  void signOut()
}


  const parts = user
    ? nameParts(user.fullName, user.username)
    : null

  const menuItem =
    'flex w-full items-center gap-3.5 rounded-xl px-2 py-2.5 text-left text-[14.5px] font-semibold tracking-tight text-white transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e63920]'

  return (
    <header
      className={
        overlay
          ? 'absolute inset-x-0 top-0 z-50 bg-gradient-to-b from-[#070a11]/70 to-transparent'
          : 'relative z-50 border-b border-white/[0.04] bg-[#070a11]'
      }
    >
      <div
        className={`flex h-[72px] items-center justify-between gap-6 ${PAGE_WIDTH}`}
      >
        {/* Лого + Sessions */}
        <div className="flex shrink-0 items-center gap-9">
          <Link
            to="/"
            aria-label="Kino XII home"
            className="select-none"
          >
            <Logo />
          </Link>

          <NavLink
            to="/sessions"
            className={({ isActive }) =>
              `text-[12px] font-semibold uppercase tracking-[0.14em] transition ${
                isActive
                  ? 'text-white'
                  : 'text-white/70 hover:text-white'
              }`
            }
          >
            SESSIONS
          </NavLink>
        </div>

        {/* Поиск */}
        <div className="ml-auto mr-8 h-[41px] w-[390px] shrink-0">
          <SearchTypeahead />
        </div>

        {/* Действия */}
        <div className="flex shrink-0 items-center gap-3">
          {isAuthenticated && user && parts ? (
            <div ref={rootRef} className="relative">
              <button
                type="button"
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpen((value) => !value)}
                className="flex items-center gap-2.5 rounded-xl p-1 pr-2 transition hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e63920]"
              >
                <Avatar
                  src={user.avatar}
                  initials={parts.initials}
                  size={40}
                  dot
                  dotComplete={user.profileComplete}
                />

                <span className="text-[13px] font-medium text-white/90">
                  {parts.first}
                </span>

                <ChevronDown
                  className={`h-3.5 w-3.5 text-white/50 transition-transform ${
                    open ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {open ? (
                <div
                  id={menuId}
                  role="menu"
                  className="absolute right-0 top-[calc(100%+12px)] z-50 w-[330px] rounded-[28px] border border-[#131b2c]/60 bg-[#070b13] p-5 shadow-2xl"
                >
                  <div className="mb-5 flex items-center gap-3.5 px-1">
                    <Avatar
                      src={user.avatar}
                      initials={parts.initials}
                      size={52}
                      dot
                      dotComplete={user.profileComplete}
                    />

                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold leading-snug tracking-tight text-white">
                        {user.fullName || user.username}
                      </p>

                      <p className="truncate text-[13px] leading-normal tracking-tight text-[#6d7990]">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {user.profileComplete ? (
                    <div className="mb-5 flex items-center justify-between rounded-[14px] bg-[#0d231e]/90 px-4 py-2.5">
                      <span className="text-[14px] font-semibold tracking-tight text-[#2bd67b]">
                        Profile Complete
                      </span>

                      <Check
                        className="h-4 w-4 text-[#2bd67b]"
                        strokeWidth={2.8}
                        aria-hidden="true"
                      />
                    </div>
                  ) : (
                    <div className="mb-5 rounded-[14px] bg-[#2a1d12]/90 px-4 py-3">
                      <p className="text-[14px] font-semibold tracking-tight text-[#f97316]">
                        Profile incomplete
                      </p>

                      <p className="mt-0.5 text-[12.5px] leading-snug text-[#c9a27d]">
                        Please complete your profile to enable booking
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col space-y-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={goProfile}
                      className={menuItem}
                    >
                      <User
                        className="h-[18px] w-[18px]"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      My Profile
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={goTickets}
                      className={menuItem}
                    >
                      <Ticket
                        className="h-[19px] w-[19px] -rotate-12"
                        fill="currentColor"
                        aria-hidden="true"
                      />
                      My Tickets
                    </button>
                  </div>

                  <div className="mx-1 my-2.5 border-t border-[#131b29]" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={onLogout}
                    className="flex w-full items-center gap-3.5 rounded-xl px-2 py-2.5 text-left text-[14.5px] font-bold tracking-tight text-[#e83e29] transition-colors hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e83e29]"
                  >
                    <LogOut
                      className="h-[18px] w-[18px]"
                      strokeWidth={2.2}
                      aria-hidden="true"
                    />
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  dispatch(openAuthModal('register'))
                }
                className="h-[38px] rounded-full bg-[#ff3b19] px-5 text-[13px] font-semibold text-white shadow-sm transition duration-200 hover:bg-[#ff4e2d] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Sign Up
              </button>

              <button
                type="button"
                onClick={() =>
                  dispatch(openAuthModal('login'))
                }
                className="h-[38px] rounded-full bg-white px-5 text-[13px] font-semibold text-[#0d1017] shadow-sm transition duration-200 hover:bg-[#f1f3f7] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e63920]"
              >
                Log In
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
