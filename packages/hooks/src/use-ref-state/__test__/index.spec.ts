import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useRefState } from '../use-ref-state'

describe('useRefState', () => {
    it('should return the initial state', () => {
        const { result } = renderHook(() => useRefState(0))
        const [state, , stateRef] = result.current

        expect(state).toBe(0)
        expect(stateRef.current).toBe(0)
    })

    it('should support a lazy initializer', () => {
        const { result } = renderHook(() => useRefState(() => 10))
        expect(result.current[0]).toBe(10)
        expect(result.current[2].current).toBe(10)
    })

    it('should update state and re-render', () => {
        const { result } = renderHook(() => useRefState(0))

        act(() => result.current[1](1))
        expect(result.current[0]).toBe(1)
        expect(result.current[2].current).toBe(1)
    })

    it('should update the ref synchronously, before the re-render', () => {
        const { result } = renderHook(() => useRefState(0))
        const [, setState, stateRef] = result.current

        act(() => {
            setState(1)
            // 还没重渲染，ref 已经是新值
            expect(stateRef.current).toBe(1)
        })
    })

    it('should support functional updates', () => {
        const { result } = renderHook(() => useRefState(0))

        act(() => {
            result.current[1](prev => prev + 1)
            result.current[1](prev => prev + 1)
        })

        expect(result.current[0]).toBe(2)
        expect(result.current[2].current).toBe(2)
    })

    it('should keep the setter and the ref object stable', () => {
        const { result, rerender } = renderHook(() => useRefState(0))
        const [, setState, stateRef] = result.current

        rerender()
        act(() => setState(1))

        expect(result.current[1]).toBe(setState)
        expect(result.current[2]).toBe(stateRef)
    })

    it('should let a stale closure read the latest state', () => {
        const { result } = renderHook(() => useRefState(0))
        const [, setState, stateRef] = result.current

        // 模拟定时器 / 事件回调里创建于旧渲染的闭包
        const read = () => stateRef.current

        act(() => setState(42))
        expect(read()).toBe(42)
    })
})
