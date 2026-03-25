import { Card, CardContent, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { makeStyles } from '../hooks/makeStyles'

type SectionCardProps = {
    title: string
    children: ReactNode
}

const useStyles = makeStyles((theme) => ({
    card: {
        borderRadius: theme.spacing(2.25),
        border: `1px solid ${theme.palette.primary.light}55`,
        boxShadow: '0 18px 38px rgba(15, 23, 42, 0.08)',
        backgroundColor: '#f8fcfb',
        position: 'relative',
        overflow: 'hidden',
        animation: 'riseIn 360ms ease both',
        '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            height: 3,
            width: '100%',
            backgroundColor: '#0f766e',
        },
    },
    content: {
        padding: theme.spacing(3.25),
        '&:last-child': {
            paddingBottom: theme.spacing(3.25),
        },
    },
    title: {
        marginBottom: theme.spacing(2),
        fontWeight: 700,
        color: theme.palette.text.primary,
        letterSpacing: -0.15,
    },
}))

function SectionCard({ title, children }: SectionCardProps) {
    const classes = useStyles()

    return (
        <Card className={classes.card}>
            <CardContent className={classes.content}>
                <Typography variant="h6" className={classes.title}>
                    {title}
                </Typography>
                {children}
            </CardContent>
        </Card>
    )
}

export default SectionCard
