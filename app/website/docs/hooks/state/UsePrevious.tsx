import { useState } from 'react'
import { usePrevious } from '@zyl-rhooks/hooks'

export function UsePrevious() {
  const [count, setCount] = useState(0);
  const previousCount = usePrevious(count);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Previous Count: {String(previousCount)}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

