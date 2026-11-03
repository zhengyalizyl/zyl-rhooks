import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useForceUpdate } from '../use-force-update'

describe('useForceUpdate', () => {
    it('should re-render the component on every call', () => {
        let renderCount = 0

        const { result } = renderHook(() => {
            renderCount += 1
            return useForceUpdate()
        })

        expect(renderCount).toBe(1)

        act(() => result.current())
        expect(renderCount).toBe(2)

        act(() => result.current())
        expect(renderCount).toBe(3)
    })

    it('should keep a stable function reference', () => {
        const { result, rerender } = renderHook(() => useForceUpdate())
        const forceUpdate = result.current

        rerender()
        expect(result.current).toBe(forceUpdate)

        act(() => forceUpdate())
        expect(result.current).toBe(forceUpdate)
    })
})
