import { useRef } from 'react'

/**
 * 把值同步到一个 ref 上，`ref.current` 永远是最新的值。
 *
 * 用来解决闭包陷阱：定时器、事件回调、异步请求的回调里直接读 props / state 会读到
 * 创建它们那一刻的旧值，改读 `ref.current` 就能拿到最新值，而且不需要把值写进依赖数组、
 * 也就不用反复重建这些回调。
 *
 * 注意 ref 的变化不会触发重渲染，只适合「读」，不要用它驱动 UI。
 */
export function useRefValue<T>(value: T): { current: T } {
    const ref = useRef(value)
    ref.current = value

    return ref
}
