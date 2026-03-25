import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    FormControlLabel,
    IconButton,
    MenuItem,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { useState } from 'react'
import { makeStyles } from '../hooks/makeStyles'
import type { ReviewRule, RuleSeverity } from '../types/reviewer'

type SettingsViewProps = {
    saveHistory: boolean
    saveCredentials: boolean
    rules: ReviewRule[]
    onSaveHistoryChange: (value: boolean) => void
    onSaveCredentialsChange: (value: boolean) => void
    onRuleAdd: (rule: {
        title: string
        pattern: string
        comment: string
        severity: RuleSeverity
    }) => void
    onRuleUpdate: (
        ruleId: string,
        updates: Partial<Pick<ReviewRule, 'title' | 'comment' | 'severity' | 'enabled' | 'pattern'>>,
    ) => void
    onRuleDelete: (ruleId: string) => void
}

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
    },
    note: {
        maxWidth: '60ch',
    },
    row: {
        padding: theme.spacing(1.75),
        borderRadius: theme.spacing(1.5),
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
    },
    rowTitle: {
        fontWeight: 700,
        marginBottom: theme.spacing(0.5),
    },
    rulesSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.5),
    },
    rulesAccordion: {
        borderRadius: `${theme.spacing(1.5)} !important`,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
        boxShadow: 'none',
        '&::before': {
            display: 'none',
        },
    },
    rulesHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing(1),
        flexWrap: 'wrap',
    },
    ruleRow: {
        padding: theme.spacing(1.5),
        borderRadius: theme.spacing(1.5),
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: '#fbfffe',
    },
    ruleHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing(1),
        flexWrap: 'wrap',
    },
    inlineActions: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
    },
    ruleMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: theme.spacing(1.5),
        [theme.breakpoints.down('sm')]: {
            gridTemplateColumns: '1fr',
        },
    },
    full: {
        gridColumn: '1 / -1',
    },
    addButton: {
        alignSelf: 'flex-start',
    },
    sectionTitle: {
        fontWeight: 700,
        marginBottom: theme.spacing(1.5),
    },
    saveButton: {
        marginTop: theme.spacing(1.5),
    },
    patternText: {
        fontFamily: 'monospace',
    },
}))

