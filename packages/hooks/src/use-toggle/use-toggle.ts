import  { useState } from 'react'
export function useToggle<T,R=T>(defaultValue: T|R,reverseValue?:R){
  const [value,setValue] = useState<T|R>(defaultValue);
  const toggle = () => {
    setValue(value===defaultValue?(reverseValue??defaultValue):defaultValue)
  }

  return {
    value,
    toggle
  }
}
