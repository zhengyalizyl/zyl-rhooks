import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebounceFn } from '../use-debounce-fn'

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

describe('useDebounceFn', () => {
    it('should delay the call by wait', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 500 }))

        act(() => result.current.run('a'))
        expect(fn).not.toHaveBeenCalled()

        advance(499)
        expect(fn).not.toHaveBeenCalled()

        advance(1)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('a')
    })

    it('should only run once for a burst, with the last args', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 500 }))

        act(() => {
            result.current.run(1)
            result.current.run(2)
            result.current.run(3)
        })

        advance(500)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith(3)
    })

    it('should restart the timer on every call', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 500 }))

        act(() => result.current.run())
        advance(400)

        act(() => result.current.run())
        advance(400)
        expect(fn).not.toHaveBeenCalled()

        advance(100)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should run immediately with leading, and once more for later calls', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 500, leading: true }))

        act(() => result.current.run('first'))
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('first')

        act(() => result.current.run('second'))
        expect(fn).toHaveBeenCalledTimes(1)

        advance(500)
        expect(fn).toHaveBeenCalledTimes(2)
        expect(fn).toHaveBeenLastCalledWith('second')
    })

    it('should not run twice with leading when there is only one call', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 500, leading: true }))

        act(() => result.current.run())
        advance(500)

        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should skip the trailing call when trailing is false', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 500, leading: true, trailing: false }))

        act(() => {
            result.current.run('a')
            result.current.run('b')
        })

        advance(500)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('a')
    })

    it('should do nothing when both leading and trailing are false', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 500, trailing: false }))

        act(() => result.current.run())
        advance(500)

        expect(fn).not.toHaveBeenCalled()
    })

    it('should force a call after maxWait when calls keep coming', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 500, maxWait: 1000 }))

        // 每 400ms 调一次，光靠 wait 永远不会触发
        act(() => result.current.run(1))
        advance(400)
        act(() => result.current.run(2))
        advance(400)
        expect(fn).not.toHaveBeenCalled()

        act(() => result.current.run(3))
        advance(200)

        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith(3)
    })

    it('should start a new round after maxWait fired', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 500, maxWait: 1000 }))

        act(() => result.current.run(1))
        advance(1000)
        expect(fn).toHaveBeenCalledTimes(1)

        act(() => result.current.run(2))
        advance(500)
        expect(fn).toHaveBeenCalledTimes(2)
        expect(fn).toHaveBeenLastCalledWith(2)
    })

    it('should cancel a pending call', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 500 }))

        act(() => result.current.run())
        act(() => result.current.cancel())

        advance(500)
        expect(fn).not.toHaveBeenCalled()
    })

    it('should flush a pending call immediately', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 500 }))

        act(() => result.current.run('a'))
        act(() => result.current.flush())

        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('a')

        // flush 之后不该再有延迟触发
        advance(500)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should do nothing when flushing without a pending call', () => {
        const fn = vi.fn()
        const { result } = renderHook(() => useDebounceFn(fn, { wait: 500 }))

        act(() => result.current.flush())
        expect(fn).not.toHaveBeenCalled()
    })

    it('should cancel the pending call on unmount', () => {
        const fn = vi.fn()
        const { result, unmount } = renderHook(() => useDebounceFn(fn, { wait: 500 }))

        act(() => result.current.run())
        unmount()

        advance(500)
        expect(fn).not.toHaveBeenCalled()
    })

    it('should always call the latest fn', () => {
        const first = vi.fn()
        const second = vi.fn()

        const { result, rerender } = renderHook(({ fn }) => useDebounceFn(fn, { wait: 500 }), {
            initialProps: { fn: first as () => void }
        })

        act(() => result.current.run())
        rerender({ fn: second })
        advance(500)

        expect(first).not.toHaveBeenCalled()
        expect(second).toHaveBeenCalledTimes(1)
    })

    it('should keep run / cancel / flush stable across renders', () => {
        const { result, rerender } = renderHook(() => useDebounceFn(() => {}, { wait: 500 }))
        const { run, cancel, flush } = result.current

        rerender()

        expect(result.current.run).toBe(run)
        expect(result.current.cancel).toBe(cancel)
        expect(result.current.flush).toBe(flush)
    })
})
