import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '../../components/navigation/Navbar'

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ONE Facility. Unified Campus Facility Management System.</p>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              All Systems Operational
            </span>
            <span>Version 1.0 (Hackathon MVP)</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
