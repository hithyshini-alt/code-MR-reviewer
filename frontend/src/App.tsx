import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import ReviewerPage from './pages/ReviewerPage'
import AuthPage from './pages/AuthPage'
import { fetchMe } from './services/auth'
import type { AuthSuccessResponse, AuthUser } from './types/auth'

const AUTH_TOKEN_STORAGE_KEY = 'mr-reviewer-auth-token'

function App() {
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isRestoringSession, setIsRestoringSession] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

      if (!storedToken) {
        setIsRestoringSession(false)
        return
      }

      try {
        const result = await fetchMe(storedToken)
        setAuthToken(storedToken)
        setCurrentUser(result.user)
      } catch {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
      } finally {
        setIsRestoringSession(false)
      }
    }

    void restoreSession()
  }, [])

  const handleAuthSuccess = (payload: AuthSuccessResponse) => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, payload.token)
    setAuthToken(payload.token)
    setCurrentUser(payload.user)
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    setAuthToken(null)
    setCurrentUser(null)
  }

  if (isRestoringSession) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Stack spacing={1.5} alignItems="center">
          <CircularProgress size={30} />
          <Typography variant="body2" color="text.secondary">
            Restoring session...
          </Typography>
        </Stack>
      </Box>
    )
  }

  if (!authToken || !currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />
  }

  return <ReviewerPage currentUser={currentUser} authToken={authToken} onLogout={handleLogout} />
}

export default App
