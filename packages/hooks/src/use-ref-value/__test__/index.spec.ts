import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useRefValue } from '../use-ref-value'

describe('useRefValue', () => {
    it('should hold the initial value', () => {
        const { result } = renderHook(() => useRefValue(1))
        expect(result.current.current).toBe(1)
    })

    it('should always hold the latest value', () => {
        const { result, rerender } = renderHook(({ value }) => useRefValue(value), {
            initialProps: { value: 1 }
        })

        rerender({ value: 2 })
        expect(result.current.current).toBe(2)

        rerender({ value: 3 })
        expect(result.current.current).toBe(3)
    })

    it('should keep the same ref object across renders', () => {
        const { result, rerender } = renderHook(({ value }) => useRefValue(value), {
            initialProps: { value: 1 }
        })
        const ref = result.current

        rerender({ value: 2 })
        expect(result.current).toBe(ref)
    })

    it('should let a stale closure read the latest value', () => {
        const { result, rerender } = renderHook(
            ({ value }) => {
                const ref = useRefValue(value)
                // 这个回调在第一次渲染时创建，直接读 value 会一直是 1
                return () => ref.current
            },
            { initialProps: { value: 1 } }
        )

        const read = result.current
        rerender({ value: 2 })

        expect(read()).toBe(2)
    })
})
