import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from '../pages/Home/HomePage'
import { SessionPage } from '@/pages/Sessions/SessionPage'
import ProfilePage from '@/pages/Profile/ProfilePage'
import MovieDetailsPage from '@/pages/MovieDetails/MovieDetailsPage'
import { ProtectedRoute } from './ProtectedRoute'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sessions" element={<SessionPage />} />
      <Route path="/movies/:slug" element={<MovieDetailsPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
