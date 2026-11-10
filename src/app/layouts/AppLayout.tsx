import { Outlet } from 'react-router-dom'
import { Navbar } from '../../components/navigation/Navbar'

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[var(--ink)] font-sans">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--line)] py-6 text-center text-[var(--muted)] text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ONE Facility. Unified Campus Facility Management System.</p>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-[var(--line-strong)] rounded-[var(--radius)] text-[var(--ink)] font-medium">
              <span className="w-1.5 h-1.5 bg-[var(--line-strong)] rounded-sm"></span>
              All systems operational
            </span>
            <span>Real data from Supabase</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
