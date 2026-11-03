import { useForceUpdate } from '@zyl-rhooks/hooks'
import { useRef } from 'react'

export function UseForceUpdate() {
    const forceUpdate = useForceUpdate()

    // 存在 ref 里的值，改了 React 不会知道
    const countRef = useRef(0)
    const renderCountRef = useRef(0)
    renderCountRef.current += 1

    return (
        <div>
            <h1>UseForceUpdate</h1>
            <p>countRef.current: {countRef.current}</p>
            <p>渲染次数：{renderCountRef.current}</p>
            <button
                onClick={() => {
                    countRef.current += 1
                }}
            >
                只改 ref（页面不会变）
            </button>{' '}
            <button onClick={forceUpdate}>强制刷新</button>
        </div>
    )
}
