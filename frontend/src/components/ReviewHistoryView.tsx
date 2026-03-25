import { Chip, Paper, Stack, Typography } from '@mui/material'
import type { ReviewHistoryItem } from '../types/reviewer'
import { makeStyles } from '../hooks/makeStyles'

type ReviewHistoryViewProps = {
    items: ReviewHistoryItem[]
}

const useStyles = makeStyles((theme) => ({
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
    },
    row: {
        padding: theme.spacing(2.25),
        borderRadius: theme.spacing(1.5),
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        '&:hover': {
            transform: 'translateY(-1px)',
            borderColor: theme.palette.primary.light,
        },
    },
    heading: {
        fontWeight: 600,
        wordBreak: 'break-word',
    },
    chips: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.spacing(1),
    },
    empty: {
        padding: theme.spacing(4),
        textAlign: 'center',
        border: `1px dashed ${theme.palette.divider}`,
        borderRadius: theme.spacing(1.5),
        backgroundColor: theme.palette.background.default,
    },
}))

function ReviewHistoryView({ items }: ReviewHistoryViewProps) {
    const classes = useStyles()

    if (items.length === 0) {
        return (
            <Paper elevation={0} className={classes.empty}>
                <Typography color="text.secondary">No reviews in history yet.</Typography>
            </Paper>
        )
    }

    return (
        <Stack className={classes.list}>
            {items.map((item) => (
                <Paper key={item.id} elevation={0} className={classes.row}>
                    <Stack spacing={1.5}>
                        <Typography className={classes.heading}>{item.mergeRequestUrl}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {new Date(item.createdAt).toLocaleString()}
                        </Typography>
                        <Stack className={classes.chips} direction="row">
                            <Chip label={`Total: ${item.totalFindings}`} size="small" />
                            <Chip label={`No sx: ${item.summary.noSx}`} size="small" />
                            <Chip label={`Deprecated: ${item.summary.noDeprecatedTags}`} size="small" />
                            <Chip label={`Optional chaining: ${item.summary.optionalChaining}`} size="small" />
                            <Chip label={`Custom: ${item.summary.custom}`} size="small" />
                        </Stack>
                    </Stack>
                </Paper>
            ))}
        </Stack>
    )
}

export default ReviewHistoryView
