import  { useState } from 'react'
export const useBoolean = (initialValue: boolean = false): { value: boolean; setTrue: () => void; setFalse: () => void; toggle: () => void } => {
  const [value, setValue] = useState(initialValue);

  const setTrue = () => setValue(true);
  const setFalse = () => setValue(false);
  const toggle = () => setValue((prev) => !prev);

  return { value, setTrue, setFalse, toggle };
}
