import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { RequireAuth, RequireRole, RedirectIfAuthed } from './guards/RequireAuth'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { LandingPage } from '../pages/public/LandingPage'
import { LoginPage } from '../pages/public/LoginPage'
import { RegisterPage } from '../pages/public/RegisterPage'
import { UnauthorizedPage } from '../pages/public/UnauthorizedPage'
import { NotFoundPage } from '../pages/public/NotFoundPage'
import { CampusExplorerPage } from '../pages/user/CampusExplorerPage'
import { FacilityDetailPage } from '../pages/user/FacilityDetailPage'
import { FacilitiesDirectoryPage } from '../pages/user/FacilitiesDirectoryPage'
import { MyReservationsPage } from '../pages/user/MyReservationsPage'
import { OrganizationDashboardPage } from '../pages/organization/OrganizationDashboardPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <AppLayout />
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'explorer',
        element: <CampusExplorerPage />,
      },
      {
        path: 'facilities',
        element: <FacilitiesDirectoryPage />,
      },
      {
        path: 'facilities/:id',
        element: <FacilityDetailPage />,
      },
      {
        path: 'my-reservations',
        element: (
          <RequireAuth>
            <MyReservationsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'organization',
        element: (
          <RequireRole allowedRoles={['officer']}>
            <OrganizationDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin',
        element: (
          <RequireRole allowedRoles={['facility_admin', 'system_admin']}>
            <AdminDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: 'login',
    element: (
      <RedirectIfAuthed>
        <LoginPage />
      </RedirectIfAuthed>
    ),
  },
  {
    path: 'register',
    element: (
      <RedirectIfAuthed>
        <RegisterPage />
      </RedirectIfAuthed>
    ),
  },
  {
    path: 'unauthorized',
    element: <UnauthorizedPage />,
  },
])
