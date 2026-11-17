import { useCallback, useEffect, useState } from 'react'

export function useAuth() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [clientId, setClientIdState] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => {
    window.cozy.auth.isLoggedIn().then(setLoggedIn)
    window.cozy.auth.getClientId().then(setClientIdState)
    return window.cozy.auth.onChanged(setLoggedIn)
  }, [])

  const saveClientId = useCallback(async (id: string) => {
    await window.cozy.auth.setClientId(id)
    setClientIdState(id)
  }, [])

  const login = useCallback(async () => {
    setError(null)
    setLoggingIn(true)
    try {
      await window.cozy.auth.login()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoggingIn(false)
    }
  }, [])

  const logout = useCallback(() => window.cozy.auth.logout(), [])

  return { loggedIn, clientId, saveClientId, login, logout, loggingIn, error }
}
