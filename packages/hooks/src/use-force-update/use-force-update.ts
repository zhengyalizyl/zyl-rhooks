import { useCallback, useState } from 'react'

/**
 * 返回一个强制组件重新渲染的函数。
 *
 * 适合值存在 ref / 外部数据源里、React 感知不到变化的场景；
 * 能用 state 表达的状态就别用它。返回的函数引用稳定，可以安全放进依赖数组。
 */
export function useForceUpdate(): () => void {
    const [, setFlag] = useState(false)

    // 每次都是新的值，一定会触发重渲染
    return useCallback(() => setFlag(flag => !flag), [])
}
