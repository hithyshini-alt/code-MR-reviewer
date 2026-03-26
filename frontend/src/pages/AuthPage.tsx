import { Alert, Box, Button, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { makeStyles } from '../hooks/makeStyles'
import { login, register } from '../services/auth'
import type { AuthSuccessResponse } from '../types/auth'

type AuthMode = 'login' | 'register'

type AuthPageProps = {
    onAuthSuccess: (payload: AuthSuccessResponse) => void
}

const useStyles = makeStyles((theme) => ({
    page: {
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: theme.spacing(3),
        background:
            'radial-gradient(circle at 12% 18%, rgba(15, 118, 110, 0.16) 0%, rgba(15, 118, 110, 0) 48%), radial-gradient(circle at 90% 82%, rgba(14, 116, 144, 0.18) 0%, rgba(14, 116, 144, 0) 52%), #f0faf8',
    },
    card: {
        width: '100%',
        maxWidth: 480,
        borderRadius: theme.spacing(2),
        padding: theme.spacing(3),
        border: `1px solid ${theme.palette.primary.light}66`,
        boxShadow: '0 18px 42px rgba(15, 23, 42, 0.1)',
    },
    title: {
        fontWeight: 800,
        letterSpacing: -0.5,
        marginBottom: theme.spacing(0.5),
    },
    subtitle: {
        color: theme.palette.text.secondary,
    },
    tabs: {
        marginTop: theme.spacing(1),
        '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 700,
        },
    },
    form: {
        marginTop: theme.spacing(2),
    },
    submit: {
        minHeight: 44,
        marginTop: theme.spacing(1),
    },
}))

function AuthPage({ onAuthSuccess }: AuthPageProps) {
    const classes = useStyles()

    const [mode, setMode] = useState<AuthMode>('login')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [loginIdentity, setLoginIdentity] = useState('')
    const [loginPassword, setLoginPassword] = useState('')

    const [registerEmail, setRegisterEmail] = useState('')
    const [registerUsername, setRegisterUsername] = useState('')
    const [registerPassword, setRegisterPassword] = useState('')

    const submitLabel = useMemo(
        () => (mode === 'login' ? 'Sign in' : 'Create account'),
        [mode],
    )

    const handleLogin = async () => {
        if (!loginIdentity.trim() || !loginPassword.trim()) {
            setError('Enter email/username and password.')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const result = await login({
                emailOrUsername: loginIdentity.trim(),
                password: loginPassword,
            })
            onAuthSuccess(result)
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Login failed.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRegister = async () => {
        if (!registerEmail.trim() || !registerUsername.trim() || !registerPassword.trim()) {
            setError('Email, username, and password are required.')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const result = await register({
                email: registerEmail.trim(),
                username: registerUsername.trim(),
                password: registerPassword,
            })
            onAuthSuccess(result)
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Registration failed.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const onSubmit = () => {
        if (mode === 'login') {
            void handleLogin()
            return
        }

        void handleRegister()
    }

    return (
        <Box className={classes.page}>
            <Paper className={classes.card}>
                <Typography variant="h4" className={classes.title}>
                    MR Reviewer
                </Typography>
                <Typography variant="body2" className={classes.subtitle}>
                    Sign in first. Your JWT identifies you on every request so your data stays isolated per account.
                </Typography>

                <Tabs
                    value={mode}
                    onChange={(_event, value: AuthMode) => {
                        setMode(value)
                        setError('')
                    }}
                    className={classes.tabs}
                >
                    <Tab value="login" label="Login" />
                    <Tab value="register" label="Register" />
                </Tabs>

                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                <Stack spacing={1.5} className={classes.form}>
                    {mode === 'login' ? (
                        <>
                            <TextField
                                label="Email or username"
                                value={loginIdentity}
                                onChange={(event) => setLoginIdentity(event.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="Password"
                                type="password"
                                value={loginPassword}
                                onChange={(event) => setLoginPassword(event.target.value)}
                                fullWidth
                            />
                        </>
                    ) : (
                        <>
                            <TextField
                                label="Email"
                                type="email"
                                value={registerEmail}
                                onChange={(event) => setRegisterEmail(event.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="Username"
                                value={registerUsername}
                                onChange={(event) => setRegisterUsername(event.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="Password"
                                type="password"
                                helperText="Use at least 8 characters"
                                value={registerPassword}
                                onChange={(event) => setRegisterPassword(event.target.value)}
                                fullWidth
                            />
                        </>
                    )}

                    <Button
                        variant="contained"
                        onClick={onSubmit}
                        className={classes.submit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Please wait...' : submitLabel}
                    </Button>
                </Stack>
            </Paper>
        </Box>
    )
}

export default AuthPage
