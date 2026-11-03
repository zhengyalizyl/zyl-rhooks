import { type Dispatch, type SetStateAction, useCallback, useRef, useState } from 'react'

/**
 * 和 `useState` 一样会触发重渲染，但额外返回一个始终同步的 ref。
 *
 * `state` 用来渲染，`stateRef.current` 用来在闭包里读最新值——调用 setter 后
 * ref 立刻就是新值，不用等到下一次渲染，所以定时器、事件回调里读它不会拿到旧状态。
 *
 * @param initialState 初始值，支持惰性初始化函数
 * @returns `[state, setState, stateRef]`
 */
export function useRefState<S>(initialState: S | (() => S)): readonly [S, Dispatch<SetStateAction<S>>, { current: S }] {
    const [state, setState] = useState(initialState)

    // 只在首次渲染初始化，之后只由 setter 更新，避免被渲染期间的旧值覆盖
    const stateRef = useRef(state)

    const setRefState = useCallback<Dispatch<SetStateAction<S>>>(action => {
        // 先算出新值并写进 ref，调用方下一行就能读到
        const nextState = typeof action === 'function' ? (action as (prev: S) => S)(stateRef.current) : action

        stateRef.current = nextState
        setState(nextState)
    }, [])

    return [state, setRefState, stateRef] as const
}
