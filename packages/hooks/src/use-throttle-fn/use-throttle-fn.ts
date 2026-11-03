import { useCallback, useEffect, useRef } from 'react'

import { useRefValue } from '../use-ref-value/use-ref-value'

export type Options = {
    /** 节流间隔（毫秒），默认 1000 */
    wait?: number
    /** 是否在间隔开始时立即执行一次，默认 true */
    leading?: boolean
    /** 间隔内还有调用时，是否在间隔结束时补执行一次，默认 true */
    trailing?: boolean
}

export type Result<TArgs extends unknown[]> = {
    /** 节流后的函数 */
    run: (...args: TArgs) => void
    /** 取消还没执行的那次调用 */
    cancel: () => void
    /** 立刻执行还没执行的那次调用 */
    flush: () => void
}

/**
 * 给函数加节流：不管调用多频繁，每 `wait` 毫秒最多执行一次。
 *
 * 和防抖的区别是节流不会被新的调用"推迟"——持续调用时它按固定频率一直执行，
 * 适合 scroll / resize / mousemove 这种高频事件。
 *
 * 返回的 `run` 引用稳定，内部始终调用最新的 `fn`；组件卸载时会自动取消待执行的调用。
 *
 * @param fn      需要节流的函数，返回值会被忽略
 * @param options 节流配置
 */
export function useThrottleFn<TArgs extends unknown[]>(fn: (...args: TArgs) => void, options: Options = {}): Result<TArgs> {
    const { wait = 1000, leading = true, trailing = true } = options

    const fnRef = useRefValue(fn)
    const optionsRef = useRefValue({ wait, leading, trailing })

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    // 间隔内被挡下来的最后一次调用，null 表示没有待执行的调用
    const pendingArgsRef = useRef<TArgs | null>(null)

    const clearTimer = useCallback(() => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    // 间隔结束：有攒着的调用就执行并开下一个间隔，没有就彻底停下来
    const startWindow = useCallback(() => {
        const { wait, trailing } = optionsRef.current

        timerRef.current = setTimeout(() => {
            timerRef.current = null

            if (!trailing) {
                pendingArgsRef.current = null
                return
            }

            const args = pendingArgsRef.current
            if (!args) return

            pendingArgsRef.current = null
            fnRef.current(...args)

            // 这次补执行同样要占一个间隔，否则就不是节流了
            startWindow()
        }, wait)
    }, [fnRef, optionsRef])

    const run = useCallback(
        (...args: TArgs) => {
            const { leading } = optionsRef.current

            // 间隔里：只记下最后一次调用，等间隔结束再说
            if (timerRef.current !== null) {
                pendingArgsRef.current = args
                return
            }

            if (leading) fnRef.current(...args)
            else pendingArgsRef.current = args

            startWindow()
        },
        [fnRef, optionsRef, startWindow]
    )

    const cancel = useCallback(() => {
        clearTimer()
        pendingArgsRef.current = null
    }, [clearTimer])

    const flush = useCallback(() => {
        const args = pendingArgsRef.current
        pendingArgsRef.current = null

        clearTimer()

        if (args) fnRef.current(...args)
    }, [clearTimer, fnRef])

    // 卸载时丢掉还没执行的调用，避免在已卸载的组件里 setState
    useEffect(() => cancel, [cancel])

    return { run, cancel, flush }
}
