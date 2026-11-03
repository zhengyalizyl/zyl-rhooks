import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useClickAway } from '../use-click-away'

function appendElement() {
    const element = document.createElement('div')
    document.body.appendChild(element)
    return element
}

function click(element: Element, type = 'click') {
    element.dispatchEvent(new MouseEvent(type, { bubbles: true }))
}

afterEach(() => {
    document.body.innerHTML = ''
})

describe('useClickAway', () => {
    it('should fire when clicking outside the target', () => {
        const target = appendElement()
        const outside = appendElement()
        const onClickAway = vi.fn()

        renderHook(() => useClickAway(onClickAway, target))

        click(outside)
        expect(onClickAway).toHaveBeenCalledTimes(1)
    })

    it('should not fire when clicking inside the target', () => {
        const target = appendElement()
        const child = document.createElement('span')
        target.appendChild(child)
        const onClickAway = vi.fn()

        renderHook(() => useClickAway(onClickAway, target))

        click(target)
        click(child)
        expect(onClickAway).not.toHaveBeenCalled()
    })

    it('should accept a ref and skip while it is not mounted yet', () => {
        const ref: { current: HTMLDivElement | null } = { current: null }
        const outside = appendElement()
        const onClickAway = vi.fn()

        const { rerender } = renderHook(() => useClickAway(onClickAway, ref))

        // ref 还没挂上真实节点，不应该误判成点击了外部
        click(outside)
        expect(onClickAway).not.toHaveBeenCalled()

        ref.current = appendElement()
        rerender()

        click(outside)
        expect(onClickAway).toHaveBeenCalledTimes(1)

        click(ref.current)
        expect(onClickAway).toHaveBeenCalledTimes(1)
    })

    it('should support multiple targets', () => {
        const first = appendElement()
        const second = appendElement()
        const outside = appendElement()
        const onClickAway = vi.fn()

        renderHook(() => useClickAway(onClickAway, [first, second]))

        click(first)
        click(second)
        expect(onClickAway).not.toHaveBeenCalled()

        click(outside)
        expect(onClickAway).toHaveBeenCalledTimes(1)
    })

    it('should support custom event names', () => {
        const target = appendElement()
        const outside = appendElement()
        const onClickAway = vi.fn()

        renderHook(() => useClickAway(onClickAway, target, ['mousedown', 'contextmenu']))

        click(outside, 'click')
        expect(onClickAway).not.toHaveBeenCalled()

        click(outside, 'mousedown')
        click(outside, 'contextmenu')
        expect(onClickAway).toHaveBeenCalledTimes(2)
    })

    it('should always call the latest callback without rebinding', () => {
        const target = appendElement()
        const outside = appendElement()
        const first = vi.fn()
        const second = vi.fn()

        const { rerender } = renderHook(({ handler }) => useClickAway(handler, target), {
            initialProps: { handler: first }
        })

        rerender({ handler: second })
        click(outside)

        expect(first).not.toHaveBeenCalled()
        expect(second).toHaveBeenCalledTimes(1)
    })

    it('should unbind on unmount', () => {
        const target = appendElement()
        const outside = appendElement()
        const onClickAway = vi.fn()

        const { unmount } = renderHook(() => useClickAway(onClickAway, target))

        unmount()
        click(outside)
        expect(onClickAway).not.toHaveBeenCalled()
    })
})
