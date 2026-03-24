import { Stack, TextField } from '@mui/material'
import { makeStyles } from '../hooks/makeStyles'

type MrInputFormProps = {
    mergeRequestUrl: string
    accessToken: string
    onMergeRequestUrlChange: (value: string) => void
    onAccessTokenChange: (value: string) => void
}

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
    },
    field: {
        '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.background.default,
            borderRadius: theme.spacing(1.25),
        },
    },
    helper: {
        marginTop: theme.spacing(0.5),
    },
}))

function MrInputForm({
    mergeRequestUrl,
    accessToken,
    onMergeRequestUrlChange,
    onAccessTokenChange,
}: MrInputFormProps) {
    const classes = useStyles()

    return (
        <Stack className={classes.root}>
            <TextField
                className={classes.field}
                label="Merge Request URL"
                placeholder="https://git.example.com/group/project/-/merge_requests/123"
                value={mergeRequestUrl}
                onChange={(event) => onMergeRequestUrlChange(event.target.value)}
                fullWidth
            />
            <TextField
                className={classes.field}
                label="GitLab Personal Access Token"
                type="password"
                value={accessToken}
                onChange={(event) => onAccessTokenChange(event.target.value)}
                helperText="Token should have api scope."
                FormHelperTextProps={{ className: classes.helper }}
                fullWidth
            />
        </Stack>
    )
}

export default MrInputForm
