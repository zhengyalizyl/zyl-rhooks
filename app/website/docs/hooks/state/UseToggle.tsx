import {useToggle} from '@zyl-rhooks/hooks'

export function UseToggle() {
  const { value, toggle } = useToggle("男","女");

  return (
    <div>
      <p>Value: {value}</p>
      <button onClick={toggle}>Toggle</button>
    </div>
  )
}
