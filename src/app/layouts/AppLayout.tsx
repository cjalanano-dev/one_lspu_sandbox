
import { Outlet } from 'react-router-dom'
import { Navbar } from '../../components/navigation/Navbar'

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[var(--ink)] font-sans">

      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar />

      <main
        id="main-content"
        className="relative flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        <Outlet />
      </main>

      <footer className="border-t border-[#627B6C]/30 bg-[#08151C]/40 backdrop-blur-md py-6 text-center text-[var(--muted)] text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">

          <p>© 2026 ONE LSPU. Unified Campus Platform.</p>

          <div className="flex items-center space-x-4">

            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#627B6C]/50 rounded-[var(--radius)] text-[#B7C29D] font-medium">
              <span className="w-1.5 h-1.5 bg-[#95A790] rounded-full shadow-[0_0_6px_rgba(149,167,144,0.7)]" />
              All systems operational
            </span>

            <span>Real data from Supabase</span>

          </div>
        </div>
      </footer>

    </div>
  )
}
