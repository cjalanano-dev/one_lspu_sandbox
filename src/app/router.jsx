import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { LandingPage } from '../pages/public/LandingPage'
import { CampusExplorerPage } from '../pages/user/CampusExplorerPage'
import { FacilityDetailPage } from '../pages/user/FacilityDetailPage'
import { FacilitiesDirectoryPage } from '../pages/user/FacilitiesDirectoryPage'
import { MyReservationsPage } from '../pages/user/MyReservationsPage'
import { OrganizationDashboardPage } from '../pages/organization/OrganizationDashboardPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
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
        element: <MyReservationsPage />,
      },
      {
        path: 'organization',
        element: <OrganizationDashboardPage />,
      },
      {
        path: 'admin',
        element: <AdminDashboardPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
