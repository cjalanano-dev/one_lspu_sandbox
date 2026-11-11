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
import { ProposalsListPage } from '../pages/proposals/ProposalsListPage'
import { ProposalFormPage } from '../pages/proposals/ProposalFormPage'
import { ProposalDetailPage } from '../pages/proposals/ProposalDetailPage'
import { ApprovalsInboxPage } from '../pages/proposals/ApprovalsInboxPage'
import { ProposalPrintPage } from '../pages/proposals/ProposalPrintPage'
import { VerifyProposalPage } from '../pages/proposals/VerifyProposalPage'

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
        path: 'proposals',
        element: (
          <RequireRole allowedRoles={['officer', 'adviser', 'osa_staff', 'facility_admin', 'system_admin']}>
            <ProposalsListPage />
          </RequireRole>
        ),
      },
      {
        path: 'proposals/new',
        element: (
          <RequireRole allowedRoles={['officer']}>
            <ProposalFormPage />
          </RequireRole>
        ),
      },
      {
        path: 'proposals/:id/edit',
        element: (
          <RequireRole allowedRoles={['officer']}>
            <ProposalFormPage />
          </RequireRole>
        ),
      },
      {
        path: 'proposals/:id',
        element: (
          <RequireAuth>
            <ProposalDetailPage />
          </RequireAuth>
        ),
      },
      {
        path: 'approvals',
        element: (
          <RequireRole allowedRoles={['adviser', 'osa_staff', 'facility_admin', 'system_admin']}>
            <ApprovalsInboxPage />
          </RequireRole>
        ),
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
    path: 'proposals/:id/print',
    element: (
      <RequireAuth>
        <ProposalPrintPage />
      </RequireAuth>
    ),
  },
  {
    path: 'verify/:reference',
    element: <VerifyProposalPage />,
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
