import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getTargetElement, useEffectWithTarget } from '../use-event-target'

afterEach(() => {
    document.body.innerHTML = ''
})

describe('getTargetElement', () => {
    it('should fall back to window when target is undefined', () => {
        expect(getTargetElement(undefined)).toBe(window)
    })

    it('should return the element itself', () => {
        const element = document.createElement('div')
        expect(getTargetElement(element)).toBe(element)
    })

    it('should unwrap a ref', () => {
        const element = document.createElement('div')
        expect(getTargetElement({ current: element })).toBe(element)
        expect(getTargetElement({ current: null })).toBeNull()
    })

    it('should call a function target', () => {
        const element = document.createElement('div')
        expect(getTargetElement(() => element)).toBe(element)
        expect(getTargetElement(() => undefined)).toBeNull()
    })

    it('should return null for an explicit null target', () => {
        expect(getTargetElement(null)).toBeNull()
    })
})

describe('useEffectWithTarget', () => {
    it('should run the effect with the resolved element', () => {
        const element = document.createElement('div')
        const effect = vi.fn()

        renderHook(() => useEffectWithTarget(effect, element))

        expect(effect).toHaveBeenCalledTimes(1)
        expect(effect).toHaveBeenCalledWith(element)
    })

    it('should wait until the ref is filled in', () => {
        const ref: { current: HTMLDivElement | null } = { current: null }
        const effect = vi.fn()

        const { rerender } = renderHook(() => useEffectWithTarget(effect, ref))
        expect(effect).not.toHaveBeenCalled()

        ref.current = document.createElement('div')
        rerender()

        expect(effect).toHaveBeenCalledTimes(1)
        expect(effect).toHaveBeenCalledWith(ref.current)
    })

    it('should not re-run while element and deps stay the same', () => {
        const element = document.createElement('div')
        const effect = vi.fn()

        const { rerender } = renderHook(() => useEffectWithTarget(effect, element, ['a']))

        rerender()
        rerender()

        expect(effect).toHaveBeenCalledTimes(1)
    })

    it('should clean up and re-run when deps change', () => {
        const element = document.createElement('div')
        const cleanup = vi.fn()
        const effect = vi.fn(() => cleanup)

        const { rerender } = renderHook(({ dep }) => useEffectWithTarget(effect, element, [dep]), {
            initialProps: { dep: 'a' }
        })

        expect(effect).toHaveBeenCalledTimes(1)
        expect(cleanup).not.toHaveBeenCalled()

        rerender({ dep: 'b' })

        expect(cleanup).toHaveBeenCalledTimes(1)
        expect(effect).toHaveBeenCalledTimes(2)
    })

    it('should clean up and re-run when the element changes', () => {
        const first = document.createElement('div')
        const second = document.createElement('div')
        const cleanup = vi.fn()
        const effect = vi.fn(() => cleanup)

        const { rerender } = renderHook(({ element }) => useEffectWithTarget(effect, element), {
            initialProps: { element: first }
        })

        rerender({ element: second })

        expect(cleanup).toHaveBeenCalledTimes(1)
        expect(effect).toHaveBeenNthCalledWith(2, second)
    })

    it('should clean up on unmount', () => {
        const element = document.createElement('div')
        const cleanup = vi.fn()

        const { unmount } = renderHook(() => useEffectWithTarget(() => cleanup, element))

        unmount()
        expect(cleanup).toHaveBeenCalledTimes(1)
    })

    it('should always use the latest effect', () => {
        const element = document.createElement('div')
        const first = vi.fn()
        const second = vi.fn()

        const { rerender } = renderHook(({ effect, dep }) => useEffectWithTarget(effect, element, [dep]), {
            initialProps: { effect: first, dep: 'a' }
        })

        rerender({ effect: second, dep: 'b' })

        expect(first).toHaveBeenCalledTimes(1)
        expect(second).toHaveBeenCalledTimes(1)
    })
})
