import { Box, Checkbox, FormControlLabel, Stack, TextField } from '@mui/material'
import { makeStyles } from '../hooks/makeStyles'
import type { ReviewRule, RuleId } from '../types/reviewer'

type RuleListProps = {
    rules: ReviewRule[]
    onRuleToggle: (ruleId: RuleId, enabled: boolean) => void
    onRuleCommentChange: (ruleId: RuleId, comment: string) => void
}

const useStyles = makeStyles((theme) => ({
    stack: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
    },
    row: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.25),
        padding: theme.spacing(1.75),
        borderRadius: theme.spacing(1.5),
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
        transition: 'border-color 0.2s ease, transform 0.2s ease',
        '&:hover': {
            borderColor: theme.palette.primary.light,
            transform: 'translateY(-1px)',
        },
    },
    field: {
        '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.background.paper,
        },
    },
}))

function RuleList({ rules, onRuleToggle, onRuleCommentChange }: RuleListProps) {
    const classes = useStyles()

    return (
        <Stack className={classes.stack}>
            {rules.map((rule) => (
                <Box key={rule.id} className={classes.row}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={rule.enabled}
                                onChange={(event) => onRuleToggle(rule.id, event.target.checked)}
                            />
                        }
                        label={rule.title}
                    />
                    <TextField
                        className={classes.field}
                        label="Comment to post"
                        value={rule.comment}
                        onChange={(event) => onRuleCommentChange(rule.id, event.target.value)}
                        disabled={!rule.enabled}
                        fullWidth
                        size="small"
                    />
                </Box>
            ))}
        </Stack>
    )
}

export default RuleList
