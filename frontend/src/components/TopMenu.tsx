import {
    Avatar,
    Box,
    Button,
    Divider,
    IconButton,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from '@mui/material'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import HistoryEduRoundedIcon from '@mui/icons-material/HistoryEduRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { makeStyles } from '../hooks/makeStyles'

export type MenuKey = 'dashboard' | 'history' | 'settings'

type TopMenuProps = {
    active: MenuKey
    onChange: (key: MenuKey) => void
    currentUser: {
        email: string
        username: string
    }
    onLogout: () => void
    onCollapse?: () => void
}

const useStyles = makeStyles((theme) => ({
    root: {
        position: 'sticky',
        top: 0,
        height: '100vh',
        width: 272,
        padding: theme.spacing(2.25),
        backgroundColor: '#f0faf8',
        borderRight: `1px solid ${theme.palette.primary.light}66`,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: theme.spacing(2),
        boxShadow: 'inset -1px 0 0 rgba(15, 118, 110, 0.1)',
        [theme.breakpoints.down('md')]: {
            position: 'relative',
            width: '100%',
            height: 'auto',
            borderRight: 'none',
            borderBottom: `1px solid ${theme.palette.primary.light}66`,
            padding: theme.spacing(1.5),
        },
    },
    topSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
    },
    left: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing(1.5),
    },
    brandWrap: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.5),
    },
    logo: {
        backgroundColor: '#0f766e',
        color: '#fff',
        width: 40,
        height: 40,
        boxShadow: '0 8px 18px rgba(15, 118, 110, 0.24)',
    },
    brand: {
        fontWeight: 700,
        letterSpacing: 0.5,
        fontSize: '1.02rem',
        color: theme.palette.primary.main,
        textTransform: 'uppercase',
    },
    closeButton: {
        border: `1px solid ${theme.palette.primary.light}88`,
        backgroundColor: '#eaf8f4',
        color: theme.palette.primary.main,
        '&:hover': {
            backgroundColor: '#d8f1ea',
        },
        [theme.breakpoints.down('md')]: {
            display: 'none',
        },
    },
    tabs: {
        minHeight: theme.spacing(6),
        alignItems: 'stretch',
        '& .MuiTabs-flexContainer': {
            gap: theme.spacing(0.75),
        },
        '& .MuiTab-root': {
            textTransform: 'none',
            justifyContent: 'flex-start',
            alignItems: 'center',
            minHeight: theme.spacing(5.75),
            fontWeight: 600,
            color: theme.palette.text.secondary,
            gap: theme.spacing(0.75),
            borderRadius: theme.spacing(1.5),
            paddingInline: theme.spacing(1.5),
            transition: 'background-color 0.2s ease, transform 0.2s ease, color 0.2s ease',
            '&:hover': {
                transform: 'translateX(2px)',
                backgroundColor: 'rgba(20, 184, 166, 0.12)',
            },
        },
        '& .Mui-selected': {
            color: theme.palette.primary.main,
            backgroundColor: 'rgba(20, 184, 166, 0.18)',
        },
        '& .MuiTabs-indicator': {
            left: 0,
            width: 3,
            borderRadius: 6,
            backgroundColor: theme.palette.primary.main,
        },
        [theme.breakpoints.down('md')]: {
            '& .MuiTabs-flexContainer': {
                flexDirection: 'row',
            },
            '& .MuiTab-root': {
                minHeight: theme.spacing(5),
            },
            '& .MuiTabs-indicator': {
                left: 'auto',
                width: 'auto',
                height: 3,
            },
        },
    },
    bottomSection: {
        borderTop: `1px solid ${theme.palette.primary.light}55`,
        paddingTop: theme.spacing(1.5),
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(0.75),
    },
    userLabel: {
        fontWeight: 700,
        color: theme.palette.text.primary,
    },
    userMeta: {
        color: theme.palette.text.secondary,
        fontSize: '0.8rem',
    },
    logoutButton: {
        justifyContent: 'flex-start',
    },
}))

function TopMenu({ active, onChange, currentUser, onLogout, onCollapse }: TopMenuProps) {
    const classes = useStyles()

    return (
        <Box className={classes.root}>
            <Stack className={classes.topSection}>
                <Stack className={classes.left} direction="row">
                    <Box className={classes.brandWrap}>
                        <Avatar className={classes.logo}>
                            <AutoAwesomeRoundedIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="h6" className={classes.brand}>
                            MR · REVIEW
                        </Typography>
                    </Box>
                    {onCollapse && (
                        <Tooltip title="Close sidebar">
                            <IconButton
                                size="small"
                                className={classes.closeButton}
                                onClick={onCollapse}
                                aria-label="Close sidebar"
                            >
                                <CloseRoundedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>

                <Divider />

                <Tabs
                    orientation="vertical"
                    value={active}
                    onChange={(_event, value: MenuKey) => onChange(value)}
                    className={classes.tabs}
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab value="dashboard" icon={<BoltRoundedIcon fontSize="small" />} iconPosition="start" label="Dashboard" />
                    <Tab value="history" icon={<HistoryEduRoundedIcon fontSize="small" />} iconPosition="start" label="History" />
                    <Tab value="settings" icon={<SettingsRoundedIcon fontSize="small" />} iconPosition="start" label="Settings" />
                </Tabs>
            </Stack>

            <Box className={classes.bottomSection}>
                <Typography className={classes.userLabel}>{currentUser.username}</Typography>
                <Typography className={classes.userMeta}>{currentUser.email}</Typography>
                <Button variant="text" color="inherit" onClick={onLogout} className={classes.logoutButton}>
                    Log out
                </Button>
            </Box>
        </Box>
    )
}

export default TopMenu
