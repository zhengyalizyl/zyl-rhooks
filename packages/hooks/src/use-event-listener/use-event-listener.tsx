import { useRef } from 'react'
import { useEffectWithTarget, type BasicTarget } from '../use-event-target/use-event-target'

export type Options = {
  /** 不传则默认挂在 window 上 */
  target?: BasicTarget
  capture?: boolean
  once?: boolean
  passive?: boolean
}

export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  options: Options = {},
) {
  const { target, capture = false, once = false, passive = false } = options

  // 用 ref 保存最新的 handler，这样 handler 变化时不需要重新绑定事件
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffectWithTarget(
    (element) => {
      const listener = (event: Event) => handlerRef.current(event)

      element.addEventListener(eventName, listener, { capture, once, passive })

      // 移除监听只按 capture 匹配，once / passive 不参与
      return () => element.removeEventListener(eventName, listener, { capture })
    },
    target,
    [eventName, capture, once, passive],
  )
}
