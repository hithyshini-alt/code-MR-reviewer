import type { CSSObject } from '@emotion/react'
import { css } from '@emotion/css'
import { useMemo } from 'react'
import { useTheme, type Theme } from '@mui/material/styles'

type PlainObject = CSSObject
type StyleObject = PlainObject
type StyleEntry<TProps, TTheme> =
    | StyleObject
    | ((props: TProps, theme: TTheme) => StyleObject)

type Styles<TProps, TTheme> = Record<string, StyleEntry<TProps, TTheme>>

const isPlainObject = (value: unknown): value is PlainObject =>
    value != null && typeof value === 'object' && !Array.isArray(value)

const DEV = import.meta.env.DEV

function walkObject(
    obj: StyleObject,
    fn: (
        key: string,
        value: unknown,
        parent: StyleObject,
    ) => { key: string; value: unknown } | null,
): StyleObject {
    const out: StyleObject = {}

    for (const key of Object.keys(obj ?? {})) {
        const value = obj[key as keyof StyleObject]
        const next = fn(key, value, obj)

        if (next === null) {
            continue
        }

        const { key: newKey, value: newValue } = next
        if (isPlainObject(newValue)) {
            out[newKey as keyof StyleObject] = walkObject(newValue, fn)
            continue
        }

        out[newKey as keyof StyleObject] = newValue as StyleObject[keyof StyleObject]
    }

    return out
}

function collectDollarRefs(style: StyleObject, bucket: Set<string>) {
    const refPattern = /\$([a-zA-Z0-9_-]+)/g

    function visit(obj: StyleObject) {
        for (const key of Object.keys(obj ?? {})) {
            const value = obj[key as keyof StyleObject]
            let match: RegExpExecArray | null
            while ((match = refPattern.exec(key))) {
                bucket.add(match[1])
            }

            if (isPlainObject(value)) {
                visit(value)
            }
        }
    }

    visit(style)
}

function replaceDollarRefs(
    style: StyleObject,
    resolver: (ref: string) => string | undefined,
): StyleObject {
    const refPattern = /\$([a-zA-Z0-9_-]+)/g

    return walkObject(style, (key, value) => {
        if (!key.includes('$')) {
            return { key, value }
        }

        let hasUnknownRef = false
        const nextKey = key.replace(refPattern, (_match, ref) => {
            const replacement = resolver(ref)
            if (!replacement) {
                hasUnknownRef = true
                return '__DROP__'
            }

            return replacement.startsWith('.') ? replacement : `.${replacement}`
        })

        if (hasUnknownRef || nextKey.includes('__DROP__')) {
            if (DEV) {
                console.warn('[makeStyles] Dropping selector with unknown $ref:', key)
            }

            return null
        }

        return { key: nextKey, value }
    })
}

function compileStyles(
    resolvedStyles: Record<string, StyleObject>,
): Record<string, string> {
    const keys = Object.keys(resolvedStyles)
    const deps: Record<string, Set<string>> = {}

    keys.forEach((key) => {
        const style = resolvedStyles[key] ?? {}
        const refs = new Set<string>()
        collectDollarRefs(style, refs)
        deps[key] = refs
    })

    const classes: Record<string, string> = {}
    const done = new Set<string>()

    let progress = true
    let iterations = 0
    const maxIterations = keys.length * 2

    while (progress && iterations++ < maxIterations) {
        progress = false

        for (const key of keys) {
            if (done.has(key)) {
                continue
            }

            const allDepsKnown = Array.from(deps[key]).every((dep) => classes[dep])

            if (deps[key].size === 0) {
                try {
                    classes[key] = css(resolvedStyles[key] || {})
                } catch (error) {
                    if (DEV) {
                        console.error('[makeStyles] Failed to compile style for', key, error)
                    }

                    classes[key] = css({})
                }

                done.add(key)
                progress = true
                continue
            }

            if (!allDepsKnown) {
                continue
            }

            const replaced = replaceDollarRefs(resolvedStyles[key] || {}, (ref) => classes[ref])

            try {
                classes[key] = css(replaced)
            } catch (error) {
                if (DEV) {
                    console.error('[makeStyles] Failed to compile (with $refs) for', key, error)
                }

                classes[key] = css({})
            }

            done.add(key)
            progress = true
        }
    }

    for (const key of keys) {
        if (done.has(key)) {
            continue
        }

        const replaced = replaceDollarRefs(resolvedStyles[key] || {}, (ref) => classes[ref])

        try {
            classes[key] = css(replaced)
        } catch (error) {
            if (DEV) {
                console.error('[makeStyles] Fallback compile failed for', key, error)
            }

            classes[key] = css({})
        }
    }

    return classes
}

export function makeStyles<
    TProps = unknown,
    TTheme = Theme,
    TStyles extends Styles<TProps, TTheme> = Styles<TProps, TTheme>,
>(
    styles: (theme: TTheme) => TStyles,
): (props?: TProps) => { [K in keyof TStyles]: string } {
    return (props?: TProps) => {
        const theme = useTheme<TTheme>()

        return useMemo(() => {
            let styleMap: TStyles

            try {
                styleMap = styles(theme) || ({} as TStyles)
            } catch (error) {
                if (DEV) {
                    console.error('[makeStyles] styles(theme) threw:', error)
                }

                return {} as { [K in keyof TStyles]: string }
            }

            const resolved = {} as Record<keyof TStyles, StyleObject>
            for (const key of Object.keys(styleMap) as (keyof TStyles)[]) {
                const entry = styleMap[key]

                try {
                    const style =
                        typeof entry === 'function'
                            ? (entry as (inputProps: TProps, inputTheme: TTheme) => StyleObject)(
                                (props ?? ({} as TProps)) as TProps,
                                theme,
                            )
                            : entry

                    resolved[key] = isPlainObject(style) ? style : {}
                } catch (error) {
                    if (DEV) {
                        console.error(`[makeStyles] style "${String(key)}" resolver threw:`, error)
                    }

                    resolved[key] = {}
                }
            }

            try {
                return compileStyles(resolved as Record<string, StyleObject>) as {
                    [K in keyof TStyles]: string
                }
            } catch (error) {
                if (DEV) {
                    console.error('[makeStyles] compileStyles threw:', error)
                }

                const empty = css({})
                const fallback = {} as { [K in keyof TStyles]: string }
                for (const key of Object.keys(resolved) as (keyof TStyles)[]) {
                    fallback[key] = empty
                }

                return fallback
            }
        }, [theme, props])
    }
}
