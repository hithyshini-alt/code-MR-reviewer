import { Button, CircularProgress, Stack } from '@mui/material'
import { makeStyles } from '../hooks/makeStyles'

type ActionButtonsProps = {
    isReviewing: boolean
    isPosting: boolean
    hasFindings: boolean
    onReview: () => void
    onPostComments: () => void
}

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        gap: theme.spacing(2),
        flexDirection: 'row',
        padding: theme.spacing(2),
        borderRadius: theme.spacing(2),
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        alignItems: 'center',
        [theme.breakpoints.down('sm')]: {
            flexDirection: 'column',
            alignItems: 'stretch',
        },
    },
    button: {
        minWidth: 180,
        [theme.breakpoints.down('sm')]: {
            width: '100%',
        },
    },
}))

function ActionButtons({
    isReviewing,
    isPosting,
    hasFindings,
    onReview,
    onPostComments,
}: ActionButtonsProps) {
    const classes = useStyles()

    return (
        <Stack className={classes.root}>
            <Button
                className={classes.button}
                variant="contained"
                onClick={onReview}
                disabled={isReviewing || isPosting}
                startIcon={isReviewing ? <CircularProgress size={16} /> : undefined}
            >
                {isReviewing ? 'Reviewing...' : 'Run Review'}
            </Button>
            <Button
                className={classes.button}
                variant="outlined"
                onClick={onPostComments}
                disabled={isReviewing || isPosting || !hasFindings}
                startIcon={isPosting ? <CircularProgress size={16} /> : undefined}
            >
                {isPosting ? 'Posting...' : 'Post Comments to GitLab'}
            </Button>
        </Stack>
    )
}

export default ActionButtons
