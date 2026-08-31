import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import type { ReviewHistoryItem } from '../types/reviewer'
import { makeStyles } from '../hooks/makeStyles'

type ReviewHistoryViewProps = {
    items: ReviewHistoryItem[]
    selectedItemId: string | null
    onSelectItem: (itemId: string) => void
}

const useStyles = makeStyles((theme) => ({
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.25),
    },
    row: {
        padding: theme.spacing(1.75),
        borderRadius: theme.spacing(1.5),
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        '&:hover': {
            transform: 'translateY(-1px)',
            borderColor: theme.palette.primary.light,
        },
    },
    rowTop: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: theme.spacing(1),
    },
    selectIcon: {
        color: theme.palette.text.secondary,
        transition: 'transform 0.2s ease, color 0.2s ease',
    },
    selectIconSelected: {
        transform: 'translateX(2px)',
        color: theme.palette.primary.main,
    },
    rowSelected: {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
        backgroundColor: `${theme.palette.primary.light}1a`,
    },
    heading: {
        fontWeight: 600,
        wordBreak: 'break-word',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    },
    date: {
        color: theme.palette.text.secondary,
        fontSize: '0.86rem',
    },
    chips: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.spacing(0.75),
    },
    empty: {
        padding: theme.spacing(4),
        textAlign: 'center',
        border: `1px dashed ${theme.palette.divider}`,
        borderRadius: theme.spacing(1.5),
        backgroundColor: theme.palette.background.default,
    },
}))

function ReviewHistoryView({ items, selectedItemId, onSelectItem }: ReviewHistoryViewProps) {
    const classes = useStyles()
    const orderedItems = [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    if (orderedItems.length === 0) {
        return (
            <Paper elevation={0} className={classes.empty}>
                <Typography color="text.secondary">No reviews in history yet.</Typography>
            </Paper>
        )
    }

    return (
        <Stack className={classes.list}>
            {orderedItems.map((item) => {
                const isSelected = selectedItemId === item.id

                return (
                    <Paper
                        key={item.id}
                        elevation={0}
                        className={`${classes.row} ${isSelected ? classes.rowSelected : ''}`}
                        onClick={() => onSelectItem(item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                onSelectItem(item.id)
                            }
                        }}
                    >
                        <Stack spacing={1.5}>
                            <Box className={classes.rowTop}>
                                <Typography className={classes.heading} title={item.mergeRequestUrl}>{item.mergeRequestUrl}</Typography>
                                <ChevronRightRoundedIcon
                                    className={`${classes.selectIcon} ${isSelected ? classes.selectIconSelected : ''}`}
                                />
                            </Box>
                            <Typography className={classes.date}>
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
                )
            })}
        </Stack>
    )
}

export default ReviewHistoryView
