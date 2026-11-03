import { useRef } from 'react'

export type ShouldUpdateFunc<T> = (prev: T | undefined, next: T) => boolean

const defaultShouldUpdate = <T,>(prev: T | undefined, next: T) => !Object.is(prev, next)

export function usePrevious<T>(
  state: T,
  shouldUpdate: ShouldUpdateFunc<T> = defaultShouldUpdate,
): T | undefined {
  const prevRef = useRef<T | undefined>(undefined)
  const curRef = useRef<T | undefined>(undefined)

  if (shouldUpdate(curRef.current, state)) {
    prevRef.current = curRef.current
    curRef.current = state
  }

  return prevRef.current
}
