import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { User, UserRole } from '../../types'

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isStudent: boolean
  isOfficer: boolean
  isAdviser: boolean
  isDean: boolean
  isOsa: boolean
  isCampusDirector: boolean
  isUnivPresident: boolean
  isApprover: boolean
  isAdmin: boolean
  isSystemAdmin: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch profile from Supabase
  const fetchProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !data) return null

      return {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        avatar_url: data.avatar_url ?? undefined,
        primary_role: data.primary_role as UserRole,
        account_status: data.account_status,
        department: data.department ?? undefined,
        student_or_employee_id: data.student_or_employee_id ?? undefined,
        organization_id: data.organization_id ?? undefined,
        organization_role: data.organization_role ?? undefined,
      }
    } catch {
      return null
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!error && session?.user) {
        const profile = await fetchProfile(session.user.id)
        setCurrentUser(profile)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const profile = await fetchProfile(session.user.id)
            setCurrentUser(profile)
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null)
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
  }

  const value: AuthContextType = {
    user: currentUser,
    signIn,
    signOut,
    isStudent: currentUser?.primary_role === 'student',
    isOfficer: currentUser?.primary_role === 'officer',
    isAdviser: currentUser?.primary_role === 'adviser',
    isDean: currentUser?.primary_role === 'college_dean',
    isOsa: currentUser?.primary_role === 'osas' || currentUser?.primary_role === 'osa_staff',
    isCampusDirector: currentUser?.primary_role === 'campus_director',
    isUnivPresident: currentUser?.primary_role === 'university_president',
    isApprover:
      currentUser?.primary_role === 'adviser' ||
      currentUser?.primary_role === 'college_dean' ||
      currentUser?.primary_role === 'osas' ||
      currentUser?.primary_role === 'osa_staff' ||
      currentUser?.primary_role === 'campus_director' ||
      currentUser?.primary_role === 'university_president' ||
      currentUser?.primary_role === 'facility_admin' ||
      currentUser?.primary_role === 'system_admin',
    isAdmin:
      currentUser?.primary_role === 'facility_admin' ||
      currentUser?.primary_role === 'system_admin',
    isSystemAdmin: currentUser?.primary_role === 'system_admin',
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
