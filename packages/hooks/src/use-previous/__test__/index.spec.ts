import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { usePrevious } from '../use-previous'

describe('usePrevious', () => {
  it('should return undefined on the first render', () => {
    const { result } = renderHook(() => usePrevious(0))
    expect(result.current).toBeUndefined()
  })

  it('should return the previous value after an update', () => {
    const { result, rerender } = renderHook(({ count }) => usePrevious(count), {
      initialProps: { count: 0 },
    })

    rerender({ count: 1 })
    expect(result.current).toBe(0)

    rerender({ count: 2 })
    expect(result.current).toBe(1)
  })

  it('should keep the previous value when the state does not change', () => {
    const { result, rerender } = renderHook(({ count }) => usePrevious(count), {
      initialProps: { count: 0 },
    })

    rerender({ count: 1 })
    rerender({ count: 1 })
    expect(result.current).toBe(0)
  })

  it('should respect a custom shouldUpdate', () => {
    const shouldUpdate = (prev: number | undefined, next: number) =>
      prev === undefined || Math.abs(next - prev) >= 10

    const { result, rerender } = renderHook(({ count }) => usePrevious(count, shouldUpdate), {
      initialProps: { count: 0 },
    })

    rerender({ count: 5 })
    expect(result.current).toBeUndefined()

    rerender({ count: 20 })
    expect(result.current).toBe(0)
  })
})
