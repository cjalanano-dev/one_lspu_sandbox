import React, { createContext, useContext, useEffect, useState } from 'react'
import { dataStore } from '../../lib/dataStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => dataStore.getCurrentUser())
  const [allUsers, setAllUsers] = useState(() => dataStore.getAllUsers())

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(dataStore.getCurrentUser())
    }
    window.addEventListener('onefacility_auth_changed', handleAuthChange)
    return () => window.removeEventListener('onefacility_auth_changed', handleAuthChange)
  }, [])

  const switchUser = (userId) => {
    const target = allUsers.find((u) => u.id === userId)
    if (target) {
      dataStore.setCurrentUser(target)
      setCurrentUser(target)
    }
  }

  const value = {
    user: currentUser,
    allUsers,
    switchUser,
    isStudent: currentUser?.primary_role === 'student',
    isOfficer: currentUser?.primary_role === 'officer',
    isAdmin: currentUser?.primary_role === 'facility_admin' || currentUser?.primary_role === 'system_admin',
    isSystemAdmin: currentUser?.primary_role === 'system_admin',
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
