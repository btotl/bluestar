import { createHashRouter, RouterProvider } from 'react-router-dom'
import { BirthPage } from './pages/BirthPage'
import { CertificatePage } from './pages/CertificatePage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'

// Hash routing so the app can be served from anything, including an ESP32's
// flash filesystem, without server-side rewrites.
const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/birth', element: <BirthPage /> },
  { path: '/furby/:id', element: <ProfilePage /> },
  { path: '/furby/:id/certificate', element: <CertificatePage /> },
  { path: '/furby/:id/settings', element: <SettingsPage /> },
  { path: '*', element: <HomePage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
