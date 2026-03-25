import {
    Alert,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    FormGroup,
    IconButton,
    Paper,
    Radio,
    RadioGroup,
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import FindingsSummary from '../components/FindingsSummary'
import SettingsView from '../components/SettingsView'
import SectionCard from '../components/SectionCard'
import TopMenu, { type MenuKey } from '../components/TopMenu'
import ReviewHistoryView from '../components/ReviewHistoryView'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import FolderRoundedIcon from '@mui/icons-material/FolderRounded'
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import { makeStyles } from '../hooks/makeStyles'
import {
    fetchMergeRequestChanges,
    postFindingsAsNotes,
} from '../services/gitlab'
import type {
    BuiltInFindingsSummary,
    Finding,
    GitLabChange,
    ReviewHistoryItem,
    ReviewRule,
    RuleSeverity,
} from '../types/reviewer'
import {
    analyzeDiff,
    defaultRules,
    parseMergeRequestUrl,
    summarizeFindings,
} from '../utils/reviewer'

const useStyles = makeStyles((theme) => ({
    page: {
        minHeight: '100vh',
        backgroundColor: '#edf7f5',
    },
    shell: {
        display: 'flex',
        minHeight: '100vh',
        [theme.breakpoints.down('md')]: {
            flexDirection: 'column',
        },
    },
    content: {
        flex: 1,
        padding: theme.spacing(4.5, 4, 6.5),
        maxWidth: 1240,
        width: '100%',
        margin: '0 auto',
        [theme.breakpoints.down('md')]: {
            padding: theme.spacing(3, 2, 4),
        },
    },
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(3),
        animation: 'riseIn 420ms ease both',
    },
    statusAlert: {
        borderRadius: theme.spacing(1.4),
    },
    hero: {
        padding: theme.spacing(2.25),
        borderRadius: theme.spacing(2),
        border: `1px solid ${theme.palette.primary.light}66`,
        backgroundColor: 'rgba(15, 118, 110, 0.08)',
    },
    heading: {
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: -0.35,
    },
    subHeading: {
        maxWidth: '70ch',
        marginTop: theme.spacing(1),
        color: theme.palette.text.secondary,
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: theme.spacing(1.75),
        [theme.breakpoints.down('md')]: {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        },
        [theme.breakpoints.down('sm')]: {
            gridTemplateColumns: '1fr',
        },
    },
    statCard: {
        padding: theme.spacing(2),
        borderRadius: theme.spacing(2),
        backgroundColor: '#f8fcfb',
        border: `1px solid ${theme.palette.primary.light}55`,
        boxShadow: '0 12px 26px rgba(15, 23, 42, 0.07)',
        minHeight: 138,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        animation: 'cardFloat 440ms ease both',
        '&:hover': {
            transform: 'translateY(-3px)',
            borderColor: theme.palette.primary.light,
            boxShadow: '0 18px 32px rgba(15, 23, 42, 0.11)',
        },
        '&:nth-of-type(2)': {
            animationDelay: '50ms',
        },
        '&:nth-of-type(3)': {
            animationDelay: '90ms',
        },
        '&:nth-of-type(4)': {
            animationDelay: '130ms',
        },
        '&:nth-of-type(5)': {
            animationDelay: '170ms',
        },
    },
    statTopRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing(1),
    },
    statIconBadge: {
        width: 38,
        height: 38,
        borderRadius: theme.spacing(1.25),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statIconReviews: {
        color: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.light}33`,
    },
    statIconIssues: {
        color: theme.palette.error.main,
        backgroundColor: `${theme.palette.error.light}33`,
    },
    statIconComments: {
        color: theme.palette.success.main,
        backgroundColor: `${theme.palette.success.light}33`,
    },
    statIconReviewed: {
        color: theme.palette.info.main,
        backgroundColor: `${theme.palette.info.light}33`,
    },
    statIconExcluded: {
        color: theme.palette.warning.main,
        backgroundColor: `${theme.palette.warning.light}33`,
    },
    statValue: {
        fontWeight: 700,
        fontSize: '1.8rem',
        lineHeight: 1,
        color: theme.palette.primary.dark,
    },
    statLabel: {
        marginTop: theme.spacing(1.5),
        fontSize: '0.82rem',
        fontWeight: 700,
        letterSpacing: 0.8,
        color: theme.palette.text.secondary,
    },
    statHelperText: {
        marginTop: theme.spacing(0.5),
        color: theme.palette.text.secondary,
        fontSize: '0.1rem',
        letterSpacing: 0.4,
    },
    reviewPanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: theme.spacing(2),
        [theme.breakpoints.down('sm')]: {
            gridTemplateColumns: '1fr',
        },
    },
    field: {
        '& .MuiOutlinedInput-root': {
            borderRadius: theme.spacing(1.25),
            backgroundColor: '#fcfcff',
        },
        '& .MuiInputLabel-root': {
            fontWeight: 600,
        },
    },
    reviewActionRow: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
        flexWrap: 'wrap',
    },
    reviewButton: {
        minWidth: 190,
        minHeight: 46,
        backgroundColor: theme.palette.primary.main,
    },
    helperMeta: {
        color: theme.palette.text.secondary,
        fontWeight: 500,
    },
    stepTitle: {
        fontWeight: 700,
        color: theme.palette.text.primary,
        marginTop: theme.spacing(0.5),
    },
    stepHint: {
        color: theme.palette.text.secondary,
    },
    selectionHint: {
        color: theme.palette.text.secondary,
    },
    selectionList: {
        maxHeight: 340,
        overflowY: 'auto',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.spacing(1.25),
        padding: theme.spacing(0.75),
        marginTop: theme.spacing(1),
        backgroundColor: '#fcfcff',
    },
    treeRow: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
        minHeight: 34,
        borderRadius: theme.spacing(1),
        paddingRight: theme.spacing(1),
        '&:hover': {
            backgroundColor: `${theme.palette.primary.light}1a`,
        },
    },
    folderLabel: {
        fontWeight: 600,
        color: theme.palette.text.primary,
    },
    treeMeta: {
        color: theme.palette.text.secondary,
        fontSize: '0.76rem',
    },
    fileLabel: {
        color: theme.palette.text.primary,
    },
    diffList: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.25),
    },
    diffItem: {
        borderRadius: theme.spacing(1.25),
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: '#fcfcff',
        padding: theme.spacing(1.25),
    },
    diffPath: {
        fontWeight: 700,
        color: theme.palette.text.primary,
        marginBottom: theme.spacing(1),
    },
    diffCode: {
        margin: 0,
        maxHeight: 260,
        overflow: 'auto',
        whiteSpace: 'pre',
        fontSize: '0.78rem',
        lineHeight: 1.5,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        color: theme.palette.text.secondary,
    },
    timelineContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.5),
    },
    timelineStepper: {
        '& .MuiStepLabel-label': {
            fontWeight: 600,
            fontSize: '0.85rem',
        },
    },
    timelineStatus: {
        color: theme.palette.text.secondary,
        fontWeight: 600,
    },
    timelineError: {
        color: theme.palette.error.main,
        fontWeight: 600,
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing(2),
        flexWrap: 'wrap',
    },
    resultActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: theme.spacing(2),
        [theme.breakpoints.down('sm')]: {
            justifyContent: 'stretch',
        },
    },
    postButton: {
        minWidth: 190,
        [theme.breakpoints.down('sm')]: {
            width: '100%',
        },
    },
}))

const HISTORY_STORAGE_KEY = 'mr-reviewer-history-v1'
const RULES_STORAGE_KEY = 'mr-reviewer-rules-v1'
const CREDENTIALS_STORAGE_KEY = 'mr-reviewer-credentials-v1'

type ReviewFlowState =
    | 'idle'
    | 'reviewing'
    | 'reviewed'
    | 'posting'
    | 'posted'
    | 'error'

const REVIEW_TIMELINE_STEPS_WITH_POSTING = [
    'Ready',
    'Reviewing',
    'Reviewed',
    'Posting comments',
    'Completed',
]

const REVIEW_TIMELINE_STEPS_NO_POSTING = [
    'Ready',
    'Reviewing',
    'Reviewed',
    'Completed',
]

type FileSelectionItem = {
    id: string
    path: string
    change: GitLabChange
    selected: boolean
}

type FileTreeFolder = {
    name: string
    path: string
    folders: FileTreeFolder[]
    files: FileSelectionItem[]
}

type FileSelectionTree = {
    folders: FileTreeFolder[]
    files: FileSelectionItem[]
}

function getChangePath(change: GitLabChange): string {
    return change.new_path || change.old_path || ''
}

function normalizeSelectionPath(filePath: string): string {
    return filePath.replace(/\\/g, '/').replace(/^\/+/, '')
}

function getFileNameFromPath(filePath: string): string {
    const normalized = normalizeSelectionPath(filePath)
    const parts = normalized.split('/').filter(Boolean)
    return parts.at(-1) || normalized
}

function buildFileSelectionTree(items: FileSelectionItem[]): FileSelectionTree {
    type MutableFolder = {
        name: string
        path: string
        folders: Map<string, MutableFolder>
        files: FileSelectionItem[]
    }

    const root: MutableFolder = {
        name: '',
        path: '',
        folders: new Map<string, MutableFolder>(),
        files: [],
    }

    const sortedItems = [...items].sort((a, b) => a.path.localeCompare(b.path))

    for (const item of sortedItems) {
        const normalized = normalizeSelectionPath(item.path)
        const parts = normalized.split('/').filter(Boolean)

        if (parts.length <= 1) {
            root.files.push(item)
            continue
        }

        let current = root
        const folderParts = parts.slice(0, -1)

        for (const folderName of folderParts) {
            const folderPath = current.path ? `${current.path}/${folderName}` : folderName

            if (!current.folders.has(folderName)) {
                current.folders.set(folderName, {
                    name: folderName,
                    path: folderPath,
                    folders: new Map<string, MutableFolder>(),
                    files: [],
                })
            }

            current = current.folders.get(folderName) as MutableFolder
        }

        current.files.push(item)
    }

    const toReadonlyFolder = (folder: MutableFolder): FileTreeFolder => ({
        name: folder.name,
        path: folder.path,
        folders: [...folder.folders.values()]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(toReadonlyFolder),
        files: [...folder.files].sort((a, b) => a.path.localeCompare(b.path)),
    })

    return {
        folders: [...root.folders.values()]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(toReadonlyFolder),
        files: [...root.files].sort((a, b) => a.path.localeCompare(b.path)),
    }
}

function isTestFilePath(filePath: string): boolean {
    const normalized = filePath.toLowerCase().replace(/\\/g, '/')

    return (
        /\.(test|spec)\.(ts|tsx)$/.test(normalized) ||
        normalized.includes('/__tests__/') ||
        normalized.includes('/tests/') ||
        normalized.includes('/test/')
    )
}

function isReviewableFileType(filePath: string, includeTestFiles: boolean): boolean {
    const normalized = filePath.toLowerCase()

    if (!includeTestFiles && isTestFilePath(normalized)) {
        return false
    }

    return normalized.endsWith('.ts') || normalized.endsWith('.tsx')
}

function ReviewerPage() {
    const classes = useStyles()

    const [activeMenu, setActiveMenu] = useState<MenuKey>('dashboard')
    const [mergeRequestUrl, setMergeRequestUrl] = useState('')
    const [accessToken, setAccessToken] = useState('')
    const [aiApiKey, setAiApiKey] = useState('')
    const [rules, setRules] = useState<ReviewRule[]>(defaultRules)
    const [findings, setFindings] = useState<Finding[]>([])
    const [history, setHistory] = useState<ReviewHistoryItem[]>([])
    const [saveHistory, setSaveHistory] = useState(true)
    const [saveCredentials, setSaveCredentials] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isReviewing, setIsReviewing] = useState(false)
    const [isPosting, setIsPosting] = useState(false)
    const [hasReviewed, setHasReviewed] = useState(false)
    const [reviewFlowState, setReviewFlowState] = useState<ReviewFlowState>('idle')
    const [totalCommentsPosted, setTotalCommentsPosted] = useState(0)
    const [lastReviewedFiles, setLastReviewedFiles] = useState(0)
    const [lastExcludedFiles, setLastExcludedFiles] = useState(0)
    const [includeTestFiles, setIncludeTestFiles] = useState(false)
    const [reviewedChanges, setReviewedChanges] = useState<GitLabChange[]>([])
    const [isFileSelectionOpen, setIsFileSelectionOpen] = useState(false)
    const [fileSelectionItems, setFileSelectionItems] = useState<FileSelectionItem[]>([])
    const [fileSelectionTotalChanges, setFileSelectionTotalChanges] = useState(0)
    const [expandedFolderPaths, setExpandedFolderPaths] = useState<string[]>([])

    const findingCountByRule: BuiltInFindingsSummary = useMemo(
        () => summarizeFindings(findings, rules),
        [findings, rules],
    )
    const autoDetectedHost = useMemo(() => {
        try {
            return mergeRequestUrl.trim() ? new URL(mergeRequestUrl.trim()).origin : ''
        } catch {
            return ''
        }
    }, [mergeRequestUrl])
    const reviewsRunCount = history.length
    const selectedFileCount = useMemo(
        () => fileSelectionItems.filter((item) => item.selected).length,
        [fileSelectionItems],
    )
    const fileSelectionTree = useMemo(
        () => buildFileSelectionTree(fileSelectionItems),
        [fileSelectionItems],
    )
    const shouldShowPostingStep = useMemo(
        () => findings.length > 0 || reviewFlowState === 'posting' || reviewFlowState === 'posted',
        [findings.length, reviewFlowState],
    )
    const timelineSteps = useMemo(
        () =>
            shouldShowPostingStep
                ? REVIEW_TIMELINE_STEPS_WITH_POSTING
                : REVIEW_TIMELINE_STEPS_NO_POSTING,
        [shouldShowPostingStep],
    )
    const timelineStepIndex = useMemo(() => {
        const isNoIssueReviewComplete =
            reviewFlowState === 'reviewed' && hasReviewed && findings.length === 0

        if (isNoIssueReviewComplete) {
            return shouldShowPostingStep ? 4 : 3
        }

        if (!shouldShowPostingStep) {
            switch (reviewFlowState) {
                case 'idle':
                    return 0
                case 'reviewing':
                    return 1
                case 'reviewed':
                    return 2
                case 'posted':
                    return 3
                case 'error':
                    return 0
                default:
                    return 0
            }
        }

        switch (reviewFlowState) {
            case 'idle':
                return 0
            case 'reviewing':
                return 1
            case 'reviewed':
                return 2
            case 'posting':
                return 3
            case 'posted':
                return 4
            case 'error':
                return 0
            default:
                return 0
        }
    }, [findings.length, hasReviewed, reviewFlowState, shouldShowPostingStep])

    const isTimelineComplete = useMemo(() => {
        return (
            reviewFlowState === 'posted' ||
            (reviewFlowState === 'reviewed' && hasReviewed && findings.length === 0)
        )
    }, [findings.length, hasReviewed, reviewFlowState])

    const timelineStatusText = useMemo(() => {
        const isNoIssueReviewComplete =
            reviewFlowState === 'reviewed' && hasReviewed && findings.length === 0

        if (isNoIssueReviewComplete) {
            return 'Status: Review completed. No issues found.'
        }

        switch (reviewFlowState) {
            case 'idle':
                return 'Status: Ready to run review.'
            case 'reviewing':
                return 'Status: Review in progress...'
            case 'reviewed':
                return 'Status: Review completed.'
            case 'posting':
                return 'Status: Posting comments to GitLab...'
            case 'posted':
                return 'Status: Review and comment posting completed.'
            case 'error':
                return 'Status: Review flow encountered an error.'
            default:
                return 'Status: Ready.'
        }
    }, [findings.length, hasReviewed, reviewFlowState])

    useEffect(() => {
        try {
            const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
            if (!raw) {
                return
            }

            const parsed = JSON.parse(raw) as ReviewHistoryItem[]
            if (Array.isArray(parsed)) {
                setHistory(
                    parsed.map((item) => ({
                        ...item,
                        summary: {
                            noSx: item.summary?.noSx ?? 0,
                            noDeprecatedTags: item.summary?.noDeprecatedTags ?? 0,
                            optionalChaining: item.summary?.optionalChaining ?? 0,
                            custom: item.summary?.custom ?? 0,
                        },
                    })),
                )
            }
        } catch {
            setHistory([])
        }
    }, [])

    useEffect(() => {
        try {
            const rawCredentials = localStorage.getItem(CREDENTIALS_STORAGE_KEY)
            if (!rawCredentials) {
                return
            }

            const parsed = JSON.parse(rawCredentials) as {
                saveCredentials?: boolean
                accessToken?: string
                aiApiKey?: string
            }

            if (parsed.saveCredentials) {
                setSaveCredentials(true)
                setAccessToken(parsed.accessToken ?? '')
                setAiApiKey(parsed.aiApiKey ?? '')
            }
        } catch {
            setSaveCredentials(false)
        }
    }, [])

    useEffect(() => {
        try {
            const rawRules = localStorage.getItem(RULES_STORAGE_KEY)
            if (!rawRules) {
                return
            }

            const parsed = JSON.parse(rawRules) as Partial<ReviewRule>[]
            if (!Array.isArray(parsed) || parsed.length === 0) {
                return
            }

            setRules(
                parsed.map((rule, index) => {
                    const matcherType = rule.matcherType || 'builtin'
                    const inferredKey =
                        rule.key ||
                        (rule.id === 'noSx' || rule.id === 'noDeprecatedTags' || rule.id === 'optionalChaining'
                            ? rule.id
                            : undefined)

                    return {
                        id: rule.id || `migrated-${index}`,
                        key: inferredKey,
                        matcherType,
                        title: rule.title || `Rule ${index + 1}`,
                        enabled: rule.enabled ?? true,
                        comment: rule.comment || 'Rule violated.',
                        severity: rule.severity || 'warning',
                        pattern: rule.pattern,
                    }
                }),
            )
        } catch {
            setRules(defaultRules)
        }
    }, [])

    useEffect(() => {
        if (!saveHistory) {
            localStorage.removeItem(HISTORY_STORAGE_KEY)
            return
        }

        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
    }, [history, saveHistory])

    useEffect(() => {
        localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules))
    }, [rules])

    useEffect(() => {
        if (!saveCredentials) {
            localStorage.removeItem(CREDENTIALS_STORAGE_KEY)
            return
        }

        localStorage.setItem(
            CREDENTIALS_STORAGE_KEY,
            JSON.stringify({
                saveCredentials: true,
                accessToken: accessToken.trim(),
                aiApiKey: aiApiKey.trim(),
            }),
        )
    }, [accessToken, aiApiKey, saveCredentials])

    const addCustomRule = (rule: {
        title: string
        pattern: string
        comment: string
        severity: RuleSeverity
    }) => {
        const newRule: ReviewRule = {
            id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            matcherType: 'regex',
            title: rule.title,
            enabled: true,
            comment: rule.comment,
            severity: rule.severity,
            pattern: rule.pattern,
        }

        setRules((previous) => [...previous, newRule])
        setStatusMessage('Custom rule added.')
        setErrorMessage('')
    }

    const updateRule = (
        ruleId: string,
        updates: Partial<Pick<ReviewRule, 'title' | 'comment' | 'severity' | 'enabled' | 'pattern'>>,
    ) => {
        setRules((previous) =>
            previous.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)),
        )
    }

    const deleteRule = (ruleId: string) => {
        setRules((previous) => previous.filter((item) => item.id !== ruleId))
        setStatusMessage('Rule deleted.')
        setErrorMessage('')
    }

    const completeReviewFromChanges = (changesToReview: GitLabChange[], totalReviewableCount: number) => {
        const excludedCount = Math.max(totalReviewableCount - changesToReview.length, 0)
        const newFindings = analyzeDiff(changesToReview, rules)
        const summary = summarizeFindings(newFindings, rules)

        setReviewedChanges(changesToReview)
        setFindings(newFindings)
        setLastReviewedFiles(changesToReview.length)
        setLastExcludedFiles(excludedCount)
        setHasReviewed(true)
        setReviewFlowState('reviewed')

        if (saveHistory) {
            const historyItem: ReviewHistoryItem = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                mergeRequestUrl: mergeRequestUrl.trim(),
                createdAt: new Date().toISOString(),
                totalFindings: newFindings.length,
                summary,
            }

            setHistory((previous) => [historyItem, ...previous].slice(0, 20))
        }

        if (newFindings.length === 0) {
            setStatusMessage(
                excludedCount > 0
                    ? `No issues found for enabled rules. Skipped ${excludedCount} file(s).`
                    : 'No issues found for enabled rules.',
            )
            return
        }

        setStatusMessage(
            `Review complete. ${newFindings.length} issue(s) found.${excludedCount > 0 ? ` Skipped ${excludedCount} file(s).` : ''}`,
        )
    }

    const toggleFileSelection = (itemId: string) => {
        setFileSelectionItems((previous) =>
            previous.map((item) =>
                item.id === itemId ? { ...item, selected: !item.selected } : item,
            ),
        )
    }

    const toggleAllFileSelections = (checked: boolean) => {
        setFileSelectionItems((previous) => previous.map((item) => ({ ...item, selected: checked })))
    }

    const toggleFolderExpanded = (folderPath: string) => {
        setExpandedFolderPaths((previous) =>
            previous.includes(folderPath)
                ? previous.filter((value) => value !== folderPath)
                : [...previous, folderPath],
        )
    }

    const getFolderSelectionStats = (folderPath: string) => {
        const matching = fileSelectionItems.filter((item) => {
            const normalized = normalizeSelectionPath(item.path)
            return normalized === folderPath || normalized.startsWith(`${folderPath}/`)
        })

        const selectedCount = matching.filter((item) => item.selected).length

        return {
            totalCount: matching.length,
            selectedCount,
        }
    }

    const toggleFolderSelection = (folderPath: string, checked: boolean) => {
        setFileSelectionItems((previous) =>
            previous.map((item) => {
                const normalized = normalizeSelectionPath(item.path)
                if (normalized === folderPath || normalized.startsWith(`${folderPath}/`)) {
                    return {
                        ...item,
                        selected: checked,
                    }
                }

                return item
            }),
        )
    }

    const cancelFileSelection = () => {
        setIsFileSelectionOpen(false)
        setFileSelectionItems([])
        setExpandedFolderPaths([])
        setFileSelectionTotalChanges(0)
        setReviewFlowState('idle')
        setStatusMessage('Review canceled before analysis.')
    }

    const confirmFileSelection = () => {
        const selectedChanges = fileSelectionItems
            .filter((item) => item.selected)
            .map((item) => item.change)

        setIsFileSelectionOpen(false)
        setFileSelectionItems([])
        setExpandedFolderPaths([])

        completeReviewFromChanges(selectedChanges, fileSelectionTotalChanges)
        setFileSelectionTotalChanges(0)
    }

    const reviewMergeRequest = async () => {
        setErrorMessage('')
        setStatusMessage('')
        setFindings([])
        setReviewedChanges([])
        setHasReviewed(false)
        setReviewFlowState('idle')

        if (!mergeRequestUrl.trim()) {
            setErrorMessage('Please enter a GitLab Merge Request URL.')
            return
        }

        if (!accessToken.trim()) {
            setErrorMessage('Please enter a GitLab Personal Access Token.')
            return
        }

        try {
            setIsReviewing(true)
            setReviewFlowState('reviewing')
            const target = parseMergeRequestUrl(mergeRequestUrl)
            const data = await fetchMergeRequestChanges(target, accessToken)
            const autoFilteredChanges = data.changes.filter((change) => {
                const filePath = getChangePath(change)

                if (!filePath) {
                    return false
                }

                if (!isReviewableFileType(filePath, includeTestFiles)) {
                    return false
                }

                return true
            })

            if (autoFilteredChanges.length === 0) {
                completeReviewFromChanges([], 0)
                setStatusMessage('No reviewable files found for the selected filter.')
                return
            }

            const items: FileSelectionItem[] = autoFilteredChanges.map((change, index) => ({
                id: `${index}-${getChangePath(change)}`,
                path: getChangePath(change),
                change,
                selected: true,
            }))

            const initialExpandedFolders = Array.from(
                new Set(
                    items.flatMap((item) => {
                        const parts = normalizeSelectionPath(item.path).split('/').filter(Boolean)
                        const folderParts = parts.slice(0, -1)

                        return folderParts.map((_, index) =>
                            folderParts.slice(0, index + 1).join('/'),
                        )
                    }),
                ),
            )

            setFileSelectionItems(items)
            setExpandedFolderPaths(initialExpandedFolders)
            setFileSelectionTotalChanges(autoFilteredChanges.length)
            setIsFileSelectionOpen(true)
            setStatusMessage(
                `Loaded ${autoFilteredChanges.length} reviewable file(s). Deselect files you want to skip, then continue.`,
            )
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to review MR.'
            setErrorMessage(message)
            setReviewFlowState('error')
        } finally {
            setIsReviewing(false)
        }
    }

    const postCommentsToMergeRequest = async () => {
        setErrorMessage('')
        setStatusMessage('')

        if (findings.length === 0) {
            setErrorMessage('No findings to post. Run review first.')
            return
        }

        try {
            setIsPosting(true)
            setReviewFlowState('posting')
            const target = parseMergeRequestUrl(mergeRequestUrl)
            const result = await postFindingsAsNotes(target, accessToken, findings)
            const messageParts: string[] = []

            if (result.postedCount > 0) {
                messageParts.push(`Posted ${result.postedCount} new comment(s) to GitLab.`)
            }

            if (result.skippedCount > 0) {
                messageParts.push(`Skipped ${result.skippedCount} duplicate comment(s) already present on this MR.`)
            }

            setStatusMessage(messageParts.join(' ') || 'No new comments to post. All findings were already posted.')
            setTotalCommentsPosted((previous) => previous + result.postedCount)
            setReviewFlowState('posted')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to post comments.'
            setErrorMessage(message)
            setReviewFlowState('error')
        } finally {
            setIsPosting(false)
        }
    }

    const clearHistory = () => {
        setHistory([])
        localStorage.removeItem(HISTORY_STORAGE_KEY)
        setStatusMessage('Review history cleared.')
        setErrorMessage('')
    }

    const dashboardView = (
        <Stack className={classes.root}>
            <Box className={classes.hero}>
                <Typography variant="h4" className={classes.heading}>
                    Merge Request Reviewer
                </Typography>
                <Typography variant="body2" color="text.secondary" className={classes.subHeading}>
                    Analyze GitLab Merge Requests, surface code risks quickly, and post actionable comments with one flow.
                </Typography>
            </Box>

            <Box className={classes.statsGrid}>
                <Paper className={classes.statCard}>
                    <Box className={classes.statTopRow}>
                        <Box className={`${classes.statIconBadge} ${classes.statIconReviews}`}>
                            <InsightsRoundedIcon fontSize="small" />
                        </Box>
                        <Typography className={classes.statValue}>{reviewsRunCount}</Typography>
                    </Box>
                    <Typography className={classes.statLabel}>REVIEWS RUN</Typography>
                </Paper>
                <Paper className={classes.statCard}>
                    <Box className={classes.statTopRow}>
                        <Box className={`${classes.statIconBadge} ${classes.statIconIssues}`}>
                            <ErrorOutlineRoundedIcon fontSize="small" />
                        </Box>
                        <Typography className={classes.statValue}>{findings.length}</Typography>
                    </Box>
                    <Typography className={classes.statLabel}>ISSUES FOUND</Typography>
                </Paper>
                <Paper className={classes.statCard}>
                    <Box className={classes.statTopRow}>
                        <Box className={`${classes.statIconBadge} ${classes.statIconComments}`}>
                            <ChatBubbleOutlineRoundedIcon fontSize="small" />
                        </Box>
                        <Typography className={classes.statValue}>{totalCommentsPosted}</Typography>
                    </Box>
                    <Typography className={classes.statLabel}>COMMENTS POSTED</Typography>
                </Paper>
                <Paper className={classes.statCard}>
                    <Box className={classes.statTopRow}>
                        <Box className={`${classes.statIconBadge} ${classes.statIconReviewed}`}>
                            <DescriptionRoundedIcon fontSize="small" />
                        </Box>
                        <Typography className={classes.statValue}>{lastReviewedFiles}</Typography>
                    </Box>
                    <Typography className={classes.statLabel}>FILES REVIEWED</Typography>
                    <Typography className={classes.statHelperText}>Current review only</Typography>
                </Paper>
                <Paper className={classes.statCard}>
                    <Box className={classes.statTopRow}>
                        <Box className={`${classes.statIconBadge} ${classes.statIconExcluded}`}>
                            <BlockRoundedIcon fontSize="small" />
                        </Box>
                        <Typography className={classes.statValue}>{lastExcludedFiles}</Typography>
                    </Box>
                    <Typography className={classes.statLabel}>FILES EXCLUDED</Typography>
                    <Typography className={classes.statHelperText}>Current review only</Typography>
                </Paper>
            </Box>

            <SectionCard title="New Code Review">
                <Stack className={classes.reviewPanel}>
                    <Typography variant="subtitle2" className={classes.stepTitle}>
                        Enter Merge Request details
                    </Typography>
                    <TextField
                        className={classes.field}
                        label="GitLab MR URL"
                        placeholder="https://gitlab.company.com/group/project/-/merge_requests/42"
                        value={mergeRequestUrl}
                        onChange={(event) => setMergeRequestUrl(event.target.value)}
                        fullWidth
                    />

                    <Box className={classes.formGrid}>
                        <TextField
                            className={classes.field}
                            label="GitLab Host (Auto-detected)"
                            value={autoDetectedHost}
                            fullWidth
                            InputProps={{ readOnly: true }}
                        />
                        <TextField
                            className={classes.field}
                            label="Personal Access Token"
                            type="password"
                            value={accessToken}
                            onChange={(event) => setAccessToken(event.target.value)}
                            fullWidth
                        />
                    </Box>

                    <TextField
                        className={classes.field}
                        label="AI Fix API Key"
                        type="password"
                        value={aiApiKey}
                        onChange={(event) => setAiApiKey(event.target.value)}
                        fullWidth
                        helperText="Used by Get AI Fix for Llama 3 suggestions"
                    />

                    <RadioGroup
                        row
                        value={includeTestFiles ? 'include' : 'exclude'}
                        onChange={(event) => setIncludeTestFiles(event.target.value === 'include')}
                    >
                        <FormControlLabel
                            value="include"
                            control={<Radio />}
                            label="Include test case files"
                        />
                        <FormControlLabel
                            value="exclude"
                            control={<Radio />}
                            label="Exclude test case files"
                        />
                    </RadioGroup>

                    <Box className={classes.reviewActionRow}>
                        <Button
                            variant="contained"
                            className={classes.reviewButton}
                            onClick={reviewMergeRequest}
                            disabled={isReviewing || isPosting || isFileSelectionOpen}
                        >
                            {isReviewing ? 'Reviewing...' : 'Start Review'}
                        </Button>
                        <Typography variant="body2" className={classes.helperMeta}>
                            {rules.filter((rule) => rule.enabled).length} active of {rules.length} total rules
                        </Typography>
                        <Button variant="text" onClick={() => setActiveMenu('history')}>
                            View review history
                        </Button>
                    </Box>
                </Stack>
            </SectionCard>

            <SectionCard title="Review Timeline">
                <Box className={classes.timelineContainer}>
                    <Stepper activeStep={timelineStepIndex} alternativeLabel className={classes.timelineStepper}>
                        {timelineSteps.map((label, index) => (
                            <Step
                                key={label}
                                completed={
                                    timelineStepIndex > index ||
                                    (isTimelineComplete && index === timelineSteps.length - 1)
                                }
                            >
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    <Typography
                        variant="body2"
                        className={reviewFlowState === 'error' ? classes.timelineError : classes.timelineStatus}
                    >
                        {timelineStatusText}
                    </Typography>
                </Box>
            </SectionCard>

            {statusMessage && <Alert severity="success" className={classes.statusAlert}>{statusMessage}</Alert>}
            {errorMessage && <Alert severity="error" className={classes.statusAlert}>{errorMessage}</Alert>}

            {/* {hasReviewed && reviewedChanges.length > 0 && (
                <SectionCard title="MR Diff Preview">
                    <Stack className={classes.diffList}>
                        {reviewedChanges.map((change, index) => {
                            const filePath = getChangePath(change) || `File ${index + 1}`
                            const diffText = change.diff?.trim() || 'No diff available for this file.'

                            return (
                                <Paper key={`${filePath}-${index}`} className={classes.diffItem}>
                                    <Typography variant="subtitle2" className={classes.diffPath}>
                                        {filePath}
                                    </Typography>
                                    <Box component="pre" className={classes.diffCode}>
                                        {diffText}
                                    </Box>
                                </Paper>
                            )
                        })}
                    </Stack>
                </SectionCard>
            )} */}

            {hasReviewed && findings.length > 0 && (
                <SectionCard title="Detected Issues">
                    <FindingsSummary
                        findings={findings}
                        summary={findingCountByRule}
                        reviewedChanges={reviewedChanges}
                        aiApiKey={aiApiKey}
                    />
                    <Box className={classes.resultActions}>
                        <Button
                            variant="outlined"
                            className={classes.postButton}
                            onClick={postCommentsToMergeRequest}
                            disabled={isReviewing || isPosting || findings.length === 0}
                        >
                            {isPosting ? 'Posting...' : 'Post Comments to GitLab'}
                        </Button>
                    </Box>
                </SectionCard>
            )}
        </Stack>
    )

    const historyView = (
        <Stack className={classes.root}>
            <Box className={classes.sectionHeader}>
                <Typography variant="h4" className={classes.heading}>
                    History of Reviews
                </Typography>
                <Button variant="outlined" color="error" onClick={clearHistory}>
                    Clear review history
                </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" className={classes.subHeading}>
                Past review runs are saved locally in your browser.
            </Typography>
            <SectionCard title="Recent Reviews">
                <ReviewHistoryView items={history} />
            </SectionCard>
        </Stack>
    )

    const settingsView = (
        <Stack className={classes.root}>
            <Typography variant="h4" className={classes.heading}>
                Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" className={classes.subHeading}>
                Manage local behavior for this frontend utility.
            </Typography>
            <SectionCard title="Preferences">
                <SettingsView
                    saveHistory={saveHistory}
                    saveCredentials={saveCredentials}
                    rules={rules}
                    onSaveHistoryChange={setSaveHistory}
                    onSaveCredentialsChange={setSaveCredentials}
                    onRuleAdd={addCustomRule}
                    onRuleUpdate={updateRule}
                    onRuleDelete={deleteRule}
                />
            </SectionCard>
        </Stack>
    )

    const activeView =
        activeMenu === 'dashboard'
            ? dashboardView
            : activeMenu === 'history'
                ? historyView
                : settingsView

    const renderFileNode = (item: FileSelectionItem, depth: number) => (
        <Box
            key={item.id}
            className={classes.treeRow}
            sx={{ pl: `${depth * 22 + 10}px` }}
        >
            <Box sx={{ width: 22, display: 'inline-flex', justifyContent: 'center' }}>
                <DescriptionOutlinedIcon fontSize="small" color="disabled" />
            </Box>
            <Checkbox
                checked={item.selected}
                onChange={() => toggleFileSelection(item.id)}
                size="small"
            />
            <Typography variant="body2" className={classes.fileLabel}>
                {getFileNameFromPath(item.path)}
            </Typography>
        </Box>
    )

    const renderFolderNode = (folder: FileTreeFolder, depth: number) => {
        const isExpanded = expandedFolderPaths.includes(folder.path)
        const stats = getFolderSelectionStats(folder.path)

        return (
            <Box key={folder.path}>
                <Box
                    className={classes.treeRow}
                    sx={{ pl: `${depth * 22 + 2}px` }}
                >
                    <IconButton
                        size="small"
                        onClick={() => toggleFolderExpanded(folder.path)}
                    >
                        {isExpanded ? <ExpandMoreRoundedIcon fontSize="small" /> : <ChevronRightRoundedIcon fontSize="small" />}
                    </IconButton>
                    <Checkbox
                        checked={stats.totalCount > 0 && stats.selectedCount === stats.totalCount}
                        indeterminate={stats.selectedCount > 0 && stats.selectedCount < stats.totalCount}
                        onChange={(event) => toggleFolderSelection(folder.path, event.target.checked)}
                        size="small"
                    />
                    {isExpanded ? <FolderOpenRoundedIcon fontSize="small" color="primary" /> : <FolderRoundedIcon fontSize="small" color="primary" />}
                    <Typography variant="body2" className={classes.folderLabel}>
                        {folder.name}
                    </Typography>
                    <Typography className={classes.treeMeta}>
                        {stats.selectedCount}/{stats.totalCount}
                    </Typography>
                </Box>

                {isExpanded && (
                    <Box>
                        {folder.folders.map((childFolder) => renderFolderNode(childFolder, depth + 1))}
                        {folder.files.map((item) => renderFileNode(item, depth + 1))}
                    </Box>
                )}
            </Box>
        )
    }

    return (
        <Box className={classes.page}>
            <Box className={classes.shell}>
                <TopMenu
                    active={activeMenu}
                    onChange={setActiveMenu}
                />
                <Box className={classes.content}>{activeView}</Box>
            </Box>

            <Dialog open={isFileSelectionOpen} onClose={cancelFileSelection} fullWidth maxWidth="md">
                <DialogTitle>Select Files to Review</DialogTitle>
                <DialogContent>
                    <Stack spacing={1.25}>
                        <Typography variant="body2" className={classes.selectionHint}>
                            Deselect any files you do not want to review. {selectedFileCount} of {fileSelectionItems.length} file(s) selected.
                        </Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={fileSelectionItems.length > 0 && selectedFileCount === fileSelectionItems.length}
                                    indeterminate={selectedFileCount > 0 && selectedFileCount < fileSelectionItems.length}
                                    onChange={(event) => toggleAllFileSelections(event.target.checked)}
                                />
                            }
                            label="Select all files"
                        />
                        <Box className={classes.selectionList}>
                            <FormGroup>
                                {fileSelectionTree.folders.map((folder) => renderFolderNode(folder, 0))}
                                {fileSelectionTree.files.map((item) => renderFileNode(item, 0))}
                            </FormGroup>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelFileSelection}>Cancel</Button>
                    <Button variant="contained" onClick={confirmFileSelection}>
                        Continue Review
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default ReviewerPage
