import {describe, it, expect} from 'vitest'
import { useToggle} from '../use-toggle'

describe('useToggle',()=>{
  it('should return the initial value',()=>{
    const {value} = useToggle(true)
    expect(value).toBe(true)
  })
  it('should toggle the value',()=>{
    const {value, toggle} = useToggle(true)
    toggle()
    expect(value).toBe(false)
    toggle()
    expect(value).toBe(true)
  })
  it('should accept a default value',()=>{
    const {value} = useToggle(false)
    expect(value).toBe(false) 
  })
})
