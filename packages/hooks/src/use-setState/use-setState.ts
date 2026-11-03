import { useState } from "react";

export function useSetState<T extends object>(initialState: T): [T, (newState: Partial<T>) => void] {
  const [state, setState] = useState<T>(initialState);

  const setMergedState = (newState: Partial<T>) => {
    setState((prevState) => ({ ...prevState, ...newState }));
  };

  return [state, setMergedState];
}
