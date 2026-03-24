import { createTheme } from '@mui/material/styles'

const appTheme = createTheme({
    shape: {
        borderRadius: 16,
    },
    palette: {
        mode: 'light',
        primary: {
            main: '#7c3aed',
            dark: '#5b21b6',
            light: '#a78bfa',
        },
        secondary: {
            main: '#0ea5e9',
        },
        background: {
            default: '#f4f6ff',
            paper: '#ffffff',
        },
        text: {
            primary: '#18122f',
            secondary: '#625c82',
        },
    },
    typography: {
        fontFamily: 'Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        h4: {
            fontWeight: 700,
            letterSpacing: -0.2,
        },
        h6: {
            fontWeight: 600,
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    background: 'linear-gradient(180deg, #f7f8ff 0%, #f3f5ff 100%)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    border: '1px solid rgba(116, 82, 223, 0.14)',
                    boxShadow: '0 12px 30px rgba(36, 24, 92, 0.08)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    border: '1px solid rgba(116, 82, 223, 0.14)',
                    boxShadow: '0 12px 30px rgba(36, 24, 92, 0.08)',
                },
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    backgroundColor: '#fcfcff',
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
                    fontWeight: 600,
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
