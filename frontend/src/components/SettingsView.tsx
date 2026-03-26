import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
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
import { requestRegexPattern } from '../services/aiFix'
import type { ReviewRule, RuleSeverity } from '../types/reviewer'

type SettingsViewProps = {
    aiApiKey: string
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
    sandboxSection: {
        marginTop: theme.spacing(0.5),
        padding: theme.spacing(1.25),
        borderRadius: theme.spacing(1.25),
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: '#fbfffe',
    },
    sandboxTitle: {
        fontWeight: 700,
        marginBottom: theme.spacing(0.75),
    },
    previewBox: {
        marginTop: theme.spacing(1),
        padding: theme.spacing(1),
        borderRadius: theme.spacing(1),
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
    },
    previewLine: {
        fontFamily: 'Consolas, monospace',
        fontSize: '0.8rem',
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
}))

function SettingsView({
    saveHistory,
    saveCredentials,
    aiApiKey,
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
    const [isGeneratingRegex, setIsGeneratingRegex] = useState(false)
    const [regexHelperText, setRegexHelperText] = useState('')
    const [regexHelperError, setRegexHelperError] = useState('')

    const resetAddForm = () => {
        setNewRuleTitle('')
        setNewRulePattern('')
        setNewRuleComment('Custom rule violated.')
        setNewRuleSeverity('warning')
        setRegexHelperText('')
        setRegexHelperError('')
    }

    const closeAddDialog = () => {
        setAdding(false)
        resetAddForm()
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

        closeAddDialog()
    }

    const generateRegexFromAi = async () => {
        setRegexHelperError('')
        setRegexHelperText('')

        if (!newRuleTitle.trim()) {
            setRegexHelperError('Rule title is required before generating a regex pattern.')
            return
        }

        try {
            setIsGeneratingRegex(true)
            const result = await requestRegexPattern(aiApiKey, {
                ruleTitle: newRuleTitle.trim(),
                ruleComment: newRuleComment.trim(),
            })

            if (!result.regexPattern) {
                setRegexHelperError('AI did not return a regex pattern.')
                return
            }

            setNewRulePattern(result.regexPattern)
            setRegexHelperText(result.explanation || 'Regex pattern generated by AI.')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to generate regex pattern.'
            setRegexHelperError(message)
        } finally {
            setIsGeneratingRegex(false)
        }
    }

    return (
        <Stack className={classes.root}>
            <Typography variant="body2" color="text.secondary" className={classes.note}>
                Configure how this frontend stores and displays your review data.
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
                    label="Save credentials to your account"
                />
                <Typography variant="body2" color="text.secondary">
                    When enabled, your PAT and AI API key are saved to your account on the backend.
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
                                onClick={() => setAdding(true)}
                            >
                                Add Rule
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

                        </Stack>
                    </AccordionDetails>
                </Accordion>
            </Stack>

            <Dialog open={adding} onClose={closeAddDialog} fullWidth maxWidth="sm">
                <DialogTitle>Add New Custom Rule</DialogTitle>
                <DialogContent>
                    <Box className={classes.formGrid} sx={{ mt: 0.5 }}>
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
                        <Box className={classes.full}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={generateRegexFromAi}
                                disabled={isGeneratingRegex}
                                sx={{ mt: 0.25, py: 0.1, px: 1.2, minWidth: 0 }}
                            >
                                {isGeneratingRegex ? 'Generating regex...' : 'Get Regex Pattern (AI)'}
                            </Button>
                            {regexHelperText && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                    {regexHelperText}
                                </Typography>
                            )}
                            {regexHelperError && (
                                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                    {regexHelperError}
                                </Typography>
                            )}
                        </Box>
                        <TextField
                            className={classes.full}
                            label="Comment"
                            size="small"
                            value={newRuleComment}
                            onChange={(event) => setNewRuleComment(event.target.value)}
                        />
                        {/*
                        <Box className={`${classes.full} ${classes.sandboxSection}`}>
                            <Typography variant="subtitle2" className={classes.sandboxTitle}>
                                Test this rule
                            </Typography>
                            <TextField
                                label="Sample code"
                                multiline
                                minRows={4}
                                fullWidth
                                value={sandboxCode}
                                onChange={(event) => setSandboxCode(event.target.value)}
                                helperText="Preview updates instantly as you edit regex or sample code."
                            />

                            <Box className={classes.previewBox}>
                                <Typography
                                    variant="caption"
                                    color={
                                        regexSandboxPreview.status === 'invalid'
                                            ? 'error'
                                            : regexSandboxPreview.status === 'match'
                                                ? 'success.main'
                                                : 'text.secondary'
                                    }
                                >
                                    {regexSandboxPreview.message}
                                </Typography>

                                {regexSandboxPreview.status === 'match' && (
                                    <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                                        {regexSandboxPreview.matches.slice(0, 8).map((matchItem) => (
                                            <Typography key={`${matchItem.lineNumber}-${matchItem.text}`} className={classes.previewLine}>
                                                {`L${matchItem.lineNumber}: ${matchItem.text}`}
                                            </Typography>
                                        ))}
                                    </Stack>
                                )}
                            </Box>
                        </Box>
                        */}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeAddDialog}>Cancel</Button>
                    <Button variant="contained" onClick={submitAddRule}>
                        Save Rule
                    </Button>
                </DialogActions>
            </Dialog>

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
