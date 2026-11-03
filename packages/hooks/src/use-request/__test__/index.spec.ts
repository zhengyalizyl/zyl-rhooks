import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useRequest } from '../use-request'

function createDeferred<T>() {
    let resolve!: (value: T) => void
    let reject!: (reason: unknown) => void

    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })

    return { promise, resolve, reject }
}

describe('useRequest', () => {
    it('should run on mount and expose loading / data', async () => {
        const deferred = createDeferred<string>()
        const service = vi.fn(() => deferred.promise)

        const { result } = renderHook(() => useRequest(service))

        expect(service).toHaveBeenCalledTimes(1)
        expect(result.current.loading).toBe(true)
        expect(result.current.data).toBeUndefined()

        await act(async () => {
            deferred.resolve('done')
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.data).toBe('done')
        expect(result.current.error).toBeUndefined()
    })

    it('should pass defaultParams to the service and record them', async () => {
        const service = vi.fn((id: number, name: string) => Promise.resolve(`${id}-${name}`))

        const { result } = renderHook(() => useRequest(service, { defaultParams: [1, 'a'] }))

        await waitFor(() => expect(result.current.data).toBe('1-a'))
        expect(service).toHaveBeenCalledWith(1, 'a')
        expect(result.current.params).toEqual([1, 'a'])
    })

    it('should not run automatically in manual mode', async () => {
        const service = vi.fn(() => Promise.resolve('done'))

        const { result } = renderHook(() => useRequest(service, { manual: true }))

        expect(service).not.toHaveBeenCalled()
        expect(result.current.loading).toBe(false)

        await act(async () => {
            result.current.run()
        })

        expect(service).toHaveBeenCalledTimes(1)
        expect(result.current.data).toBe('done')
    })

    it('should put failures into error state without rejecting run', async () => {
        const error = new Error('boom')
        const service = vi.fn(() => Promise.reject(error))

        const { result } = renderHook(() => useRequest(service, { manual: true }))

        await act(async () => {
            result.current.run()
        })

        expect(result.current.error).toBe(error)
        expect(result.current.loading).toBe(false)
        expect(result.current.data).toBeUndefined()
    })

    it('should reject runAsync so the caller can catch it', async () => {
        const service = vi.fn(() => Promise.reject(new Error('boom')))

        const { result } = renderHook(() => useRequest(service, { manual: true }))

        await act(async () => {
            await expect(result.current.runAsync()).rejects.toThrow('boom')
        })
    })

    it('should clear the error after a later success', async () => {
        const service = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('done')

        const { result } = renderHook(() => useRequest(service, { manual: true }))

        await act(async () => {
            result.current.run()
        })
        expect(result.current.error).toBeInstanceOf(Error)

        await act(async () => {
            result.current.run()
        })
        expect(result.current.error).toBeUndefined()
        expect(result.current.data).toBe('done')
    })

    it('should fire the lifecycle callbacks', async () => {
        const onBefore = vi.fn()
        const onSuccess = vi.fn()
        const onError = vi.fn()
        const onFinally = vi.fn()
        const service = vi.fn((id: number) => Promise.resolve(`data-${id}`))

        const { result } = renderHook(() => useRequest(service, { manual: true, onBefore, onSuccess, onError, onFinally }))

        await act(async () => {
            result.current.run(1)
        })

        expect(onBefore).toHaveBeenCalledWith([1])
        expect(onSuccess).toHaveBeenCalledWith('data-1', [1])
        expect(onFinally).toHaveBeenCalledWith([1], 'data-1', undefined)
        expect(onError).not.toHaveBeenCalled()
    })

    it('should fire onError and onFinally when the request fails', async () => {
        const error = new Error('boom')
        const onError = vi.fn()
        const onFinally = vi.fn()
        const service = vi.fn(() => Promise.reject(error))

        const { result } = renderHook(() => useRequest(service, { manual: true, onError, onFinally }))

        await act(async () => {
            result.current.run(1)
        })

        expect(onError).toHaveBeenCalledWith(error, [1])
        expect(onFinally).toHaveBeenCalledWith([1], undefined, error)
    })

    it('should refresh with the last params', async () => {
        const service = vi.fn((id: number) => Promise.resolve(`data-${id}`))

        const { result } = renderHook(() => useRequest(service, { manual: true }))

        await act(async () => {
            result.current.run(7)
        })

        await act(async () => {
            result.current.refresh()
        })

        expect(service).toHaveBeenCalledTimes(2)
        expect(service).toHaveBeenLastCalledWith(7)
        expect(result.current.data).toBe('data-7')
    })

    it('should mutate data without sending a request', async () => {
        const service = vi.fn(() => Promise.resolve(1))

        const { result } = renderHook(() => useRequest(service))
        await waitFor(() => expect(result.current.data).toBe(1))

        act(() => result.current.mutate(10))
        expect(result.current.data).toBe(10)

        act(() => result.current.mutate(old => (old ?? 0) + 5))
        expect(result.current.data).toBe(15)
        expect(service).toHaveBeenCalledTimes(1)
    })

    it('should drop the result of a cancelled request', async () => {
        const deferred = createDeferred<string>()
        const service = vi.fn(() => deferred.promise)

        const { result } = renderHook(() => useRequest(service))
        expect(result.current.loading).toBe(true)

        act(() => result.current.cancel())
        expect(result.current.loading).toBe(false)

        await act(async () => {
            deferred.resolve('done')
        })

        expect(result.current.data).toBeUndefined()
    })

    it('should ignore a stale response that comes back last', async () => {
        const slow = createDeferred<string>()
        const fast = createDeferred<string>()
        const service = vi
            .fn()
            .mockImplementationOnce(() => slow.promise)
            .mockImplementationOnce(() => fast.promise)

        const { result } = renderHook(() => useRequest(service, { manual: true }))

        act(() => result.current.run())
        act(() => result.current.run())

        await act(async () => {
            fast.resolve('second')
        })
        expect(result.current.data).toBe('second')
        expect(result.current.loading).toBe(false)

        // 先发出的请求后返回，不应该覆盖掉新数据
        await act(async () => {
            slow.resolve('first')
        })
        expect(result.current.data).toBe('second')
    })

    it('should wait for ready and run once it flips to true', async () => {
        const service = vi.fn(() => Promise.resolve('done'))

        const { result, rerender } = renderHook(({ ready }) => useRequest(service, { ready }), {
            initialProps: { ready: false }
        })

        expect(service).not.toHaveBeenCalled()
        expect(result.current.loading).toBe(false)

        rerender({ ready: true })

        await waitFor(() => expect(result.current.data).toBe('done'))
        expect(service).toHaveBeenCalledTimes(1)
    })

    it('should re-request when refreshDeps change', async () => {
        const service = vi.fn((id: number) => Promise.resolve(`data-${id}`))

        const { result, rerender } = renderHook(({ id }) => useRequest(() => service(id), { refreshDeps: [id] }), {
            initialProps: { id: 1 }
        })

        await waitFor(() => expect(result.current.data).toBe('data-1'))

        rerender({ id: 2 })

        await waitFor(() => expect(result.current.data).toBe('data-2'))
        expect(service).toHaveBeenCalledTimes(2)
        expect(service).toHaveBeenLastCalledWith(2)
    })

    it('should not re-request when refreshDeps is not provided', async () => {
        const service = vi.fn((id: number) => Promise.resolve(`data-${id}`))

        const { result, rerender } = renderHook(({ id }) => useRequest(() => service(id)), {
            initialProps: { id: 1 }
        })

        await waitFor(() => expect(result.current.data).toBe('data-1'))

        rerender({ id: 2 })
        rerender({ id: 3 })

        expect(service).toHaveBeenCalledTimes(1)
    })

    it('should not update state after unmount', async () => {
        const deferred = createDeferred<string>()
        const service = vi.fn(() => deferred.promise)

        const { unmount } = renderHook(() => useRequest(service))
        unmount()

        await act(async () => {
            deferred.resolve('done')
        })

        expect(service).toHaveBeenCalledTimes(1)
    })
})
