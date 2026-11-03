import { useCallback, useEffect, useRef, useState } from 'react'

import { useRefValue } from '../use-ref-value/use-ref-value'

/** 发请求的函数，参数由调用方决定，必须返回 Promise */
export type Service<TData, TParams extends unknown[]> = (...params: TParams) => Promise<TData>

export type Options<TData, TParams extends unknown[]> = {
    /** 为 true 时不自动发请求，需要手动调用 run / runAsync，默认 false */
    manual?: boolean
    /** 自动请求时带的参数 */
    defaultParams?: TParams
    /** 为 false 时不发请求；由 false 变 true 时会自动补发一次（manual 模式下只是拦截 run），默认 true */
    ready?: boolean
    /** 依赖变化时自动用上一次的参数重新请求（manual 模式下不生效） */
    refreshDeps?: unknown[]
    /** 请求发出前触发 */
    onBefore?: (params: TParams) => void
    /** 请求成功时触发 */
    onSuccess?: (data: TData, params: TParams) => void
    /** 请求失败时触发 */
    onError?: (error: Error, params: TParams) => void
    /** 不管成功失败都会触发 */
    onFinally?: (params: TParams, data?: TData, error?: Error) => void
}

export type Result<TData, TParams extends unknown[]> = {
    /** 请求返回的数据 */
    data: TData | undefined
    /** 请求抛出的错误，成功后会被清掉 */
    error: Error | undefined
    /** 是否正在请求 */
    loading: boolean
    /** 最近一次请求用的参数 */
    params: TParams | []
    /** 发请求，错误只进 error 状态和 onError，不会抛出 */
    run: (...params: TParams) => void
    /** 发请求，返回 Promise，需要自己 catch */
    runAsync: (...params: TParams) => Promise<TData>
    /** 用上一次的参数重新请求 */
    refresh: () => void
    /** 用上一次的参数重新请求，返回 Promise */
    refreshAsync: () => Promise<TData>
    /** 直接改 data，不发请求 */
    mutate: (data: TData | ((oldData: TData | undefined) => TData)) => void
    /** 忽略当前请求的结果并结束 loading */
    cancel: () => void
}

type State<TData, TParams extends unknown[]> = {
    data: TData | undefined
    error: Error | undefined
    loading: boolean
    params: TParams | []
}

/**
 * 管理异步请求的状态。
 *
 * 默认挂载时自动请求一次，`manual: true` 则完全由 run / runAsync 驱动。
 * 内部用自增计数做竞态控制：只有最后一次发出的请求能写状态、能触发回调，
 * 被顶掉或被 cancel 的请求结果直接丢弃，所以快慢请求交叉返回时不会出现旧数据覆盖新数据。
 */
export function useRequest<TData, TParams extends unknown[] = unknown[]>(
    service: Service<TData, TParams>,
    options: Options<TData, TParams> = {}
): Result<TData, TParams> {
    const { manual = false, ready = true, refreshDeps } = options

    // service 和 options 每次渲染都是新引用，用 ref 兜住最新的，避免重建 run / 重跑 effect
    const serviceRef = useRefValue(service)
    const optionsRef = useRefValue(options)

    const [state, setState] = useState<State<TData, TParams>>(() => ({
        data: undefined,
        error: undefined,
        loading: !manual && ready,
        params: options.defaultParams ?? []
    }))
    const stateRef = useRefValue(state)

    // 每发一次请求自增，用来判断回来的结果是不是最新那次的
    const countRef = useRef(0)
    const unmountedRef = useRef(false)

    useEffect(() => {
        unmountedRef.current = false

        return () => {
            unmountedRef.current = true
        }
    }, [])

    const safeSetState = useCallback((partial: Partial<State<TData, TParams>>) => {
        if (unmountedRef.current) return

        setState(prev => ({ ...prev, ...partial }))
    }, [])

    const runAsync = useCallback(
        async (...params: TParams): Promise<TData> => {
            countRef.current += 1
            const currentCount = countRef.current

            const { onBefore, onSuccess, onError, onFinally } = optionsRef.current

            safeSetState({ loading: true, params, error: undefined })
            onBefore?.(params)

            try {
                const data = await serviceRef.current(...params)

                // 已经被新请求或 cancel 顶掉：Promise 照常 resolve 给调用方，但不写状态、不触发回调
                if (currentCount !== countRef.current) return data

                safeSetState({ data, error: undefined, loading: false })
                onSuccess?.(data, params)
                onFinally?.(params, data, undefined)

                return data
            } catch (e) {
                const error = e instanceof Error ? e : new Error(String(e))

                if (currentCount !== countRef.current) throw error

                safeSetState({ error, loading: false })
                onError?.(error, params)
                onFinally?.(params, undefined, error)

                throw error
            }
        },
        [optionsRef, safeSetState, serviceRef]
    )

    const run = useCallback(
        (...params: TParams) => {
            // 错误已经交给 error 状态和 onError，这里吞掉避免 unhandled rejection
            runAsync(...params).catch(() => {})
        },
        [runAsync]
    )

    const refreshAsync = useCallback(() => runAsync(...(stateRef.current.params as TParams)), [runAsync, stateRef])

    const refresh = useCallback(() => {
        refreshAsync().catch(() => {})
    }, [refreshAsync])

    const mutate = useCallback(
        (data: TData | ((oldData: TData | undefined) => TData)) => {
            const nextData = typeof data === 'function' ? (data as (oldData: TData | undefined) => TData)(stateRef.current.data) : data

            safeSetState({ data: nextData })
        },
        [safeSetState, stateRef]
    )

    const cancel = useCallback(() => {
        // 自增一次，在途请求回来时就对不上号了
        countRef.current += 1
        safeSetState({ loading: false })
    }, [safeSetState])

    const runRef = useRefValue(run)
    const refreshRef = useRefValue(refresh)

    // 挂载时自动请求；ready 由 false 变 true 时补发
    useEffect(() => {
        if (manual || !ready) return

        runRef.current(...((optionsRef.current.defaultParams ?? []) as TParams))
    }, [manual, ready, optionsRef, runRef])

    const isFirstEffectRef = useRef(true)

    // refreshDeps 变化时重新请求，首次渲染交给上面的自动请求，这里跳过
    useEffect(
        () => {
            if (isFirstEffectRef.current) {
                isFirstEffectRef.current = false
                return
            }

            if (manual || !ready || !refreshDeps) return

            refreshRef.current()
        },
        // 依赖数组由调用方决定，不传就退化成只在挂载时跑一次
        refreshDeps ?? []
    )

    return {
        data: state.data,
        error: state.error,
        loading: state.loading,
        params: state.params,
        run,
        runAsync,
        refresh,
        refreshAsync,
        mutate,
        cancel
    }
}
