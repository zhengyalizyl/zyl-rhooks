import { useEffect, useRef, type RefObject } from 'react'

type TargetValue = EventTarget | null | undefined

/** 事件挂载目标：可以直接传元素、传 ref、或传一个返回元素的函数 */
export type BasicTarget = EventTarget | null | RefObject<TargetValue> | (() => TargetValue)

/** 把各种形态的 target 统一解析成真实元素；不传时默认 window（SSR 下为 null） */
export function getTargetElement(target: BasicTarget | undefined): EventTarget | null {
  if (target === undefined) return typeof window === 'undefined' ? null : window
  if (typeof target === 'function') return target() ?? null
  if (target !== null && 'current' in target) return target.current ?? null
  return target
}

/**
 * 针对 DOM target 的 useEffect。
 *
 * 和原生 useEffect 的区别：ref.current 从 null 变成真实节点时不会触发重渲染，
 * React 也就不会重跑 effect，所以依赖数组里放 ref 是没用的。这里故意不写依赖数组，
 * 每次渲染后都重新解析一遍 target，自己比对 [element, ...deps] 决定要不要重新执行。
 *
 * @param effect 拿到真实元素后要执行的副作用，可返回清理函数
 * @param target 挂载目标，见 BasicTarget
 * @param deps   除元素之外的依赖项
 */
export function useEffectWithTarget(
  effect: (element: EventTarget) => void | (() => void),
  target: BasicTarget | undefined,
  deps: unknown[] = [],
) {
  const effectRef = useRef(effect)
  effectRef.current = effect

  // 上一次执行用的依赖，以及对应的清理函数
  const depsRef = useRef<unknown[] | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const element = getTargetElement(target)
    const nextDeps = [element, ...deps]

    // 依赖没变就什么都不做，避免每次渲染都解绑重绑
    if (depsRef.current?.every((dep, i) => dep === nextDeps[i])) return

    cleanupRef.current?.()
    cleanupRef.current = null
    depsRef.current = nextDeps

    // target 传了但还没挂载（ref.current 还是 null）时跳过，下次渲染后再试
    if (!element) return

    cleanupRef.current = effectRef.current(element) || null
  })

  // 组件卸载时清理
  useEffect(
    () => () => {
      cleanupRef.current?.()
      cleanupRef.current = null
      depsRef.current = null
    },
    [],
  )
}
