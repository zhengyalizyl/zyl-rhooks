import {describe, it, expect} from 'vitest'
import { useBoolean } from '../use-boolean'
describe('useBoolean',()=>{
  it('should return the initial value',()=>{
    const {value} = useBoolean(true)
    expect(value).toBe(true)
  })
  it('should set the value to true',()=>{
    const {value,setTrue} = useBoolean(false)
    setTrue()
    expect(value).toBe(true)
  })
  it('should set the value to false',()=>{
    const {value,setFalse} = useBoolean(true)
    setFalse()
    expect(value).toBe(false)
  } )
  it('should toggle the value',()=>{
    const {value,toggle} = useBoolean(false)
    toggle()
    expect(value).toBe(true)
    toggle()
    expect(value).toBe(false)
  })
})
