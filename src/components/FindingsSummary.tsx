import { Alert, Chip, Stack, Typography } from '@mui/material'
import { makeStyles } from '../hooks/makeStyles'
import type { BuiltInFindingsSummary, Finding } from '../types/reviewer'

type FindingsSummaryProps = {
    findings: Finding[]
    summary: BuiltInFindingsSummary
}

const useStyles = makeStyles((theme) => ({
    chips: {
        display: 'flex',
        gap: theme.spacing(1),
        flexWrap: 'wrap',
    },
    chip: {
        borderRadius: theme.spacing(1),
        backgroundColor: theme.palette.background.default,
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.5),
    },
    finding: {
        borderRadius: theme.spacing(1.5),
        border: `1px solid ${theme.palette.warning.light}`,
        '& code': {
            fontFamily: 'Consolas, monospace',
            background: theme.palette.background.default,
            padding: theme.spacing(0.25, 0.75),
            borderRadius: theme.spacing(0.75),
        },
    },
}))

function FindingsSummary({ findings, summary }: FindingsSummaryProps) {
    const classes = useStyles()

    return (
        <Stack spacing={2}>
            <Stack className={classes.chips} direction="row">
                <Chip className={classes.chip} label={`No sx: ${summary.noSx}`} />
                <Chip className={classes.chip} label={`No deprecated tags: ${summary.noDeprecatedTags}`} />
                <Chip className={classes.chip} label={`Optional chaining: ${summary.optionalChaining}`} />
                <Chip className={classes.chip} label={`Custom: ${summary.custom}`} />
            </Stack>

            {findings.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No findings yet.
                </Typography>
            ) : (
                <Stack className={classes.list}>
                    {findings.map((finding, index) => (
                        <Alert
                            severity="warning"
                            className={classes.finding}
                            key={`${finding.ruleId}-${finding.filePath}-${index}`}
                        >
                            <strong>{finding.comment}</strong>
                            <br />
                            File: {finding.filePath}
                            <br />
                            Line: {finding.lineNumber ?? 'N/A'}
                            <br />
                            Code: <code>{finding.snippet.trim()}</code>
                        </Alert>
                    ))}
                </Stack>
            )}
        </Stack>
    )
}

export default FindingsSummary
