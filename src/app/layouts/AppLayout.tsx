import { Outlet } from 'react-router-dom'
import { Navbar } from '../../components/navigation/Navbar'
import { useAuth } from '../../features/auth/AuthContext'
import { Shield } from 'lucide-react'

const ROLE_WORKSPACE_LABELS: Record<string, string> = {
  student: 'Student Portal Workspace',
  faculty: 'Faculty Portal Workspace',
  officer: 'Student Organization Executive Workspace',
  adviser: 'Organization Adviser Signatory Desk',
  college_dean: 'Office of the College Dean · Signatory Desk',
  osas: 'Office of Student Affairs & Services · Signatory Desk',
  osa_staff: 'Office of Student Affairs · Signatory Desk',
  campus_director: 'Office of the Campus Director · Signatory Desk',
  university_president: 'Office of the University President · Executive Signatory',
  facility_admin: 'Facility Administration & Venue Command',
  system_admin: 'Institutional System Administration',
}

export function AppLayout() {
  const { user } = useAuth()
  const roleLabel = user ? ROLE_WORKSPACE_LABELS[user.primary_role] ?? 'Institutional Workspace' : 'Public Campus Directory'

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface)] text-[var(--ink)] font-sans">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--line)] bg-[var(--paper)] py-6 text-[var(--muted)] text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[var(--ink)] tracking-tight">ONE LSPU</span>
            <span className="text-[var(--line)]">|</span>
            <span>Institutional Facility & Activity Governance System</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[var(--line)] bg-[var(--surface)] rounded-[var(--radius)] text-[var(--ink)] font-medium">
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full"></span>
              <Shield className="w-3 h-3 text-[var(--accent)]" />
              {roleLabel}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
