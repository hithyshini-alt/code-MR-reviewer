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
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
        backgroundColor: theme.palette.background.paper,
    },
    content: {
        padding: theme.spacing(3),
        '&:last-child': {
            paddingBottom: theme.spacing(3),
        },
    },
    title: {
        marginBottom: theme.spacing(2),
        fontWeight: 600,
        color: theme.palette.text.primary,
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
