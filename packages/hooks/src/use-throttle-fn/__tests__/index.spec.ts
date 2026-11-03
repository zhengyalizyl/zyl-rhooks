import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useThrottleFn } from '../use-throttle-fn'

beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
})

function advance(ms: number) {
    act(() => {
        vi.advanceTimersByTime(ms)
    })
}

describe('useThrottleFn', () => {
    it('should run immediately on the first call', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useThrottleFn(fn, { wait: 500 }))

        act(() => result.current.run('a'))

        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('a')
    })

    it('should swallow the calls inside the window and replay the last one', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useThrottleFn(fn, { wait: 500 }))

        act(() => {
            result.current.run(1)
            result.current.run(2)
            result.current.run(3)
        })

        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith(1)

        advance(500)
        expect(fn).toHaveBeenCalledTimes(2)
        expect(fn).toHaveBeenLastCalledWith(3)
    })

    it('should keep a steady rate while calls keep coming', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useThrottleFn(fn, { wait: 500 }))

        // 每 100ms 调一次，持续 1.5s
        for (let i = 0; i <= 15; i += 1) {
            act(() => result.current.run(i))
            advance(100)
        }

        // t=0 / 500 / 1000 / 1500 各一次
        expect(fn).toHaveBeenCalledTimes(4)
    })

    it('should not run again after the window when there was no further call', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useThrottleFn(fn, { wait: 500 }))

        act(() => result.current.run())
        advance(500)
        advance(500)

        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should start a fresh window after it went idle', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useThrottleFn(fn, { wait: 500 }))

        act(() => result.current.run(1))
        advance(1000)

        act(() => result.current.run(2))
        expect(fn).toHaveBeenCalledTimes(2)
        expect(fn).toHaveBeenLastCalledWith(2)
    })

    it('should skip the leading call when leading is false', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useThrottleFn(fn, { wait: 500, leading: false }))

        act(() => result.current.run('a'))
        expect(fn).not.toHaveBeenCalled()

        advance(500)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('a')
    })

    it('should drop the trailing call when trailing is false', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useThrottleFn(fn, { wait: 500, trailing: false }))

        act(() => {
            result.current.run(1)
            result.current.run(2)
        })

        expect(fn).toHaveBeenCalledTimes(1)

        advance(500)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith(1)
    })

    it('should never run when both leading and trailing are false', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useThrottleFn(fn, { wait: 500, leading: false, trailing: false }))

        act(() => result.current.run())
        advance(500)
        advance(500)

        expect(fn).not.toHaveBeenCalled()
    })

    it('should cancel a pending trailing call', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useThrottleFn(fn, { wait: 500 }))

        act(() => {
            result.current.run(1)
            result.current.run(2)
        })
        act(() => result.current.cancel())

        advance(500)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith(1)
    })

    it('should flush a pending trailing call immediately', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useThrottleFn(fn, { wait: 500 }))

        act(() => {
            result.current.run(1)
            result.current.run(2)
        })
        act(() => result.current.flush())

        expect(fn).toHaveBeenCalledTimes(2)
        expect(fn).toHaveBeenLastCalledWith(2)

        advance(500)
        expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should do nothing when flushing without a pending call', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useThrottleFn(fn, { wait: 500 }))

        act(() => result.current.run(1))
        act(() => result.current.flush())

        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should cancel the pending call on unmount', () => {
        const fn = vi.fn()
        const { result, unmount } = renderHook(() => useThrottleFn(fn, { wait: 500 }))

        act(() => {
            result.current.run(1)
            result.current.run(2)
        })
        unmount()

        advance(500)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should always call the latest fn', () => {
        const first = vi.fn()
        const second = vi.fn()

        const { result, rerender } = renderHook(({ fn }) => useThrottleFn(fn, { wait: 500, leading: false }), {
            initialProps: { fn: first as () => void }
        })

        act(() => result.current.run())
        rerender({ fn: second })
        advance(500)

        expect(first).not.toHaveBeenCalled()
        expect(second).toHaveBeenCalledTimes(1)
    })

    it('should keep run / cancel / flush stable across renders', () => {
        const { result, rerender } = renderHook(() => useThrottleFn(() => {}, { wait: 500 }))
        const { run, cancel, flush } = result.current

        rerender()

        expect(result.current.run).toBe(run)
        expect(result.current.cancel).toBe(cancel)
        expect(result.current.flush).toBe(flush)
    })
})
