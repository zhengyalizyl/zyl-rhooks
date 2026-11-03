import { useCallback, useEffect, useRef } from 'react'

import { useRefValue } from '../use-ref-value/use-ref-value'

export type Options = {
    /** 防抖等待时间（毫秒），默认 1000 */
    wait?: number
    /** 是否在一轮的开始立即执行一次，默认 false */
    leading?: boolean
    /** 是否在一轮结束后执行最后一次，默认 true */
    trailing?: boolean
    /** 最长等待时间（毫秒）：一直有调用时，超过这个时间也会强制执行一次 */
    maxWait?: number
}

export type Result<TArgs extends unknown[]> = {
    /** 防抖后的函数 */
    run: (...args: TArgs) => void
    /** 取消还没执行的那次调用 */
    cancel: () => void
    /** 立刻执行还没执行的那次调用 */
    flush: () => void
}

/**
 * 给函数加防抖：连续调用时只认最后一次，安静 `wait` 毫秒后才真正执行。
 *
 * 返回的 `run` 引用稳定，可以直接传给子组件或放进依赖数组；内部始终调用最新的 `fn`，
 * 所以 `fn` 里读到的 props / state 不会是旧的。组件卸载时会自动取消待执行的调用。
 *
 * @param fn      需要防抖的函数，返回值会被忽略
 * @param options 防抖配置
 */
export function useDebounceFn<TArgs extends unknown[]>(fn: (...args: TArgs) => void, options: Options = {}): Result<TArgs> {
    const { wait = 1000, leading = false, trailing = true, maxWait } = options

    const fnRef = useRefValue(fn)
    const optionsRef = useRefValue({ wait, leading, trailing, maxWait })

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    // 等着被执行的那次调用的参数，null 表示没有待执行的调用
    const pendingArgsRef = useRef<TArgs | null>(null)

    const clearTimers = useCallback(() => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        if (maxTimerRef.current !== null) {
            clearTimeout(maxTimerRef.current)
            maxTimerRef.current = null
        }
    }, [])

    const invokePending = useCallback(() => {
        const args = pendingArgsRef.current
        pendingArgsRef.current = null

        if (args) fnRef.current(...args)
    }, [fnRef])

    const run = useCallback(
        (...args: TArgs) => {
            const { wait, leading, trailing, maxWait } = optionsRef.current

            // 没有计时器在跑，说明这是新一轮的第一次调用
            const isNewRound = timerRef.current === null

            pendingArgsRef.current = args

            if (leading && isNewRound) {
                // 开头已经执行过了，这次调用就不留给 trailing 了
                pendingArgsRef.current = null
                fnRef.current(...args)
            }

            if (timerRef.current !== null) clearTimeout(timerRef.current)

            timerRef.current = setTimeout(() => {
                timerRef.current = null

                if (maxTimerRef.current !== null) {
                    clearTimeout(maxTimerRef.current)
                    maxTimerRef.current = null
                }

                if (trailing) invokePending()
                else pendingArgsRef.current = null
            }, wait)

            // maxWait 只在一轮的第一次调用时起计，中途的调用不会把它续上
            if (maxWait !== undefined && maxTimerRef.current === null) {
                maxTimerRef.current = setTimeout(() => {
                    maxTimerRef.current = null

                    if (timerRef.current !== null) {
                        clearTimeout(timerRef.current)
                        timerRef.current = null
                    }

                    invokePending()
                }, maxWait)
            }
        },
        [fnRef, invokePending, optionsRef]
    )

    const cancel = useCallback(() => {
        clearTimers()
        pendingArgsRef.current = null
    }, [clearTimers])

    const flush = useCallback(() => {
        clearTimers()
        invokePending()
    }, [clearTimers, invokePending])

    // 卸载时丢掉还没执行的调用，避免在已卸载的组件里 setState
    useEffect(() => cancel, [cancel])

    return { run, cancel, flush }
}