function SettingsView({
    saveHistory,
    saveCredentials,
    rules,
    onSaveHistoryChange,
    onSaveCredentialsChange,
    onRuleAdd,
    onRuleUpdate,
    onRuleDelete,
}: SettingsViewProps) {
    const classes = useStyles()
    const [adding, setAdding] = useState(false)
    const [newRuleTitle, setNewRuleTitle] = useState('')
    const [newRulePattern, setNewRulePattern] = useState('')
    const [newRuleComment, setNewRuleComment] = useState('Custom rule violated.')
    const [newRuleSeverity, setNewRuleSeverity] = useState<RuleSeverity>('warning')
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null)

    const resetAddForm = () => {
        setNewRuleTitle('')
        setNewRulePattern('')
        setNewRuleComment('Custom rule violated.')
        setNewRuleSeverity('warning')
    }

    const submitAddRule = () => {
        if (!newRuleTitle.trim() || !newRulePattern.trim()) {
            return
        }

        onRuleAdd({
            title: newRuleTitle.trim(),
            pattern: newRulePattern.trim(),
            comment: newRuleComment.trim() || 'Custom rule violated.',
            severity: newRuleSeverity,
        })

        resetAddForm()
        setAdding(false)
    }

    return (
        <Stack className={classes.root}>
            <Typography variant="body2" color="text.secondary" className={classes.note}>
                Configure how this frontend stores and displays your local review data.
            </Typography>

            <Stack className={classes.row}>
                <Typography variant="subtitle2" className={classes.rowTitle}>
                    Save Credentials
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={saveCredentials}
                            onChange={(event) => onSaveCredentialsChange(event.target.checked)}
                        />
                    }
                    label="Save Personal Access Token in browser"
                />
                <Typography variant="body2" color="text.secondary">
                    When enabled, your PAT is stored locally so you do not need to enter it every time.
                </Typography>
            </Stack>

            <Stack className={classes.rulesSection}>
                <Accordion defaultExpanded className={classes.rulesAccordion}>
                    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                        <Typography variant="h6">Review Rules ({rules.length})</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box className={classes.rulesHeader}>
                            <Typography variant="body2" color="text.secondary">
                                Configure built-in and custom rules.
                            </Typography>
                            <Button
                                startIcon={<AddRoundedIcon />}
                                variant="outlined"
                                className={classes.addButton}
                                onClick={() => setAdding((previous) => !previous)}
                            >
                                {adding ? 'Cancel' : 'Add Rule'}
                            </Button>
                        </Box>

                        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                            {rules.map((rule) => {
                                const isEditing = editingRuleId === rule.id

                                return (
                                    <Box key={rule.id} className={classes.ruleRow}>
                                        <Box className={classes.ruleHeader}>
                                            <Box>
                                                <Typography variant="subtitle1" className={classes.sectionTitle}>
                                                    {rule.title}
                                                </Typography>
                                                <Box className={classes.ruleMeta}>
                                                    <Chip
                                                        size="small"
                                                        label={rule.severity}
                                                        color={
                                                            rule.severity === 'error'
                                                                ? 'error'
                                                                : rule.severity === 'info'
                                                                    ? 'info'
                                                                    : 'warning'
                                                        }
                                                    />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {rule.enabled ? 'ON' : 'OFF'}
                                                    </Typography>
                                                    {rule.matcherType === 'builtin' && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            Built-in
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box className={classes.inlineActions}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setEditingRuleId(isEditing ? null : rule.id)}
                                                >
                                                    <EditRoundedIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => onRuleDelete(rule.id)}>
                                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={rule.enabled}
                                                        onChange={(event) =>
                                                            onRuleUpdate(rule.id, { enabled: event.target.checked })
                                                        }
                                                    />
                                                }
                                                label="Enabled"
                                            />

                                            {isEditing ? (
                                                <Stack spacing={1.25}>
                                                    <TextField
                                                        size="small"
                                                        label="Rule title"
                                                        value={rule.title}
                                                        onChange={(event) =>
                                                            onRuleUpdate(rule.id, { title: event.target.value })
                                                        }
                                                    />
                                                    {rule.matcherType === 'regex' && (
                                                        <TextField
                                                            size="small"
                                                            label="Regex pattern"
                                                            value={rule.pattern ?? ''}
                                                            onChange={(event) =>
                                                                onRuleUpdate(rule.id, { pattern: event.target.value })
                                                            }
                                                        />
                                                    )}
                                                    <TextField
                                                        size="small"
                                                        select
                                                        label="Severity"
                                                        value={rule.severity}
                                                        onChange={(event) =>
                                                            onRuleUpdate(rule.id, {
                                                                severity: event.target.value as RuleSeverity,
                                                            })
                                                        }
                                                    >
                                                        <MenuItem value="error">Error</MenuItem>
                                                        <MenuItem value="warning">Warning</MenuItem>
                                                        <MenuItem value="info">Info</MenuItem>
                                                    </TextField>
                                                    <TextField
                                                        size="small"
                                                        label="Comment"
                                                        value={rule.comment}
                                                        onChange={(event) =>
                                                            onRuleUpdate(rule.id, { comment: event.target.value })
                                                        }
                                                    />
                                                </Stack>
                                            ) : (
                                                <>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {rule.comment}
                                                    </Typography>
                                                    {rule.matcherType === 'regex' && (
                                                        <Typography variant="body2" className={classes.patternText}>
                                                            Pattern: {rule.pattern}
                                                        </Typography>
                                                    )}
                                                </>
                                            )}
                                        </Stack>
                                    </Box>
                                )
                            })}

                            {adding && (
                                <Box className={classes.ruleRow}>
                                    <Typography variant="subtitle1" className={classes.sectionTitle}>
                                        New Custom Rule
                                    </Typography>
                                    <Box className={classes.formGrid}>
                                        <TextField
                                            label="Rule title"
                                            size="small"
                                            value={newRuleTitle}
                                            onChange={(event) => setNewRuleTitle(event.target.value)}
                                        />
                                        <TextField
                                            label="Severity"
                                            size="small"
                                            select
                                            value={newRuleSeverity}
                                            onChange={(event) => setNewRuleSeverity(event.target.value as RuleSeverity)}
                                        >
                                            <MenuItem value="error">Error</MenuItem>
                                            <MenuItem value="warning">Warning</MenuItem>
                                            <MenuItem value="info">Info</MenuItem>
                                        </TextField>
                                        <TextField
                                            className={classes.full}
                                            label="Regex pattern"
                                            placeholder="console\.log\(|\bany\b"
                                            size="small"
                                            value={newRulePattern}
                                            onChange={(event) => setNewRulePattern(event.target.value)}
                                        />
                                        <TextField
                                            className={classes.full}
                                            label="Comment"
                                            size="small"
                                            value={newRuleComment}
                                            onChange={(event) => setNewRuleComment(event.target.value)}
                                        />
                                    </Box>

                                    <Button className={classes.saveButton} variant="contained" onClick={submitAddRule}>
                                        Save Rule
                                    </Button>
                                </Box>
                            )}
                        </Stack>
                    </AccordionDetails>
                </Accordion>
            </Stack>

            <Stack className={classes.row}>
                <Typography variant="subtitle2" className={classes.rowTitle}>
                    Application Settings
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={saveHistory}
                            onChange={(event) => onSaveHistoryChange(event.target.checked)}
                        />
                    }
                    label="Save review history in browser"
                />
            </Stack>
        </Stack>
    )
}

export default SettingsView
