import {useSetState} from '@zyl-rhooks/hooks'

export function UseSetState() {
  const [state, setMergedState] = useSetState({ count: 0 });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => setMergedState({ count: state.count + 1 })}>
        Increment
      </button>
    </div>
  )
}
