import { createTheme } from '@mui/material/styles'

const appTheme = createTheme({
    shape: {
        borderRadius: 18,
    },
    palette: {
        mode: 'light',
        primary: {
            main: '#0f766e',
            dark: '#115e59',
            light: '#5eead4',
        },
        secondary: {
            main: '#f97316',
            dark: '#c2410c',
            light: '#fdba74',
        },
        background: {
            default: '#eef6f5',
            paper: '#f8fcfb',
        },
        text: {
            primary: '#0f172a',
            secondary: '#334155',
        },
    },
    typography: {
        fontFamily: 'Space Grotesk, Segoe UI, Helvetica, Arial, sans-serif',
        h4: {
            fontWeight: 700,
            letterSpacing: -0.35,
        },
        h6: {
            fontWeight: 700,
            letterSpacing: -0.2,
        },
        button: {
            fontWeight: 700,
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    background:
                        'radial-gradient(circle at 6% 6%, rgba(94, 234, 212, 0.28), transparent 32%), radial-gradient(circle at 88% 12%, rgba(251, 146, 60, 0.2), transparent 38%), linear-gradient(180deg, #f8fdfc 0%, #eef6f5 100%)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    border: '1px solid rgba(15, 118, 110, 0.16)',
                    boxShadow: '0 14px 34px rgba(15, 23, 42, 0.08)',
                    backdropFilter: 'blur(3px)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    border: '1px solid rgba(15, 118, 110, 0.16)',
                    boxShadow: '0 14px 34px rgba(15, 23, 42, 0.08)',
                },
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 14,
                    textTransform: 'none',
                    fontWeight: 700,
                    letterSpacing: 0.1,
                },
                containedPrimary: {
                    backgroundColor: '#0f766e',
                    '&:hover': {
                        backgroundColor: '#115e59',
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 14,
                    backgroundColor: '#fbfffe',
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 999,
                    fontWeight: 700,
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    height: 4,
                    borderRadius: 999,
                },
            },
        },
    },
})

export default appTheme
