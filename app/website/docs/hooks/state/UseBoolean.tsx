import { useBoolean } from '@zyl-rhooks/hooks'

export function UseBoolean() {
  const { value, setTrue, setFalse, toggle } = useBoolean(false);

  return (
    <div>
      <p>Value: {value ? "true" : "false"}</p>
      <p>
        <button onClick={setTrue}>Set True</button>
      </p>
      <p>
        <button onClick={setFalse}>Set False</button>
      </p>
      <p>
        <button onClick={toggle}>Toggle</button>
      </p>
    </div>
  )
}
