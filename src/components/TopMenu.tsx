import {
    Avatar,
    Box,
    Divider,
    Stack,
    Tab,
    Tabs,
    Typography,
} from '@mui/material'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import HistoryEduRoundedIcon from '@mui/icons-material/HistoryEduRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { makeStyles } from '../hooks/makeStyles'

export type MenuKey = 'dashboard' | 'history' | 'settings'

type TopMenuProps = {
    active: MenuKey
    onChange: (key: MenuKey) => void
}

const useStyles = makeStyles((theme) => ({
    root: {
        position: 'sticky',
        top: 0,
        height: '100vh',
        width: 260,
        padding: theme.spacing(2),
        background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, #f3efff 100%)`,
        borderRight: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: theme.spacing(2),
        [theme.breakpoints.down('md')]: {
            position: 'relative',
            width: '100%',
            height: 'auto',
            borderRight: 'none',
            borderBottom: `1px solid ${theme.palette.divider}`,
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
        gap: theme.spacing(1.5),
    },
    logo: {
        background: 'linear-gradient(135deg, #7c3aed 0%, #0ea5e9 100%)',
        color: '#fff',
        width: 36,
        height: 36,
    },
    brand: {
        fontWeight: 700,
        letterSpacing: 0.4,
        fontSize: '1.1rem',
        color: theme.palette.primary.main,
    },
    tabs: {
        minHeight: theme.spacing(6),
        alignItems: 'stretch',
        '& .MuiTabs-flexContainer': {
            gap: theme.spacing(0.5),
        },
        '& .MuiTab-root': {
            textTransform: 'none',
            justifyContent: 'flex-start',
            alignItems: 'center',
            minHeight: theme.spacing(5.75),
            fontWeight: 600,
            color: theme.palette.text.secondary,
            gap: theme.spacing(0.75),
            borderRadius: theme.spacing(1.25),
            paddingInline: theme.spacing(1.25),
            transition: 'background-color 0.2s ease',
            '&:hover': {
                backgroundColor: '#f5f3ff',
            },
        },
        '& .Mui-selected': {
            color: theme.palette.primary.main,
            backgroundColor: '#efe8ff',
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
}))

function TopMenu({ active, onChange }: TopMenuProps) {
    const classes = useStyles()

    return (
        <Box className={classes.root}>
            <Stack className={classes.topSection}>
                <Stack className={classes.left} direction="row">
                    <Avatar className={classes.logo}>
                        <AutoAwesomeRoundedIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" className={classes.brand}>
                        MR · REVIEW
                    </Typography>
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
        </Box>
    )
}

export default TopMenu
