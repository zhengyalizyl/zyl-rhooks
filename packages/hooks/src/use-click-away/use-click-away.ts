import { useRef } from 'react'

import { type BasicTarget, getTargetElement, useEffectWithTarget } from '../use-event-target/use-event-target'

/**
 * 监听点击目标元素外部的事件。
 *
 * 事件统一挂在 document 上，触发时再解析一遍 target，所以 target 可以是还没挂载的 ref。
 * 任意一个 target 没解析出元素（比如 ref.current 还是 null），都视为「还没准备好」而不触发回调，
 * 避免组件刚挂载时误判成点击了外部。
 *
 * @param onClickAway 点击外部时的回调
 * @param target      一个或多个「内部区域」，见 BasicTarget
 * @param eventName   监听的事件名，默认 'click'，可传数组同时监听多个
 */
export function useClickAway<T extends Event = Event>(
    onClickAway: (event: T) => void,
    target: BasicTarget | BasicTarget[],
    eventName: string | string[] = 'click'
) {
    // 用 ref 保存最新的回调和 target，避免它们变化时反复解绑重绑
    const onClickAwayRef = useRef(onClickAway)
    onClickAwayRef.current = onClickAway

    const targetRef = useRef(target)
    targetRef.current = target

    const eventNames = Array.isArray(eventName) ? eventName : [eventName]
    // 数组每次渲染都是新引用，用字符串当依赖
    const eventKey = eventNames.join(',')

    useEffectWithTarget(
        element => {
            const listener = (event: Event) => {
                const targets = Array.isArray(targetRef.current) ? targetRef.current : [targetRef.current]

                const shouldSkip = targets.some(item => {
                    const targetElement = getTargetElement(item)
                    if (!targetElement || !('contains' in targetElement)) return true
                    return (targetElement as Node).contains(event.target as Node)
                })

                if (shouldSkip) return

                onClickAwayRef.current(event as T)
            }

            eventNames.forEach(name => element.addEventListener(name, listener))

            return () => {
                eventNames.forEach(name => element.removeEventListener(name, listener))
            }
        },
        // SSR 下没有 document，返回 null 跳过绑定
        () => (typeof document === 'undefined' ? null : document),
        [eventKey]
    )
}
