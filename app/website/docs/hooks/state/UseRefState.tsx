import { useRefState } from '@zyl-rhooks/hooks'
import { useState } from 'react'

export function UseRefState() {
    const [count, setCount, countRef] = useRefState(0)
    const [staleValue, setStaleValue] = useState<number | null>(null)
    const [freshValue, setFreshValue] = useState<number | null>(null)

    const readLater = () => {
        setStaleValue(null)
        setFreshValue(null)

        // 这个回调创建于本次渲染，2 秒后执行
        setTimeout(() => {
            setStaleValue(count) // 闭包里的 count 停在点击那一刻
            setFreshValue(countRef.current) // ref 永远是最新值
        }, 2000)
    }

    return (
        <div>
            <h1>UseRefState</h1>
            <p>Count: {count}</p>
            <button onClick={() => setCount(prev => prev + 1)}>Increment</button> <button onClick={readLater}>2 秒后读取</button>
            <p>点「2 秒后读取」，然后在这 2 秒里继续点 Increment：</p>
            <ul>
                <li>闭包里的 count：{staleValue ?? '-'}</li>
                <li>countRef.current：{freshValue ?? '-'}</li>
            </ul>
        </div>
    )
}
